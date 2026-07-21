const Repository = require('../core/repository/repository')
const Output = require('../cli/output')
const logger = require('../utils/logger')

/**
 * Creates the .mygit directory structure and initial HEAD file in the target directory.
 * If the repository already exists, it reports that and leaves the directory unchanged.
 * @param {string[]} args - Directory where the .mygit repository should be created
 * @param {Object} options - Additional options for the command
 * @throws {Error} If repository initialization fails
 */
module.exports = function init(args = [], options = {}) {
    try {
        const targetDir = args[0] || process.cwd()

        const repo = Repository.init(targetDir)

        Output.success(`Initialized empty mygit repository in ${repo.mygitDir}`)
        logger.info(`Initialized empty mygit repository in ${repo.mygitDir}`)
        
    } catch (error) {
        Output.error(error.message)
    }
}
