const Repository = require('../core/repository/repository')
const logger = require('../utils/logger')

/**
 * Creates the .mygit directory structure and initial HEAD file in the target directory.
 * If the repository already exists, it reports that and leaves the directory unchanged.
 * @param {string} [targetDir=process.cwd()] - Directory where the .mygit repository should be created
 * @throws {Error} If repository initialization fails
 */
function initCommand(targetDir=process.cwd()) {
    try {
        const repo = Repository.init(targetDir)

        console.log(`Initialized empty mygit repository in ${repo.mygitDir}`)
        logger.info(`Initialized empty mygit repository in ${repo.mygitDir}`)

    } catch (error) {
        console.error(error.message)
        logger.error(error.stack)
    }
}

module.exports = initCommand
