const fs = require('fs');
const path = require('path');

const getCurrentBranch = require('../helpers/getCurrentBranch')
const readObject = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')
const { getRepoPath, ensureRepo } = require("../core/repository")

function readTree(treeHash, prefix = '') {
    const { content } = readObject(treeHash);
    const entries = parseTree(content);
    const files = {};
    
    for (const entry of entries) {
        const fullPath = prefix ? path.join(prefix, entry.name) : entry.name;
        
        if (entry.mode === '40000') {
        const subFiles = readTree(entry.hash, fullPath);
        Object.assign(files, subFiles);
        } else {
        files[fullPath] = { hash: entry.hash, mode: entry.mode };
        }
    }
    
    return files;
}

function getCurrentFiles(dir = process.cwd(), prefix = '') {
    const files = new Set();
    
    if (!fs.existsSync(dir)) {
        return files;
    }
    
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
        if (entry === '.mygit') continue;
        
        const fullPath = path.join(dir, entry);
        const relativePath = prefix ? path.join(prefix, entry) : entry;
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
        const subFiles = getCurrentFiles(fullPath, relativePath);
        subFiles.forEach(f => files.add(f));
        } else if (stats.isFile()) {
        files.add(relativePath);
        }
    }
    
    return files;
}

function updateWorkingDirectory(targetFiles) {
    const repoRoot = process.cwd();
    const currentFiles = getCurrentFiles();
    
    // Delete files that shouldn't exist
    for (const filePath of currentFiles) {
        if (!targetFiles[filePath]) {
            const fullPath = path.join(repoRoot, filePath);
            fs.unlinkSync(fullPath);
            
            let dir = path.dirname(fullPath);
            while (dir !== repoRoot) {
                try {
                    if (fs.readdirSync(dir).length === 0) {
                        fs.rmdirSync(dir);
                        dir = path.dirname(dir);
                    } else {
                        break;
                    }
                } catch (error) {
                    break;
                }
            }
        }
    }
    
    // Create/update files from target tree
    for (const [filePath, fileInfo] of Object.entries(targetFiles)) {
        const fullPath = path.join(repoRoot, filePath);
        const { content } = readObject(fileInfo.hash);
        
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        }
        
        if (fileInfo.mode === '120000') {
            fs.symlinkSync(content.toString(), fullPath);
        } else {
            fs.writeFileSync(fullPath, content);
            
            if (fileInfo.mode === '100755') {
            fs.chmodSync(fullPath, 0o755);
            }
        }
    }
}

/**
 * Switches HEAD and the working directory to another branch.
 * With -b, creates the branch at the current commit before checking it out.
 * @param {string[]} args - Checkout arguments, optionally including -b followed by a branch name
 * @throws {Error} If the repository, branch name, commit, tree, or working directory update is invalid
 */
function checkout(args) {

    // --1. Check if you are in a mygit repo
    const mygitDir = getRepoPath();
    
    ensureRepo()

    // --2. Parse arguments
    
    let createBranch = false;
    let branchName = null;
    
    if (args.length === 0) {
        console.error('error: branch name required');
        console.error('Usage: mygit checkout [-b] <branch>');
        process.exit(1);
    }
    
    if (args[0] === '-b') {
        // Create and checkout branch
        createBranch = true;
        branchName = args[1];
        
        if (!branchName) {
        console.error('error: branch name required after -b');
        process.exit(1);
        }
    } else {
        // Just chekout existing branch
        branchName = args[0];
    }
    
    // validate branch name
    if (!/^[a-zA-Z0-9_\-\/]+$/.test(branchName)) {
        console.error(`fatal: '${branchName}' is not a valid branch name.`);
        process.exit(1);
    }
    
    // --3. Handel -b flag (create and checkout)
    const branchPath = path.join(mygitDir, 'refs', 'heads', branchName);
    
    if (createBranch) {
        if (fs.existsSync(branchPath)) {
        console.error(`fatal: A branch named '${branchName}' already exists.`);
        process.exit(1);
        }
        
        // Get current commit
        const headPath = path.join(mygitDir, 'HEAD');
        const headContent = fs.readFileSync(headPath, 'utf-8').trim();
        
        let currentCommit = null;
        
        if (headContent.startsWith('ref: ')) {
        const currentBranchRef = headContent.substring(5);
        const currentBranchPath = path.join(mygitDir, currentBranchRef);
        
        if (fs.existsSync(currentBranchPath)) {
            currentCommit = fs.readFileSync(currentBranchPath, 'utf-8').trim();
        }
        }
        
        if (!currentCommit) {
        console.error('fatal: You are on a branch yet to be born');
        process.exit(1);
        }
        
        // Create the new branch
        const branchDir = path.dirname(branchPath);
        fs.mkdirSync(branchDir, { recursive: true });
        fs.writeFileSync(branchPath, currentCommit + '\n');
    }
    
    // --4. Validate branch exists
    if (!fs.existsSync(branchPath)) {
        console.error(`error: pathspec '${branchName}' did not match any file(s) known to mygit.`);
        process.exit(1);
    }
    
    // 5. Check if already on this branch
    const currentBranch = getCurrentBranch();
    
    if (currentBranch === branchName) {
        console.log(`Already on '${branchName}'`);
        return;
    }
    
    // --6. Get the commit that the branch points to
    const commitHash = fs.readFileSync(branchPath, 'utf-8').trim();
    
    if (!commitHash) {
        console.error(`fatal: reference is not a tree: ${branchName}`);
        process.exit(1);
    }
    
    // --7 REad the commit object
    let treeHash;
    try {
        const { header, content } = readObject(commitHash);
        
        if (!header.startsWith('commit ')) {
        console.error(`fatal: reference is not a commit: ${branchName}`);
        process.exit(1);
        }
        
        // Parse the commit to get tree hash
        const lines = content.toString().split('\n');
        
        for (const line of lines) {
        if (line.startsWith('tree ')) {
            treeHash = line.substring(5);
            break;
        }
        }
        
        if (!treeHash) {
        console.error('fatal: invalid commit object');
        process.exit(1);
        }
        
    } catch (error) {
        console.error(`fatal: unable to read commit ${commitHash}`);
        console.error(error.message);
        process.exit(1);
    }
    
    // --8. Read the tree to get all files
    let targetFiles;
    try {
        targetFiles = readTree(treeHash);
    } catch (error) {
        console.error(`fatal: unable to read tree ${treeHash}`);
        console.error(error.message);
        process.exit(1);
    }
    
    // --9. Update working dir
    try {
        updateWorkingDirectory(targetFiles);
    } catch (error) {
        console.error('error: unable to update working directory');
        console.error(error.message);
        process.exit(1);
    }
    
    // --10. update HEAD to point to new branch 
    const headPath = path.join(mygitDir, 'HEAD');
    fs.writeFileSync(headPath, `ref: refs/heads/${branchName}\n`);

    // --11. Print success message for feedback
    
    if (createBranch) {
        console.log(`Switched to a new branch '${branchName}'`);
    } else {
        console.log(`Switched to branch '${branchName}'`);
    }
}

module.exports = checkout;
