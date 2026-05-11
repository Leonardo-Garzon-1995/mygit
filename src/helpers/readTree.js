const path = require('path')

const readObject = require('./readObject')
const parseTree = require('./parseTree')

/**
 * Traverses a tree recursively and returns an object with all the files and their blob hashes
 * @param {string} treeHash 
 * @param {string} prefix 
 * @returns {Object} { 'path/to/file.txt': 'blob-hash', ... }
 */
function readTree(treeHash, prefix='') {

    const { content } = readObject(treeHash)
    const entries = parseTree(content)

    const files = {}

    for (const entry of entries) {
        const fullPath = prefix ? path.join(prefix, entry.name).split(path.sep).join('/') : entry.name

        if (entry.mode === "40000") {
            const subfiles = readTree(entry.hash, fullPath)
            Object.assign(files, subfiles)
        } else {
            files[fullPath] = { hash: entry.hash, mode: entry.mode }
        }
    }

    return files
}

module.exports = readTree
