import { Pool } from 'pg';

// Database connection pool for API routes (server-side only)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
