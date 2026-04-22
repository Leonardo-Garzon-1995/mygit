const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')
const crypto = require('crypto')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const commit = require('../src/commands/commit')

test.beforeEach(() => {
    setupRepo()
    fs.mkdirSync(path.join(baseDir, '.mygit', 'refs', 'heads'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, '.mygit', 'HEAD'), 'ref: refs/heads/main')
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

function addToIndex(filePath, mode = '100644') {
    const indexPath = path.join(baseDir, '.mygit', 'index')
    let index = { version: 1, entries: {} }
    
    if (fs.existsSync(indexPath)) {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
    }
    
    const fullPath = path.join(baseDir, filePath)
    const content = fs.readFileSync(fullPath)
    const hash = writeBlob(content)
    
    index.entries[filePath] = { mode, hash }
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
    
    return hash
}

function captureOutput(fn) {
    const originalLog = console.log
    const originalError = console.error
    let output = []
    
    console.log = (...args) => {
        output.push(args.join(' '))
    }
    console.error = (...args) => {
        output.push(args.join(' '))
    }
    
    fn()
    
    console.log = originalLog
    console.error = originalError
    
    return output.join('\n')
}

// TESTS

console.log('\nTESTING COMMIT\n')

test('commit shows error when no message provided', () => {
    const originalExit = process.exit
    let exitCode
    
    process.exit = (code) => {
        exitCode = code
        throw new Error('EXIT')
    }
    
    assert.throws(() => captureOutput(() => commit()), /EXIT/)
    assert.strictEqual(exitCode, 1)
    
    process.exit = originalExit
})

test('commit shows error when not in a mygit repository', () => {
    fs.rmSync(path.join(baseDir, '.mygit'), { recursive: true, force: true })
    
    const originalExit = process.exit
    let exitCode
    
    process.exit = (code) => {
        exitCode = code
        throw new Error('EXIT')
    }
    
    assert.throws(() => captureOutput(() => commit('test message')), /EXIT/)
    assert.strictEqual(exitCode, 1)
    
    process.exit = originalExit
})

test('commit shows error when nothing staged', () => {
    const originalExit = process.exit
    let exitCode
    
    process.exit = (code) => {
        exitCode = code
        throw new Error('EXIT')
    }
    
    assert.throws(() => captureOutput(() => commit('test message')), /EXIT/)
    assert.strictEqual(exitCode, 1)
    
    process.exit = originalExit
})

test('commit creates first commit', () => {
    fs.writeFileSync(path.join(baseDir, 'test.txt'), 'test content')
    addToIndex('test.txt')
    
    let commitHash
    const output = captureOutput(() => {
        commitHash = commit('Initial commit')
    })
    
    assert.match(output, /\[main \(root-commit\) [0-9a-f]{7}\] Initial commit/)
    assert.match(commitHash, /^[0-9a-f]{40}$/)
    
    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')
    assert.ok(fs.existsSync(branchPath))
    assert.strictEqual(fs.readFileSync(branchPath, 'utf-8').trim(), commitHash)
})

test('commit creates second commit with parent', () => {
    fs.writeFileSync(path.join(baseDir, 'file1.txt'), 'content 1')
    addToIndex('file1.txt')
    commit('First commit')
    
    fs.writeFileSync(path.join(baseDir, 'file2.txt'), 'content 2')
    addToIndex('file2.txt')
    
    const output = captureOutput(() => {
        commit('Second commit')
    })
    
    assert.match(output, /\[main [0-9a-f]{7}\] Second commit/)
    assert.doesNotMatch(output, /root-commit/)
})

test('commit handles empty files', () => {
    fs.writeFileSync(path.join(baseDir, 'empty.txt'), '')
    addToIndex('empty.txt')
    
    const output = captureOutput(() => {
        commit('Add empty file')
    })
    
    assert.match(output, /Add empty file/)
})

test('commit handles files with spaces in names', () => {
    fs.writeFileSync(path.join(baseDir, 'my file.txt'), 'content')
    addToIndex('my file.txt')
    
    const output = captureOutput(() => {
        commit('Add file with space')
    })
    
    assert.match(output, /Add file with space/)
})

test('commit exits with error when HEAD is missing', () => {
    fs.unlinkSync(path.join(baseDir, '.mygit', 'HEAD'))
    fs.writeFileSync(path.join(baseDir, 'test.txt'), 'content')
    addToIndex('test.txt')
    
    // commit.js throws ENOENT when HEAD is missing
    assert.throws(
        () => captureOutput(() => commit('test message')),
        /ENOENT/
    )
})

test('commit exits with error when HEAD is detached', () => {
    const fakeHash = 'a'.repeat(40)
    fs.writeFileSync(path.join(baseDir, '.mygit', 'HEAD'), fakeHash)
    fs.writeFileSync(path.join(baseDir, 'test.txt'), 'content')
    addToIndex('test.txt')
    
    const originalExit = process.exit
    let exitCode
    
    process.exit = (code) => {
        exitCode = code
        throw new Error('EXIT')
    }
    
    assert.throws(() => captureOutput(() => commit('test message')), /EXIT/)
    assert.strictEqual(exitCode, 1)
    
    process.exit = originalExit
})