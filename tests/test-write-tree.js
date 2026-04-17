const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test directory
const testDir = path.join(__dirname, 'test-temp');

function cleanup() {

  try {
    process.chdir(__dirname)
  } catch (error) {}

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

function test(name, fn) {
    try {
        setup();
        fn();
        console.log(`✅ ${name}`);
        return 0
    } catch (err) {
        console.log(`❌ ${name}`);
        console.error(err.message);
        return 1
    } finally {
        cleanup();
    }
}

function countFiles(dir) {
  let count =0 

  const entries = fs.readdirSync(dir, {withFileTypes: true})

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isFile()) {
      count++
    } else if (entry.isDirectory()) {
      count += countFiles(fullPath)
    }
  }

  return count
}
// ============ TESTS ============

console.log('\n🧪 Running tests...\n');

function runTests() {
  const results = []

  test('creates objects for single file', () => {
    run('mygit init');
    fs.writeFileSync('test.txt', 'hello');
    
    const hash = run('mygit write-tree');
    
    // Check that objects were created
    const objectPath = path.join(process.cwd(), '.mygit', 'objects')
    const objectsCount = countFiles(objectPath);
    
    if (objectsCount !== 2) {
      throw new Error(`Expected 2 objects (1 blob + 1 tree), got ${objectsCount}`);
    }
    
    if (hash.length !== 40) {
      throw new Error(`Expected 40-char hash, got ${hash.length}`);
    }
  });

  test('creates objects for nested directories', () => {
    run('mygit init');
    
    fs.writeFileSync('file1.txt', 'content1');
    fs.mkdirSync('dir1');
    fs.writeFileSync('dir1/file2.txt', 'content2');
    
    run('mygit write-tree');
    
    // Should have: 2 blobs + 1 tree (dir1) + 1 tree (root) = 4 objects
    const objectPath = path.join(process.cwd(), '.mygit', 'objects')
    const objectsCount = countFiles(objectPath);
    
    if (objectsCount !== 4) {
      throw new Error(`Expected 4 objects, got ${objectsCount}`);
    }
  });


  test('matches real git hash', () => {
    run('mygit init');
    
    fs.writeFileSync('test.txt', 'hello world\n');
    
    const mygitHash = run('mygit write-tree');
    fs.rmSync('.mygit', {recursive: true, force: true})

    run('git init');
    run('git add -A');
    const gitHash = run('git write-tree');
    
    if (mygitHash !== gitHash) {
      throw new Error(`Hash mismatch!\n\tMyGit: ${mygitHash}\n\tGit:   ${gitHash}`);
    }
  });

  test('handles empty directory properly', () => {
    run('mygit init');
    
    // Should create just 1 tree object for empty root
    const hash = run('mygit write-tree');
    
    const objectPath = path.join(process.cwd(), '.mygit', 'objects')
    const objectsCount = countFiles(objectPath);
    
    if (objectsCount !== 1) {
      throw new Error(`Expected 1 object (empty root tree), got ${objectsCount}`);
    }
  });

  test('deduplicates identical content', () => {
    run('mygit init');
    
    fs.writeFileSync('file1.txt', 'same content');
    fs.writeFileSync('file2.txt', 'same content');
    
    run('mygit write-tree');
    
    // Should have: 1 blob (deduplicated) + 1 tree = 2 objects
    const objectPath = path.join(process.cwd(), '.mygit', 'objects')
    const objectsCount = countFiles(objectPath);
    
    if (objectsCount !== 2) {
      throw new Error(`Expected 2 objects (deduplication should happen), got ${objectsCount}`);
    }
  });
}

runTests();