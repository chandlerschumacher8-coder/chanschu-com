// run-sql.mjs — Execute SQL against Supabase programmatically
// Usage: node run-sql.mjs "SQL STATEMENT"
// Or:    node run-sql.mjs path/to/file.sql
//
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Also needs: SUPABASE_ACCESS_TOKEN (personal access token from https://supabase.com/dashboard/account/tokens)

import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!ACCESS_TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN — generate one at https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    const body = await res.json();
    return { ok: true, result: body };
  }

  const errText = await res.text();
  return { ok: false, error: `HTTP ${res.status}: ${errText.substring(0, 300)}` };
}

// Main
const input = process.argv[2];
if (!input) {
  console.error('Usage: node run-sql.mjs "SQL" or node run-sql.mjs file.sql');
  process.exit(1);
}

let sql = input;
if (input.endsWith('.sql') && fs.existsSync(input)) {
  sql = fs.readFileSync(input, 'utf8');
}

// Run as a single batch — Supabase Management API supports multi-statement
console.log('Running SQL via Supabase Management API...\n');
const result = await runSQL(sql);

if (result.ok) {
  console.log('✓ SQL executed successfully');
  if (result.result && Array.isArray(result.result) && result.result.length) {
    // Show result rows if it was a SELECT
    result.result.forEach(r => {
      if (Array.isArray(r) && r.length) {
        console.log('\nResult:');
        r.forEach(row => console.log(' ', JSON.stringify(row)));
      }
    });
  }
} else {
  console.error('✗ SQL execution failed');
  console.error(result.error);
  process.exit(1);
}
