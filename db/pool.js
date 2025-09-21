require('dotenv').config();
const { Pool }  = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = isProduction 
  ? process.env.DATABASE_URL 
  : `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'members_only_top'}`;

module.exports = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

