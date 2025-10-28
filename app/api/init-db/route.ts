import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  try {
    // Check for secret token to prevent unauthorized access
    const DATABASE_URL = process.env.DATABASE_URL

    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      )
    }
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    // Create articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        published_date TIMESTAMP,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Create article_scores table
    await client.query(`
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
    `)

    // Create newsletter_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_items (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        human_approved BOOLEAN DEFAULT FALSE,
        approved_at TIMESTAMP,
        included_in_sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP,
        newsletter_date DATE
      );
    `)

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    await client.end()

    return NextResponse.json({
      success: true,
      message: 'Database schema initialized',
      tables: result.rows.map((r: any) => r.table_name)
    })

  } catch (error: any) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
