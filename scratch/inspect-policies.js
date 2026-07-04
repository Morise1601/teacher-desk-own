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
  console.log("Fetching pg_policies...");
  const { data, error } = await supabaseAdmin.rpc('get_policies'); // if custom RPC exists
  
  if (error) {
    // If no custom RPC, let's query raw SQL via a known method or check the policies using pg_catalog
    console.log("No RPC get_policies, querying via postgres query directly...");
    const { data: policies, error: sqlErr } = await supabaseAdmin.from('pg_policies').select('*');
    if (sqlErr) {
      console.log("Standard select on pg_policies failed. Trying raw query through pg_catalog...");
      // Let's run a select on a table that is a view of policies or read schema
      const { data: polList, error: polErr } = await supabaseAdmin
        .from('posted_jobs')
        .select('*')
        .limit(0); // won't tell policies but checks access
      console.log("Checking policy system status...");
    }
  } else {
    console.log("Policies:", data);
  }
  
  // Let's query pg_policies using custom select if we can run it, or write a script that queries it via SQL
  // In Supabase, if we don't have SQL execution panel, we can look at what happens when we use authenticated inserts.
}

main().catch(console.error);
