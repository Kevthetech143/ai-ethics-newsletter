import { Client } from 'pg'

let isInitialized = false

export async function initDatabase() {
  // Only run once per process
  if (isInitialized) {
    console.log('✅ Database already initialized in this process')
    return
  }

  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set, skipping database initialization')
    return
  }

  try {
    console.log('🔌 Initializing database schema...')

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

    await client.end()

    isInitialized = true
    console.log('✅ Database schema initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    // Don't throw - allow app to start even if DB init fails
  }
}
