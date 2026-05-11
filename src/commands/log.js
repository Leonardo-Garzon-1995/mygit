/*
1. Reads HEAD - finds the current branch
2. Reads the branch reference - gets the hash of the latest commit
3. Reads the commit object - gets its contents (tree, parent, author, message)
4. Follows the parent chain - reads the parent commit, then its parent and so on
5. Displays commits - in reverse chronological order (newest first) */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const colors  = require('../utils/colors')
const readObject = require('../helpers/readObject')
const parseCommit = require('../helpers/parseCommit')
const { getRepoPath, ensureRepo } = require('../core/repository')


function formatCommit(hash, commit, isShort=false) {
    // FORMAT A COMMIT FOR DISPLAY

    if (isShort) {
        // Short format: just hash and message (like git log --oneline)
        return `${colors.yellow}${hash.slice(0, 7)}${colors.reset} ${commit.message.split('\n')[0]}`
    }

    // Full format: hash, author, date, message (like git log)

    let output = `${colors.yellow}commit ${hash}${colors.reset}\n`

    // Parse author info for nice display
    if (commit.author) {
        const authorMatch = commit.author.match(/^(.+?) <(.+?)> (\d+) ([+-]\d{4})$/) // name <email> timestamp timezone
        if (authorMatch) {
            const [, name, email, timestamp, timezone] = authorMatch

            // Convert unix timestamp to human-readable date
            const date = new Date(parseInt(timestamp) * 1000)
            output += `Author: ${name} <${email}>\n`
            output += `Date: ${date.toDateString()} ${date.toTimeString().split(' ')[0]} ${timezone}\n`
        } else {
            output += `Author: ${commit.author}\n`
        }
    }

    output += '\n' // Blank line before message

    // Indent the commit message for better readability
    const messageLines = commit.message.split('\n')
    for (const line of messageLines) {
        output += `    ${line}\n`
    }

    // Return the formatted commit string
    return output
}

/**
 * Walks the current branch history from HEAD and prints each reachable commit.
 * Supports an oneline display mode for compact commit output.
 * @param {{oneline?: boolean}} [options={}] - Display options for the log output
 * @throws {Error} If the repository or HEAD reference is invalid
 */
function log(options = {}) {
    // 1. Check if we're in a mygit repository
    const mygitDir = getRepoPath()
    ensureRepo()

    // 2. Read HEAD to find the current branch
    const headPath = path.join(mygitDir, 'HEAD')
    if (!fs.existsSync(headPath)) {
        console.error('Error: HEAD file not found')
        process.exit(1)
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim()
    if (!headContent.startsWith('ref: ')) {
        console.error('Error: HEAD is not a symbolic reference')
        process.exit(1)
    }

    const branchRef = headContent.substring(5) // Remove 'ref: ' prefix

    // 3. Read the branch reference to get the latest commit hash
    const branchPath = path.join(mygitDir, branchRef)
    if (!fs.existsSync(branchPath)) {
        console.log('No commits yet')
        return
    }

    let currentHash = fs.readFileSync(branchPath, 'utf-8').trim()

    // 4. Follow the commit chain and display each commit
    const commits = []
    // Keep track of visited commits to avoid infinite loops in case of corrupted history
    const visited = new Set()


    while (currentHash && !visited.has(currentHash)) {
        visited.add(currentHash)

        try {
            // Read the commit object
            const {header, content} = readObject(currentHash)

            // Verify it is an actual commit object
            if (!header.toString().startsWith('commit ')) {
                console.error(`Error: Object ${currentHash} is not a commit`)
                break
            }

            // Parse the commit content
            const commit = parseCommit(content)

            // Store in commits array for later display
            commits.push({hash: currentHash, commit})

            // Move to the parent commit (if it exists)
            if (commit.parents.length > 0) {
                currentHash = commit.parents[0] // Follow the first parent for simplicity (ignoring merge commits for now)
            } else {
                currentHash = null // No more parents, we've reached the end of the history
            }
        } catch (error) {
            console.error(`Error reading commit ${currentHash}: ${error.message}`)
            break
        }
    }

    // 5. Display commits in reverse chronological order (newest first)

    if (commits.length === 0) {
        console.log('No commits yet')
        return
    }

    const isShort = options.oneline

    for (let i = 0; i < commits.length; i++) {
        const {hash, commit} = commits[i]
        const formatted = formatCommit(hash, commit, isShort)
        console.log(formatted)

        // Add blank line between commits (except for oneline commits or last commit)
        if (!isShort && i < commits.length - 1) {
            console.log('')
        }
    }

}

module.exports = log
