/**
 * @fileoverview Synchronous filesystem utilities for mygit.
 *
 * All helpers here are thin wrappers around Node's built-in `fs` and `path`
 * modules.  They expose a consistent, project-wide API so that callers never
 * need to import `fs` or `path` directly.
 *
 * When importing this module, prefer:
 *   const fs = require('../utils/filesystem')
 *
 * to avoid name collisions with Node's built-in `fs`.
 *
 * NOTE: Only synchronous operations are implemented at this time.
 */

const fs   = require('fs')
const path = require('path')

// ── Existence & type checks ───────────────────────────────────────────────────

/**
 * Return `true` if the path exists on disk (file, directory, symlink, etc.).
 *
 * @param {string} filePath - Absolute or relative path to test.
 * @returns {boolean}
 */
function exists(filePath) {
    return fs.existsSync(filePath)
}

/**
 * Return `true` if the path exists **and** is a regular file.
 *
 * @param {string} filePath - Absolute or relative path to test.
 * @returns {boolean}
 */
function isFile(filePath) {
    return exists(filePath) && fs.statSync(filePath).isFile()
}

/**
 * Return `true` if the path exists **and** is a directory.
 *
 * @param {string} filePath - Absolute or relative path to test.
 * @returns {boolean}
 */
function isDirectory(filePath) {
    return exists(filePath) && fs.statSync(filePath).isDirectory()
}

// ── Directory operations ──────────────────────────────────────────────────────

/**
 * Create `dirPath` (and any missing parent directories) if it does not already
 * exist.  Equivalent to `mkdir -p`.
 *
 * @param {string} dirPath - Path of the directory to create.
 * @param {Object} options
 * @returns {void}
 */
function ensureDir(dirPath, options = {recursive: true}) {
    fs.mkdirSync(dirPath, options)
}

/**
 * Remove `dirPath` and all of its contents recursively.  If the directory does
 * not exist the call is a no-op.
 *
 * @param {string}  dirPath - Path of the directory to remove.
 * @param {boolean} [f=true] - When `true` the removal is forced (errors for
 *   non-existent entries are suppressed), matching `rm -rf` behaviour.
 * @returns {void}
 */
function removeDir(dirPath, f = true) {
    if (!exists(dirPath)) return

    fs.rmSync(dirPath, {
        recursive: true,
        force: f
    })
}

/**
 * Return an array of entry names (files **and** subdirectories) directly
 * inside `DirPath`.  The results are not sorted.
 *
 * @param {string} DirPath - Path of the directory to list.
 * @returns {string[]} An array of entry names (not full paths).
 */
function listDir(DirPath) {
    return fs.readdirSync(DirPath)
}

// ── File reading ──────────────────────────────────────────────────────────────

/**
 * Read the entire contents of `filePath` and return them as a string.
 *
 * @param {string} filePath  - Path to the file to read.
 * @param {string} [encoding='utf8'] - Character encoding passed to
 *   `fs.readFileSync`.
 * @returns {string} The decoded file contents.
 */
function readFile(filePath, encoding = 'utf8') {
    return fs.readFileSync(filePath, encoding)
}

/**
 * Read the entire contents of `filePath` and return them as a raw
 * {@link Buffer} (no encoding applied).
 *
 * Useful when dealing with binary object files.
 *
 * @param {string} filePath - Path to the file to read.
 * @returns {Buffer}
 */
function readFileBuffer(filePath) {
    return fs.readFileSync(filePath)
}

/**
 * Read and JSON-parse the contents of `filePath`.
 *
 * @param {string} filePath - Path to a UTF-8 JSON file.
 * @returns {*} The parsed JavaScript value.
 * @throws {SyntaxError} If the file content is not valid JSON.
 */
function readJSON(filePath) {
    return JSON.parse(readFile(filePath))
}

// ── File writing ──────────────────────────────────────────────────────────────

/**
 * Write `content` to `filePath`, creating any missing parent directories
 * automatically.  Overwrites any existing content.
 *
 * @param {string}          filePath - Destination file path.
 * @param {string | Buffer} content  - Data to write.
 * @returns {void}
 */
function writeFile(filePath, content) {
    ensureDir(path.dirname(filePath))

    fs.writeFileSync(filePath, content)
}

/**
 * Append `content` to `filePath`, creating the file (and any missing parent
 * directories) if it does not already exist.
 *
 * @param {string}          filePath - Destination file path.
 * @param {string | Buffer} content  - Data to append.
 * @returns {void}
 */
function appendFile(filePath, content) {
    ensureDir(path.dirname(filePath))

    fs.appendFileSync(filePath, content)
}

/**
 * Serialise `data` to JSON and write it to `filePath`.  Parent directories are
 * created automatically.
 *
 * @param {string} filePath       - Destination file path.
 * @param {*}      data           - Value to serialise.
 * @param {number} [spacing=2]    - Number of spaces used for indentation in the
 *   JSON output.
 * @returns {void}
 */
function writeJSON(filePath, data, spacing = 2) {
    writeFile(filePath, JSON.stringify(data, null, spacing))
}

// ── File removal ──────────────────────────────────────────────────────────────

/**
 * Delete the file at `filePath`.  If the file does not exist the call is a
 * no-op.
 *
 * @param {string} filePath - Path of the file to delete.
 * @returns {void}
 */
function removeFile(filePath) {
    if (!exists(filePath)) return

    fs.unlinkSync(filePath)
}

// ── Copy and move ─────────────────────────────────────────────────────────────

/**
 * Copy the file at `source` to `destination`, creating any missing parent
 * directories automatically.  Overwrites the destination if it already exists.
 *
 * @param {string} source      - Path of the file to copy.
 * @param {string} destination - Path of the copy target.
 * @returns {void}
 */
function copyFile(source, destination) {
    ensureDir(path.dirname(destination))

    fs.copyFileSync(source, destination)
}

/**
 * Move (rename) the file at `source` to `destination`, creating any missing
 * parent directories automatically.
 *
 * @param {string} source      - Current path of the file.
 * @param {string} destination - Target path.
 * @returns {void}
 */
function moveFile(source, destination) {
    ensureDir(path.dirname(destination))

    fs.renameSync(source, destination)
}

// ── Metadata utilities ────────────────────────────────────────────────────────

/**
 * Return the `fs.Stats` object for `filePath`.
 *
 * @param {string} filePath - Path to stat.
 * @returns {fs.Stats}
 */
function stat(filePath) {
    return fs.statSync(filePath)
}

/**
 * Return the size (in bytes) of the file at `filePath`.
 *
 * @param {string} filePath - Path to the file.
 * @returns {number} File size in bytes.
 */
function fileSize(filePath) {
    return stat(filePath).size
}

/**
 * Return the last-modified time of the file at `filePath`.
 *
 * @param {string} filePath - Path to the file.
 * @returns {Date} The `mtime` as a JavaScript `Date` object.
 */
function modifiedTime(filePath) {
    return stat(filePath).mtime
}



module.exports = {
    exists,
    isFile,
    isDirectory,
    ensureDir,
    removeDir,
    listDir,
    readFile,
    readFileBuffer,
    readJSON,
    writeFile,
    writeJSON,
    appendFile,
    removeFile,
    copyFile,
    moveFile,
    stat,
    fileSize,
    modifiedTime
}