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

async function main() {
  const openapiUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseSecretKey}`;
  console.log("Fetching OpenAPI spec from:", `${supabaseUrl}/rest/v1/`);
  try {
    const response = await fetch(openapiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const spec = await response.json();
    console.log("Exposed Tables & Views:");
    console.log(Object.keys(spec.definitions || {}));
    
    console.log("\nExposed RPC Paths:");
    const paths = Object.keys(spec.paths || {});
    const rpcPaths = paths.filter(p => p.startsWith('/rpc/'));
    console.log(rpcPaths);
    
    // Save to scratch file for manual inspection
    fs.writeFileSync(path.join(__dirname, 'openapi-spec.json'), JSON.stringify(spec, null, 2));
    console.log("\nSaved openapi-spec.json to scratch folder.");
  } catch (err) {
    console.error("❌ Failed to fetch OpenAPI spec:", err.message);
  }
}

main().catch(console.error);
