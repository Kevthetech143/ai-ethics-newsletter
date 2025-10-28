#!/usr/bin/env python3
"""
Manual test script for the entire pipeline
Run: python3 test_pipeline.py
"""

import os
import sys

# Must set environment variables before running
DATABASE_URL = os.environ.get('DATABASE_URL')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

if not DATABASE_URL:
    print("❌ DATABASE_URL not set")
    print("Set it with:")
    print('export DATABASE_URL="postgresql://ai_ethics_newsletter_db_user:69j8fKI3ony3tZedzd9uLb2c9RIpxTUe@dpg-d401ht75r7bs73a3lf6g-a:5432/ai_ethics_newsletter_db"')
    sys.exit(1)

if not ANTHROPIC_API_KEY:
    print("❌ ANTHROPIC_API_KEY not set")
    sys.exit(1)

print("=" * 60)
print("AI Ethics Newsletter - Pipeline Test")
print("=" * 60)

# Test 1: RSS Monitor
print("\n[1/3] Testing RSS Monitor...")
try:
    from rss_monitor import fetch_rss_feeds
    count = fetch_rss_feeds()
    print(f"✅ RSS Monitor: {count} new articles")
except Exception as e:
    print(f"❌ RSS Monitor failed: {e}")

# Test 2: AI Curator
print("\n[2/3] Testing AI Curator...")
try:
    from ai_curator import score_articles
    count = score_articles()
    print(f"✅ AI Curator: {count} articles scored")
except Exception as e:
    print(f"❌ AI Curator failed: {e}")

# Test 3: Newsletter Assembler
print("\n[3/3] Testing Newsletter Assembler...")
try:
    from newsletter_assembler import assemble_newsletter
    count = assemble_newsletter()
    print(f"✅ Newsletter Assembler: {count} articles selected")
except Exception as e:
    print(f"❌ Newsletter Assembler failed: {e}")

print("\n" + "=" * 60)
print("Pipeline test complete!")
print("=" * 60)
