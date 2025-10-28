#!/bin/bash
# AI Curator Runner Script
# Scores articles using Claude API
# Run after RSS monitor completes

cd "$(dirname "$0")/.."

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: ANTHROPIC_API_KEY environment variable not set"
    echo "Get your API key from: https://console.anthropic.com/settings/keys"
    echo "Then export it: export ANTHROPIC_API_KEY=your_key_here"
    exit 1
fi

source venv/bin/activate
python3 scripts/ai_curator.py >> logs/ai_curator.log 2>&1
