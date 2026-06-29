const { readIndex } = require('../core/index')
const logger = require('../utils/logger')

const Repository = require('../core/repository/repository')

/**
 * Prints the staged file paths recorded in the index, sorted alphabetically.
 * 
 * Returns silently when the index is empty or has no entries.
 */
function lsFiles() {
    try {
        const repo = Repository.find()
        repo.ensure()

        const index = readIndex(repo)
        if (!index.entries || Object.keys(index.entries).length === 0) {
            return
        }

        const sorted = Object.keys(index.entries).sort()

        for (const filePath of sorted) {
            console.log(filePath)
        }
    } catch (error) {
        console.error(error.message)
        logger.error(error.stack)
    }
}

module.exports = lsFiles
