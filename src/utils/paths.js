const path = require('path')

/**
 * 
 */
const sep = path.sep

/**
 * Join path segments using the platform's path separator.
 *
 * @param {...string} segments - Path segments to join.
 * @returns {string} Joined path string.
 */
function join(...segments) {
    return path.join(...segments)
}

/**
 * Resolve a sequence of path segments into an absolute path, applying
 * `path.resolve` semantics.
 *
 * @param {...string} segments - Path segments to join and resolve.
 * @returns {string} Resolved absolute path.
 */
function resolve(...segments) {
    return path.resolve(...segments)
}

/**
 * Return the directory component of `filePath` (everything before the final
 * path separator).
 *
 * @param {string} filePath - A file path.
 * @returns {string} The directory name.
 */
function dirname(filePath) {
    return path.dirname(filePath)
}

/**
 * Return the base name of `filePath` — the last portion of the path.
 *
 * @param {string} filePath - A file path.
 * @returns {string} The base name (optionally including extension).
 */
function basename(filePath) {
    return path.basename(filePath)
}

/**
 * Return the file extension of `filePath`, including the leading `.`.
 * Returns an empty string if there is no extension.
 *
 * @param {string} filePath - A file path.
 * @returns {string} E.g. `'.js'`, `'.json'`, or `''`.
 */
function extname(filePath) {
    return path.extname(filePath)
}

/**
 * Returns a normalized string path
 * 
 * @param {string} filePath 
 * @returns {string}
 */
function normalize(filePath) {
    return path.normalize(filePath)
}

/**
 * Solves a relative path from {from} to {to} based on the current working directory
 * @param {string} from 
 * @param {string} to 
 * @returns {string}
 */
function relative(from, to) {
    return path.relative(from, to)
}

/**
 * Parses a file path and return an object with its components (root, dir, base, ext, name)
 * @param {string} filePath 
 * @returns {Object}
 */
function parse(filePath) {
    return path.parse(filePath)
}

/**
 * Determines whetehr {filePath} is an absolute path
 * 
 * @param {string} filePath 
 * @returns {boolean}
 */
function isAbsolute(filePath) {
    return path.isAbsolute(filePath)
}

module.exports = {
    join,
    resolve,
    dirname,
    basename,
    extname,
    normalize,
    relative,
    parse
}