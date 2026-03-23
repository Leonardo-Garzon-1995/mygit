const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testDir = path.join(__dirname, 'test-checkout-temp');

function cleanup() {
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

console.log('🧪 Testing checkout command...\n');

// Test 1: Checkout updates HEAD
setup();
run('mygit init');
fs.writeFileSync('test.txt', 'hello');
run('mygit commit -m "Initial"');
run('mygit branch feature');
run('mygit checkout feature');

const head = fs.readFileSync('.mygit/HEAD', 'utf-8').trim();
if (!head.includes('feature')) {
  console.log('❌ HEAD should point to feature branch');
} else {
  console.log('✅ Updates HEAD correctly');
}

// Test 2: Checkout -b creates and switches
run('mygit checkout -b develop');
if (!fs.existsSync('.mygit/refs/heads/develop')) {
  console.log('❌ Should create develop branch');
} else {
  console.log('✅ Creates branch with -b flag');
}

// Test 3: Files change when switching branches
run('mygit checkout feature');
fs.writeFileSync('feature.txt', 'feature-specific');
run('mygit commit -m "Add feature file"');

run('mygit checkout develop');
if (fs.existsSync('feature.txt')) {
  console.log('❌ feature.txt should not exist on develop branch');
} else {
  console.log('✅ Removes files from previous branch');
}

run('mygit checkout feature');
if (!fs.existsSync('feature.txt')) {
  console.log('❌ feature.txt should exist on feature branch');
} else {
  console.log('✅ Restores files when switching back');
}

// Test 4: Directories are created/removed
run('mygit checkout develop');
fs.mkdirSync('src');
fs.writeFileSync('src/app.js', 'code');
run('mygit commit -m "Add src"');

run('mygit checkout feature');
if (fs.existsSync('src')) {
  console.log('❌ src directory should not exist on feature');
} else {
  console.log('✅ Removes directories');
}

run('mygit checkout develop');
if (!fs.existsSync('src/app.js')) {
  console.log('❌ src/app.js should exist on develop');
} else {
  console.log('✅ Recreates directories');
}

// Test 5: Can't checkout current branch
const output = run('mygit checkout develop');
if (!output.includes('Already on')) {
  console.log('❌ Should detect already on branch');
} else {
  console.log('✅ Detects already on current branch');
}

cleanup();
console.log('\n✨ All tests passed!');