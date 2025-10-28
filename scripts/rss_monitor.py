#!/usr/bin/env python3
"""
RSS Feed Monitor for AI Ethics Newsletter
Fetches articles from configured RSS feeds and stores them in the database.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
import feedparser
import psycopg
from typing import List, Dict, Optional
import hashlib

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'dbname': 'newsletter_content',
    'user': 'listmonk',
    'password': 'listmonk'
}

def load_feeds(feeds_file: str = '../rss-feeds.json') -> List[Dict]:
    """Load RSS feed configuration from JSON file."""
    script_dir = Path(__file__).parent
    feeds_path = script_dir / feeds_file

    with open(feeds_path, 'r') as f:
        config = json.load(f)
    return config['feeds']

def generate_guid(link: str, title: str) -> str:
    """Generate a unique GUID for an article if one doesn't exist."""
    content = f"{link}|{title}"
    return hashlib.sha256(content.encode()).hexdigest()

def parse_feed(feed_url: str, feed_name: str, category: str) -> List[Dict]:
    """Parse an RSS feed and extract article information."""
    print(f"Fetching {feed_name}...")

    try:
        feed = feedparser.parse(feed_url)
        articles = []

        for entry in feed.entries:
            # Generate or use existing GUID
            guid = entry.get('id') or entry.get('guid') or generate_guid(
                entry.get('link', ''),
                entry.get('title', '')
            )

            # Parse publication date
            pub_date = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                pub_date = datetime(*entry.updated_parsed[:6])

            article = {
                'guid': guid,
                'title': entry.get('title', 'No title'),
                'link': entry.get('link', ''),
                'description': entry.get('summary', ''),
                'content': entry.get('content', [{}])[0].get('value', '') if hasattr(entry, 'content') else '',
                'pub_date': pub_date,
                'source_name': feed_name,
                'source_url': feed_url,
                'category': category
            }
            articles.append(article)

        print(f"  Found {len(articles)} articles")
        return articles

    except Exception as e:
        print(f"  Error parsing {feed_name}: {e}")
        return []

def store_articles(articles: List[Dict], conn) -> int:
    """Store articles in the database, skipping duplicates."""
    if not articles:
        return 0

    cursor = conn.cursor()
    stored_count = 0

    for article in articles:
        try:
            cursor.execute("""
                INSERT INTO articles
                (guid, title, link, description, content, pub_date, source_name, source_url, category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (guid) DO NOTHING
                RETURNING id
            """, (
                article['guid'],
                article['title'],
                article['link'],
                article['description'],
                article['content'],
                article['pub_date'],
                article['source_name'],
                article['source_url'],
                article['category']
            ))

            if cursor.fetchone():
                stored_count += 1

        except Exception as e:
            print(f"  Error storing article '{article['title'][:50]}...': {e}")
            conn.rollback()
            continue

    conn.commit()
    cursor.close()
    return stored_count

def main():
    """Main execution function."""
    print(f"RSS Monitor started at {datetime.now()}")
    print("="*60)

    try:
        # Load feed configuration
        feeds = load_feeds()
        print(f"Loaded {len(feeds)} RSS feeds\n")

        # Connect to database
        print("Connecting to database...")
        conn = psycopg.connect(**DB_CONFIG)
        print("Connected!\n")

        # Process each feed
        total_articles = 0
        total_stored = 0

        for feed in feeds:
            articles = parse_feed(feed['url'], feed['name'], feed['category'])
            stored = store_articles(articles, conn)
            total_articles += len(articles)
            total_stored += stored

            if stored > 0:
                print(f"  Stored {stored} new articles\n")
            else:
                print(f"  No new articles\n")

        conn.close()

        # Summary
        print("="*60)
        print(f"Summary:")
        print(f"  Total articles found: {total_articles}")
        print(f"  New articles stored: {total_stored}")
        print(f"Completed at {datetime.now()}")

        return 0

    except Exception as e:
        print(f"Fatal error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
