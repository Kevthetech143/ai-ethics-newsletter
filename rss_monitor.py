#!/usr/bin/env python3
"""
RSS Monitor - Fetches articles from AI ethics RSS feeds
"""

import os
import feedparser
import psycopg
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')

# AI Ethics RSS Feeds
RSS_FEEDS = [
    {
        'url': 'https://www.anthropic.com/blog/rss.xml',
        'source': 'Anthropic Blog'
    },
    {
        'url': 'https://openai.com/blog/rss.xml',
        'source': 'OpenAI Blog'
    },
    {
        'url': 'https://www.aiethicsjournal.org/feed',
        'source': 'AI Ethics Journal'
    },
    {
        'url': 'https://futureoflife.org/feed/',
        'source': 'Future of Life Institute'
    }
]

def fetch_rss_feeds():
    """Fetch and store new articles from RSS feeds"""
    print(f"[{datetime.now()}] 📡 Starting RSS feed monitoring...")

    conn = psycopg.connect(DATABASE_URL)
    new_articles = 0

    for feed_info in RSS_FEEDS:
        try:
            print(f"[{datetime.now()}] Fetching {feed_info['source']}...")
            feed = feedparser.parse(feed_info['url'])

            for entry in feed.entries[:10]:  # Limit to 10 most recent
                try:
                    # Extract article details
                    url = entry.link
                    title = entry.title
                    source = feed_info['source']
                    published = None

                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6])

                    # Insert into database (skip if URL exists)
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO articles (url, title, source, published_date)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (url) DO NOTHING
                            RETURNING id;
                        """, (url, title, source, published))

                        if cur.fetchone():
                            new_articles += 1
                            print(f"  ✅ Added: {title[:60]}...")

                        conn.commit()

                except Exception as e:
                    print(f"  ⚠️  Error processing entry: {e}")
                    continue

        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error fetching {feed_info['source']}: {e}")

    conn.close()
    print(f"[{datetime.now()}] ✅ RSS monitoring complete. New articles: {new_articles}")
    return new_articles

if __name__ == "__main__":
    fetch_rss_feeds()
