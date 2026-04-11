const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

const getFileMode =  require('../helpers/getFileMode')

function getIndexPath() {
    return path.join(process.cwd(), '.mygit', 'index')
}

function readIndex() {
    const indexPath = getIndexPath()

    if (!fs.existsSync(indexPath)) {
        return {version: 1, entries: {}}
    }

    try {
        const content = fs.readFileSync(indexPath, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        console.error('error: unable to read index')
        console.error(error.message)
        process.exit(1)
    }
}

function writeIndex(index) {
    const indexPath = getIndexPath()

    try {
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
        console.error('error: unable to write index');
        console.error(error.message);
        process.exit(1);
    }
}

function hashObjectContent(content, type='blob') {
    // Hash and store content as a blob

    const header = `${type} ${content.length}\0`
    const store = Buffer.concat([Buffer.from(header), content])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    // Compress and store

    const compressed = zlib.deflateSync(store)

    const dir = hash.slice(0, 2)
    const filename = hash.slice(2)
    const objectsDir = path.join(process.cwd(), '.mygit', 'objects')
    const objDir = path.join(objectsDir, dir)
    const objPath = path.join(objDir, filename)

    fs.mkdirSync(objDir, {recursive: true})

    if (!fs.existsSync(objPath)) {
        fs.writeFileSync(objPath, compressed)
    }

    return hash
}

function normalizePath(filePath) {
    // Normialize path to use foward slashes

    // Convert to relative path from repo 
    const repoRoot = process.cwd()
    const absolutePath = path.resolve(filePath)

    // Get relative path
    let relativePath = path.relative(repoRoot, absolutePath)

    // Convert to foward slashes (git's internal format)
    relativePath.split(path.sep).join('/')

    return relativePath
}

function addFile(filePath) {
    // Add a single file to the indexx 

    const absolutePath = path.resolve(filePath)

    if (!fs.existsSync(absolutePath)) {
        console.error(`fatal: pathspec '${filePath}' did not match any files`)
        process.exit(1)
    }

    const stats = fs.statSync(absolutePath)

    if (stats.isDirectory()) {
        console.error(`fatal: '${filePath}' is a directory. Use 'mygit add ${filePath}/*' or add files individually`)
        process.exit(1)
    }

    if (!stats.isFile()) {
        console.error(`fatal: '${filePath}' is not a regular file`);
        process.exit(1);
    }

    // read and hash the file
    const content = fs.readFileSync(absolutePath)
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

    if (!fs.existsSync(absolutePath)) {
        console.error(`fatal: pathspec '${dirPath}' did not match any files`);
        process.exit(1);
    }

    const stats = fs.statSync(absolutePath)

    if (!stats.isDirectory()) {
        console.error(`fatal: '${dirPath}' is not a directory`);
        process.exit(1);
    }

    const addedFiles = []

    function traverse(currentDir) {
        const entries = fs.readdirSync(currentDir)

        for (const entry of entries) {
            if (entry === '.mygit') continue

            const fullPath = path.join(currentDir, entry)
            const stats = fs.statSync(fullPath)

            if (stats.isDirectory()) {
                traverse(fullPath)
            } else if (stats.isFile()) {
                const added = addFile(fullPath)
                addedFiles.push(added)
            }
        }
    }

    traverse(absolutePath)
    return addedFiles
}

function add(args) {
    // 1. Check if in a mygit repositiry 

    const mygitDir = path.join(process.cwd(), '.mygit')

    if (!fs.existsSync(mygitDir)) {
        console.error('fatal: not a mygit repository')
        process.exit(1)
    }

    // 2. Parse Arguments

    if (args.length === 0) {
        console.error('Nothing specified, nothing added.');
        console.error('Maybe you wanted to say \'mygit add .\'?');
        process.exit(1);
    }

    // 3. Process each file/pattern

    for (const arg of args) {
        if (arg === '.') {
            // Add all files in current directory
            addDirectory(process.cwd())
        } else {
            const absolutePath = path.resolve(arg)

            if (!fs.existsSync(absolutePath)) {
                console.error(`fatal: pathspec '${arg}' did not match any files`);
                process.exit(1);
            }

            const stats = fs.statSync(absolutePath)

            if (stats.isDirectory()) {
                addDirectory(absolutePath)
            } else {
                addFile(absolutePath)
            }
        }
    }
}

module.exports = add

