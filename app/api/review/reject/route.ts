import { NextResponse } from 'next/server';
import sql from '../../db';

export async function POST(request: Request) {
  try {
    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Check if newsletter_items record exists
    const existing = await sql`
      SELECT id FROM newsletter_items WHERE article_id = ${articleId}
    `;

    if (existing.length > 0) {
      // Update existing record
      await sql`
        UPDATE newsletter_items
        SET human_approved = false,
            approved_at = NULL
        WHERE article_id = ${articleId}
      `;
    } else {
      // Create new record marked as rejected
      await sql`
        INSERT INTO newsletter_items (article_id, human_approved)
        VALUES (${articleId}, false)
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Article rejected'
    });

  } catch (error) {
    console.error('Error rejecting article:', error);
    return NextResponse.json(
      { error: 'Failed to reject article' },
      { status: 500 }
    );
  }
}
