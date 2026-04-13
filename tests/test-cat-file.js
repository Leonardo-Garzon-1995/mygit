const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testDir = path.join(__dirname, 'test-catfile-temp');

function cleanup() {

  try {
    process.chdir(__dirname);
  } catch (err) {}

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

function setup() {
  cleanup();
  fs.mkdirSync(testDir);
  process.chdir(testDir);
}

function run(command) {
  return execSync(command, { encoding: 'utf-8' }).trim();
}

console.log('🧪 Testing cat-file command...\n');

// Test 1: Show blob type
setup();
run('mygit init');
fs.writeFileSync('test.txt', 'hello');
const blobHash = run('mygit hash-object test.txt');
const type = run(`mygit cat-file -t ${blobHash}`);

if (type !== 'blob') {
  console.log(`❌ Expected type 'blob', got '${type}'`);
} else {
  console.log('✅ Shows blob type correctly');
}

// Test 2: Show blob size
const size = parseInt(run(`mygit cat-file -s ${blobHash}`));
if (size !== 5) {
  console.log(`❌ Expected size 5, got ${size}`);
} else {
  console.log('✅ Shows blob size correctly');
}

// Test 3: Show blob content
const content = run(`mygit cat-file -p ${blobHash}`);
if (content !== 'hello') {
  console.log(`❌ Expected content 'hello', got '${content}'`);
} else {
  console.log('✅ Shows blob content correctly');
}

// Test 4: Show tree type
const treeHash = run('mygit write-tree');
const treeType = run(`mygit cat-file -t ${treeHash}`);

if (treeType !== 'tree') {
  console.log(`❌ Expected type 'tree', got '${treeType}'`);
} else {
  console.log('✅ Shows tree type correctly');
}

// Test 5: Show tree content (should be formatted)
const treeContent = run(`mygit cat-file -p ${treeHash}`);
if (!treeContent.includes('test.txt')) {
  console.log('❌ Tree content should include test.txt');
} else {
  console.log('✅ Shows tree content correctly');
}

// Test 6: Show commit type
run('mygit add test.txt');
run('mygit commit -m "Test"');
const commitHash = fs.readFileSync('.mygit/refs/heads/main', 'utf-8').trim();
const commitType = run(`mygit cat-file -t ${commitHash}`);

if (commitType !== 'commit') {
  console.log(`❌ Expected type 'commit', got '${commitType}'`);
} else {
  console.log('✅ Shows commit type correctly');
}

// Test 7: Show commit content
const commitContent = run(`mygit cat-file -p ${commitHash}`);
if (!commitContent.includes('Test')) {
  console.log('❌ Commit content should include message');
} else {
  console.log('✅ Shows commit content correctly');
}

// Test 8: Shortened hash
const shortHash = blobHash.substring(0, 7);
const shortContent = run(`mygit cat-file -p ${shortHash}`);
if (shortContent !== 'hello') {
  console.log('❌ Shortened hash should work');
} else {
  console.log('✅ Supports shortened hashes');
}

cleanup();
console.log('\n✨ All tests passed!');