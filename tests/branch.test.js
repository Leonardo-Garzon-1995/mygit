const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')
const crypto = require('crypto')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const captureOutput = require('./helpers/captureOutput')
const branch = require('../src/commands/branch')

test.beforeEach(() => {
    setupRepo()
    fs.mkdirSync(path.join(baseDir, '.mygit', 'refs', 'heads'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, '.mygit', 'HEAD'), 'ref: refs/heads/main')
})

test.afterEach(cleanupRepo)

function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;]*m/g, '')
}

function writeCommit(message) {
    const body = Buffer.from(`tree abc123\n\n${message}\n`)
    const header = Buffer.from(`commit ${body.length}\0`)
    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')
    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))

    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))

    return hash
}

function seedBranch(name, commitHash) {
    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', name)

    fs.mkdirSync(path.dirname(branchPath), { recursive: true })
    fs.writeFileSync(branchPath, `${commitHash}\n`)
}

function readBranch(name) {
    return fs
        .readFileSync(path.join(baseDir, '.mygit', 'refs', 'heads', name), 'utf-8')
        .trim()
}

function captureBranch(args) {
    const result = captureOutput(() => branch(args), true)
    return { ...result, output: stripAnsi(result.output) }
}

console.log('\nTESTING BRANCH\n')

test('branch lists the current branch with a marker', () => {
    seedBranch('main', writeCommit('initial commit'))

    const { output, exitCode } = captureBranch([])

    assert.strictEqual(exitCode, null)
    assert.match(output, /\* main/)
})

test('branch <name> creates a branch at HEAD', () => {
    const head = writeCommit('initial commit')
    seedBranch('main', head)

    const { output, exitCode } = captureBranch(['feature'])

    assert.strictEqual(exitCode, null)
    assert.match(output, /Created branch feature/)
    assert.strictEqual(readBranch('feature'), head)
})

test('branch -v lists short hashes and commit messages', () => {
    const head = writeCommit('initial commit')
    seedBranch('main', head)
    seedBranch('feature', writeCommit('feature commit'))

    const { output, exitCode } = captureBranch(['-v'])

    assert.strictEqual(exitCode, null)
    assert.match(output, new RegExp(`\\* main\\s+${head.slice(0, 7)} initial commit`))
    assert.match(output, /feature\s+[0-9a-f]{7} feature commit/)
})

test('branch -d deletes a non-current branch', () => {
    seedBranch('main', writeCommit('initial commit'))
    seedBranch('feature', writeCommit('feature commit'))

    const { output, exitCode } = captureBranch(['-d', 'feature'])

    assert.strictEqual(exitCode, null)
    assert.match(output, /Deleted branch feature/)
    assert.strictEqual(
        fs.existsSync(path.join(baseDir, '.mygit', 'refs', 'heads', 'feature')),
        false,
    )
})

test('branch -d refuses to delete the current branch', () => {
    const head = writeCommit('initial commit')
    seedBranch('main', head)

    const { output, exitCode } = captureBranch(['-d', 'main'])

    assert.strictEqual(exitCode, 1)
    assert.match(output, /Cannot delete branch 'main'/)
    assert.strictEqual(readBranch('main'), head)
})

test('branch rejects invalid branch names without creating refs', () => {
    seedBranch('main', writeCommit('initial commit'))

    const { output, exitCode } = captureBranch(['bad@name'])

    assert.strictEqual(exitCode, 1)
    assert.match(output, /not a valid branch name/)
    assert.strictEqual(
        fs.existsSync(path.join(baseDir, '.mygit', 'refs', 'heads', 'bad@name')),
        false,
    )
})
