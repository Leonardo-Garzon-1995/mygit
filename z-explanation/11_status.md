# The `status` command

- It will show:
    - **Modified files**: files that exist in the current commit but have different content now.
    - **New files**: files in the working directory that aren't in the current commit.
    - **Deleted files**: files in the current commit that no longer exist in the working directory.

- Get the current commit from HEAD
- Read that commit's tree to see what files should exist
- Scan the working directory to see what files actually exist
- compare the two and categorize the diferences

## implementation explained
The `status` command is implemented in the `src/commands/status.js` file. We are importing some helper functions for this implementation. 

- `colors` - An object with diferent ansi scape colors for better formatting
- The `readObject()` function from `src/helpers/readObject.js`.
- The `parseTree()` function from `src/helpers/parseTree.js`.
- The `getCurrentBranch()` function from `src/helpers/getCurrentBranch.js`.
- The `getCurrentCommit()` function form `src/helpers/getCurrentCommit.js`.

There are other functions in this file:
- The `readTree()` reads a tree object and returns an object with the file paths as keys and their corresponding blob hashes as values.
- The `getWorkingDirectoryFiles()` scans recursively all the folders and subfolders in the working directory and returns an object with the file paths as keys and their content as values.
- The `status()` function is the main function that implements the `status` command. It gets the current commit, reads its tree, gets the files in the working directory, and compares them to categorize the modified, new, and deleted files. Finally, it prints the results to the console with appropriate formatting.

## Implementation of each function

- The imports:
```javaScript
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const colors = require('../utils/colors')
const readObject = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')
const getCurrentBranch = require('../helpers/getCurrentBranch')
const getCurrentCommit = require('../helpers/getCurrentCommit')
```
- The `readTree` function that takes a tree hash as its first argument and an optional prefix as a second argument and it is responsible for:
    - Read the contents of the object with the tree hash by using the `readObject` function and getting the content of such object.
    - Parse the content of the object by using the `parseTree` function and returning all of the entries in that object
    - Loop through all the entries  recursively and create and object with the path (as a key) and the blob hash (as a vlaue) of each file in the tree. 
```javaScript
function readTree(treeHash, prefix='') {
    const { content } = readObject(treeHash)
    const entries = parseTree(content)

    const files = {}

    for (const entry of entries) {
        const fullPath = prefix ? path.join(prefix, entry.name) : entry.name

        if (entry.mode === "40000") {
            const subfiles = readTree(entry.hash, fullPath)
            Object.assign(files, subfiles)
        } else {
            files[fullPath] = entry.hash
        }
    }
    return files
}
```
- The `getWorkingDirectoryFiles()` is a helper function that takes  the current working directory as its first ans second argument and it is responsible for:
    - Reading all the folders and subfolders in the cwd recursively.
    - Parsing the contents of each file and constructing their paths
    - Returning an objec with the file path (as the key) and the hash of the blob (as the value)

```javascript
function getWorkingDirectoryFiles(baseDir=process.cwd(), currentDir=process.cwd()) {
    const files = {}

    if (!fs.existsSync(currentDir)) {
        return files
    }

    const entries = fs.readdirSync(currentDir) 

    for (const entry of entries) {
        if (entry === '.mygit') continue

        const fullPath = path.join(currentDir, entry)
        const stats = fs.statSync(fullPath) 
        const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/')

        if (stats.isDirectory()) {
            const subfiles = getWorkingDirectoryFiles(baseDir, relativePath)
            Object.assign(files, subfiles)
        } else {
            const content = fs.readFileSync(fullPath)
            const header = `blob ${content.length}\0`
            const store = Buffer.concat([Buffer.from(header), content])
            const hash =  crypto.createHash('sha1').update(store).digest('hex')

            files[relativePath] = has
        }
    }

    return files
}
```

