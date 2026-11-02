const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const run = require('./helpers/run')
const { setupRepo, baseDir, cleanupRepo } = require('./helpers/setup')

test.beforeEach(setupRepo)
test.afterEach(cleanupRepo)

console.log('\nTESTING CAT-FILE\n')

// TEST GET SIZE
test('cat-file -s shows the correct size', () => {
  const filePath = path.join(baseDir, 'file.txt')
  fs.writeFileSync(filePath, 'hello')

  const hash = run(`mygit hash-object ${filePath} -w`)
  const size = run(`mygit cat-file -s ${hash}`)

  assert.strictEqual(Number(size), 5)
})

// TEST TYPE
test('cat-file -t shows object type', () => {
  const filePath = path.join(baseDir, 'file.txt')
  fs.writeFileSync(filePath, 'hello')

  const hash = run(`mygit hash-object ${filePath} -w`)
  const type = run(`mygit cat-file -t ${hash}`)

  assert.strictEqual(type, 'blob')
})

// TEST PRETTY PRINT
test('cat-file -p prints blob content', () => {
  const filePath = path.join(baseDir, 'file.txt')
  fs.writeFileSync(filePath, 'hello')

  const hash = run(`mygit hash-object ${filePath} -w`)
  const content = run(`mygit cat-file -p ${hash}`)

  assert.strictEqual(content, 'hello')
})

// TEST SHORT HASH
test('cat-file supports short hash', () => {
  const filePath = path.join(baseDir, 'file.txt')
  fs.writeFileSync(filePath, 'hello')

  const hash = run(`mygit hash-object ${filePath} -w`)
  const short = hash.slice(0, 6)

  const content = run(`mygit cat-file -p ${short}`)

  assert.strictEqual(content, 'hello')
})
