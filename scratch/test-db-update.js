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
  console.log("Attempting test update with potential columns...");
  
  // Get first job id
  const { data: jobs } = await supabaseAdmin.from('posted_jobs').select('id').limit(1);
  if (!jobs || jobs.length === 0) {
    console.log("No jobs found to test update.");
    return;
  }
  const jobId = jobs[0].id;
  console.log("Testing on job ID:", jobId);

  const testPayloads = [
    { is_featured: true },
    { board: 'CBSE' },
    { state: 'Delhi' },
    { grade_level: 'High School' },
    { gradeLevel: 'High School' },
    { qualification: 'M.Ed' }
  ];

  for (const payload of testPayloads) {
    const key = Object.keys(payload)[0];
    const { data, error } = await supabaseAdmin
      .from('posted_jobs')
      .update(payload)
      .eq('id', jobId)
      .select();
    
    if (error) {
      console.log(`❌ Column '${key}' failed to update:`, error.message);
    } else {
      console.log(`✅ Column '${key}' updated successfully!`);
    }
  }
}

main().catch(console.error);
