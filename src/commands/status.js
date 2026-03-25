const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')

const colors = require('../utils/colors')
const readObject = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')

function getCurrentBranch() {
    const mygitDir = path.join(process.cwd(), '.mygit')
    const headPath = path.join(mygitDir, 'HEAD')

    if (!fs.existsSync(headPath)) {
        return null
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim()

    if (headContent.startsWith('ref: ')) {
        const branchRef = headContent.substring(5)
        return branchRef.replace('refs/heads/', "")
    }

    return null
}

function getCurrentCommit() {
    const mygitDir = path.join(process.cwd(), '.mygit')
    const headPath = path.join(mygitDir, 'HEAD');

    if (!fs.existsSync(headPath)) {
        return null;
    }
    
    const headContent = fs.readFileSync(headPath, 'utf-8').trim();
    
    if (headContent.startsWith('ref: ')) {
        const branchRef = headContent.substring(5);
        const branchPath = path.join(mygitDir, branchRef);
        
        if (!fs.existsSync(branchPath)) {
        return null;
        }
        
        return fs.readFileSync(branchPath, 'utf-8').trim();
    }
    
    return headContent;
}

function readTree(treeHash, prefix='') {
    // Recursively read a tree and return all the files
    // Returns: { 'path/to/file.txt': 'blob-hash', ... }

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

function getWorkingDirectoryFiles(baseDir = process.cwd(), currentDir = process.cwd()) {
    // ─── Get all files in working directory with their hashes ───────────────
    // Returns: { 'path/to/file.txt': 'computed-hash', ... }

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

        if (stats.isDirectory()) {
            // Recurse into sub directoru
            const subfiles = getWorkingDirectoryFiles(baseDir, relativePath)
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

    // 3. Get Current commit 

    const currentCommit = getCurrentCommit()

    if (!currentCommit) {
        console.log('\nNo commits yet\n')

        // Just show untracked files
        const workingFiles = getWorkingDirectoryFiles()
        const fileList  = Object.keys(workingFiles).sort()

        if (fileList.length > 0) {
            console.log('Untracked files:');
            console.log('  (use "mygit add <file>..." to include in what will be committed)\n');
            for (const file of fileList) {
                console.log(`\t${file}`)
            }
            console.log('')
        }

        return
    }

    // 4. Get the tree for current commit
    let commitedFiles = []

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

    // 5. GET FILES IN WORKING DIRECTORY
    const workingFiles = getWorkingDirectoryFiles()

    // 6. COMPARE AND CATEGORIZE

    const modified = []
    const deleted = []
    const newFiles = []

    // Check for modified and deleted files 
    for (const [filePath, commitedHash] of Object.entries(commitedFiles)) {
        
        if (workingFiles[filePath]) {
            // File exist in both -check if modified (hashes are different)
            if (workingFiles[filePath] !== commitedHash) {
                modified.push(path.relative(process.cwd(), filePath))
            }
        } else {
            // File exist in commit but not in working directory - deleted
            deleted.push(path.relative(process.cwd(), filePath))
        }
    }

    // Check for new files
    for (const filePath of Object.keys(workingFiles)) {
        if (!commitedFiles[filePath]) {
            newFiles.push(path.relative(process.cwd(), filePath))
        }
    }

    // 7. DISPLAY STATUS

    // Check if wd is clean
    if (modified.length === 0 && deleted.length === 0 && newFiles.length === 0) {
        console.log('\nnothing to commit, working tree clean');
        return;
    }

    console.log('')

    // Show modified files
    if (modified.length > 0 || deleted.length > 0) {
        console.log('Changes not staged for commit:');
        console.log('  (use "mygit add <file>..." to update what will be committed)\n');
        
        modified.sort();
        for (const file of modified) {
            console.log(`${colors.red}\tmodified:   ${file}${colors.reset}`);
        }

        deleted.sort();
        for (const file of deleted) {
            console.log(`\tdeleted:    ${file}`);
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

