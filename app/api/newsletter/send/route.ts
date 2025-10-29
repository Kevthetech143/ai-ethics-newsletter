import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import sql from '../../db';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template function
function generateNewsletterHTML(articles: any[]) {
  const articleHTML = articles.map(article => `
    <div style="margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #111827;">
        <a href="${article.url}" style="color: #111827; text-decoration: none;" target="_blank">
          ${article.title}
        </a>
      </h2>

      <div style="margin-bottom: 12px; font-size: 14px; color: #6b7280;">
        ${article.source} • ${new Date(article.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>

      <div style="display: inline-block; background: #f3f4f6; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">
          AI Score
        </div>
        <div style="font-size: 24px; font-weight: 700; color: ${article.overall_score >= 0.8 ? '#059669' : '#3b82f6'};">
          ${(article.overall_score * 100).toFixed(0)}/100
        </div>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
        <div style="font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; margin-bottom: 8px;">
          Why This Matters (Claude's Analysis)
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">
          ${article.reasoning}
        </p>
      </div>

      <div style="margin-top: 16px;">
        <div style="display: inline-grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 13px;">
          <div>
            <span style="color: #6b7280;">Relevance:</span>
            <span style="font-weight: 600; color: #111827;"> ${(article.relevance_score * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span style="color: #6b7280;">Quality:</span>
            <span style="font-weight: 600; color: #111827;"> ${(article.quality_score * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span style="color: #6b7280;">Novelty:</span>
            <span style="font-weight: 600; color: #111827;"> ${(article.novelty_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <a href="${article.url}"
         style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;"
         target="_blank">
        Read Full Article →
      </a>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Ethics Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white;">
        AI Ethics Newsletter
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #bfdbfe;">
        ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>

    <!-- Intro -->
    <div style="padding: 32px; border-bottom: 2px solid #e5e7eb;">
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Your weekly digest of the most important developments in AI safety and ethics—curated by Claude AI and reviewed by humans.
      </p>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          <strong>📊 How we curate:</strong> Claude Sonnet 4.5 scores each article on relevance, quality, and novelty. Below, you'll see the AI's reasoning and scores for every story.
        </p>
      </div>
    </div>

    <!-- Articles -->
    <div style="padding: 32px;">
      ${articleHTML}
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 32px; border-top: 2px solid #e5e7eb; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
        You're receiving this because you subscribed to AI Ethics Newsletter
      </p>
      <div style="margin-bottom: 16px;">
        <a href="{{unsubscribe_url}}" style="color: #6b7280; font-size: 13px; text-decoration: underline;">
          Unsubscribe
        </a>
      </div>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} AI Ethics Newsletter. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: Request) {
  try {
    // Get approved articles that haven't been sent yet
    const approvedArticles = await sql`
      SELECT
        a.id,
        a.url,
        a.title,
        a.source,
        a.published_date,
        s.overall_score,
        s.relevance_score,
        s.quality_score,
        s.novelty_score,
        s.reasoning,
        n.id as newsletter_item_id
      FROM articles a
      INNER JOIN article_scores s ON a.id = s.article_id
      INNER JOIN newsletter_items n ON a.id = n.article_id
      WHERE n.human_approved = true
        AND (n.included_in_sent IS NULL OR n.included_in_sent = false)
      ORDER BY s.overall_score DESC
      LIMIT 10
    `;

    if (approvedArticles.length === 0) {
      return NextResponse.json(
        { error: 'No approved articles to send' },
        { status: 400 }
      );
    }

    // Convert scores to numbers
    const articles = approvedArticles.map((article: any) => ({
      ...article,
      overall_score: parseFloat(article.overall_score),
      relevance_score: parseFloat(article.relevance_score),
      quality_score: parseFloat(article.quality_score),
      novelty_score: parseFloat(article.novelty_score)
    }));

    // Get active subscribers
    const subscribers = await sql`
      SELECT email FROM subscribers WHERE active = true
    `;

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers' },
        { status: 400 }
      );
    }

    // Generate email HTML
    const emailHTML = generateNewsletterHTML(articles);

    // Send emails (TEMPORARY: only to owner email for Resend test domain)
    // TODO: Remove filter when custom domain is verified
    const { data, error } = await resend.emails.send({
      from: 'AI Ethics Newsletter <onboarding@resend.dev>',
      to: ['talkers.winding_0w@icloud.com'],
      subject: `AI Ethics Digest – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
      html: emailHTML,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send emails', details: error },
        { status: 500 }
      );
    }

    // Mark articles as sent
    const articleIds = articles.map(a => a.id);
    await sql`
      UPDATE newsletter_items
      SET included_in_sent = true,
          sent_at = NOW(),
          newsletter_date = CURRENT_DATE
      WHERE article_id IN ${sql(articleIds)}
    `;

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      articleCount: articles.length,
      subscriberCount: subscribers.length,
      emailId: data?.id
    });

  } catch (error) {
    console.error('Send newsletter error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter', details: String(error) },
      { status: 500 }
    );
  }
}
