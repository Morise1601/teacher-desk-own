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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Attempting to insert into 'posted_jobs' using public client...");
  const { data, error } = await supabase.from('posted_jobs').insert([
    {
      title: 'Anon Test Math Teacher',
      subject: 'Mathematics',
      description: 'Anon test description',
      experience_required: '3-5 Years',
      salary_range: '₹45,000 – ₹65,000',
      employment_type: 'Full-time',
      location: 'New Delhi',
      status: 'active'
    }
  ]).select();

  if (error) {
    console.error("❌ Insert error:", error.message, error.code);
  } else {
    console.log("✅ Insert success! Data:", data);
    // Cleanup
    const { error: delError } = await supabase.from('posted_jobs').delete().eq('id', data[0].id);
    if (delError) {
      console.error("❌ Delete cleanup error:", delError.message);
    } else {
      console.log("✅ Cleanup success!");
    }
  }
}

main().catch(console.error);
