const fs = require('fs');
console.log("Debug script starting");
fs.writeFileSync('debug_output.txt', 'Hello from debug script: ' + new Date().toISOString());
console.log("Debug script finished");
