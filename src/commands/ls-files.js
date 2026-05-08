const fs = require('fs')
const path = require('path')

const readIndex = require('../helpers/readIndex')
const { ensureRepo } = require('../core/repository')

/**
 * Prints the staged file paths recorded in the index, sorted alphabetically.
 * Returns silently when the index is empty or has no entries.
 * @throws {Error} If the current directory is not a mygit repository
 */
function lsFiles() {
    ensureRepo()

    const index = readIndex()
    if (!index.entries || Object.keys(index.entries).length === 0) {
        return
    }

    const sorted = Object.keys(index.entries).sort()

    for (const filePath of sorted) {
        console.log(filePath)
    }
}

module.exports = lsFiles
