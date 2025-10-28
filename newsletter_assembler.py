#!/usr/bin/env python3
"""
Newsletter Assembler - Generates newsletter from top-scored articles
"""

import os
import psycopg
from datetime import datetime, date

DATABASE_URL = os.environ.get('DATABASE_URL')

def assemble_newsletter():
    """Select top articles and add to newsletter_items for human review"""
    print(f"[{datetime.now()}] 📧 Starting newsletter assembly...")

    conn = psycopg.connect(DATABASE_URL)

    # Get top-scored articles from last 7 days that haven't been included yet
    with conn.cursor() as cur:
        cur.execute("""
            SELECT a.id, a.title, a.source, a.url, s.overall_score, s.reasoning
            FROM articles a
            JOIN article_scores s ON a.id = s.article_id
            LEFT JOIN newsletter_items n ON a.id = n.article_id
            WHERE n.id IS NULL
              AND a.scraped_at > NOW() - INTERVAL '7 days'
            ORDER BY s.overall_score DESC
            LIMIT 10;
        """)
        articles = cur.fetchall()

    if not articles:
        print(f"[{datetime.now()}] ℹ️  No new high-scoring articles found")
        conn.close()
        return 0

    print(f"[{datetime.now()}] Found {len(articles)} top articles")
    added = 0

    # Add articles to newsletter_items for human review
    for article in articles:
        article_id, title, source, url, score, reasoning = article

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO newsletter_items (article_id, newsletter_date)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (article_id, date.today()))

                conn.commit()
                added += 1
                print(f"  ✅ Added: {title[:60]}... (Score: {score:.2f})")

        except Exception as e:
            print(f"  ❌ Error adding article: {e}")
            continue

    conn.close()
    print(f"[{datetime.now()}] ✅ Newsletter assembly complete. Added: {added} articles")
    return added

if __name__ == "__main__":
    assemble_newsletter()
