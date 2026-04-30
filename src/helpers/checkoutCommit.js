const fs = require('fs')
const path = require('path')

const readObject  = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')

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
        
        fs.writeFileSync(fullPath, content);
        
        if (fileInfo.mode === '100755') {
        fs.chmodSync(fullPath, 0o755);
        }
    }
}

function readTree(treeHash, prefix = '') {
    const { content } = readObject(treeHash)
    const entries = parseTree(content)
    const files = {}

    for (const entry of entries) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name

        if (entry.mode === '40000') {
            Object.assign(files, readTree(entry.hash, fullPath))
        } else {
            files[fullPath] = entry
        }
    }

    return files
}

function checkoutCommit(commitHash) {
    const { content } = readObject(commitHash)

    const lines = content.toString().split('\n')
    let treeHash = null

    for (const line of lines) {
        if (line.startsWith('tree ')) {
            treeHash = line.slice(5)
            break
        }
    }

    if (!treeHash) {
        throw new Error('Invalid commit')
    }

    const files = readTree(treeHash)
    updateWorkingDirectory(files)
}

module.exports = checkoutCommit