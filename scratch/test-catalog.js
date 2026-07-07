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
const supabaseSecretKey = env.SUPABASE_SECRET_KEY || ''; // Admin key

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

async function main() {
  console.log("Attempting to query pg_trigger via Supabase REST API...");
  try {
    const { data, error } = await supabaseAdmin
      .from('pg_trigger')
      .select('*')
      .limit(5);
    if (error) {
      console.log("❌ pg_trigger query failed:", error.message);
    } else {
      console.log("✅ pg_trigger query succeeded! Data:", data);
    }
  } catch (err) {
    console.log("❌ Exception querying pg_trigger:", err.message);
  }

  console.log("Attempting to query information_schema.triggers...");
  try {
    const { data, error } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .limit(5);
    if (error) {
      console.log("❌ information_schema.triggers query failed:", error.message);
    } else {
      console.log("✅ information_schema.triggers query succeeded! Data:", data);
    }
  } catch (err) {
    console.log("❌ Exception querying information_schema.triggers:", err.message);
  }
}

main().catch(console.error);
