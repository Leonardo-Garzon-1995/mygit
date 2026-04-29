const path = require('path')

const readObject = require('./readObject')
const parseTree =  require('./parseTree')
const { getMygitignorePatterns, isIgnored } = require('../utils/mygitignore')

/**
 * Recursively walks a tree object and returns a flat map of all blob paths.
 *
 * A commit points to a root tree. That tree may contain blobs (files)
 * or nested trees (subdirectories). We recurse into trees, building
 * the full path as we go.
 *
 * @param {string} treeHash - hash of the root tree object
 * @param {string} prefix   - accumulated path prefix (used in recursion)
 * @returns {Map<string, string>} - Map<filepath, blobHash>
 */
function getTreeFiles(treeHash, prefix='', mygitignorePatterns=null) {
    const { content, type } = readObject(treeHash)

    if(type !== 'tree') {
        throw new Error(`Expected tree object, got ${type} (${treeHash})`)
    }

    const entries = parseTree(content)
    const files = new Map()

    for (const entry of entries) {
        const fullPath = prefix ? path.join(prefix, entry.name) : entry.name

        // Skip ignored files
        if (mygitignorePatterns && isIgnored(fullPath, mygitignorePatterns)) {
            continue
        }

        if (entry.type === 'blob') {
            files.set(fullPath, {hash: entry.hash, mode: entry.mode})
        } else if (entry.type === 'tree') {
            // Recurse into subdirectory, merge results into files
            const nested = getTreeFiles(entry.hash, fullPath, mygitignorePatterns)
            for (const [path, info] of nested) {
                files.set(path, info)
            }
        }
    }

    return files
}

module.exports = getTreeFiles