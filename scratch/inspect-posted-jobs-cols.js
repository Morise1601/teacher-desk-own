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
  console.log("Fetching schema info for 'posted_jobs' table...");
  
  // We can query information_schema or just select a row and look at keys
  const { data, error } = await supabaseAdmin.from('posted_jobs').select('*').limit(1);
  if (error) {
    console.error("Error fetching posted_jobs:", error.message);
  } else {
    console.log("posted_jobs sample record:", data);
  }

  // Also check job_applications
  const { data: apps, error: appsErr } = await supabaseAdmin.from('job_applications').select('*').limit(1);
  if (appsErr) {
    console.error("Error fetching job_applications:", appsErr.message);
  } else {
    console.log("job_applications sample record:", apps);
  }
}

main().catch(console.error);
