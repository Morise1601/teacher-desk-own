const fs = require('fs');
const path = require('path');

// Setup environment variables before importing supabase client
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    process.env[key] = value.trim();
  }
});

// Now import the repository
// Since we are running in Node, we need to mock window, localStorage etc. if they are used
global.window = {};
const { jobsRepository } = require('../app/jobs/jobsRepository');
const { supabase } = require('../lib/supabase');

async function main() {
  console.log("Starting verification test...");

  // Mock getUser to return the test institution ID
  const testInstId = 'fd44dc5a-a70d-4bc3-b73e-6ce0ee0b87fe';
  supabase.auth.getUser = async () => {
    return { data: { user: { id: testInstId } } };
  };

  // 1. Fetch current jobs for the test institution
  console.log("\n1. Fetching jobs for test institution...");
  const jobs = await jobsRepository.getInstitutionJobs(testInstId);
  if (jobs.length === 0) {
    console.log("No jobs found to test. Please post a job first.");
    return;
  }

  const testJob = jobs[0];
  console.log(`Testing with job: "${testJob.title}" (ID: ${testJob.id})`);
  console.log("Current values fetched from DB:");
  console.log(`  - isFeatured: ${testJob.isFeatured}`);
  console.log(`  - board: ${testJob.board}`);
  console.log(`  - state: ${testJob.state}`);
  console.log(`  - gradeLevel: ${testJob.gradeLevel}`);
  console.log(`  - qualification: ${testJob.qualification}`);
  console.log(`  - raw requirements: "${testJob.requirements}"`);

  // Store original values to restore later
  const originalMetadata = {
    isFeatured: testJob.isFeatured,
    board: testJob.board,
    state: testJob.state,
    gradeLevel: testJob.gradeLevel,
    qualification: testJob.qualification,
    requirements: testJob.requirements
  };

  // 2. Perform metadata update
  console.log("\n2. Updating job metadata fields...");
  const updatePayload = {
    isFeatured: !testJob.isFeatured,
    board: 'ICSE',
    state: 'Puducherry',
    gradeLevel: 'Middle School',
    qualification: 'B.Ed',
    requirements: 'Teaching experience is highly desired.'
  };
  
  await jobsRepository.updateJob(testJob.id, updatePayload);
  console.log("Job updated successfully.");

  // 3. Fetch again to verify persistence
  console.log("\n3. Fetching job again to verify persistence...");
  const updatedJobs = await jobsRepository.getInstitutionJobs(testInstId);
  const updatedJob = updatedJobs.find(j => j.id === testJob.id);

  console.log("New values fetched from DB:");
  console.log(`  - isFeatured: ${updatedJob.isFeatured} (expected: ${updatePayload.isFeatured})`);
  console.log(`  - board: ${updatedJob.board} (expected: ${updatePayload.board})`);
  console.log(`  - state: ${updatedJob.state} (expected: ${updatePayload.state})`);
  console.log(`  - gradeLevel: ${updatedJob.gradeLevel} (expected: ${updatePayload.gradeLevel})`);
  console.log(`  - qualification: ${updatedJob.qualification} (expected: ${updatePayload.qualification})`);
  console.log(`  - clean requirements: "${updatedJob.requirements}" (expected: "${updatePayload.requirements}")`);

  const success = 
    updatedJob.isFeatured === updatePayload.isFeatured &&
    updatedJob.board === updatePayload.board &&
    updatedJob.state === updatePayload.state &&
    updatedJob.gradeLevel === updatePayload.gradeLevel &&
    updatedJob.qualification === updatePayload.qualification &&
    updatedJob.requirements === updatePayload.requirements;

  if (success) {
    console.log("\n✅ SUCCESS: All metadata fields updated and parsed successfully!");
  } else {
    console.log("\n❌ FAILURE: Mismatch in updated metadata fields.");
  }

  // 4. Restore original job values
  console.log("\n4. Restoring original job values...");
  await jobsRepository.updateJob(testJob.id, originalMetadata);
  console.log("Job restored to original state.");
}

main().catch(console.error);
