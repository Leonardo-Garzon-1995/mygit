const fs =  require('fs')
const path = require('path')
const zlib = require('zlib')

const colors = require('../utils/colors')
const getCurrentBranch = require('../helpers/getCurrentBranch')
const getCurrentCommit = require('../helpers/getCurrentCommit')

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

    try {
        const gitDir = path.join(process.cwd(), '.mygit')
        const dir = commitHash.slice(0, 2)
        const file = commitHash.slice(2)
        const objPath = path.join(gitDir, 'objects', dir, file)

        if (!fs.existsSync(objPath)) {
            return ""
        }

        const compressed = fs.readFileSync(objPath)
        const decompressed = zlib.inflateSync(compressed)

        const nullIndex = decompressed.indexOf(0)
        const content = decompressed.slice(nullIndex + 1).toString()

        // Extract message, everything after the blank line

        const lines = content.split('\n')
        let messageStart = 0

        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "") {
                messageStart = i + 1
                break;
            }
        }

        // Get the first line of the message

        return lines[messageStart] || ""

    } catch (error) {
        return ""
    }
}

function listBranches(verbose=false) {
    const branches = getAllBranches() // Returns an array with all existing branches objects

    if (branches.length === 0) {
        console.log('No branches found')
        return
    }

    const currentBranch = getCurrentBranch()

    for (const branch of branches) {
        const isCurrent = branch.name === currentBranch
        const marker = isCurrent ? "*" : " "
        const name = isCurrent ? colors.green + branch.name + colors.reset : branch.name

        if (verbose) {
            // Show commit hash and message
            const shortHash = branch.commit.substring(0, 7)
            const message = getCommitMessage(branch.commit)
            console.log(`${marker} ${name.padEnd(20)} ${shortHash} ${message}`)
        } else {
            // Just show the branch name
            console.log(`${marker} ${name}`)
        }
    }
}

function createBranch(branchName) {
    const mygitDir = path.join(process.cwd(), ".mygit")
    const branchPath = path.join(mygitDir, 'refs', 'heads', branchName)

    // Check if branch already exist
    if (fs.existsSync(branchPath)) {
        console.error(`fatal: A branch named ${branchName} already exist`)
        process.exit(1)
    }

    // Validate branch name (basic validation)
    if (!/^[a-zA-Z0-9_\-\/]+$/.test(branchName)) {
        console.error(`fatal: '${branchName}' is not a valid branch name`)
        process.exit(1)
    }
    if (branchName.startsWith('-')) {
        console.error(`fatal: '${branchName}' is not a valid branch name.`);
        process.exit(1);
    }

    // Get current commit hash to point to the new branch
    const currentCommit = getCurrentCommit()

    if (!currentCommit) {
        console.error('fatal: Not a valid object name: \'HEAD\'.');
        console.error('No commits yet - create a commit first');
        process.exit(1);
    }

    // Create the branch file pointing to the current commit
    // Ensure the directory exists (for nested branches like feature/login)

    const branchDir = path.dirname(branchPath)
    fs.mkdirSync(branchDir, {recursive: true})
    fs.writeFileSync(branchPath, currentCommit + '\n')

    console.log(`Created branch ${branchName}`)
}

function deleteBranch(branchName, force=false) {
    const mygitDir = path.join(process.cwd(), '.mygit')
    const branchPath = path.join(mygitDir, 'refs', 'heads', branchName)

    // Check if branch exist
    if (!fs.existsSync(branchPath)) {
        console.error(`error: branch '${branchName}' not found`)
        process.exit(1)
    }

    // If branch is currentBranch (it is un use), then it cannot be deleted
    const currentBranch = getCurrentBranch()
    if (branchName === currentBranch) {
        console.error(`error: Cannot delete branch '${branchName}' checked out at '${process.cwd()}'`)
        process.exit(1)
    }

    // DELETE THE BRANCH FILE
    try {
        fs.unlinkSync(branchPath)
        console.log(`Deleted branch ${branchName}.`)
    } catch (error) {
        console.error(error.message)
    }
}

// MAIN FUNCTION TO HANDLE THE BRANCH COMMAND

/**
 * Lists branches, creates a branch at the current commit, or deletes an existing branch.
 * Supports verbose listing and delete flags while protecting the checked-out branch from deletion.
 * @param {string[]} [args=[]] - Branch options, flags, or the branch name to create
 * @throws {Error} If the repository is missing, an option is invalid, or branch creation/deletion cannot proceed
 */
function branch(args=[]) {
    // 1. Check if we're in a mygit repository
    const mygitDir = path.join(process.cwd(), '.mygit')
    if (!fs.existsSync(mygitDir)) {
        console.error('fatal: not a mygit repository')
        process.exit(1)
    }

    // 2. Parse arguments
    if (args.length === 0) {
        // No arguments, just list branches
        listBranches(false)
    } else if (args[0] === '-v' || args[0] === '--verbose') {
        // List branches with verbose info
        listBranches(true)
    } else if (args[0] === '-d' || args[0] === '--delete') {
        if (args.length < 2) {
            console.error('error: branch name required for deletion')
            console.error('Usage: mygit branch -d <branch-name>')
            process.exit(1)
        }
        deleteBranch(args[1], false)
    } else if (args[0] === '-D') {
        // Force delete branch (not implemented yet, behaves same as -d for now)
        if (args.length < 2) {
            console.error('error: branch name required for deletion')
            console.error('Usage: mygit branch -D <branch-name>')
            process.exit(1)
        }
        deleteBranch(args[1], true)
    } else if (args[0].startsWith('-')) {
        console.error(`error: unknown option '${args[0]}'`)
        process.exit(1)
    } else {
        // Assume it's a branch name to create
        createBranch(args[0])
    }
}

module.exports = branch
