-- Articles table to store fetched RSS items
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    guid VARCHAR(500) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    description TEXT,
    content TEXT,
    pub_date TIMESTAMP,
    source_name VARCHAR(200) NOT NULL,
    source_url TEXT NOT NULL,
    category VARCHAR(100),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI curation scores table
CREATE TABLE IF NOT EXISTS article_scores (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    quality_score DECIMAL(3,2),
    novelty_score DECIMAL(3,2),
    overall_score DECIMAL(3,2),
    reasoning TEXT,
    ai_model VARCHAR(100),
    scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id)
);

-- Newsletter items table
CREATE TABLE IF NOT EXISTS newsletter_items (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    newsletter_date DATE NOT NULL,
    human_approved BOOLEAN DEFAULT FALSE,
    curator_notes TEXT,
    display_order INTEGER,
    included_in_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, newsletter_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_name);
CREATE INDEX IF NOT EXISTS idx_articles_fetched ON articles(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_overall ON article_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_date ON newsletter_items(newsletter_date);
CREATE INDEX IF NOT EXISTS idx_newsletter_approved ON newsletter_items(human_approved);
