const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, 'openapi-spec.json');
if (fs.existsSync(openapiPath)) {
  const spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  console.log("rls_auto_enable path details:", JSON.stringify(spec.paths['/rpc/rls_auto_enable'], null, 2));
} else {
  console.log("openapi-spec.json not found");
}
