const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const run = require('./helpers/run')
const { setupRepo, baseDir, cleanupRepo } = require('./helpers/setup')

test.beforeEach(() => {
    setupRepo()
    fs.mkdirSync(path.join(baseDir, '.mygit', 'refs', 'heads'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, '.mygit', 'HEAD'), 'ref: refs/heads/main')
})

test.afterEach(cleanupRepo)

console.log('\nTESTING STATUS\n')

// TEST NO COMMITS YET & UNTRACKED FILES
test('status shows "No commits yet" and untracked files', () => {
    const filePath = path.join(baseDir, 'untracked.txt')
    fs.writeFileSync(filePath, 'hello')

    const output = run('mygit status')
    assert.match(output, /No commits yet/i)
    assert.match(output, /Untracked files:/i)
    assert.match(output, /untracked\.txt/)
})

// TEST NO COMMITS YET & STAGED FILES
test('status shows staged files before initial commit', () => {
    const filePath = path.join(baseDir, 'staged.txt')
    fs.writeFileSync(filePath, 'hello')

    run(`mygit add staged.txt`)

    const output = run('mygit status')
    assert.match(output, /No commits yet/i)
    assert.match(output, /Changes to be committed:/i)
    assert.match(output, /new file:\s+staged\.txt/)
})

// TEST CLEAN WORKING TREE
test('status reports clean working tree after commit', () => {
    const filePath = path.join(baseDir, 'file.txt')
    fs.writeFileSync(filePath, 'hello')

    run(`mygit add file.txt`)
    run(`mygit commit -m "initial commit"`)

    const output = run('mygit status')
    assert.match(output, /nothing to commit, working tree clean/i)
})

// TEST STAGED MODIFIED FILE
test('status shows staged modified files', () => {
    const filePath = path.join(baseDir, 'modified.txt')
    fs.writeFileSync(filePath, 'hello')

    run(`mygit add modified.txt`)
    run(`mygit commit -m "initial commit"`)

    fs.writeFileSync(filePath, 'hello world!')
    run(`mygit add modified.txt`)

    const output = run('mygit status')
    assert.match(output, /Changes to be committed:/i)
    assert.match(output, /modified:\s+modified\.txt/i)
})

// TEST UNSTAGED MODIFIED FILE
test('status shows unstaged modified files', () => {
    const filePath = path.join(baseDir, 'modified.txt')
    fs.writeFileSync(filePath, 'hello')

    run(`mygit add modified.txt`)
    run(`mygit commit -m "initial commit"`)

    fs.writeFileSync(filePath, 'hello world!')

    const output = run('mygit status')
    assert.match(output, /Changes not staged for commit:/i)
    assert.match(output, /modified:\s+modified\.txt/i)
})

// TEST DELETED UNSTAGED FILE
test('status shows unstaged deleted files', () => {
    const filePath = path.join(baseDir, 'deleted.txt')
    fs.writeFileSync(filePath, 'hello')

    run(`mygit add deleted.txt`)
    run(`mygit commit -m "initial commit"`)

    fs.unlinkSync(filePath)

    const output = run('mygit status')
    assert.match(output, /Changes not staged for commit:/i)
    assert.match(output, /deleted:\s+deleted\.txt/i)
})