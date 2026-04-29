const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const colors = require('../utils/colors')
const readObject = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')
const getCurrentBranch = require('../helpers/getCurrentBranch')
const getCurrentCommit = require('../helpers/getCurrentCommit')
const readIndex = require('../helpers/readIndex')
const { getMygitignorePatterns, isIgnored} = require('../utils/mygitignore')

function readTree(treeHash, prefix='') {
    // Recursively read a tree and return all the files
    // Returns: { 'path/to/file.txt': 'blob-hash', ... }

    const { content } = readObject(treeHash)
    const entries = parseTree(content)

    const files = {}

    for (const entry of entries) {
        const fullPath = prefix ? path.join(prefix, entry.name).split(path.sep).join('/') : entry.name

        if (entry.mode === "40000") {
            const subfiles = readTree(entry.hash, fullPath)
            Object.assign(files, subfiles)
        } else {
            files[fullPath] = entry.hash
        }
    }

    return files
}

function getWorkingDirectoryFiles(baseDir = process.cwd(), currentDir = process.cwd(), mygitignorePatterns = null) {
    // ─── Get all files in working directory with their hashes ───────────────
    // Returns: { 'path/to/file.txt': 'computed-hash', ... }

    if (mygitignorePatterns === null) {
        mygitignorePatterns = getMygitignorePatterns()
    }
    const files = {}

    if (!fs.existsSync(currentDir)) {
        return files
    }

    const entries = fs.readdirSync(currentDir)

    for (const entry of entries) {
        if (entry === '.mygit') continue

        const fullPath = path.join(currentDir, entry)
        const stats = fs.statSync(fullPath)
        const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/');

        if (isIgnored(relativePath, mygitignorePatterns)) {
            continue
        }


        if (stats.isDirectory()) {
            // Recurse into sub directoru
            const subfiles = getWorkingDirectoryFiles(baseDir, fullPath, mygitignorePatterns)
            Object.assign(files, subfiles)
        } else if (stats.isFile()) {
            // Hash the file to compare with commited version
            const content = fs.readFileSync(fullPath)
            const header = `blob ${content.length}\0`
            const store = Buffer.concat([Buffer.from(header), content])
            const hash = crypto.createHash('sha1').update(store).digest('hex')

            files[relativePath] = hash
        }
    }

    return files
}

