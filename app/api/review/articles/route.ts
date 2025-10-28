import { NextRequest, NextResponse } from 'next/server';
import sql from '../../db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minScore = parseFloat(searchParams.get('minScore') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '50');

    const articles = await sql`
      SELECT
        a.id,
        a.url,
        a.title,
        a.source,
        a.published_date,
        a.scraped_at,
        s.overall_score,
        s.relevance_score,
        s.quality_score,
        s.novelty_score,
        s.reasoning,
        s.scored_at,
        n.human_approved,
        n.approved_at,
        n.included_in_sent
      FROM articles a
      LEFT JOIN article_scores s ON a.id = s.article_id
      LEFT JOIN newsletter_items n ON a.id = n.article_id
      WHERE s.overall_score >= ${minScore}
      ORDER BY s.overall_score DESC, a.scraped_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({
      articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Fetch articles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
