const fs = require('fs');
try {
    fs.copyFileSync('d:/home_project/vibe_coding/translated_mapping.json', 'd:/home_project/vibe_coding/src/translated_mapping.json');
    console.log('File copied successfully');
} catch (err) {
    console.error('Error copying file:', err);
}
