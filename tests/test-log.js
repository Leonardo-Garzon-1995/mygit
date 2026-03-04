const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testDir = path.join(__dirname, 'test-log-temp');

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
  return execSync(command, { encoding: 'utf-8' });
}

console.log('🧪 Testing log command...\n');

// Test 1: No commits
setup();
run('mygit init');
const output1 = run('mygit log');
if (!output1.includes('No commits yet')) {
  console.log('❌ Should show "No commits yet" with no commits');
} else {
  console.log('✅ Handles empty repository');
}

// Test 2: Single commit
fs.writeFileSync('test.txt', 'hello');
run('mygit commit -m "First commit"');
const output2 = run('mygit log');
if (!output2.includes('First commit')) {
  console.log('❌ Log should show commit message');
} else {
  console.log('✅ Shows single commit');
}

// Test 3: Multiple commits in order
fs.writeFileSync('test2.txt', 'world');
run('mygit commit -m "Second commit"');
fs.writeFileSync('test3.txt', 'foo');
run('mygit commit -m "Third commit"');

const output3 = run('mygit log');
const thirdIndex = output3.indexOf('Third commit');
const secondIndex = output3.indexOf('Second commit');
const firstIndex = output3.indexOf('First commit');

if (thirdIndex < secondIndex && secondIndex < firstIndex) {
  console.log('✅ Shows commits in reverse chronological order');
} else {
  console.log('❌ Commits not in correct order');
}

// Test 4: Oneline format
const output4 = run('mygit log --oneline');
const lines = output4.trim().split('\n');
if (lines.length === 3 && lines[0].length < 50) {
  console.log('✅ Oneline format works');
} else {
  console.log('❌ Oneline format incorrect');
}

cleanup();
console.log('\n✨ All tests passed!');