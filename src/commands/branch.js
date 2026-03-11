const fs =  require('fs')
const path = require('path')
const zlib = require('zlib')

function getCurrentBranch() {
    const gitDir = path.join(process.cwd(), '.mygit')
    const headPath = path.join(gitDir, 'HEAD')
    if (!fs.existsSync(headPath)) {
        return null
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim()

    if (headContent.startsWith('ref: ')) {
        const branchRef = headContent.substring(5)

        return branchRef.replace('refs/heads/', '')
    }

    return null
}

function getCurrentCommit() {
    // Get the hash of the current commit 

    const gitDir = path.join(process.cwd(), '.mygit')
    const headPath = path.join(gitDir, 'HEAD')

    if (fs.existsSync(headPath)) {
        return null
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim()

    if (headContent.startsWith('ref: ')) {
        // Read the branch file to get commit hash
        const branchRef = headContent.substring(5);
        const branchPath = path.join(gitDir, branchRef);
        
        if (!fs.existsSync(branchPath)) {
            return null; // Branch exists but has no commits yet
        }

        return fs.readFileSync(branchPath, 'utf8').trim()
    }

    return headContent
}

function getAllBranches() {
    // List all branches in refs/heads

    const mygitDir = path.join(process.cwd(), '.mygit')
    const headsDir = path.join(mygitDir, 'refs', 'heads')

    if (!fs.existsSync(headsDir)) {
        return []
    }

    const branches = [] 

    // Read all files in refs/heads/
    // (We're not handling nested branch directories for now)
    const files = fs.readdirSync(headsDir)

    for (const file of files) {
        const branchPath = path.join(headsDir, file)
        const stats = fs.statSync(branchPath)

        if (stats.isFile()) {
            const commitHash = fs.readFileSync(branchPath, 'utf-8').trim()
            branches.push({name: file, commit: commitHash})
        }
    }

    return branches
}

function getCommitMessage(commitHash) {
    // Read a commit's message
}