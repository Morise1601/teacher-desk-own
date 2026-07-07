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
  console.log("Querying database triggers using supabaseAdmin...");
  
  // Find a valid post
  const { data: posts, error: postErr } = await supabaseAdmin.from('posts').select('id, user_id').limit(1);
  if (postErr || !posts || posts.length === 0) {
    console.error("❌ Failed to find a valid post:", postErr);
    return;
  }
  const postId = posts[0].id;
  const postAuthorId = posts[0].user_id;

  // Find a valid institution user who has a profile
  const { data: insts, error: instErr } = await supabaseAdmin.from('institutions').select('auth_id, name');
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('user_id');
  if (instErr || profErr || !insts || !profiles) {
    console.error("❌ Failed to query institutions or profiles:", instErr, profErr);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.user_id));
  const validInsts = insts.filter(i => profileIds.has(i.auth_id));
  
  const targetInst = validInsts.find(i => i.auth_id !== postAuthorId) || validInsts[0];
  if (!targetInst) {
    console.error("❌ Could not find an institution user with a valid profile.");
    return;
  }
  
  const userId = targetInst.auth_id;
  const instName = targetInst.name || "Test Institution";
  
  console.log(`Using post ID: ${postId} (Author: ${postAuthorId}), Institution Commenter: ${userId} (${instName})`);

  // Print a sample row from teachers table to understand the required fields
  const { data: sampleTeacher } = await supabaseAdmin.from('teachers').select('*').limit(1);
  console.log("Sample teacher record structure:", sampleTeacher);

  // Attempt to insert a record into teachers table for this institution user
  console.log("Inserting a record in teachers table for the institution user to satisfy the trigger...");
  const tempTeacherRecord = {
    id: require('crypto').randomUUID(),
    created_at: new Date().toISOString(),
    full_name: instName,
    email: 'test-inst@teacherdesk.com',
    phone: '0000000000',
    gender: 'other',
    dob: '1970-01-01',
    qualification: 'None',
    specialization: 'None',
    experience: '0',
    auth_id: userId
  };

  const { data: insertedTeacher, error: teachErr } = await supabaseAdmin
    .from('teachers')
    .insert([tempTeacherRecord])
    .select();

  if (teachErr) {
    console.log("⚠️ Failed to insert into teachers table (might already exist or missing fields):", teachErr.message);
  } else {
    console.log("✅ Successfully inserted/updated teacher record:", insertedTeacher);
  }

  console.log("Performing test insert of a comment by a non-author user...");
  try {
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('post_comments')
      .insert([{
        post_id: postId,
        user_id: userId,
        comment_text: 'Hello, this is a test comment by a non-author user.'
      }])
      .select();
      
    if (commentError) {
      console.log("❌ Comment Insert failed with error:\n", JSON.stringify(commentError, null, 2));
    } else {
      console.log("✅ Comment Insert succeeded:", comment);
      // Clean up comment
      await supabaseAdmin.from('post_comments').delete().eq('id', comment[0].id);
      console.log("✅ Cleanup comment succeeded.");
    }
    
    // Clean up temporary teacher record if we created it
    if (insertedTeacher && insertedTeacher.length > 0) {
      await supabaseAdmin.from('teachers').delete().eq('id', insertedTeacher[0].id);
      console.log("✅ Cleanup temporary teacher succeeded.");
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

main().catch(console.error);
