#!/usr/bin/env python3
"""
AI Curator - Scores articles using Anthropic Claude
"""

import os
import psycopg
from anthropic import Anthropic
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

client = Anthropic(api_key=ANTHROPIC_API_KEY)

SCORING_PROMPT = """You are an AI ethics expert curator for a newsletter. Score this article on three dimensions (0.00 to 1.00):

1. **Relevance** (0.00-1.00): How relevant is this to AI ethics, safety, governance, or societal impact?
2. **Quality** (0.00-1.00): How well-researched, credible, and well-written is this?
3. **Novelty** (0.00-1.00): How fresh or unique is this perspective/news?

Article Title: {title}
Source: {source}
URL: {url}

Respond in this exact JSON format:
{{
  "relevance_score": 0.00,
  "quality_score": 0.00,
  "novelty_score": 0.00,
  "reasoning": "Brief explanation (2-3 sentences)"
}}
"""

def score_articles():
    """Score unscored articles using Claude"""
    print(f"[{datetime.now()}] 🤖 Starting AI curation...")

    conn = psycopg.connect(DATABASE_URL)

    # Get unscored articles
    with conn.cursor() as cur:
        cur.execute("""
            SELECT a.id, a.url, a.title, a.source
            FROM articles a
            LEFT JOIN article_scores s ON a.id = s.article_id
            WHERE s.id IS NULL
            ORDER BY a.scraped_at DESC
            LIMIT 20;
        """)
        articles = cur.fetchall()

    if not articles:
        print(f"[{datetime.now()}] ℹ️  No unscored articles found")
        conn.close()
        return 0

    print(f"[{datetime.now()}] Found {len(articles)} unscored articles")
    scored = 0

    for article in articles:
        article_id, url, title, source = article

        try:
            print(f"[{datetime.now()}] Scoring: {title[:60]}...")

            # Call Claude API
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": SCORING_PROMPT.format(title=title, source=source, url=url)
                }]
            )

            # Parse JSON response
            import json
            result = json.loads(response.content[0].text)

            relevance = float(result['relevance_score'])
            quality = float(result['quality_score'])
            novelty = float(result['novelty_score'])
            reasoning = result['reasoning']

            # Calculate overall score (weighted average)
            overall = (relevance * 0.5) + (quality * 0.3) + (novelty * 0.2)

            # Store in database
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO article_scores
                    (article_id, overall_score, relevance_score, quality_score, novelty_score, reasoning)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, (article_id, overall, relevance, quality, novelty, reasoning))

                conn.commit()
                scored += 1
                print(f"  ✅ Score: {overall:.2f} (R:{relevance:.2f} Q:{quality:.2f} N:{novelty:.2f})")

        except Exception as e:
            print(f"  ❌ Error scoring article: {e}")
            continue

    conn.close()
    print(f"[{datetime.now()}] ✅ AI curation complete. Scored: {scored}")
    return scored

if __name__ == "__main__":
    score_articles()
