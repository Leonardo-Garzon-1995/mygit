const path = require('../utils/paths')
const { writeBlobObject, } = require('../core/objects/blobs')
const getFileMode  = require('../core/objects/modes')
const { ValidationError } = require('../errors')
const {
    readIndex,
    writeIndex,
    createIndexEntry,
    setIndexEntry,
    removeIndexEntry,
    hasIndexEntry,
    getIndexStoredPaths
} = require('../core/index/index')
const Repository = require('../core/repository/repository')

/**
 * Stage a file
 * 
 * Creates a blob object and updates
 * the repository index
 * 
 * @param {Repository} repo 
 * @param {string} filePath 
 * @returns {string} blob hash
 */
function stageFile(repo, filePath) {
    if (!filePath) {
        throw new ValidationError('File path is required')
    }

    const hash = writeBlobObject(repo, filePath)

    const mode = getFileMode(filePath)

    const relativePath = path.relative(repo.workTree, filePath)

    const index = readIndex(repo)

    const entry = createIndexEntry(hash, mode)

    setIndexEntry(index, relativePath, entry)

    writeIndex(repo, index)

    return hash
}

/**
 * Stage multiple files
 * 
 * @param {Repository} repo 
 * @param {string[]} filePaths 
 * @returns {string[]}
 */
function stageFiles(repo, filePaths=[]) {
    const hashes = []

    for (const filePath of filePaths) {
        hashes.push(stageFile(repo, filePath))
    }

    return hashes
}

/**
 * Remove file form index
 * 
 * @param {Repository} repo 
 * @param {string} filePath 
 */
function unstageFile(repo, filePath) {
    const relativePath = path.relative(repo.workTree, filePath)

    const index = readIndex(repo)

    removeIndexEntry(index, relativePath)

    writeIndex(repo, index)
}

/**
 * Check weather a file
 * exists in the index
 * 
 * @param {Repository} repo 
 * @param {string} filePath 
 * @returns {boolean}
 */
function isStaged(repo, filePath) {
    const relativePath = path.relative(repo.workTree, filePath)

    const index = readIndex(repo)

    return hasIndexEntry(index, relativePath)
}

/**
 * Get all staged paths
 * 
 * @param {Repository} repo 
 * @returns {string[]}
 */
function listStagedFiles(repo) {
    const index = readIndex(repo)

    return getIndexStoredPaths(index)
}

/* 
TO IMPLEMENT

- stageDirectory
- stagePattern
- stageAll,
- unstageAll
- compareIndexToWorkingTree
*/

module.exports = {
    stageFile,
    stageFiles,
    unstageFile,
    isStaged,
    listStagedFiles
}

