const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const run = require('./helpers/run')
const captureOutput = require('./helpers/captureOutput')
const { setupRepo, baseDir, cleanupRepo } = require('./helpers/setup')
const lsFiles = require('../src/commands/ls-files')

test.beforeEach(() => {
    setupRepo()
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'index'),
        JSON.stringify({ version: 1, entries: {} }, null, 2)
    )
})

test.afterEach(cleanupRepo)

console.log('\nTESTING LS-FILES\n')

// TEST EMPTY INDEX - NO OUTPUT
test('ls-files prints nothing when index is empty', () => {
    const { output, exitCode } = captureOutput(() => lsFiles())

    assert.strictEqual(output, '')
    assert.strictEqual(exitCode, null)
})

// TEST MISSING INDEX - NO OUTPUT
test('ls-files prints nothing when index file is absent', () => {
    fs.rmSync(path.join(baseDir, '.mygit', 'index'), { force: true })

    const { output, exitCode } = captureOutput(() => lsFiles())

    assert.strictEqual(output, '')
    assert.strictEqual(exitCode, null)
})

// TEST SINGLE FILE
test('ls-files prints a single staged file', () => {
    run('mygit init')
    fs.writeFileSync(path.join(baseDir, 'file.txt'), 'hello')
    run('mygit add file.txt')

    const output = run('mygit ls-files')

    assert.strictEqual(output, 'file.txt')
})

// TEST MULTIPLE FILES - SORTED
test('ls-files prints multiple staged files sorted alphabetically', () => {
    run('mygit init')
    fs.writeFileSync(path.join(baseDir, 'banana.txt'), 'b')
    fs.writeFileSync(path.join(baseDir, 'apple.txt'), 'a')
    fs.writeFileSync(path.join(baseDir, 'cherry.txt'), 'c')
    run('mygit add apple.txt banana.txt cherry.txt')

    const output = run('mygit ls-files')

    assert.strictEqual(output, 'apple.txt\nbanana.txt\ncherry.txt')
})

// TEST NESTED PATHS
test('ls-files includes nested paths', () => {
    run('mygit init')
    fs.mkdirSync(path.join(baseDir, 'src'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, 'src', 'main.js'), 'console.log(1)')
    fs.writeFileSync(path.join(baseDir, 'README.md'), '# hi')
    run('mygit add .')

    const output = run('mygit ls-files')

    // README.md sorts before src/main.js (uppercase R < lowercase s)
    assert.match(output, /^README\.md\s*$/m)
    assert.match(output, /^src\/main\.js\s*$/m)
})

// TEST DOES NOT MODIFY INDEX
test('ls-files does not modify the index file', () => {
    run('mygit init')
    fs.writeFileSync(path.join(baseDir, 'file.txt'), 'hello')
    run('mygit add file.txt')

    const indexPath = path.join(baseDir, '.mygit', 'index')
    const before = fs.readFileSync(indexPath, 'utf-8')

    run('mygit ls-files')

    const after = fs.readFileSync(indexPath, 'utf-8')
    assert.strictEqual(before, after)
})

// TEST NOT IN A MYGIT REPO - EXITS WITH ERROR
test('ls-files fails outside a mygit repo', () => {
    cleanupRepo()
    const outsideDir = path.join(baseDir, '..', 'not-a-repo')
    fs.rmSync(outsideDir, { recursive: true, force: true })
    fs.mkdirSync(outsideDir, { recursive: true })
    process.chdir(outsideDir)

    const { exitCode } = captureOutput(() => lsFiles())

    assert.notStrictEqual(exitCode, 0)

    process.chdir(__dirname)
    fs.rmSync(outsideDir, { recursive: true, force: true })
})

// TEST IGNORES NON-ENTRIES KEYS
test('ls-files only lists keys under entries', () => {
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'index'),
        JSON.stringify({
            version: 1,
            entries: {
                'foo.txt': { hash: 'abc123', mode: '100644' },
                'bar.txt': { hash: 'def456', mode: '100644' }
            },
            extraField: 'should-be-ignored'
        }, null, 2)
    )

    const { output } = captureOutput(() => lsFiles())

    assert.strictEqual(output, 'bar.txt\nfoo.txt')
})
