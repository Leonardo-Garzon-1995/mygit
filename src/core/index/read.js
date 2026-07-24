const fs = require('../../utils/filesystem')
const { IndexFormatError } = require('../../errors')
const { validateIndex } = require('./entries')

/**
 * Create an empty index structure
 * 
 * @returns {Object}
 */
function createEmptyIndex() {
    return {
        version: 1,
        entries: {}
    }
}

/**
 * Reads repository index and object index with all the files in it.
 * 
 * Returns an empty index if the file does not exist
 * 
 * @param {Repository} repo Repository object
 * @returns {Object}
 */
function readIndex(repo) {
    const indexPath = repo.paths.index

    if (!fs.exists(indexPath)) {
        return createEmptyIndex()
    }

    try {
        const content = fs.readFile(indexPath)
        const index = JSON.parse(content)

        validateIndex(index)

        return index
    } catch (error) {
        throw error instanceof IndexFormatError ?  error : new IndexFormatError(`Failed to read index: ${error.message}`)
    }
}

module.exports = {
    readIndex,
    createEmptyIndex
}