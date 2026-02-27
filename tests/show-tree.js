
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function readObject(hash) {
  const dir = hash.slice(0, 2);
  const filename = hash.slice(2);
  const objectPath = path.join(process.cwd(), '.mygit', 'objects', dir, filename);
  
  const compressed = fs.readFileSync(objectPath);
  const decompressed = zlib.inflateSync(compressed);
  
  const nullIndex = decompressed.indexOf(0);
  const header = decompressed.slice(0, nullIndex).toString();
  const content = decompressed.slice(nullIndex + 1);
  
  return { header, content };
}

function parseTree(content) {
  const entries = [];
  let offset = 0;
  
  while (offset < content.length) {
    let nullPos = offset;
    while (content[nullPos] !== 0) nullPos++;
    
    const entry = content.slice(offset, nullPos).toString();
    const [mode, name] = entry.split(' ');
    
    const hashBytes = content.slice(nullPos + 1, nullPos + 21);
    const hash = hashBytes.toString('hex');
    
    entries.push({ mode, name, hash });
    offset = nullPos + 21;
  }
  
  return entries;
}

function showTree(hash, indent = '') {
  const { header, content } = readObject(hash);

  console.log(`\n🌳 Tree ${hash}\n`);
  
  if (header.startsWith('blob')) {
    console.log(`${indent}${content.toString().slice(0, 50)}...`);
    return;
  }
  
  const entries = parseTree(content);
  
  for (const entry of entries) {
    const type = entry.mode === '40000' ? '📁' : '📄';
    console.log(`${indent}${type} ${entry.name} (${entry.hash.slice(0, 8)}...)`);
    
    if (entry.mode === '40000') {
      showTree(entry.hash, indent + '  ');
    }
  }
}

module.exports = showTree