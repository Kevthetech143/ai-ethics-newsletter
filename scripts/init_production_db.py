#!/usr/bin/env python3
"""
Initialize production database schema on Render
Run this once after deployment: python3 scripts/init_production_db.py
"""

import os
import psycopg

def init_database():
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')

    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        return False

    try:
        print("🔌 Connecting to production database...")
        conn = psycopg.connect(database_url)

        with conn.cursor() as cur:
            print("📋 Creating articles table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS articles (
                    id SERIAL PRIMARY KEY,
                    url TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    source TEXT NOT NULL,
                    published_date TIMESTAMP,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            print("📋 Creating article_scores table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS article_scores (
                    id SERIAL PRIMARY KEY,
                    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
                    overall_score DECIMAL(3,2),
                    relevance_score DECIMAL(3,2),
                    quality_score DECIMAL(3,2),
                    novelty_score DECIMAL(3,2),
                    reasoning TEXT,
                    scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(article_id)
                );
            """)

            print("📋 Creating newsletter_items table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS newsletter_items (
                    id SERIAL PRIMARY KEY,
                    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
                    human_approved BOOLEAN DEFAULT FALSE,
                    approved_at TIMESTAMP,
                    included_in_sent BOOLEAN DEFAULT FALSE,
                    sent_at TIMESTAMP,
                    newsletter_date DATE
                );
            """)

            conn.commit()
            print("✅ Database schema initialized successfully!")

            # Verify tables
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cur.fetchall()
            print(f"\n📊 Tables in database: {', '.join([t[0] for t in tables])}")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    exit(0 if success else 1)
