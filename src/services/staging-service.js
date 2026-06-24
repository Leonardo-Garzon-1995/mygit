const fs = require('../utils/filesystem')
const path = require('../utils/paths')
const { writeBlobObject, } = require('../core/objects/blobs')
const getFileMode  = require('../core/objects/modes')
const { ValidationError } = require('../errors')
const {
    readIndex,
    writeIndex,
    createIndexEntry,
    setIndexEntry,
    removeIndexEntry,
    hasIndexEntry,
    getIndexStoredPaths,
    clearIndexEntries,
} = require('../core/index/index')

/**
 * Stage a file
 *
 * Creates a blob object and updates
 * the repository index
 *
 * @param {Repository} repo
 * @param {string} filePath
 * @returns {string} blob hash
 */
function stageFile(repo, filePath) {
    if (!filePath) {
        throw new ValidationError('File path is required')
    }
    const content = fs.readFileBuffer(filePath)
    const hash = writeBlobObject(repo, content)

    const mode = getFileMode(filePath)

    const relativePath = path.relative(repo.worktree, filePath)

    const index = readIndex(repo)

    const entry = createIndexEntry(hash, mode)

    setIndexEntry(index, relativePath, entry)

    writeIndex(repo, index)

    return hash
}

/**
 * Stage multiple files
 *
 * @param {Repository} repo
 * @param {string[]} filePaths
 * @returns {string[]}
 */
function stageFiles(repo, filePaths=[]) {
    const hashes = []

    for (const filePath of filePaths) {
        hashes.push(stageFile(repo, filePath))
    }

    return hashes
}

/**
 * Remove file from index
 *
 * @param {Repository} repo
 * @param {string} filePath
 */
function unstageFile(repo, filePath) {
    const relativePath = path.relative(repo.worktree, filePath)

    const index = readIndex(repo)

    removeIndexEntry(index, relativePath)

    writeIndex(repo, index)
}

/**
 * Check whether a file
 * exists in the index
 *
 * @param {Repository} repo
 * @param {string} filePath
 * @returns {boolean}
 */
function isStaged(repo, filePath) {
    const relativePath = path.relative(repo.worktree, filePath)

    const index = readIndex(repo)

    return hasIndexEntry(index, relativePath)
}

/**
 * Get all staged paths
 *
 * @param {Repository} repo
 * @returns {string[]}
 */
function listStagedFiles(repo) {
    const index = readIndex(repo)

    return getIndexStoredPaths(index)
}

// Move _walkDir to filesystem later
/**
 * Recursively collect all file paths under `dirPath`, skipping the `.mygit`
 * metadata directory.
 *
 * @param {string} dirPath - Absolute path of the directory to walk.
 * @returns {string[]} Absolute paths of every regular file found.
 */
function _walkDir(dirPath) {
    const result = []

    let entries
    try {
        entries = fs.listDir(dirPath)
    } catch {
        return result
    }

    for (const entry of entries) {
        if (entry === '.mygit') continue

        const fullPath = path.join(dirPath, entry)

        let stats
        try {
            stats = fs.lstat(fullPath)
        } catch {
            continue
        }

        if (stats.isDirectory()) {
            const sub = _walkDir(fullPath)
            for (const p of sub) result.push(p)
        } else if (stats.isFile() || stats.isSymbolicLink()) {
            result.push(fullPath)
        }
    }

    return result
}

/**
 * Stage all files contained within a directory, recursively.
 *
 * This function:
 * 1. Verifies the provided path exists.
 * 2. Verifies the path is a directory.
 * 3. Recursively traverses all nested files.
 * 4. Skips the `.mygit` directory.
 * 5. Stages every discovered file using `stageFile`.
 *
 * @param {Repository} repo
 * @param {string} directoryPath - Absolute path of the directory to stage.
 * @returns {string[]} Absolute paths of all staged files.
 * @throws {ValidationError} If the path is missing, does not exist, or is not
 *   a directory.
 */
function stageDirectory(repo, directoryPath) {
    if (!directoryPath) {
        throw new ValidationError('Directory path is required')
    }

    if (!fs.existsSync(directoryPath)) {
        throw new ValidationError(`Path does not exist: ${directoryPath}`)
    }

    const stats = fs.lstat(directoryPath)
    if (!stats.isDirectory()) {
        throw new ValidationError(`Path is not a directory: ${directoryPath}`)
    }

    const filePaths = _walkDir(directoryPath)
    const staged    = []

    for (const filePath of filePaths) {
        stageFile(repo, filePath)
        staged.push(filePath)
    }

    return staged
}

// This could become useful later, move to utils/
/**
 * Convert a simple wildcard pattern (e.g. `*.js`, `*.txt`) to a RegExp.
 *
 * Only the `*` wildcard is supported — it matches any sequence of characters
 * that does not include a path separator.
 *
 * @param {string} pattern - A simple glob-like pattern.
 * @returns {RegExp}
 */
function _patternToRegex(pattern) {
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex special chars
        .replace(/\*/g, '[^/\\\\]*')            // * → match non-separator chars
    return new RegExp(`^${escaped}$`)
}

/**
 * Stage all repository files whose base-name matches a simple wildcard
 * pattern.
 *
 * Supported patterns: `*.js`, `*.json`, `*.txt`, `*.md`, etc.
 * Full glob syntax (e.g. `**`) is **not** required.
 *
 * This function:
 * 1. Walks the entire work-tree.
 * 2. Matches each file's base-name against `pattern`.
 * 3. Stages matching files using `stageFile`.
 * 4. Skips `.mygit`.
 *
 * @param {Repository} repo
 * @param {string} pattern - Simple wildcard pattern, e.g. `'*.js'`.
 * @returns {string[]} Absolute paths of all staged files.
 * @throws {ValidationError} If `pattern` is not provided.
 */
function stagePattern(repo, pattern) {
    if (!pattern) {
        throw new ValidationError('Pattern is required')
    }

    const regex     = _patternToRegex(path.basename(pattern))
    const allFiles  = _walkDir(repo.worktree)
    const staged    = []

    for (const filePath of allFiles) {
        const base = path.basename(filePath)
        if (regex.test(base)) {
            stageFile(repo, filePath)
            staged.push(filePath)
        }
    }

    return staged
}

/**
 * Stage every trackable file inside the repository root.
 *
 * This is the backing function for `mygit add .`.  It traverses the entire
 * work-tree (skipping `.mygit`) and stages each discovered file via
 * `stageDirectory`.
 *
 * @param {Repository} repo
 * @returns {string[]} Absolute paths of all staged files.
 */
function stageAll(repo) {
    return stageDirectory(repo, repo.worktree)
}

/**
 * Remove every entry from the index, effectively un-staging all files.
 *
 * The working tree is left untouched.
 *
 * @param {Repository} repo
 * @returns {void}
 */
function unstageAll(repo) {
    const index = readIndex(repo)

    clearIndexEntries(index)

    writeIndex(repo, index)
}

module.exports = {
    stageFile,
    stageFiles,
    unstageFile,
    isStaged,
    listStagedFiles,
    stageDirectory,
    stagePattern,
    stageAll,
    unstageAll,
}
