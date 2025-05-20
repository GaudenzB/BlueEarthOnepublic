const fs = require('fs');
const path = require('path');

// File to modify
const testFile = 'client/__tests__/components/EmployeeDirectory/EmployeeList.test.tsx';

// Read the file
let content = fs.readFileSync(testFile, 'utf8');

// Replace all occurrences of MemoryRouter with TestRouter
content = content.replace(/<MemoryRouter>/g, '<TestRouter>');
content = content.replace(/<\/MemoryRouter>/g, '</TestRouter>');

// Write back to the file
fs.writeFileSync(testFile, content, 'utf8');

console.log('Memory Router fixes applied to', testFile);
