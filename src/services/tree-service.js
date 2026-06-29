const path = require('../utils/paths')
const { 
    readIndex, 
    getIndexStoredPaths, 
    getIndexEntry 
} = require('../core/index/index')
const { FILE_MODES } = require('../constants')
const { writeTreeObject } = require('../core/objects/trees')
const { ValidationError } = require('../errors')

/**
 * Build an in-memory directory tree from index entries
 * 
 * @param {Object} index 
 * @returns {Object}
 * @example 
 * - `src/index.js`
 * - `src/utils/helpers.js`
 * 
 * becomes:
 * ```
 * {
 *   src: {
 *      index.js: {...},
 *      utils: {
 *          helpers.js: {...}
 *      }
 *   }
 * }
 * 
 */
function buildDirectoryTree(index) {
    const root = {}

    const paths = getIndexStoredPaths(index)

    for (const filePath of paths) {
        const entry = getIndexEntry(index, filePath)

        const segments = filePath.split(/[\\/]/)

        let current = root

        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i]

            if (!current[segment]) {
                current[segment] = {}
            }

            current = current[segment]
        }

        const filename = segments[segments.length - 1]

        current[filename] = {
            hash: entry.hash,
            mode: entry.mode
        }
    }

    return root 
}

/**
 * Recursively write tree objects and returns a tree hash
 * 
 * @param {Repository} repo 
 * @param {Object} node 
 * @returns {string}
 */
function writeDirectoryTree(repo, node) {
    const entries = []

    const names = Object.keys(node).sort()

    for (const name of names) {
        const value = node[name]

        const isDirectory = typeof value === 'object' && !('hash' in values)

        if (isDirectory) {
            const subtreeHash = writeDirectoryTree(repo, value) 
            entries.push({
                mode: FILE_MODES.DIRECTORY,
                name,
                hash: subtreeHash
            })

            continue
        }

        entries.push({
            mode: value.mode,
            name,
            hash: value.hash
        })
    }

    return writeDirectoryTree(repo, entries)
} 

/**
 * Create tree object(s) from current index
 * 
 * Returns root tree hash
 * @param {Repository} repo 
 * @returns {string}
 */
function writeTree(repo) {
    const index = readIndex(repo)

    const paths = getIndexStoredPaths(index)

    if (paths.length === 0) {
        throw new ValidationError('Cannot create tree from empty index')
    }

    const directoryTree = buildDirectoryTree(index)

    return writeDirectoryTree(index, directoryTree)
}

function writeTreeFromIndex(repo, index) {
    const directoryTree = buildDirectoryTree(index)

    return writeDirectoryTree(repo, directoryTree)
}

module.exports = {
    buildDirectoryTree,
    writeDirectoryTree,
    writeTree
}