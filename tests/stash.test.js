const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')
const crypto = require('crypto')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const { readStash } = require('../src/core/stash')
const captureOutput = require('./helpers/captureOutput')
const stash = require('../src/commands/stash')
const readObject = require('../src/helpers/readObject')

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

function writeBlob(content) {
    const body = Buffer.from(content)
    const header = Buffer.from(`blob ${body.length}\0`)
    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))

    return hash
}

function writeTree(entries) {
    let content = ''
    Object.entries(entries).forEach(([path, hash]) => {
        content += `100644 ${path}\0${Buffer.from(hash, 'hex').toString('latin1')}`
    })

    const body = Buffer.from(content, 'latin1')
    const header = Buffer.from(`tree ${body.length}\0`)
    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))

    return hash
}

function writeCommit(treeHash, message, parentHash = null) {
    let content = `tree ${treeHash}\n`

    if (parentHash) {
        content += `parent ${parentHash}\n`
    }

    content += `author Test <test@example.com> 1710000000 +0000\n`
    content += `committer Test <test@example.com> 1710000000 +0000\n\n`
    content += message

    const body = Buffer.from(content)
    const header = Buffer.from(`commit ${body.length}\0`)
    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))

    return hash
}

function seedHead(commitHash) {
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'refs', 'heads', 'main'),
        commitHash
    )
}


function createFileWithContent(filename, content) {
    fs.writeFileSync(filename, content)
    return writeBlob(content)
}

function createInitialCommit() {
    const fileHash = writeBlob('initial content')
    const treeHash = writeTree({ 'file.txt': fileHash })
    const commitHash = writeCommit(treeHash, 'Initial commit')
    seedHead(commitHash)
    return commitHash
}

console.log('\nTESTING STASH\n')

// Test stashPush (default behavior and save command)

test('stash (default) saves working directory changes', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified content')

    const { output } = captureOutput(() => stash([]))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 1)
    assert.strictEqual(stashData.stashes[0].id, 'stash@{0}')
    assert.strictEqual(stashData.stashes[0].message, 'WIP: stash')
    assert.match(output, /Saved working directory to stash@{0}/)
    assert.strictEqual(
        fs.readFileSync(path.join(baseDir, 'file.txt'), 'utf-8'),
        'initial content'
    )
})

test('stash save <message> saves with custom message', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified content')

    const { output } = captureOutput(() => stash(['save', 'my', 'custom', 'message']))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 1)
    assert.strictEqual(stashData.stashes[0].message, 'my custom message')
    assert.match(output, /Saved working directory to stash@{0}/)
    assert.strictEqual(
        fs.readFileSync(path.join(baseDir, 'file.txt'), 'utf-8'),
        'initial content'
    )
})

test('stash creates multiple stashes with proper indexing', () => {
    createInitialCommit()

    createFileWithContent('file.txt', 'first stash')
    captureOutput(() => stash(['save', 'First stash']))

    createFileWithContent('file.txt', 'second stash')
    captureOutput(() => stash(['save', 'Second stash']))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 2)
    assert.strictEqual(stashData.stashes[0].id, 'stash@{0}')
    assert.strictEqual(stashData.stashes[0].message, 'Second stash')
    assert.strictEqual(stashData.stashes[1].id, 'stash@{1}')
    assert.strictEqual(stashData.stashes[1].message, 'First stash')
})

test('stash stores timestamp with each entry', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified content')

    captureOutput(() => stash(['save', 'Test stash']))

    const stashData = readStash()
    assert.ok(typeof stashData.stashes[0].timestamp === 'number')
    assert.ok(stashData.stashes[0].timestamp > 0)
})

test('stash stores commit hash with each entry', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified content')

    captureOutput(() => stash(['save', 'Test stash']))

    const stashData = readStash()
    assert.ok(stashData.stashes[0].commit)
    assert.match(stashData.stashes[0].commit, /^[0-9a-f]{40}$/)
})

// Test stashList

test('stash list shows all stashes', () => {
    createInitialCommit()

    createFileWithContent('file.txt', 'first')
    captureOutput(() => stash(['save', 'First stash']))

    createFileWithContent('file.txt', 'second')
    captureOutput(() => stash(['save', 'Second stash']))

    const { output } = captureOutput(() => stash(['list']))

    assert.ok(output.includes('stash@{0}: Second stash'))
    assert.ok(output.includes('stash@{1}: First stash'))
})

test('stash list shows "No stashes" when empty', () => {
    createInitialCommit()

    const { output } = captureOutput(() => stash(['list']))

    assert.match(output, /No stashes/)
})

test('stash list shows empty message correctly', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified')
    captureOutput(() => stash([]))

    const { output } = captureOutput(() => stash(['list']))

    assert.ok(output.includes('stash@{0}: WIP: stash'))
})

// Test stashApply

test('stash apply restores stashed changes', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified content')
    captureOutput(() => stash(['save', 'Test stash']))

    const { output } = captureOutput(() => stash(['apply', 'stash@{0}']))
    const filePath = path.join(baseDir, 'file.txt')

    assert.match(output, /Applied stash@{0}/)
    assert.ok(fs.existsSync(filePath))
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'modified content')
})

test('stash apply does not remove stash from list', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified')
    captureOutput(() => stash(['save', 'Test stash']))

    captureOutput(() => stash(['apply', 'stash@{0}']))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 1)
})

test('stash apply with invalid reference shows error', () => {
    createInitialCommit()

    const { output } = captureOutput(() => stash(['apply', 'stash@{99}']))

    assert.match(output, /Invalid stash reference/)
})

