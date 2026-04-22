const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')
const crypto = require('crypto')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const checkout = require('../src/commands/checkout')

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

function writeTree(entries) {
    let treeContent = Buffer.alloc(0)
    
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const entryBuffer = Buffer.concat([
            Buffer.from(`${entry.mode} ${entry.name}\0`),
            Buffer.from(entry.hash, 'hex')
        ])
        treeContent = Buffer.concat([treeContent, entryBuffer])
    }
    
    const header = Buffer.from(`tree ${treeContent.length}\0`)
    const store = Buffer.concat([header, treeContent])
    const hash = crypto.createHash('sha1').update(store).digest('hex')
    
    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))
    
    return hash
}

function writeCommit(treeHash, parentHash = null, message = 'Test commit') {
    const author = 'Test Author <test@example.com> 1710000000 +0000'
    let content = `tree ${treeHash}\n`
    if (parentHash) {
        content += `parent ${parentHash}\n`
    }
    content += `author ${author}\ncommitter ${author}\n\n${message}\n`
    
    const body = Buffer.from(content)
    const header = Buffer.from(`commit ${body.length}\0`)
    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')
    
    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0, 2))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))
    
    return hash
}

function addToIndex(filePath, content, mode = '100644') {
    const indexPath = path.join(baseDir, '.mygit', 'index')
    let index = { version: 1, entries: {} }
    
    if (fs.existsSync(indexPath)) {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
    }
    
    const hash = writeBlob(content)
    index.entries[filePath] = { mode, hash }
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
}

function createCommit(message, files = {}) {
    // Add files to index
    for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(baseDir, filePath)
        const dir = path.dirname(fullPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(fullPath, content)
        addToIndex(filePath, content)
    }
    
    // Create commit using the commit command
    const commit = require('../src/commands/commit')
    return commit(message)
}

function createBranch(branchName, commitHash) {
    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', branchName)
    const branchDir = path.dirname(branchPath)
    if (!fs.existsSync(branchDir)) {
        fs.mkdirSync(branchDir, { recursive: true })
    }
    fs.writeFileSync(branchPath, commitHash + '\n')
}

function captureOutput(fn) {
    const originalLog = console.log
    const originalError = console.error
    const originalExit = process.exit
    let output = []
    let exitCode = null
    
    console.log = (...args) => {
        output.push(args.join(' '))
    }
    console.error = (...args) => {
        output.push(args.join(' '))
    }
    process.exit = (code) => {
        exitCode = code
        throw new Error(`EXIT ${code}`)
    }
    
    try {
        fn()
    } catch (err) {
        if (!err.message || !err.message.includes('EXIT')) {
            throw err
        }
    } finally {
        console.log = originalLog
        console.error = originalError
        process.exit = originalExit
    }
    
    return { output: output.join('\n'), exitCode }
}

function getCurrentBranch() {
    const headPath = path.join(baseDir, '.mygit', 'HEAD')
    const headContent = fs.readFileSync(headPath, 'utf-8').trim()
    if (!headContent.startsWith('ref: ')) {
        return null
    }
    return headContent.substring(5).split('/').pop()
}

// TESTS

console.log('\nTESTING CHECKOUT\n')

test('checkout shows error when no branch name provided', () => {
    const { output, exitCode } = captureOutput(() => {
        checkout([])
    })
    
    assert.match(output, /branch name required/)
    assert.strictEqual(exitCode, 1)
})

test('checkout shows error when not in a mygit repository', () => {
    fs.rmSync(path.join(baseDir, '.mygit'), { recursive: true, force: true })
    
    const { output, exitCode } = captureOutput(() => {
        checkout(['main'])
    })
    
    assert.match(output, /not a mygit repository/)
    assert.strictEqual(exitCode, 1)
})

test('checkout shows error for invalid branch name', () => {
    const { output, exitCode } = captureOutput(() => {
        checkout(['bad@name'])
    })
    
    assert.match(output, /not a valid branch name/)
    assert.strictEqual(exitCode, 1)
})

test('checkout shows error when branch does not exist', () => {
    const { output, exitCode } = captureOutput(() => {
        checkout(['nonexistent'])
    })
    
    assert.match(output, /did not match any file\(s\) known to mygit/)
    assert.strictEqual(exitCode, 1)
})

test('checkout shows message when already on branch', () => {
    // Create a commit first
    fs.writeFileSync(path.join(baseDir, 'test.txt'), 'content')
    addToIndex('test.txt', 'content')
    const commit = require('../src/commands/commit')
    commit('Initial commit')
    
    const { output, exitCode } = captureOutput(() => {
        checkout(['main'])
    })
    
    assert.match(output, /Already on 'main'/)
    assert.strictEqual(exitCode, null)
})

