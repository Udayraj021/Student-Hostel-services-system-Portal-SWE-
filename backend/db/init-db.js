const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const seedPath = path.join(__dirname, 'seed.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const seed = fs.readFileSync(seedPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('→ Executing schema.sql ...');
  await conn.query(schema);
  console.log('✓ Schema created.');

  console.log('→ Seeding reference data (seed.sql) ...');
  await conn.query(seed);
  console.log('✓ Reference data inserted.');

  await conn.end();
  console.log('\nDatabase initialised. Now run: npm run db:seed to create demo users.');
}

run().catch((err) => {
  console.error('\nDatabase init failed.');
  console.error(err.message || err);
  if (err.code) console.error('  code:', err.code);
  if (err.errno) console.error('  errno:', err.errno);
  if (err.sqlMessage) console.error('  sql:', err.sqlMessage);
  console.error('\nCheck: MySQL is running, DB_USER/DB_PASSWORD in backend/.env are correct,');
  console.error('and this user may CREATE DATABASE (or run as a user that can).\n');
  process.exit(1);
});
