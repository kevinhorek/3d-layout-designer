/**
 * Run Supabase migration (001_initial.sql) against your project.
 *
 * 1. In Supabase Dashboard: Project → Settings → Database.
 * 2. Copy the "Connection string" → "URI" (use the one that includes your password).
 * 3. Set it in .env.local as SUPABASE_DB_URL (or pass as env when running).
 *
 * Then run: node scripts/run-migration.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL in .env.local')
  console.error('Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)')
  process.exit(1)
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial.sql')
const sql = fs.readFileSync(migrationPath, 'utf8')

const client = new Client({ connectionString: dbUrl })

async function run() {
  try {
    await client.connect()
    await client.query(sql)
    console.log('Migration 001_initial.sql ran successfully.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
