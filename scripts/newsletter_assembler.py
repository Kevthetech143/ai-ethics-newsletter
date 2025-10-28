#!/usr/bin/env python3
"""
Newsletter Assembler for AI Ethics Newsletter
Assembles approved articles into newsletter and sends via Listmonk.
"""

import json
import sys
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict
import psycopg
import requests
from requests.auth import HTTPBasicAuth

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'dbname': 'newsletter_content',
    'user': 'listmonk',
    'password': 'listmonk'
}

# Listmonk configuration
LISTMONK_URL = 'http://localhost:9000'
LISTMONK_USERNAME = 'admin'
LISTMONK_PASSWORD = 'listmonk'
LISTMONK_LIST_ID = 3  # AI Ethics Newsletter list ID

def get_approved_articles(conn, newsletter_date: str = None) -> List[Dict]:
    """Fetch approved articles for a newsletter date."""
    if not newsletter_date:
        newsletter_date = date.today().isoformat()

    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            a.id,
            a.title,
            a.link,
            a.description,
            a.source_name,
            a.pub_date,
            a.category,
            s.overall_score,
            s.reasoning,
            ni.curator_notes,
            ni.display_order
        FROM newsletter_items ni
        JOIN articles a ON ni.article_id = a.id
        JOIN article_scores s ON a.id = s.article_id
        WHERE ni.newsletter_date = %s
          AND ni.human_approved = true
          AND ni.included_in_sent = false
        ORDER BY COALESCE(ni.display_order, 0), s.overall_score DESC
    """, (newsletter_date,))

    articles = []
    for row in cursor.fetchall():
        articles.append({
            'id': row[0],
            'title': row[1],
            'link': row[2],
            'description': row[3],
            'source_name': row[4],
            'pub_date': row[5],
            'category': row[6],
            'overall_score': float(row[7]),
            'reasoning': row[8],
            'curator_notes': row[9],
            'display_order': row[10]
        })

    cursor.close()
    return articles

def format_article_html(article: Dict) -> str:
    """Format a single article as HTML."""
    pub_date_str = article['pub_date'].strftime('%b %d, %Y') if article['pub_date'] else 'Date unknown'

    # Truncate description if too long
    description = article['description'] or ''
    if len(description) > 300:
        description = description[:297] + '...'

    # Category badge
    category_tag = f'<span class="article-category">{article["category"].upper()}</span>' if article['category'] else ''

    html = f'''
    <div class="article">
        <div class="article-header">
            <span class="score-badge">Score: {article["overall_score"]:.2f}</span>
            {category_tag}
        </div>
        <h2><a href="{article['link']}" target="_blank">{article['title']}</a></h2>
        <div class="article-meta">
            <span>{article['source_name']}</span>
            <span>•</span>
            <span>{pub_date_str}</span>
        </div>
        <div class="article-description">
            {description}
        </div>
        <div class="article-reasoning">
            <strong>Why this matters:</strong> {article['reasoning']}
        </div>
        <a href="{article['link']}" target="_blank" class="read-more">Read Full Article →</a>
    </div>
    '''
    return html

def assemble_newsletter(articles: List[Dict], newsletter_date: str) -> str:
    """Assemble the complete newsletter HTML."""
    script_dir = Path(__file__).parent
    template_path = script_dir / 'newsletter_template.html'

    with open(template_path, 'r') as f:
        template = f.read()

    # Format all articles
    articles_html = '\n'.join([format_article_html(article) for article in articles])

    # Format date
    date_obj = datetime.strptime(newsletter_date, '%Y-%m-%d')
    formatted_date = date_obj.strftime('%B %d, %Y')

    # Replace template variables
    newsletter_html = template.replace('{{ date }}', formatted_date)
    newsletter_html = newsletter_html.replace('{{ article_count }}', str(len(articles)))
    newsletter_html = newsletter_html.replace('{{ articles }}', articles_html)

    # Listmonk placeholders
    newsletter_html = newsletter_html.replace('{{ archive_url }}', 'http://localhost:9000/archive')
    newsletter_html = newsletter_html.replace('{{ website_url }}', 'http://localhost:3000')
    newsletter_html = newsletter_html.replace('{{ unsubscribe_url }}', '{{ UnsubscribeURL }}')
    newsletter_html = newsletter_html.replace('{{ manage_url }}', '{{ ManageURL }}')

    return newsletter_html

def create_listmonk_campaign(subject: str, html_body: str, list_ids: List[int], send_now: bool = False) -> Dict:
    """Create a campaign in Listmonk."""
    url = f'{LISTMONK_URL}/api/campaigns'
    auth = HTTPBasicAuth(LISTMONK_USERNAME, LISTMONK_PASSWORD)

    payload = {
        'name': subject,
        'subject': subject,
        'lists': list_ids,
        'type': 'regular',
        'content_type': 'html',
        'body': html_body,
        'send_at': None if send_now else None,
        'messenger': 'email'
    }

    response = requests.post(url, json=payload, auth=auth)
    response.raise_for_status()

    campaign_data = response.json()
    return campaign_data['data']

def send_campaign(campaign_id: int) -> bool:
    """Send a campaign immediately."""
    url = f'{LISTMONK_URL}/api/campaigns/{campaign_id}/status'
    auth = HTTPBasicAuth(LISTMONK_USERNAME, LISTMONK_PASSWORD)

    payload = {'status': 'running'}

    response = requests.put(url, json=payload, auth=auth)
    response.raise_for_status()

    return True

def mark_articles_sent(conn, article_ids: List[int]) -> None:
    """Mark articles as included in sent newsletter."""
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE newsletter_items
        SET included_in_sent = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE article_id = ANY(%s)
    """, (article_ids,))
    conn.commit()
    cursor.close()

