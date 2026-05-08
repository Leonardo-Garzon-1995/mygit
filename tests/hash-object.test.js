const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const hashObject = require('../src/commands/hash-object');
const {setupRepo, cleanupRepo,baseDir} = require('./helpers/setup')

function setup() {
    cleanupRepo()
    
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    fs.mkdirSync(path.join(testDir, '.mygit', 'objects'), { recursive: true });
}

function cleanup() {
    process.chdir(__dirname);
    fs.rmSync(testDir, { recursive: true, force: true });
}

test.beforeEach(setupRepo);
test.afterEach(cleanupRepo);


console.log('\nTESTING HASH-OBJECT\n')

test('hashObject returns a valid SHA-1 hash', () => {
    const type = 'blob';
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject(type, filePath, false);

    assert.strictEqual(hash.length, 40);
    assert.match(hash, /^[a-f0-9]{40}$/);
});

test('hashObject does not write object when write=false', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject("blob", filePath, false);

    const dir = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, fileName);

    assert.strictEqual(fs.existsSync(objPath), false);
});


test('hashObject writes compressed object to disk', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject('blob', filePath, true);

    const dir = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, fileName);

    assert.strictEqual(fs.existsSync(objPath), true);
});


test('stored object has correct blob format', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject('blob', filePath, true);

    const dir = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, fileName);

    const compressed = fs.readFileSync(objPath);
    const decompressed = zlib.inflateSync(compressed);

    const expected = Buffer.from('blob 5\0hello');

    assert.deepStrictEqual(decompressed, expected);
});

test('same content produces same hash', () => {
    const file1 = path.join(baseDir, 'a.txt');
    const file2 = path.join(baseDir, 'b.txt');

    fs.writeFileSync(file1, 'hello');
    fs.writeFileSync(file2, 'hello');

    const hash1 = hashObject('blob', file1, false);
    const hash2 = hashObject('blob', file2, false);

    assert.strictEqual(hash1, hash2);
});