- The `status` function is the main function and it si responsible for:
    - Getting the current branch name by using the `getCurrentBranch` function.
    - Getting the current commit, if there is one, if not it logs unktracked files.
    - Getting the the root tree of the current commit, 
    - Getting the tree hash, read the tree
    - Getting al the files and their corresponding path by using the `getWorkingDirectoryFiles` function
    - Checking for **new**, **modified** and **deleted** files
    - Displaying the current status of the files

```javascript
function status() {
    // 1. Check if in a mygit repo 
    const mygitDir = path.join(process.cwd(), ".mygit") 

    if (!fs.existsSync(mygitDir)) {
        console.log(`fatal: not a mygit repository`)
        process.exit(1)
    }

    // 2. Get current branch
    const currentBranch = getCurrentBranch()

    if (!currentBranch) {
        console.log('On detached HEAD')
    } else {
        console.log(`On branch ${currentBranch}`)
    }

    // 3. Get current commit 
    const currentCommit = getCurrentCommit()

    if (!currentCommit) {
        console.log('\nNo commits yet\n')

        // Just show untracked files 
        const workingFiles = getWorkingDirectoryFiles()
        const fileList = Object.keys(workingFiles).sort()

        if (fileList.length > 0) {
            console.log('Untracked files:')
            console.log('  (use "mygit add <file>..." to include in what will be committed)\n');
            for (const file of fileList) {
                console.log(`${colors.red}\t${file}${colors.reset}`)
            }
            console.log('')
        }

        return 
    }

    // 4. Get the tree for current Commit
    let commitedFiles []

    try {
        const { content } = readObject(currentCommit)
        const lines = content.toString().split('\n')

        let treeHash = null

        for (const line of lines) {
            if (line.startswith('tree ')) {
                treehash = line.substring(5)
                break
            }
        }

        if (treeHash) {
            commitedFiles = readTree(treeHash)
        }
    } catch (error) {
        console.error('error: unable to read current commit');
        process.exit(1);
    }

    // 5. Get files in current Working Directory
    const workingFiles = getWorkingDirectoryFiles()

    // 6. Compare and Categorize 
    const modified = []
    const deleted = []
    const newFiles = []

    // Check for modified and deleted files
    for (const [filePath, commitedHash] of Object.entries(commitedFiles)) {
        if (workingFiles[filePath]) {
            // File exists both in cwd and in the current commit
            // check if modified (hashes are diferent)
            if (workingFiles[filePath] !== commitedHash) {
                modified.push(path.relative(process.cwd(), filePath))
            }
        } else {
            // File exist in commit but not in working directory - deleted
            deleted.push(path.relative(process.cwd(), filePath))
        }
    }

    // Check for new files
    for (const filePath of Object.keys(workignFiles)) {
        if (!commitedFiles[filePath]) {
            newFiles.push(path.relative(process.cwd(), filePath))
        }
    }

    // 7. FORMAT AND DISPLAY STATUS 

    // Check if cwd is clean
    if (modified.length === 0 && deleted.length === 0 && newFiles.length === 0) {
        console.log('\nnothing to commit, working tree clean');
        return;
    }

    console.log('')

    // Show modified files
    if (modified.length > 0 || deleted.length > 0) {
        console.log('Changes not staged for commit:');
        console.log('  (use "mygit add <file>..." to update what will be committed)\n');

        modified.sort()
        for (const file of modified) {
            console.log(`${colors.red}\tmodified:   ${file}${colors.reset}`);
        }

        deleted.sort()
        for (const file of deleted) {
            console.log(`${colors.red}\tdeleted:    ${file}${colors.reset}`);
        }
    }

    // Show new files
    if (newFiles.length > 0) {
        console.log('Untracked files:');
        console.log('  (use "mygit add <file>..." to include in what will be committed)\n');
        
        newFiles.sort();
        for (const file of newFiles) {
            console.log(`\t${colors.red}${file}${colors.reset}`);
        }
        
        console.log('');
    }
}

module.exports = status

```