test('checkout switches to existing branch', () => {
    // Create initial commit on main
    fs.writeFileSync(path.join(baseDir, 'file1.txt'), 'content 1')
    addToIndex('file1.txt', 'content 1')
    const commit = require('../src/commands/commit')
    const mainCommit = commit('First commit on main')
    
    // Create a new branch
    createBranch('feature', mainCommit)
    
    // Switch to feature branch
    const { output, exitCode } = captureOutput(() => {
        checkout(['feature'])
    })
    
    assert.match(output, /Switched to branch 'feature'/)
    assert.strictEqual(exitCode, null)
    assert.strictEqual(getCurrentBranch(), 'feature')
})

test('checkout updates working directory when switching branches', () => {
    // Create main branch with file1.txt
    fs.writeFileSync(path.join(baseDir, 'file1.txt'), 'main content')
    addToIndex('file1.txt', 'main content')
    const commit = require('../src/commands/commit')
    const mainCommit = commit('Main commit')
    
    // Create feature branch pointing to same commit as main
    createBranch('feature', mainCommit)
    
    // Switch to feature branch
    checkout(['feature'])
    assert.strictEqual(getCurrentBranch(), 'feature')
    
    // Add file2.txt on feature branch and commit it
    fs.writeFileSync(path.join(baseDir, 'file2.txt'), 'feature content')
    addToIndex('file2.txt', 'feature content')
    const featureCommit = commit('Feature commit')
    
    // Update feature branch to point to new commit
    const featurePath = path.join(baseDir, '.mygit', 'refs', 'heads', 'feature')
    fs.writeFileSync(featurePath, featureCommit + '\n')
    
    // Switch back to main
    checkout(['main'])
    assert.strictEqual(getCurrentBranch(), 'main')
    
    // file2.txt should not exist in main branch
    assert.ok(!fs.existsSync(path.join(baseDir, 'file2.txt')))
    assert.ok(fs.existsSync(path.join(baseDir, 'file1.txt')))
    
    // Switch to feature
    checkout(['feature'])
    assert.strictEqual(getCurrentBranch(), 'feature')
    
    // file2.txt should be restored
    assert.ok(fs.existsSync(path.join(baseDir, 'file2.txt')))
})

test('checkout creates and switches to new branch with -b flag', () => {
    // Create initial commit
    fs.writeFileSync(path.join(baseDir, 'test.txt'), 'content')
    addToIndex('test.txt', 'content')
    const commit = require('../src/commands/commit')
    commit('Initial commit')
    
    const { output, exitCode } = captureOutput(() => {
        checkout(['-b', 'new-branch'])
    })
    
    assert.match(output, /Switched to a new branch 'new-branch'/)
    assert.strictEqual(exitCode, null)
    assert.strictEqual(getCurrentBranch(), 'new-branch')
    
    // Verify branch file was created
    const branchPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'new-branch')
    assert.ok(fs.existsSync(branchPath))
})

test('checkout with -b shows error when branch already exists', () => {
    // Create initial commit
    fs.writeFileSync(path.join(baseDir, 'test.txt'), 'content')
    addToIndex('test.txt', 'content')
    const commit = require('../src/commands/commit')
    commit('Initial commit')
    
    // Try to create branch that already exists
    const { output, exitCode } = captureOutput(() => {
        checkout(['-b', 'main'])
    })
    
    assert.match(output, /already exists/)
    assert.strictEqual(exitCode, 1)
})

test('checkout with -b requires branch name', () => {
    const { output, exitCode } = captureOutput(() => {
        checkout(['-b'])
    })
    
    assert.match(output, /branch name required after -b/)
    assert.strictEqual(exitCode, 1)
})

test('checkout handles nested directories correctly', () => {
    // Create commit with nested files
    const files = {
        'src/index.js': 'console.log("hello")',
        'src/utils/helper.js': 'module.exports = {}',
        'README.md': '# Project'
    }
    
    for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(baseDir, filePath)
        const dir = path.dirname(fullPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(fullPath, content)
        addToIndex(filePath, content)
    }
    
    const commit = require('../src/commands/commit')
    commit('Initial commit')
    
    // Create and switch to new branch
    checkout(['-b', 'feature'])
    
    // Verify nested structure is preserved
    assert.ok(fs.existsSync(path.join(baseDir, 'src/index.js')))
    assert.ok(fs.existsSync(path.join(baseDir, 'src/utils/helper.js')))
    assert.ok(fs.existsSync(path.join(baseDir, 'README.md')))
})

test('checkout exits with error when HEAD is missing', () => {
    fs.unlinkSync(path.join(baseDir, '.mygit', 'HEAD'))
    
    const originalExit = process.exit
    let exitCode
    
    process.exit = (code) => {
        exitCode = code
        throw new Error('EXIT')
    }
    
    assert.throws(() => checkout(['main']), /EXIT/)
    assert.strictEqual(exitCode, 1)
    
    process.exit = originalExit
})