function status() {
    // 1. Check if in a mygit repo

    const mygitDir = path.join(process.cwd(), '.mygit')

    if (!fs.existsSync(mygitDir)) {
        console.error('fatal: not a mygit repository')
        process.exit(1)
    }

    // 2. Get current branch
    const currentBranch = getCurrentBranch()

    if (!currentBranch) {
        console.log('On detached HEAD')
    } else {
        console.log (`On branch ${currentBranch}`)
    }

    // 3. Get Current commit, index and working files 

    const currentCommit = getCurrentCommit()
    const index = readIndex()
    const workingFiles = getWorkingDirectoryFiles()

    // 4. Handle case: no commits yet
    if (!currentCommit) {
        console.log('\nNo commits yet\n')

        const stagedFiles = Object.keys(index.entries).sort()
        const unstagedFiles = []

        // Files in working directory but not in index
        for (const filePath of Object.keys(workingFiles)) {
            if(!index.entries[filePath]) {
                unstagedFiles.push(filePath)
            }
        }

        unstagedFiles.sort()

        if (stagedFiles.length > 0) {
            console.log('Changes to be committed:')
            console.log('   (use "mygit rm --cached <file>..." to unstage)\n')
            for (const file of stagedFiles) {
                console.log(`\t${colors.green}new file:   ${file}${colors.reset}`);
            }
            console.log('')
        }

        if (unstagedFiles.length > 0) {
            console.log('Untracked files:')
            console.log('   (use "mygit add <file>..." to include in what will be committed)\n')
            for (const file of unstagedFiles) {
                console.log(`\t${colors.red}${file}${colors.reset}`)
            }
            console.log('')
        }
        return
    }

    // 4. Get the tree for current commit
    let commitedFiles = {}

    try {
        const { content } = readObject(currentCommit)
        const lines = content.toString().split('\n')

        let treeHash =  null

        for (const line of lines) {
            if (line.startsWith('tree ')) {
                treeHash = line.substring(5)
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


    // 6. COMPARE AND CATEGORIZE

    const stagedNew = [] // In index, not in commit (new file)
    const stagedModified = [] // In both, different hash (modified)
    const stagedDeleted = []  // In commit, not in index (deleted)

    const unstagedModified = [] // In index, in working, different hash
    const unstagedDeleted = [] // In index, not in working
    
    const untracked = []  // In working, not in index


    // Check staged changes (commit vs index)
    const indexFiles = index.entries

    for (const [filePath, fileInfo] of Object.entries(indexFiles)) {
        if (commitedFiles[filePath]) {
            // File exist in commit 
            if (commitedFiles[filePath] !== fileInfo.hash) {
                stagedModified.push(filePath)
            }
        } else  {
            // File doesn't exist in commit - it's new
            stagedNew.push(filePath);
        }
    }

    // Check deleted files  (in commit but not in indedx)
    for (const filePath of Object.keys(commitedFiles)) {
        if (!indexFiles[filePath]) {
            stagedDeleted.push(filePath)
        }
    }

    // Check for unstaged changes (index vs working directory)
    for (const [filePath, fileInfo] of Object.entries(indexFiles)) {
        if (workingFiles[filePath]) {
            // File exists in working directory
            if (workingFiles[filePath] !== fileInfo.hash) {
                unstagedModified.push(filePath);
            }
        } else {
            // File in index but not in working directory
            unstagedDeleted.push(filePath);
        }
    }

    // Check for untracked files (in working but not in index)
    for (const filePath of Object.keys(workingFiles)) {
        if (!indexFiles[filePath]) {
            untracked.push(filePath);
        }
    }
    

    // 7. DISPLAY STATUS

    const hasStaged = stagedNew.length > 0 || stagedModified.length > 0 || stagedDeleted.length > 0
    const hasUnstaged = unstagedModified.length > 0 || unstagedDeleted.length > 0 
    const hasUntracked = untracked.length > 0


    // Check if wd is clean
    if (!hasStaged && !hasUnstaged && !hasUntracked) {
        console.log('\nnothing to commit, working tree clean');
        return;
    }

    console.log('')

    // Show staged changes
    if (hasStaged) {
        console.log('Changes to be committed:')
        console.log(' (use "mygit reset HEAD <file>..." to unstaged)\n')

        stagedNew.sort()
        for (const file of stagedNew) {
            console.log(`\t${colors.green}new file:   ${file}${colors.reset}`);
        }

        stagedModified.sort();
        for (const file of stagedModified) {
            console.log(`\t${colors.green}modified:   ${file}${colors.reset}`);
        }

        stagedDeleted.sort();
        for (const file of stagedDeleted) {
            console.log(`\t${colors.green}deleted:    ${file}${colors.reset}`);
        }

        console.log('')
    }

    // Show unstaged changes
    if (hasUnstaged) {
        console.log('Changes not staged for commit:');
        console.log('  (use "mygit add <file>..." to update what will be committed)\n');
        
        unstagedModified.sort();
        for (const file of unstagedModified) {
            console.log(`\t${colors.red}modified:   ${file}${colors.reset}`);
        }
        
        unstagedDeleted.sort();
        for (const file of unstagedDeleted) {
            console.log(`\t${colors.red}deleted:    ${file}${colors.reset}`);
        }
        
        console.log('');
    }

    // Show untracked files
    if (hasUntracked) {
        console.log('Untracked files:');
        console.log('  (use "mygit add <file>..." to include in what will be committed)\n');
        
        untracked.sort();
        for (const file of untracked) {
            console.log(`\t${colors.red}${file}${colors.reset}`);
        }
        
        console.log('');
    }
}

module.exports = status

