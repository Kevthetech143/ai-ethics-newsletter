#!/usr/bin/env python3
"""
Render Background Worker - Handles database initialization and cron jobs
"""

import os
import sys
import time
import schedule
import psycopg
from datetime import datetime

# Force unbuffered output for immediate log visibility
sys.stdout.reconfigure(line_buffering=True)

DATABASE_URL = os.environ.get('DATABASE_URL')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

def init_database():
    """Initialize database schema on first run"""
    print(f"[{datetime.now()}] 🔌 Initializing database schema...")

    try:
        conn = psycopg.connect(DATABASE_URL)

        with conn.cursor() as cur:
            # Create tables
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
            print(f"[{datetime.now()}] ✅ Database schema initialized!")

        conn.close()
        return True

    except Exception as e:
        print(f"[{datetime.now()}] ❌ Database init error: {e}")
        return False

def run_rss_monitor():
    """Run RSS monitor script"""
    print(f"[{datetime.now()}] 📡 Running RSS monitor...")
    # TODO: Import and run rss_monitor.py

def run_ai_curator():
    """Run AI curator script"""
    print(f"[{datetime.now()}] 🤖 Running AI curator...")
    # TODO: Import and run ai_curator.py

def run_newsletter_assembler():
    """Run newsletter assembler script"""
    print(f"[{datetime.now()}] 📧 Running newsletter assembler...")
    # TODO: Import and run newsletter_assembler.py

if __name__ == "__main__":
    print(f"[{datetime.now()}] 🚀 Background worker starting...")

    # Initialize database on startup
    init_database()

    # Schedule jobs
    schedule.every().day.at("09:00").do(run_rss_monitor)
    schedule.every().day.at("17:00").do(run_rss_monitor)
    schedule.every().day.at("09:30").do(run_ai_curator)
    schedule.every().day.at("17:30").do(run_ai_curator)
    schedule.every().monday.at("08:00").do(run_newsletter_assembler)
    schedule.every().thursday.at("08:00").do(run_newsletter_assembler)

    print(f"[{datetime.now()}] ⏰ Scheduled jobs configured")
    print(f"[{datetime.now()}] 🔄 Worker running. Press Ctrl+C to stop.")

    # Run scheduler loop
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute
