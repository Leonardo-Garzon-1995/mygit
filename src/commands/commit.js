const fs = require('fs')
const path = require('path')
const writeTree = require('./write-tree')
const commitTree = require('./commit-tree')


function commit(message) {
    // 1. Validate Messalge
    if(!message) {
        console.error('Error: commit message required')
        console.error('Usage: mygit commit -m <message>')
        process.exit(1)
    }

    // Check if you're in a mygit repository
    const gitDir = path.join(process.cwd(), '.mygit')

    if (!fs.existsSync(gitDir)) {
        console.error('fatal: not a mygit repository');
        console.error('Run "mygit init" first');
        process.exit(1);
    }

    // 3. Read HEAD to find current branch
    // HEAD contains something like: "ref: refs/heads/main"
    // We need to extract "refs/heads/main" from this
    const headPath = path.join(gitDir, "HEAD")
    const headContent =fs.readFileSync(headPath, 'utf-8').trim()

    // Check if HEAD is a symbolic reference (pointing to a branch)
    if (!headContent.startsWith('ref: ')) {
        console.error('Error: HEAD is in detached state')
        process.exit(1)
    }

    // extract the branch reference
    const branchRef = headContent.substring(5) // Remove 'ref: ' 

    // 4. Get the parent commit (if branch exists)
    // The branch file contains the hash of the last commit on that branch.
    // If this is the first commit, the branch file won't exist yet.

    const branchPath = path.join(gitDir, branchRef)
    let parentCommit = null 

    if(fs.existsSync(branchPath)) {
        // Branch exist, read the parent commit hash
        parentCommit = fs.readFileSync(branchPath, 'utf-8').trim()

        // Vlidate it looks like a hash (40 Hex characters)
        if (!/^[0-9a-f]{40}$/.test(parentCommit))  {
            console.error(`Error: Invalid commit hash in ${branchRef}`)
            process.exit(1)
        }
    } else {
        // Firs Commit in this branch - no parent
        console.log(`Creating initial commit on branch ${branchRef.split('/').pop()}`)
    }

    //  5. Create tree snapshot
    const treeHash = writeTree()

    // 6. Create commit object
    const commitHash = commitTree(treeHash, message, parentCommit)

    // 7. Update branch reference
    // Write the new commit hash to the branch file.
    // This "moves the branch forward" to point to our new commit.
    //
    // If the branch file doesn't exist yet (first commit), we create it.

    // ensure the refs/heads directory exist
    const refsHeadsDir = path.dirname(branchPath)
    fs.mkdirSync(refsHeadsDir, {recursive: true})

    // write the commit hash to the branch file
    fs.writeFileSync(branchPath, commitHash + '\n')

    // 8. Feedback message for user

    const branchName = branchRef.split('/').pop() //  "refs/heads/main" → "main"

    if (parentCommit) {
        console.log(`[${branchName} ${commitHash.substring(0, 7)}] ${message}`);
    } else {
        console.log(`[${branchName} (root-commit) ${commitHash.substring(0, 7)}] ${message}`);
    }

    return commitHash
}

module.exports = commit