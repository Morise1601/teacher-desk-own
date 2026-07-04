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

async function main() {
  const fetch = (await import('node-fetch')).default;
  
  const url = `${supabaseUrl}/rest/v1/`;
  const response = await fetch(url, {
    headers: {
      'apikey': supabaseSecretKey,
      'Authorization': `Bearer ${supabaseSecretKey}`
    }
  });

  const schema = await response.json();
  const tables = ['posted_jobs', 'job_applications', 'job_saved', 'job_notifications'];
  for (const table of tables) {
    console.log(`\n================= TABLE: ${table} =================`);
    if (schema.definitions && schema.definitions[table]) {
      console.log(JSON.stringify(schema.definitions[table].properties, null, 2));
    } else {
      console.log("No definition found in schema.");
    }
  }
}

main().catch(console.error);
