const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')

const { cleanupRepo, baseDir } = require('./helpers/setup')
const run = require('./helpers/run')
const init = require('../src/commands/init')

test.beforeEach(() => {
    cleanupRepo()

    fs.mkdirSync(baseDir, {recursive: true})

    process.chdir(baseDir)
})

test.afterEach(cleanupRepo)

// ______TESTS______

console.log('\nTESTING INIT\n')

test('init creates a .mygit folder inside cwd', () => {
    run('mygit init')
    const mygitPath = path.join(baseDir, '.mygit')
    assert.ok(fs.existsSync(mygitPath))
})

test('init creates objects, refs and heads directories', () => {
    run('mygit init')

    const mygitPath = path.join(baseDir, '.mygit')
    const objectsDir = path.join(mygitPath, 'objects')
    const refsDir = path.join(mygitPath, 'refs')
    const headsDir = path.join(refsDir, 'heads')

    assert.ok(fs.existsSync(objectsDir))
    assert.ok(fs.existsSync(refsDir))
    assert.ok(fs.existsSync(refsDir))
    assert.ok(fs.existsSync(headsDir))
})

test('init creates a HEAD file that points correctly to default branch', () => {
    run('mygit init')

    const mygitPath = path.join(baseDir, '.mygit')
    const headPath = path.join(mygitPath, 'HEAD')
    const headContent = fs.readFileSync(headPath, 'utf-8').trim()

    assert.ok(fs.existsSync(headPath))
    assert.strictEqual(headContent, 'ref: refs/heads/main')
})

/*test('running init twice does not break repo' , () => {
    const init1 = run('mygit init')
    const init2 = run('mygit init')


    const mygitPath = path.join(baseDir, '.mygit')
    const headPath = path.join(mygitPath, 'HEAD')
    const headContent = fs.readFileSync(headPath, 'utf-8').trim()


    assert.strictEqual(init2, "A '.mygit' directory already exists inside this folder.")
    assert.ok(fs.existsSync(headPath))
    assert.strictEqual(headContent, 'ref: refs/heads/main')
})*/

