const fs = require('fs')
const path = require('path')


const getFileMode =  require('../helpers/getFileMode')
const hashObjectContent = require('../helpers/hashObjectContent')
const { getIndexPath, readIndex, writeIndex } = require('../core/index')
const { getMygitignorePatterns, isIgnored } = require('../utils/mygitignore')
const { ensureRepo } = require('../core/repository')

function normalizePath(filePath) {
    // Normialize path to use foward slashes

    const repoRoot = process.cwd()
    const absolutePath = path.resolve(filePath)

    // Get relative path
    let relativePath = path.relative(repoRoot, absolutePath)

    // Convert to foward slashes 
    const modifiedPath = relativePath.split(path.sep).join('/')

    return modifiedPath
}

function addFile(filePath) {
    // Add a single file to the indexx 

    const absolutePath = path.resolve(filePath)

    let stats;
    try {
        stats = fs.lstatSync(absolutePath)
    } catch (e) {
        console.error(`fatal: pathspec '${filePath}' did not match any files`)
        return
    }

    if (stats.isDirectory()) {
        console.error(`fatal: '${filePath}' is a directory. Use 'mygit add ${filePath}/*' or add files individually`)
        return
    }

    if (!stats.isFile() && !stats.isSymbolicLink()) {
        console.error(`fatal: '${filePath}' is not a regular file or symbolic link`);
        return
    }

    // read and hash the file
    let content;
    if (stats.isSymbolicLink()) {
        content = Buffer.from(fs.readlinkSync(absolutePath));
    } else {
        content = fs.readFileSync(absolutePath)
    }
    const hash = hashObjectContent(content, 'blob')
    const mode = getFileMode(absolutePath)

    // Normailize path
    const normalizedPath = normalizePath(filePath)

    // read index
    const index = readIndex()

    // Add entry to index
    index.entries[normalizedPath] = {
        hash: hash,
        mode: mode
    }

    // write index
    writeIndex(index)

    return normalizedPath
}

function addDirectory(dirPath) {
    const absolutePath = path.resolve(dirPath)

    let stats;
    try {
        stats = fs.lstatSync(absolutePath)
    } catch (e) {
        console.error(`fatal: pathspec '${dirPath}' did not match any files`);
        return
    }

    if (!stats.isDirectory()) {
        console.error(`fatal: '${dirPath}' is not a directory`);
        return
    }

    const addedFiles = []

    const mygitignorePatterns = getMygitignorePatterns()

    function traverse(currentDir) {
        const entries = fs.readdirSync(currentDir)

        for (const entry of entries) {
            if (entry === '.mygit') continue

            const fullPath = path.join(currentDir, entry)
            let stats;
            try {
                stats = fs.lstatSync(fullPath)
            } catch (e) {
                continue;
            }

            // Skip ignored files
            if (isIgnored(fullPath, mygitignorePatterns)) {
                continue
            }

            if (stats.isDirectory()) {
                traverse(fullPath)
            } else if (stats.isFile() || stats.isSymbolicLink()) {
                const added = addFile(fullPath)
                addedFiles.push(added)
            }
        }
    }

    traverse(absolutePath)
    return addedFiles
}

/**
 * Adds files or directories to the index after hashing their current content.
 * The special "." argument recursively stages files from the current directory, respecting mygitignore rules.
 * @param {string[]} args - Paths or directory patterns to add to the index
 * @throws {Error} If the current directory is not a mygit repository
 */
function add(args) {
    // 1. Check if in a mygit repositiry 
    ensureRepo()

    // 2. Parse Arguments

    if (args.length === 0) {
        console.error('Nothing specified, nothing added.');
        console.error('Maybe you wanted to say \'mygit add .\'?');
        return
    }

    // 3. Process each file/pattern

    for (const arg of args) {
        if (arg === '.') {
            // Add all files in current directory
            addDirectory(process.cwd())
        } else {
            const absolutePath = path.resolve(arg)

            let stats;
            try {
                stats = fs.lstatSync(absolutePath)
            } catch (e) {
                console.error(`fatal: pathspec '${arg}' did not match any files`);
                return
            }

            if (stats.isDirectory()) {
                addDirectory(absolutePath)
            } else {
                addFile(absolutePath)
            }
        }
    }
}

module.exports = add
