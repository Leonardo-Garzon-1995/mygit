const fs = require('fs')
const path = require('path')

const baseDir = path.join(__dirname, "..", 'tmp-test')

function setupRepo() {
    fs.rmSync(baseDir, {recursive: true, force: true})
    fs.mkdirSync(baseDir, {recursive: true})

    process.chdir(baseDir)

    fs.mkdirSync(path.join(baseDir, ".mygit", 'objects'), {recursive: true})
}

function cleanupRepo() {
    process.chdir(__dirname)
    fs.rmSync(baseDir, {recursive: true, force: true})
}

module.exports = {
    baseDir,
    setupRepo,
    cleanupRepo
}