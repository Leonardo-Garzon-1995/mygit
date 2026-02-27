
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');


function inspectObject(hash) {
    if (!hash) {
        console.error('Usage: node inspect-object.js <hash>');
        process.exit(1);
    }

    const dir = hash.slice(0, 2);
    const filename = hash.slice(2);
    const objectPath = path.join(process.cwd(), '.mygit', 'objects', dir, filename);

    if (!fs.existsSync(objectPath)) {
        console.error(`Object ${hash} not found`);
        process.exit(1);
    }

    // Read and decompress
    const compressed = fs.readFileSync(objectPath);
    const decompressed = zlib.inflateSync(compressed);

    // Find the null byte that separates header from content
    const nullIndex = decompressed.indexOf(0);
    const header = decompressed.slice(0, nullIndex).toString();
    const content = decompressed.slice(nullIndex + 1);

    console.log('=== OBJECT HEADER ===');
    console.log(header);
    console.log('\n=== OBJECT CONTENT ===');

    if (header.startsWith('blob')) {
    // For blobs, show as text
        console.log(content.toString());
    } else if (header.startsWith('tree')) {
    // For trees, parse the entries
        console.log('Tree entries:');
        let offset = 0;
        
        while (offset < content.length) {
            // Find the null byte after the name
            let nullPos = offset;
            while (content[nullPos] !== 0) nullPos++;
            
            // Extract mode and name
            const entry = content.slice(offset, nullPos).toString();
            const [mode, name] = entry.split(' ');
            
            // Extract the 20-byte hash
            const hashBytes = content.slice(nullPos + 1, nullPos + 21);
            const entryHash = hashBytes.toString('hex');
            
            console.log(`  ${mode} ${name} -> ${entryHash}`);
            
            offset = nullPos + 21;
        }
    }

    console.log('\n=== RAW BYTES (first 100) ===');
    console.log(decompressed.slice(0, 100));
}


module.exports = inspectObject