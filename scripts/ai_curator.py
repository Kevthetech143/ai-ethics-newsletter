#!/usr/bin/env python3
"""
AI Curator for AI Ethics Newsletter
Uses Claude API to score articles for relevance, quality, and novelty.
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional
import psycopg
from anthropic import Anthropic

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'dbname': 'newsletter_content',
    'user': 'listmonk',
    'password': 'listmonk'
}

# AI Model configuration
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
MODEL = "claude-sonnet-4-20250514"

SCORING_PROMPT = """You are an expert AI safety and ethics researcher tasked with curating content for a professional newsletter.

Your role is to evaluate whether articles are relevant and valuable for an audience of AI researchers, engineers, and policymakers focused on AI safety, alignment, and ethics.

Evaluate the following article and provide scores (0.00 to 1.00) for:

1. **Relevance Score**: How directly does this relate to AI safety, ethics, alignment, or responsible AI development?
   - 1.00: Core AI safety/ethics topic (alignment research, safety techniques, ethical frameworks)
   - 0.70-0.99: Adjacent topics (AI policy, governance, technical AI research with safety implications)
   - 0.40-0.69: Tangentially related (general AI/ML without safety focus)
   - 0.00-0.39: Not relevant (unrelated tech news, marketing content)

2. **Quality Score**: How credible, well-researched, and substantive is this content?
   - 1.00: Peer-reviewed research, official announcements from major labs
   - 0.70-0.99: Technical blog posts from credible sources, detailed analysis
   - 0.40-0.69: News coverage, opinion pieces with some substance
   - 0.00-0.39: Low-quality content, speculation, marketing fluff

3. **Novelty Score**: How new or significant is this information?
   - 1.00: Major breakthrough or announcement
   - 0.70-0.99: Important update or interesting new perspective
   - 0.40-0.69: Incremental progress or recap of known information
   - 0.00-0.39: Outdated or widely covered information

4. **Overall Score**: Your recommendation for inclusion (weighted average favoring relevance)

ARTICLE TO EVALUATE:
---
Title: {title}
Source: {source}
Date: {pub_date}
Description: {description}
---

Respond with a JSON object only (no other text):
{{
  "relevance_score": 0.00,
  "quality_score": 0.00,
  "novelty_score": 0.00,
  "overall_score": 0.00,
  "reasoning": "Brief explanation of your scores (2-3 sentences)"
}}"""

def get_unscored_articles(conn, limit: int = 50) -> List[Dict]:
    """Fetch articles that haven't been scored yet."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.title, a.source_name, a.pub_date, a.description, a.link
        FROM articles a
        LEFT JOIN article_scores s ON a.id = s.article_id
        WHERE s.id IS NULL
        ORDER BY a.pub_date DESC
        LIMIT %s
    """, (limit,))

    articles = []
    for row in cursor.fetchall():
        articles.append({
            'id': row[0],
            'title': row[1],
            'source_name': row[2],
            'pub_date': row[3],
            'description': row[4],
            'link': row[5]
        })

    cursor.close()
    return articles

def score_article(client: Anthropic, article: Dict) -> Optional[Dict]:
    """Use Claude to score an article."""
    try:
        prompt = SCORING_PROMPT.format(
            title=article['title'],
            source=article['source_name'],
            pub_date=article['pub_date'] or 'Unknown',
            description=article['description'][:500] if article['description'] else 'No description available'
        )

        message = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract JSON from response
        response_text = message.content[0].text.strip()

        # Try to parse JSON directly
        try:
            scores = json.loads(response_text)
        except json.JSONDecodeError:
            # If wrapped in markdown code block, extract it
            if '```json' in response_text:
                json_start = response_text.find('```json') + 7
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            elif '```' in response_text:
                json_start = response_text.find('```') + 3
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            scores = json.loads(response_text)

        return scores

    except Exception as e:
        print(f"  Error scoring article: {e}")
        return None

def store_score(conn, article_id: int, scores: Dict) -> bool:
    """Store article scores in database."""
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO article_scores
            (article_id, relevance_score, quality_score, novelty_score, overall_score, reasoning, ai_model)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            article_id,
            scores['relevance_score'],
            scores['quality_score'],
            scores['novelty_score'],
            scores['overall_score'],
            scores['reasoning'],
            MODEL
        ))
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        print(f"  Error storing score: {e}")
        conn.rollback()
        cursor.close()
        return False

def main():
    """Main execution function."""
    print(f"AI Curator started at {datetime.now()}")
    print("="*60)

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY environment variable not set")
        return 1

    try:
        # Initialize Claude client
        print("Initializing Claude API...")
        client = Anthropic(api_key=ANTHROPIC_API_KEY)
        print("Connected!\n")

        # Connect to database
        print("Connecting to database...")
        conn = psycopg.connect(**DB_CONFIG)
        print("Connected!\n")

        # Get unscored articles
        print("Fetching unscored articles...")
        articles = get_unscored_articles(conn, limit=10)
        print(f"Found {len(articles)} articles to score\n")

        if not articles:
            print("No articles to score. Exiting.")
            conn.close()
            return 0

        # Score articles
        scored_count = 0
        high_quality_count = 0

        for i, article in enumerate(articles, 1):
            print(f"[{i}/{len(articles)}] Scoring: {article['title'][:60]}...")

            scores = score_article(client, article)
            if scores:
                if store_score(conn, article['id'], scores):
                    scored_count += 1
                    if scores['overall_score'] >= 0.70:
                        high_quality_count += 1
                        print(f"  ⭐ Score: {scores['overall_score']:.2f} - {scores['reasoning'][:80]}...")
                    else:
                        print(f"  Score: {scores['overall_score']:.2f}")

            # Rate limiting pause
            if i < len(articles):
                import time
                time.sleep(1)

        conn.close()

        # Summary
        print("\n" + "="*60)
        print(f"Summary:")
        print(f"  Articles processed: {len(articles)}")
        print(f"  Successfully scored: {scored_count}")
        print(f"  High-quality articles (≥0.70): {high_quality_count}")
        print(f"Completed at {datetime.now()}")

        return 0

    except Exception as e:
        print(f"Fatal error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
