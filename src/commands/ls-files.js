const { readIndex } = require('../core/index/index')
const Output = require('../cli/output')
const logger = require('../utils/logger')

const Repository = require('../core/repository/repository')

/**
 * Prints the staged file paths recorded in the index, sorted alphabetically.
 * 
 * Returns silently when the index is empty or has no entries.
 */
module.exports = function lsFiles() {
    try {
        const repo = Repository.find()
        repo.ensure()

        const index = readIndex(repo)
        if (!index.entries || Object.keys(index.entries).length === 0) {
            return
        }

        const sorted = Object.keys(index.entries).sort()

        for (const filePath of sorted) {
            Output.info(filePath)
        }
    } catch (error) {
        throw new Error(error)
    }
}

