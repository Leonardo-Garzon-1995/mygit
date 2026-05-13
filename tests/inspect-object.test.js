const test = require('node:test')
const assert = require('node:assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const run = require('./helpers/run')
const captureOutput = require('./helpers/captureOutput')
const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const hashObject = require('../src/commands/hash-object')
const writeTree = require('../src/commands/write-tree')
const inspectObject = require('../src/commands/inspect-object')

const binPath = path.join(__dirname, '..', 'bin', 'mygit.js')

test.beforeEach(setupRepo)
test.afterEach(cleanupRepo)

function objectPath(hash) {
    return path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2), hash.slice(2))
}

function writeRawObject(type, content) {
    const body = Buffer.from(`${type} ${content.length}\0${content}`)
    const hash = crypto.createHash('sha1').update(body).digest('hex')
    const filePath = objectPath(hash)

    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, zlib.deflateSync(body))

    return hash
}

function runInspectObject(hash) {
    return run(`node "${binPath}" inspect-object ${hash}`)
}

console.log('\nTESTING INSPECT-OBJECT\n')

test('inspect-object shows usage when hash is missing', () => {
    const result = captureOutput(() => inspectObject(), true)

    assert.strictEqual(result.exitCode, 1)
    assert.match(result.output, /Missing hash/)
    assert.match(result.output, /Usage: mygit inspect-object <hash>/)
})

test('inspect-object reports when the object does not exist', () => {
    const missingHash = 'a'.repeat(40)
    const result = captureOutput(() => inspectObject(missingHash), true)

    assert.strictEqual(result.exitCode, 1)
    assert.match(result.output, new RegExp(`Object ${missingHash} not found`))
})

test('inspect-object prints blob metadata and content through the CLI', () => {
    const filePath = path.join(baseDir, 'hello.txt')
    fs.writeFileSync(filePath, 'hello world')

    const hash = hashObject('blob', filePath, true)
    const storedBefore = fs.readFileSync(objectPath(hash))

    const output = runInspectObject(hash)

    const storedAfter = fs.readFileSync(objectPath(hash))

    assert.match(output, /^Type: blob$/m)
    assert.match(output, /^Size: 11 bytes$/m)
    assert.match(output, /hello world/)
    assert.strictEqual(storedAfter.equals(storedBefore), true)
})

test('inspect-object prints tree entries without modifying the stored tree object', () => {
    fs.writeFileSync('tree.txt', 'tree content')

    const treeHash = writeTree()
    const treeObject = fs.readFileSync(objectPath(treeHash))

    const output = runInspectObject(treeHash)
    const treeObjectAfter = fs.readFileSync(objectPath(treeHash))

    assert.match(output, /^Type: tree$/m)
    assert.match(output, /^Size: \d+ bytes$/m)
    assert.match(output, /^100644 tree\.txt [0-9a-f]{40}$/m)
    assert.strictEqual(treeObjectAfter.equals(treeObject), true)
})

test('inspect-object prints nested tree entries and preserves both stored tree objects', () => {
    fs.mkdirSync('nested')
    fs.writeFileSync(path.join('nested', 'inner.txt'), 'inner file')
    fs.writeFileSync('root.txt', 'root file')

    const nestedTreeHash = writeTree(path.join(baseDir, 'nested'))
    const rootTreeHash = writeTree()
    const nestedTreeObject = fs.readFileSync(objectPath(nestedTreeHash))
    const rootTreeObject = fs.readFileSync(objectPath(rootTreeHash))

    const rootOutput = runInspectObject(rootTreeHash)
    const nestedOutput = runInspectObject(nestedTreeHash)

    const nestedTreeObjectAfter = fs.readFileSync(objectPath(nestedTreeHash))
    const rootTreeObjectAfter = fs.readFileSync(objectPath(rootTreeHash))

    assert.match(rootOutput, /^Type: tree$/m)
    assert.match(rootOutput, /^040000 nested [0-9a-f]{40}$/m)
    assert.match(rootOutput, /^100644 root\.txt [0-9a-f]{40}$/m)
    assert.match(nestedOutput, /^Type: tree$/m)
    assert.match(nestedOutput, /^100644 inner\.txt [0-9a-f]{40}$/m)
    assert.strictEqual(nestedTreeObjectAfter.equals(nestedTreeObject), true)
    assert.strictEqual(rootTreeObjectAfter.equals(rootTreeObject), true)
})

test('inspect-object prints unsupported object types predictably', () => {
    const hash = writeRawObject('tag', 'lightweight tag data')
    const storedBefore = fs.readFileSync(objectPath(hash))

    const output = runInspectObject(hash)

    const storedAfter = fs.readFileSync(objectPath(hash))

    assert.match(output, /^Type: tag$/m)
    assert.match(output, /^Size: 20 bytes$/m)
    assert.match(output, /lightweight tag data/)
    assert.strictEqual(storedAfter.equals(storedBefore), true)
})