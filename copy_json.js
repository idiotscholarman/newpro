import fs from 'fs';
try {
    fs.copyFileSync('translated_mapping.json', 'src/translated_mapping.json');
    console.log('File copied successfully');
} catch (err) {
    console.error('Error copying file:', err);
}
