#!/usr/bin/env python3
"""
One-time script to initialize database schema on Render
Run with: python3 init_db.py
"""

import os
import psycopg

# Get database URL from environment or use Render's
DATABASE_URL = os.environ.get('DATABASE_URL',
    'postgresql://ai_ethics_newsletter_db_user:69j8fKI3ony3tZedzd9uLb2c9RIpxTUe@dpg-d401ht75r7bs73a3lf6g-a.ohio-postgres.render.com/ai_ethics_newsletter_db?sslmode=require')

print("🔌 Connecting to database...")
conn = psycopg.connect(DATABASE_URL)

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
print("\n🎉 Database initialization complete!")
