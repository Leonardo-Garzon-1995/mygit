const fs = require('fs')
const path = require('path')

/**
 * Returns the name of the current branch, or null if HEAD is not a symbolic reference.
 * @returns {string|null} The name of the current branch, or null if HEAD is not a symbolic reference.
 */
function getCurrentBranch() {
    const mygitDir = path.join(process.cwd(), '.mygit');
    const headPath = path.join(mygitDir, 'HEAD');
    
    if (!fs.existsSync(headPath)) {
        return null;
    }
    
    const headContent = fs.readFileSync(headPath, 'utf-8').trim();
    
    if (headContent.startsWith('ref: ')) {
        const branchRef = headContent.substring(5);
        return branchRef.replace('refs/heads/', '');
    }
    
    return null;
}

module.exports = getCurrentBranch