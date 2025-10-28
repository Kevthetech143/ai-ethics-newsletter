import postgres from 'postgres';

// Database connection for API routes (serverless-compatible)
const sql = postgres(process.env.DATABASE_URL || '', {
  max: 1, // Serverless-friendly: single connection
});

export default sql;