test('stash apply with malformed reference shows error', () => {
    createInitialCommit()

    assert.throws(
        () => captureOutput(() => stash(['apply', 'invalid'])),
        /Invalid stash reference/
    )
})

// Test stashPop

test('stash pop restores stashed changes', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified')
    captureOutput(() => stash(['save', 'Test stash']))

    // Ensure pop must actively restore stashed content.
    fs.writeFileSync(path.join(baseDir, 'file.txt'), 'post-stash content')

    const { output } = captureOutput(() => stash(['pop']))

    assert.match(output, /Popped stash@{0}/)
    assert.ok(fs.existsSync(path.join(baseDir, 'file.txt')))
    assert.strictEqual(
        fs.readFileSync(path.join(baseDir, 'file.txt'), 'utf-8'),
        'modified'
    )
})

test('stash pop removes stash from list', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified')
    captureOutput(() => stash(['save', 'Test stash']))

    assert.strictEqual(readStash().stashes.length, 1)

    captureOutput(() => stash(['pop']))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 0)
})

test('stash pop reindexes remaining stashes', () => {
    createInitialCommit()

    createFileWithContent('file.txt', 'first')
    captureOutput(() => stash(['save', 'First']))

    createFileWithContent('file.txt', 'second')
    captureOutput(() => stash(['save', 'Second']))

    captureOutput(() => stash(['pop']))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes[0].id, 'stash@{0}')
    assert.strictEqual(stashData.stashes[0].message, 'First')
})

test('stash pop shows error when no stashes', () => {
    createInitialCommit()

    const { output } = captureOutput(() => stash(['pop']))

    assert.match(output, /No stashes to pop/)
})

// Test stashDrop

test('stash drop removes a stash by reference', () => {
    createInitialCommit()

    createFileWithContent('file.txt', 'first')
    captureOutput(() => stash(['save', 'First']))

    createFileWithContent('file.txt', 'second')
    captureOutput(() => stash(['save', 'Second']))

    const { output } = captureOutput(() => stash(['drop', 'stash@{1}']))

    assert.match(output, /Dropped stash@{1}/)
    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 1)
    assert.strictEqual(stashData.stashes[0].message, 'Second')
})

test('stash drop reindexes remaining stashes', () => {
    createInitialCommit()

    createFileWithContent('file.txt', 'first')
    captureOutput(() => stash(['save', 'First']))

    createFileWithContent('file.txt', 'second')
    captureOutput(() => stash(['save', 'Second']))

    captureOutput(() => stash(['drop', 'stash@{1}']))

    const stashData = readStash()
    assert.strictEqual(stashData.stashes[0].id, 'stash@{0}')
    assert.strictEqual(stashData.stashes[0].message, 'Second')
})

test('stash drop with invalid reference shows error', () => {
    createInitialCommit()

    const { output } = captureOutput(() => stash(['drop', 'stash@{0}']))

    assert.match(output, /Invalid stash reference/)
})

test('stash drop with malformed reference shows error', () => {
    createInitialCommit()

    assert.throws(
        () => captureOutput(() => stash(['drop', 'invalid'])),
        /Invalid stash reference/
    )
})

// Test stashClear

test('stash clear removes all stashes', () => {
    createInitialCommit()

    createFileWithContent('file.txt', 'first')
    captureOutput(() => stash(['save', 'First']))

    createFileWithContent('file.txt', 'second')
    captureOutput(() => stash(['save', 'Second']))

    const { output } = captureOutput(() => stash(['clear']))

    assert.match(output, /Cleared all stashes/)
    const stashData = readStash()
    assert.strictEqual(stashData.stashes.length, 0)
})

test('stash clear creates empty stash file', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'modified')
    captureOutput(() => stash(['save', 'Test']))

    captureOutput(() => stash(['clear']))

    const stashData = readStash()
    assert.deepStrictEqual(stashData, { stashes: [] })
})

// Test stashShow

test('stash show displays stash content', () => {
    createInitialCommit()
    createFileWithContent('file.txt', 'stashed content')
    captureOutput(() => stash(['save', 'Test stash']))

    const stashData = readStash()
    const stashedCommit = stashData.stashes[0].commit
    const expectedPayload = readObject(stashedCommit).content.toString()

    const { output } = captureOutput(() => stash(['show', 'stash@{0}']))

    assert.ok(output.includes('--- stash@{0} ---'))
    assert.ok(output.includes(expectedPayload))
})

test('stash show with invalid reference shows error', () => {
    createInitialCommit()

    const { output } = captureOutput(() => stash(['show', 'stash@{99}']))

    assert.match(output, /Invalid stash reference/)
})

test('stash show with malformed reference shows error', () => {
    createInitialCommit()

    assert.throws(
        () => captureOutput(() => stash(['show', 'invalid'])),
        /Invalid stash reference/
    )
})

// Test unknown command

test('stash with unknown command shows error', () => {
    createInitialCommit()

    const { output } = captureOutput(() => stash(['unknown']))

    assert.match(output, /Unknown stash command/)
})

test('stash save outside a mygit repository fails cleanly', () => {
    const mygitDir = path.join(baseDir, '.mygit')

    fs.rmSync(mygitDir, { recursive: true, force: true })

    const { output } = captureOutput(() => stash(['save', 'Test stash']))

    assert.match(output, /fatal: not a mygit repository/i)
    assert.strictEqual(fs.existsSync(mygitDir), false)
})
