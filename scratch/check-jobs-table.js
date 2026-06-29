const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseSecretKey = env.SUPABASE_SECRET_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

async function main() {
  const possibleTables = ['jobs', 'job_posts', 'job_listings', 'job_applications', 'posts', 'post_polls', 'poll_options', 'post_likes', 'post_comments'];
  
  console.log("Checking table existence in Supabase database...");
  for (const table of possibleTables) {
    const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table: ${table} -> Error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ Table: ${table} -> Exists! Record count in query: ${data.length}`);
    }
  }
}

main().catch(console.error);
