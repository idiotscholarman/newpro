try {
    const fs = require('fs');
    fs.writeFileSync('debug_output.txt', 'Node execution verified');
    console.log('File written');
} catch (e) {
    console.error(e);
}
