const fs = require('fs');
const path = require('path');

async function main() {
  const specPath = path.join(__dirname, 'openapi-spec.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  
  const teachersDef = spec.definitions.teachers;
  if (!teachersDef) {
    console.error("❌ teachers definition not found in openapi-spec.json");
    return;
  }
  
  console.log("Teachers columns properties:");
  const properties = teachersDef.properties || {};
  const required = teachersDef.required || [];
  
  for (const [colName, details] of Object.entries(properties)) {
    const isRequired = required.includes(colName) || details.description?.includes('required') ? 'REQUIRED' : 'optional';
    console.log(`- ${colName}: ${details.type} (${details.format || ''}) - ${isRequired}`);
  }
  
  console.log("\nRequired fields list:", required);
}

main().catch(console.error);
