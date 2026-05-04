const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const commitTree = require('../src/commands/commit-tree')
const writeTree = require('../src/commands/write-tree')
const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const captureOutput = require('./helpers/captureOutput')
const readObject = require('../src/helpers/readObject')

test.beforeEach(setupRepo)
test.afterEach(cleanupRepo)

// HELPERS

function objectPath(hash) {
    return path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2), hash.slice(2))
}

function setAuthorEnv(t, name, email) {
    const originalName = process.env.MYGIT_AUTHOR_NAME
    const originalEmail = process.env.MYGIT_AUTHOR_EMAIL

    process.env.MYGIT_AUTHOR_NAME = name
    process.env.MYGIT_AUTHOR_EMAIL = email

    t.after(() => {
        if (originalName === undefined) {
            delete process.env.MYGIT_AUTHOR_NAME
        } else {
            process.env.MYGIT_AUTHOR_NAME = originalName
        }

        if (originalEmail === undefined) {
            delete process.env.MYGIT_AUTHOR_EMAIL
        } else {
            process.env.MYGIT_AUTHOR_EMAIL = originalEmail
        }
    })
}


// ______TESTS______

console.log('\nTESTING COMMIT-TREE\n')

test('commit-tree creates a commit object without a parent', (t) => {
    setAuthorEnv(t, 'Test Author', 'test@example.com')
    fs.writeFileSync('hello.txt', 'hello world')

    const treeHash = writeTree()
    const commitHash = commitTree(treeHash, 'first commit')

    assert.match(commitHash, /^[0-9a-f]{40}$/)

    const obj = readObject(commitHash)
    const body = obj.content.toString()

    assert.match(obj.header, /^commit \d+$/)
    assert.ok(body.includes(`tree ${treeHash}\n`))
    assert.match(body, /author Test Author <test@example\.com> \d+ [+-]\d{4}\n/)
    assert.match(body, /committer Test Author <test@example\.com> \d+ [+-]\d{4}\n/)
    assert.strictEqual(body.endsWith('\nfirst commit\n'), true)
})

test('commit-tree creates a commit object with a parent', (t) => {
    setAuthorEnv(t, 'Parent Author', 'parent@example.com')
    fs.writeFileSync('file.txt', 'first')

    const firstTreeHash = writeTree()
    const firstCommitHash = commitTree(firstTreeHash, 'first')

    fs.writeFileSync('file.txt', 'second')

    const secondTreeHash = writeTree()
    const secondCommitHash = commitTree(secondTreeHash, 'second', firstCommitHash)

    assert.match(secondCommitHash, /^[0-9a-f]{40}$/)

    const obj = readObject(secondCommitHash)
    const body = obj.content.toString()
    const lines = body.split('\n')

    assert.strictEqual(lines[0], `tree ${secondTreeHash}`)
    assert.strictEqual(lines[1], `parent ${firstCommitHash}`)
    assert.strictEqual(body.endsWith('\nsecond\n'), true)
})

test('commit-tree shows error when tree hash is missing', () => {
    const result = captureOutput(() => commitTree(null, 'message'))

    assert.strictEqual(result.exitCode, 1)
    assert.match(result.output, /tree hash required/)
})

test('commit-tree shows error when message is missing', () => {
    const treeHash = 'a'.repeat(40)
    const result = captureOutput(() => commitTree(treeHash))

    assert.strictEqual(result.exitCode, 1)
    assert.match(result.output, /commit message required/)
})

test('commit-tree uses MYGIT_AUTHOR_NAME and MYGIT_AUTHOR_EMAIL', (t) => {
    setAuthorEnv(t, 'Env Author', 'env@example.com')
    fs.writeFileSync('env.txt', 'env')

    const treeHash = writeTree()
    const commitHash = commitTree(treeHash, 'env test')
    const obj = readObject(commitHash)
    const body = obj.content.toString()

    assert.match(body, /author Env Author <env@example\.com> \d+ [+-]\d{4}\n/)
    assert.match(body, /committer Env Author <env@example\.com> \d+ [+-]\d{4}\n/)
    assert.doesNotMatch(body, /Leonardo Garzon/)
    assert.doesNotMatch(body, /example@gmail\.com/)
})

test('commit-tree stores the commit object and reuses the same hash for same input', (t) => {
    setAuthorEnv(t, 'Stable Author', 'stable@example.com')
    t.mock.method(Date, 'now', () => 1700000000000)
    fs.writeFileSync('stable.txt', 'stable')

    const treeHash = writeTree()
    const commitHash1 = commitTree(treeHash, 'stable commit')
    const commitHash2 = commitTree(treeHash, 'stable commit')

    assert.strictEqual(commitHash1, commitHash2)
    assert.strictEqual(fs.existsSync(objectPath(commitHash1)), true)
})
