// Fix for the tenant ID issue in contracts module
// Sets default tenant ID to the valid ID from the database
// Run with: node fix-contract-tenant.js

const fs = require('fs');
const path = require('path');

const routesFilePath = path.join(__dirname, 'modules/contracts/server/routes.ts');

let content = fs.readFileSync(routesFilePath, 'utf8');

// Replace all instances of the invalid tenant ID with the valid one
content = content.replace(/00000000-0000-0000-0000-000000000000/g, '00000000-0000-0000-0000-000000000001');

fs.writeFileSync(routesFilePath, content);

console.log('✅ Successfully updated tenant ID in contract routes');