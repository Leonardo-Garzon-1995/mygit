const fs = require('fs')
const path = require('path')

const commitTree = require('./commit-tree')
const hashObjectContent = require('../helpers/hashObjectContent')
const { getRepoPath, ensureRepo } = require('../core/repository')
const { readIndex } = require('../core/index')

function writeTreeFromIndex(entries, prefix='') {
    // Create a tree from index entries 
    // Group entries by directory and create tree objecs recursively

    // Filter entries for 'this level'
    const thisLevel = {}
    const subDirs = {}

    for (const [filePath, fileInfo] of Object.entries(entries)) {
        // Skip if it does not match prefix 
        if (prefix && !filePath.startsWith(prefix)) {
            continue
        }

        // Get relative path from this level
        const relativePath = prefix ? filePath.substring(prefix.length) : filePath

        // Remove leading slashes if present 
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath
        if (!cleanPath) continue

        const parts = cleanPath.split('/')

        if (parts.length === 1) {
            thisLevel[parts[0]] = fileInfo
        } else {
            // File in subdirectory
            const dirName = parts[0]
            if (!subDirs[dirName]) {
                subDirs[dirName] = {}
            }

            const subPath = parts.slice(1).join('/')
            subDirs[dirName][subPath] = fileInfo
        }
    }

    // Build tree entries 
    const treeEntries = []

    // Add subdirectories (trees)
    for (const [dirName, dirEntries] of Object.entries(subDirs)) {
        const treeHash = writeTreeFromIndex(
            Object.fromEntries(Object.entries(dirEntries).map(([p, info]) => [p, info])), ""
        )

        const entry = Buffer.concat([
            Buffer.from(`40000 ${dirName}\0`),
            Buffer.from(treeHash, 'hex')
        ])

        treeEntries.push({name: dirName, entry})
    }

    // Add files (blobs)
    for (const [fileName, fileInfo] of Object.entries(thisLevel)) {
        const entry = Buffer.concat([
            Buffer.from(`${fileInfo.mode} ${fileName}\0`),
            Buffer.from(fileInfo.hash, 'hex')
        ]);
    
        treeEntries.push({ name: fileName, entry });
    }

    // Sort entries (real git sorts them too )
    treeEntries.sort((a, b) => a.name.localeCompare(b.name))

    // concatenate all entries
    const treeContent = Buffer.concat(treeEntries.map(e => e.entry))

    // Hash and store tree

    const treeHash = hashObjectContent(treeContent, 'tree')

    return treeHash
}



/**
 * Creates a commit from the current index and advances the current branch reference.
 * Uses the existing branch tip as the parent commit when one exists.
 * @param {string} message - Commit message to include in the new commit
 * @returns {string} Hash of the created commit object
 * @throws {Error} If the message, repository, index, HEAD, or parent commit reference is invalid
 */
function commit(message) {
    // 1. Validate Messalge
    if (!message || !message.trim()) {
    console.error('Error: Commit message cannot be empty.');
    process.exit(1);
}

    // Check if you're in a mygit repository
    const mygitDir = getRepoPath()

    ensureRepo()

    //  Read index 
    const index = readIndex()

    if (Object.keys(index.entries).length === 0) {
        console.error('nothing to commit (use "mygit add" to stage files)');
        process.exit(1);
    }

    // create tree from index
    const treeHash = writeTreeFromIndex(index.entries)

    // 3. Read HEAD to find current branch
    // HEAD contains something like: "ref: refs/heads/main"
    // We need to extract "refs/heads/main" from this
    const headPath = path.join(mygitDir, "HEAD")
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

    const branchPath = path.join(mygitDir, branchRef)
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
