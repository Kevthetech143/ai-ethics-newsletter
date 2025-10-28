import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'newsletter_content',
  user: 'listmonk',
  password: 'listmonk',
});

export default pool;
