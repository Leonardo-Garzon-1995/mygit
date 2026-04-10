const fs = require('fs') 

/**
 * Returns the mode of a file given its path.
 * The mode is a string that represents the file type and its executable status.
 * If the file does not exist, an empty string is returned.
 * @param {string} filePath - the path of the file
 * @returns {string} the mode of the file
 */
function getFileMode(filePath) {

    if (!fs.existsSync(filePath)) return "" 

    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
        return '40000'
    }

    if (stats.isSymbolicLink()) {
        return '120000'
    }

    const isExecutable = (stats.mode & 0o111) !== 0
    return isExecutable ? '100755' : '100644'
}

module.exports = getFileMode