const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, 'openapi-spec.json');
if (fs.existsSync(openapiPath)) {
  const spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  const paths = Object.keys(spec.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  console.log("RPC endpoints found in openapi-spec.json:", rpcs);
} else {
  console.log("openapi-spec.json does not exist");
}
