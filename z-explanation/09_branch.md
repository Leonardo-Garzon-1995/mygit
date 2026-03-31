# The `branch` command
The `branch` command is used to manage branches in Git. A branch in Git is a pointer to a specific commit, allowing you to work on different features or versions of your project without affecting the main codebase.

It will let you create, list, rename, and delete branches. When you create a new branch, it points to the same commit as the current branch. You can then switch to the new branch and make changes without affecting the original branch.

- `git branch` - Lists all branches in the repository. The current branch will be highlighted with an asterisk (*).
- `git branch <name>` - Creates a new branch pointing to current commit. 
- `git branch [-d, --delete] <name>` - Deletes the specified branch. Note that you cannot delete a branch that you are currently on.
- `git branch [-v, --verbose]` - Lists branches with their latest commit info. 

## Implementation explained
The `branch` command is implemented in the `branch` function in the `src/commands/branch.js` file. The function takes an array of arguments as input and performs the appropriate action based on the first argument.

For this implementation we are also importing some helper functions from other files.
    - `getCurrentBranch()` - Returns the name of the current branch, or null if HEAD is not a symbolic reference.
    - `getCurrentCommit()` - Returns the hash of the current commit, or null if HEAD is not a symbolic reference.

There are several functions in this file.
    - `getAllBranches()` - Lists all branches in refs/heads.
    - `getCommitMessage()` - Returns the commit message for the given commit hash.
    - `listBranches()` - Lists all branches in the repository.
    - `createBranch()` - Creates a new branch pointing to current commit.
    - `deleteBranch()` - Deletes the specified branch.
    - `branch()` - The main function that handles the `branch` command.

## Implementation of each function

> The imports:
```javascript
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const colors = require('../utils/colors')
const getCurrentBranch = require('../helpers/getCurrentBranch')
const getCurrentCommit = require('../helpers/getCurrentCommit')
```

- The `getAllBranches()` function is a helper function responsible for:
    - Reading the contents of the .mygit/refs/heads directory.
    - Parsing each file in the directory to extract the branch name and commit hash.
    - Returning an array of objects containing the branch name and commit hash.
```javascript
function getAllBranches() {
    const mygitDir = path.join(process.cwd(), '.mygit')
    const headsDir = path.join(mygitDir, 'refs', 'heads')

    if (!fs.existsSync(headsDir)) {
        return []
    }

    const branches = []

    const files = fs.readdirSync(headsDir)

    for (const file of files) {
        const branchPath = path.join(headsDir, file)
        const stats = fs.statSync(branchPath)

        if (stats.isFile()) {
            const commitHash = fs.readFileSync(branchPath, 'uft8').trim()
            branches.push({name: file, commit: commitHash})
        }
    }

    return branches
}
```

- The `getCommitMessage()` function is a helper function responsible for:
    - Reading the commit object (hash)from the .mygit/objects directory.
    - Parsing the commit object to extract the commit message.
    - Returning the commit message.
```javascript
function getCommitMessage(commitHash) {
    try {
        const mygitDir = path.join(process.cwd(), '.mygit')
        const dir = commitHash.slice(0, 2)
        const file = commitHash.slice(2)
        const objPath = path.join(mygitDir, 'objects', dir, file)

        if (!fs.existsSync(objPath)) {
            return ''
        }

        const compressed = fs.readFileSync(objPath)
        const decompressed = zlib.inflateSync(compressed)

        const nullIndex = decompressed.indexOf(0)
        const content = decompressed.slice(nullIndex + 1).toString()

        // Extract message

        const lines = content.split('\n')
        let messageStart = 

        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "") {
                messageStart = i + 1
                break
            }
        }

        return lines[messageStart] || ""

    } catch (error) {
        return ''
    }
}
```

- The `listBranches()` function is a helper function responsible for:
    - Getting the existing branches objects. It uses the `getAllBranches()` function.
    - Getting the current branch name. It uses the `getCurrentBranch()` function.
    - Formatting and displaying the branches information.
```javascript
function listBranches(verbose= false) {
    const branches = getAllBranches()

    if (branches.length === 0) {
        console.log("No branches found")
        return
    }

    const currentBranch = getCurrentBranch()

    for (const branch of branches) {
        const isCurrent = branch.name === currentBranch
        const marker = isCurrent ? '*' : ' '
        const name = isCurrent ? 
        colors.green + branch.name + colors.reset : branch.name

        if (verbose) {
            const shortHash =  branch.commit.substring(0, 7)
            const message = getCommitMessage(branch.commit)
            console.log(`${marker} ${name.padEnd(20)} ${shortHash} ${message}`)
        } else {
            console.log(`${marker} ${name}`)
        }
    }

}
```

- The `createBranch()` function is a helper function responsible for:
    - Creating a new branch file in the .mygit/refs/heads directory.
    - Writing the commit hash to the new branch file.
```javascript
function createBranch(branchName) {
    const mygitDir =  path.join(process.cwd(), '.mygit')
    const branchPath = path.join(mygitDir, 'refs', 'heads', branchName)

    // Check if branch already exists
    if (fs.existsSync(branchPath)) {
        console.error(`fatal: A branch named ${branchName} already exists.`)
        process.exit(1)
    }

    // Validate the Branch Name (basic validation)
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
    fs.mkdirSync(branchDir. {recursive: true})
    fs.writeFileSync(branchPath, currentCommit + '\n')

    console.log(`Created branch ${branchName}`)
}
```
- The `deleteBranch()` function is a helper function responsible for:
    - Deleting the branch file in the .mygit/refs/heads directory.
    - If the branch is checked out, it cannot be deleted.
```javascript
function deleteBranch(branchName, force=false) {
    const mygitDir = path.join(process.cwd(), '.mygit')
    const branchPath = path.join(mygitDir, 'refs', 'heads', branchName)

    if (!fs.existsSync(branchPath)) {
        console.error(`error: branch '${branchName}' not found`)
        process.exit(1)
    }

    // If branch is currentBranch (it is in use), then it cannot be deleted
    const currentBranch = getCurrentBranch()

    if (currentBranch === branchName) {
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
```

- The `branch()` function is the main function that handles the `branch` command. It takes an array of arguments as input and performs the appropriate action based on the first argument.
```javascript
function branch(args[]) {
    // 1. Check if you are in a mygit repository
    const mygitDir = path.join(process.cwd(), '.mygit')
    if (!fs.existsSync(mygitDir)) {
        console.error('fatal: not a mygit repository')
        process.exit(1)
    }

    // 2. Parse arguments

    if (args.length === 0) {
        listBranches(false)
    } else if (args[0] === '-v' || args[0] === '--verbose') {
        listBranches(true)
    } else if (args[0] === '-d' || args[0] === '--delete') {
        if (args.length < 2) {
            console.error('error: branch name required for deletion')
            console.error('Usage: mygit branch -d <branch-name>')
            process.exit(1)
        }

        deleteBranch(args[1], true)
    } else if (args[0].startsWith('-')) {
        console.error(`error: unknown option '${args[0]}'`)
        process.exit(1)
    } else {
        // Asume it's a branch name to create
        createBranch(args[0])
    }
}

module.exports = branch
```