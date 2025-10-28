#!/bin/bash
# RSS Monitor Runner Script
# Run this twice daily via cron: 9am and 5pm
# Example crontab: 0 9,17 * * * /path/to/run_rss_monitor.sh

cd "$(dirname "$0")/.."
source venv/bin/activate
python3 scripts/rss_monitor.py >> logs/rss_monitor.log 2>&1
