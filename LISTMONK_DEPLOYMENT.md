# Listmonk Deployment Guide for Render

## Option 1: Deploy Listmonk on Render (Requires Paid Plan)

Listmonk requires Docker deployment, which needs Render Starter plan ($7/month).

### Steps:

1. **Create Web Service via Dashboard**
   - Go to: https://dashboard.render.com
   - Click "New" → "Web Service"
   - Connect GitHub repo: https://github.com/Kevthetech143/ai-ethics-newsletter
   - Service settings:
     - Name: `ai-ethics-newsletter-listmonk`
     - Runtime: `Docker`
     - Dockerfile path: `Dockerfile.listmonk`
     - Plan: `Starter` ($7/month minimum for Docker)
     - Region: `Ohio` (same as database)

2. **Environment Variables**
   ```
   LISTMONK_database__host=dpg-d401ht75r7bs73a3lf6g-a
   LISTMONK_database__port=5432
   LISTMONK_database__user=ai_ethics_newsletter_db_user
   LISTMONK_database__password=69j8fKI3ony3tZedzd9uLb2c9RIpxTUe
   LISTMONK_database__database=ai_ethics_newsletter_db
   LISTMONK_database__ssl_mode=disable
   LISTMONK_app__admin_username=admin
   LISTMONK_app__admin_password=[SET_SECURE_PASSWORD]
   ```

3. **Initialize Listmonk Database**
   After first deploy, run:
   ```bash
   ./listmonk --install
   ```

4. **Access Dashboard**
   - URL: https://ai-ethics-newsletter-listmonk.onrender.com
   - Login with admin credentials
   - Configure SMTP (AWS SES recommended)

## Option 2: Use Alternative Email Service (Simpler)

Instead of self-hosting Listmonk, use managed email services:

### Mailgun (Recommended for MVP)
- Free tier: 5,000 emails/month for 3 months
- Easy API integration
- No infrastructure management

### SendGrid
- Free tier: 100 emails/day
- Simple API
- Good deliverability

### Implementation
Create `send_newsletter.py`:
```python
import requests

MAILGUN_API_KEY = os.environ.get('MAILGUN_API_KEY')
MAILGUN_DOMAIN = os.environ.get('MAILGUN_DOMAIN')

def send_newsletter(subscribers, content):
    for subscriber in subscribers:
        requests.post(
            f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
            auth=("api", MAILGUN_API_KEY),
            data={
                "from": "AI Ethics Newsletter <newsletter@yourdomain.com>",
                "to": subscriber['email'],
                "subject": "This Week in AI Ethics",
                "html": content
            }
        )
```

## Recommendation

For MVP launch:
- **Start with Mailgun** (simpler, cheaper during validation phase)
- **Migrate to Listmonk later** when newsletter grows and self-hosting becomes cost-effective

Current infrastructure cost:
- PostgreSQL Free: $0
- Next.js Web Service: $7/month
- Background Worker: $7/month
- **Total: $14/month** (without Listmonk)

With Listmonk:
- **Total: $21/month** (+$7 for Docker service)
