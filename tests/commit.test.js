const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')

const commit = require('../src/commands/commit')
const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')

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

function writeIndex(entries) {
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'index'),
        JSON.stringify({ version: 1, entries }, null, 2)
    )
}

function stageFile(name, content) {
    fs.writeFileSync(path.join(baseDir, name), content)

    const crypto = require('crypto')
    const body = Buffer.from(content)
    const store = Buffer.concat([
        Buffer.from(`blob ${body.length}\0`),
        body
    ])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))

    return { hash, mode: '100644' }
}

function readCommitObject(hash) {
    const dir = hash.slice(0, 2)
    const file = hash.slice(2)
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, file)
    const compressed = fs.readFileSync(objPath)
    const raw = zlib.inflateSync(compressed).toString('utf-8')
    const nullIndex = raw.indexOf('\0')
    return raw.slice(nullIndex + 1)
}

function captureConsole() {
    const origLog = console.log
    const origError = console.error
    const out = { log: [], error: [] }
    console.log = (...a) => out.log.push(a.join(' '))
    console.error = (...a) => out.error.push(a.join(' '))
    const restore = () => {
        console.log = origLog
        console.error = origError
    }
    return { out, restore }
}

function expectExit(fn) {
    const origExit = process.exit
    let exitCode = null
    process.exit = (code) => {
        exitCode = code
        throw new Error(`__exit:${code}`)
    }
    try {
        fn()
    } catch (e) {
        if (!String(e.message).startsWith('__exit:')) throw e
    } finally {
        process.exit = origExit
    }
    return exitCode
}

// ____TESTS____

console.log('\nTESTING COMMIT\n')

test('commit without a message exits with code 1', () => {
    const { out, restore } = captureConsole()
    try {
        const code = expectExit(() => commit(''))
        assert.strictEqual(code, 1)
        assert.ok(out.error.some((line) => /commit message required/.test(line)))
    } finally {
        restore()
    }
})

test('commit with empty index exits with code 1', () => {
    writeIndex({})

    const { out, restore } = captureConsole()
    try {
        const code = expectExit(() => commit('initial'))
        assert.strictEqual(code, 1)
        assert.ok(out.error.some((line) => /nothing to commit/.test(line)))
    } finally {
        restore()
    }
})

test('commit creates commit object and advances refs/heads/main', () => {
    const file = stageFile('hello.txt', 'hello world')
    writeIndex({ 'hello.txt': file })

    const { restore } = captureConsole()
    let hash
    try {
        hash = commit('initial commit')
    } finally {
        restore()
    }

    assert.match(hash, /^[0-9a-f]{40}$/)

    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')
    assert.strictEqual(fs.readFileSync(branchPath, 'utf-8').trim(), hash)

    const body = readCommitObject(hash)
    assert.match(body, /^tree [0-9a-f]{40}\n/)
    assert.ok(!/\nparent /.test(body), 'root commit must have no parent')
    assert.match(body, /\nauthor .+ <.+> \d+ [+\-]\d{4}\n/)
    assert.match(body, /\ncommitter .+ <.+> \d+ [+\-]\d{4}\n/)
    assert.ok(body.endsWith('\ninitial commit\n'))
})

test('second commit records the parent commit hash', () => {
    const file1 = stageFile('a.txt', 'A')
    writeIndex({ 'a.txt': file1 })

    const { restore } = captureConsole()
    let firstHash, secondHash
    try {
        firstHash = commit('first')

        const file2 = stageFile('b.txt', 'B')
        writeIndex({ 'a.txt': file1, 'b.txt': file2 })

        secondHash = commit('second')
    } finally {
        restore()
    }

    assert.notStrictEqual(firstHash, secondHash)

    const body = readCommitObject(secondHash)
    assert.match(body, new RegExp(`\\nparent ${firstHash}\\n`))

    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')
    assert.strictEqual(fs.readFileSync(branchPath, 'utf-8').trim(), secondHash)
})

test('root commit prints root-commit feedback; follow-up commit prints normal feedback', () => {
    const file1 = stageFile('x.txt', 'X')
    writeIndex({ 'x.txt': file1 })

    const first = captureConsole()
    let firstHash
    try {
        firstHash = commit('first')
    } finally {
        first.restore()
    }

    const firstFeedback = first.out.log.find((line) => line.startsWith('[main'))
    assert.ok(firstFeedback, 'expected root-commit feedback line')
    assert.ok(firstFeedback.includes('(root-commit)'), 'root commit line should contain (root-commit)')
    assert.ok(firstFeedback.includes(firstHash.substring(0, 7)))
    assert.ok(firstFeedback.endsWith('first'))

    const file2 = stageFile('y.txt', 'Y')
    writeIndex({ 'x.txt': file1, 'y.txt': file2 })

    const second = captureConsole()
    let secondHash
    try {
        secondHash = commit('second')
    } finally {
        second.restore()
    }

    const secondFeedback = second.out.log.find((line) => line.startsWith('[main'))
    assert.ok(secondFeedback, 'expected follow-up commit feedback line')
    assert.ok(!secondFeedback.includes('(root-commit)'), 'non-root commit must not contain (root-commit)')
    assert.ok(secondFeedback.includes(secondHash.substring(0, 7)))
    assert.ok(secondFeedback.endsWith('second'))
})
