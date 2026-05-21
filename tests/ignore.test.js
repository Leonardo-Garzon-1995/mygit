const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const run = require('./helpers/run')
const captureOutput = require('./helpers/captureOutput')
const { setupRepo, baseDir, cleanupRepo } = require('./helpers/setup')
const ignore = require('../src/commands/ignore')

const ignorePath = () => path.join(baseDir, '.mygitignore')

test.beforeEach(setupRepo)
test.afterEach(cleanupRepo)

console.log('\nTESTING IGNORE\n')

test('ignore creates .mygitignore and appends a pattern through the CLI', () => {
    const output = run('mygit ignore logs/')

    assert.strictEqual(output, '')
    assert.strictEqual(fs.readFileSync(ignorePath(), 'utf-8'), 'logs/\n')
})

test('ignore --list prints tracked patterns', () => {
    run('mygit ignore logs/')
    run('mygit ignore dist/')

    const output = run('mygit ignore --list')

    assert.match(output, /Patterns tracked by '.mygitignore'/)
    assert.match(output, /- logs\//)
    assert.match(output, /- dist\//)
})

test('ignore --remove deletes only the requested pattern', () => {
    fs.writeFileSync(ignorePath(), 'logs/\ndist/\n')

    const output = run('mygit ignore --remove logs/')

    assert.match(output, /pattern 'logs\/' removed from .mygitignore/)
    assert.strictEqual(fs.readFileSync(ignorePath(), 'utf-8'), 'dist/\n')
})

test('ignore --remove-all clears all tracked patterns', () => {
    fs.writeFileSync(ignorePath(), 'logs/\ndist/\n')

    const output = run('mygit ignore --remove-all')

    assert.strictEqual(output, '')
    assert.strictEqual(fs.readFileSync(ignorePath(), 'utf-8'), '')
})

test('ignore --remove without a pattern prints usage and leaves the file empty', () => {
    const { output, exitCode } = captureOutput(() => ignore(['--remove']), true)

    assert.strictEqual(exitCode, null)
    assert.match(output, /usage: mygit ignore --remove <pattern>/)
    assert.strictEqual(fs.readFileSync(ignorePath(), 'utf-8'), '')
})
