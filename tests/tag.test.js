const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')
const crypto = require('crypto')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const captureOutput = require('./helpers/captureOutput')
const tagCmd = require('../src/commands/tag')

test.beforeEach(() => {
    setupRepo()

    fs.mkdirSync(
        path.join(baseDir, '.mygit', 'refs', 'heads'),
        { recursive: true }
    )

    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'HEAD'),
        'ref: refs/heads/main'
    )
})
test.afterEach(cleanupRepo)

// HELPERS

function writeCommit(content) {
    const body = Buffer.from(content)
    const header = Buffer.from(`commit ${body.length}\0`)
    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))
    return hash
}

function seedHead(hash) {
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'refs', 'heads', 'main'),
        hash
    )
}

function makeCommit(message) {
    const hash = writeCommit(
`tree abc123
author Test <test@example.com> 1710000000 +0000
committer Test <test@example.com> 1710000000 +0000

${message}`
    )
    return hash
}

function readTag(name) {
    return fs
        .readFileSync(path.join(baseDir, '.mygit', 'refs', 'tags', name), 'utf-8')
        .trim()
}

console.log('\nTESTING TAG\n')

test('tag <name> creates a tag at HEAD', () => {
    const head = makeCommit('first')
    seedHead(head)

    captureOutput(() => tagCmd(['v1']))

    assert.strictEqual(readTag('v1'), head)
})

test('tag (no args) lists tags', () => {
    const head = makeCommit('first')
    seedHead(head)
    captureOutput(() => tagCmd(['v1']))
    captureOutput(() => tagCmd(['v2']))

    const { output } = captureOutput(() => tagCmd([]))

    assert.match(output, /^v1$/m)
    assert.match(output, /^v2$/m)
})

test('tag (no tags dir) reports no tags', () => {
    const { output } = captureOutput(() => tagCmd([]))
    assert.match(output, /No tags found/)
})

test('tag <name> twice without -f errors and does not rewrite', () => {
    const first = makeCommit('first')
    seedHead(first)
    captureOutput(() => tagCmd(['v1']))
    const before = readTag('v1')

    const second = makeCommit('second')
    seedHead(second)
    const { output, exitCode } = captureOutput(() => tagCmd(['v1']))

    assert.strictEqual(exitCode, 1)
    assert.match(output, /already exists/)
    assert.strictEqual(readTag('v1'), before)
})

test('tag -f <name> overwrites an existing tag', () => {
    const first = makeCommit('first')
    seedHead(first)
    captureOutput(() => tagCmd(['v1']))

    const second = makeCommit('second')
    seedHead(second)
    captureOutput(() => tagCmd(['-f', 'v1']))

    assert.strictEqual(readTag('v1'), second)
})

test('tag <name> <commit-hash> creates the tag at that commit', () => {
    const head = makeCommit('head commit')
    seedHead(head)
    const target = makeCommit('target commit')

    captureOutput(() => tagCmd(['v-target', target]))

    assert.strictEqual(readTag('v-target'), target)
})

test('tag <name> <branch> resolves the branch ref', () => {
    const head = makeCommit('first')
    seedHead(head)
    const otherCommit = makeCommit('feature commit')
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'refs', 'heads', 'feature'),
        otherCommit
    )

    captureOutput(() => tagCmd(['v-feature', 'feature']))

    assert.strictEqual(readTag('v-feature'), otherCommit)
})

test('tag -d <name> deletes the tag', () => {
    const head = makeCommit('first')
    seedHead(head)
    captureOutput(() => tagCmd(['v1']))
    assert.ok(
        fs.existsSync(path.join(baseDir, '.mygit', 'refs', 'tags', 'v1')),
    )

    captureOutput(() => tagCmd(['-d', 'v1']))

    assert.strictEqual(
        fs.existsSync(path.join(baseDir, '.mygit', 'refs', 'tags', 'v1')),
        false,
    )
})

test('tag -d on missing tag errors', () => {
    const { output, exitCode } = captureOutput(() => tagCmd(['-d', 'never']))
    assert.strictEqual(exitCode, 1)
    assert.match(output, /not found/)
})

test('tag <name> <bogus-ref> errors', () => {
    const head = makeCommit('first')
    seedHead(head)
    const { output, exitCode } = captureOutput(() => tagCmd(['v1', 'no-such-ref']))
    assert.strictEqual(exitCode, 1)
    assert.match(output, /not a valid ref/)
})

test('tag <name> <bogus-hash> errors when the object does not exist', () => {
    const head = makeCommit('first')
    seedHead(head)
    const fakeHash = 'd'.repeat(40)
    const { output, exitCode } = captureOutput(() => tagCmd(['v1', fakeHash]))
    assert.strictEqual(exitCode, 1)
    assert.match(output, /not a valid ref/)
})

test('tag <name> <tree-hash> rejects non-commit objects', () => {
    const head = makeCommit('first')
    seedHead(head)
    // Write a tree object directly so we have a valid hash that isn't a commit.
    const treeBody = Buffer.from('100644 blob abc123\tfile.txt')
    const treeHeader = Buffer.from(`tree ${treeBody.length}\0`)
    const store = Buffer.concat([treeHeader, treeBody])
    const treeHash = crypto.createHash('sha1').update(store).digest('hex')
    const dir = path.join(baseDir, '.mygit', 'objects', treeHash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, treeHash.slice(2)), zlib.deflateSync(store))

    const { output, exitCode } = captureOutput(() => tagCmd(['v1', treeHash]))
    assert.strictEqual(exitCode, 1)
    assert.match(output, /is a tree, not a commit/)
})

test('tag rejects names with path separators', () => {
    const head = makeCommit('first')
    seedHead(head)
    // Pre-existing branch ref we must NOT be able to overwrite via tag -f.
    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')
    const original = fs.readFileSync(branchPath, 'utf-8')

    const { output, exitCode } = captureOutput(
        () => tagCmd(['-f', '../heads/main']),
    )

    assert.strictEqual(exitCode, 1)
    assert.match(output, /must not contain '\/'/)
    // Branch ref untouched.
    assert.strictEqual(fs.readFileSync(branchPath, 'utf-8'), original)
})

test('tag rejects delete with path separators', () => {
    const { output, exitCode } = captureOutput(
        () => tagCmd(['-d', '../heads/main']),
    )
    assert.strictEqual(exitCode, 1)
    assert.match(output, /must not contain '\/'/)
})

test('tag --delete <name> long form deletes', () => {
    const head = makeCommit('first')
    seedHead(head)
    captureOutput(() => tagCmd(['v1']))
    captureOutput(() => tagCmd(['--delete', 'v1']))
    assert.strictEqual(
        fs.existsSync(path.join(baseDir, '.mygit', 'refs', 'tags', 'v1')),
        false,
    )
})
