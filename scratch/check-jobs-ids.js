// Diagnostic: check posted_jobs institution_id vs profiles and institutions
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let v = match[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[match[1]] = v;
  }
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function main() {
  // 1. Fetch all posted_jobs institution_ids
  const { data: jobs, error: jobErr } = await supabaseAdmin.from('posted_jobs').select('id, institution_id, title, status');
  if (jobErr) { console.error('jobs error:', jobErr); return; }
  console.log(`\n✅ Total posted_jobs: ${jobs.length}`);
  jobs.forEach(j => console.log(`  job: ${j.title} | institution_id: ${j.institution_id} | status: ${j.status}`));

  // 2. Fetch all profiles user_ids
  const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, role');
  console.log(`\n✅ Total profiles: ${profiles?.length}`);
  profiles?.forEach(p => console.log(`  profile user_id: ${p.user_id} | role: ${p.role}`));

  // 3. Fetch all institutions auth_ids
  const { data: insts } = await supabaseAdmin.from('institutions').select('auth_id, name');
  console.log(`\n✅ Total institutions: ${insts?.length}`);
  insts?.forEach(i => console.log(`  institution auth_id: ${i.auth_id} | name: ${i.name}`));

  // 4. Cross-check: does each job's institution_id exist in profiles?
  const profileIds = new Set(profiles?.map(p => p.user_id));
  const instAuthIds = new Set(insts?.map(i => i.auth_id));
  console.log('\n--- Cross Check ---');
  jobs.forEach(j => {
    const inProfiles = profileIds.has(j.institution_id) ? '✅ in profiles' : '❌ NOT in profiles';
    const inInsts = instAuthIds.has(j.institution_id) ? '✅ in institutions' : '❌ NOT in institutions';
    console.log(`  job "${j.title}": institution_id ${j.institution_id} → ${inProfiles} | ${inInsts}`);
  });
}

main().catch(console.error);
