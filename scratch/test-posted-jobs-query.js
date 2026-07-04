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
  const instId = 'fc1dc924-9d64-421d-971b-6a23fd1b87cb'; // TD Instituition
  
  console.log("Inserting a test job into 'posted_jobs'...");
  const { data: job, error: insertErr } = await supabaseAdmin
    .from('posted_jobs')
    .insert([
      {
        institution_id: instId,
        title: 'Test Chemistry Teacher',
        subject: 'Chemistry',
        description: 'Test description',
        requirements: 'Test requirements',
        experience_required: '1-3 Years',
        salary_range: '₹30,000 – ₹45,000',
        salary_min: 30000,
        employment_type: 'Full-time',
        location: 'Pondicherry',
        deadline: '2026-08-30',
        positions_open: 2,
        skills_required: ['Chemistry', 'Lab Safety'],
        status: 'active'
      }
    ])
    .select()
    .single();

  if (insertErr) {
    console.error("❌ Insert error:", insertErr.message);
    return;
  }
  
  console.log("✅ Insert success! Job:", job);

  console.log("\nAttempting to query posted_jobs joined with institutions...");
  // Let's test if we can join via foreign keys
  const { data: joinData, error: joinErr } = await supabaseAdmin
    .from('posted_jobs')
    .select(`
      *,
      institutions:institutions!inner(
        name
      )
    `);

  if (joinErr) {
    console.log("❌ inner join with institutions failed:", joinErr.message);
    
    // Try joining with profiles
    const { data: joinProf, error: joinProfErr } = await supabaseAdmin
      .from('posted_jobs')
      .select(`
        *,
        profiles!inner(
          role
        )
      `);
      
    if (joinProfErr) {
      console.log("❌ inner join with profiles failed:", joinProfErr.message);
    } else {
      console.log("✅ Join with profiles success! Data:", joinProf);
    }
  } else {
    console.log("✅ Join with institutions success! Data:", joinData);
  }

  // Clean up
  console.log("\nCleaning up test job...");
  await supabaseAdmin.from('posted_jobs').delete().eq('id', job.id);
}

main().catch(console.error);
