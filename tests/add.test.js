const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')

const add = require('../src/commands/add') 
const { cleanupRepo, baseDir, setupRepo } = require('./helpers/setup')


test.beforeEach(() => {
    setupRepo()

    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'index'),
        JSON.stringify({entries: {}}, null, 2)
    )
})

test.afterEach(cleanupRepo)

// ____TESTS____

test('add command stages a single file into index', () => {

    fs.writeFileSync('file.txt', 'hello world')

    add(['file.txt'])

    const indexPath = path.join(baseDir, '.mygit', 'index')

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

    assert.ok(index.entries['file.txt'])
    assert.ok(index.entries['file.txt'].hash)
    assert.strictEqual(index.entries['file.txt'].mode, '100644')
})

test('add . stages all files in current directory', () => {
    fs.writeFileSync('a.txt', 'A')
    fs.writeFileSync('b.txt', 'B')

    add(['.'])

    const indexPath = path.join(baseDir, '.mygit', 'index')

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

    assert.ok(index.entries['a.txt']);
    assert.ok(index.entries['b.txt']);
    assert.strictEqual(Object.keys(index.entries).length, 2)
})

test('add stages recursively nested files in directories', () => {
    fs.mkdirSync('src')
    fs.mkdirSync('src/lib')

    fs.writeFileSync('src/app.js', 'console.log("app")');
    fs.writeFileSync('src/lib/util.js', 'module.exports = {}')

    add(['src'])

    const indexPath = path.join(baseDir, '.mygit', 'index')

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

    assert.ok(index.entries['src/app.js']);
    assert.ok(index.entries['src/lib/util.js']);
})

test('add updates file hash when file changes', () => {
    fs.writeFileSync('file.txt', 'version1')

    add(['file.txt'])

    const indexPath = path.join(baseDir, '.mygit', 'index')

    let index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

    const firstHash = index.entries['file.txt'].hash

    fs.writeFileSync('file.txt', 'version2')

    add(['file.txt'])

    index = JSON.parse(fs.readFileSync(
        indexPath,
        'utf-8'
    ))

    const secondHash = index.entries['file.txt'].hash

    assert.notStrictEqual(firstHash, secondHash)
})

test('add . ignores files inside .mygit directory', ()=> {
    fs.writeFileSync('tracked.txt', 'tracked')

    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'secret'),
        'should not be added'
    )

    add(['.'])

    const indexPath = path.join(baseDir, '.mygit', 'index')

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

    assert.ok(index.entries['tracked.txt'])
    assert.strictEqual(index.entries['.mygit/secret'], undefined)
})