def main():
    """Main execution function."""
    print(f"Newsletter Assembler started at {datetime.now()}")
    print("="*60)

    # Parse command line arguments
    newsletter_date = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()
    send_now = '--send' in sys.argv

    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg.connect(**DB_CONFIG)
        print("Connected!\n")

        # Fetch approved articles
        print(f"Fetching approved articles for {newsletter_date}...")
        articles = get_approved_articles(conn, newsletter_date)
        print(f"Found {len(articles)} approved articles\n")

        if not articles:
            print("No approved articles found. Exiting.")
            conn.close()
            return 0

        # Display articles
        print("Articles to include:")
        for i, article in enumerate(articles, 1):
            print(f"  {i}. {article['title'][:60]}... (Score: {article['overall_score']:.2f})")
        print()

        # Assemble newsletter
        print("Assembling newsletter...")
        newsletter_html = assemble_newsletter(articles, newsletter_date)
        print("Newsletter assembled!\n")

        # Create subject line
        date_obj = datetime.strptime(newsletter_date, '%Y-%m-%d')
        subject = f"AI Ethics Newsletter • {date_obj.strftime('%B %d, %Y')} • {len(articles)} Key Insights"

        # Create campaign in Listmonk
        print("Creating campaign in Listmonk...")
        campaign = create_listmonk_campaign(
            subject=subject,
            html_body=newsletter_html,
            list_ids=[LISTMONK_LIST_ID],
            send_now=False
        )
        campaign_id = campaign['id']
        print(f"Campaign created! ID: {campaign_id}\n")

        if send_now:
            print("Sending newsletter...")
            send_campaign(campaign_id)
            print("Newsletter sent!\n")

            # Mark articles as sent
            article_ids = [a['id'] for a in articles]
            mark_articles_sent(conn, article_ids)
            print("Articles marked as sent")
        else:
            print(f"Campaign created but NOT sent.")
            print(f"To send, visit: {LISTMONK_URL}/campaigns/{campaign_id}")
            print("Or run with --send flag to send immediately")

        conn.close()

        print("\n" + "="*60)
        print("Newsletter assembly complete!")
        print(f"Subject: {subject}")
        print(f"Articles: {len(articles)}")
        print(f"Campaign ID: {campaign_id}")
        print(f"Completed at {datetime.now()}")

        return 0

    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
