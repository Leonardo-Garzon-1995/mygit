const fs = require('fs')
const path = require('path')

const { readIndex, writeIndex } = require('../core/index')
const { ensureRepo } = require('../core/repository')

function normalizePath(filePath) {
    // Normialize path to use foward slashes

    const repoRoot = process.cwd()
    const absolutePath = path.resolve(filePath)

    // Get relative path
    let relativePath = path.relative(repoRoot, absolutePath)

    // Convert to foward slashes
    const modifiedPath = relativePath.split(path.sep).join('/')

    return modifiedPath
}

function removeFile(index, filePath, options) {
    const normalizedPath = normalizePath(filePath)

    if (!index.entries[normalizedPath]) {
        console.error(`fatal: pathspec '${filePath}' did not match any files`)
        return
    }

    delete index.entries[normalizedPath]

    if (!options.cached) {
        const absolutePath = path.resolve(filePath)

        if (fs.existsSync(absolutePath)) {
            const stats = fs.lstatSync(absolutePath)

            if (!stats.isDirectory()) {
                fs.unlinkSync(absolutePath)
            }
        }
    }
}

function rm(args = [], options = {}) {
    ensureRepo()

    
    const cached = options['cached'] || false
    console.log(`Cached option: ${cached}`)
    const files = args.filter(arg => arg !== '--cached')
    console.log(files)

    if (files.length === 0) {
        console.error('Nothing specified, nothing removed.')
        return
    }

    const index = readIndex()

    for (const filePath of files) {
        removeFile(index, filePath, { cached })
    }

    writeIndex(index)
}

module.exports = rm
