const fs = require('fs')
const path = require('path')

function getRepoPath() {
    return path.join(process.cwd(), '.mygit')
}

function repoExists() {
    return fs.existsSync(getRepoPath())
}

/**
 * Ensures that the current directory is a mygit repository. If not, it prints an error message and exits the process with code 1.
 * @returns {void}
 */
function ensureRepo() {
    if (!repoExists()) {
        console.error('fatal: not a mygit repository')
        process.exit(1)
    }
}

module.exports = {
    getRepoPath,
    repoExists,
    ensureRepo
}