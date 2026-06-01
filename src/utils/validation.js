/**
 * Centralized validation utility module.
 * Provides reusable validation helpers shared across multiple subsystems.
 */

/**
 * Checks whether a string is a valid SHA-1 hash.
 * Requirements:
 * - must be a string
 * - must contain only hexadecimal characters
 * - must be exactly 40 characters long
 * 
 * @param {string} hash
 * @returns {boolean}
 */
function isValidHash(hash) {
    if (typeof hash !== 'string') return false;
    return /^[a-f0-9]{40}$/i.test(hash);
}

/**
 * Checks whether an object type is valid.
 * Supported types: blob, tree, commit, tag
 * 
 * @param {string} type
 * @returns {boolean}
 */
function isValidObjectType(type) {
    const validTypes = ['blob', 'tree', 'commit', 'tag'];
    return validTypes.includes(type);
}

/**
 * Checks whether a Git reference path is valid.
 * Examples: refs/heads/main, refs/tags/v1.0.0
 * 
 * @param {string} ref
 * @returns {boolean}
 */
function isValidRef(ref) {
    if (typeof ref !== 'string') return false;
    if (!ref.startsWith('refs/')) return false;
    // A ref must have a valid path after refs/
    return /^(refs\/heads\/|refs\/tags\/)[^\s~^:?*\[]+$/.test(ref);
}

/**
 * Checks whether a branch name is valid.
 * 
 * @param {string} name
 * @returns {boolean}
 */
function isValidBranchName(name) {
    if (typeof name !== 'string') return false;
    if (name.trim() === '') return false;
    if (name.includes(' ')) return false;
    if (name.includes('..')) return false;
    if (name.includes('~')) return false;
    if (name.includes('^')) return false;
    if (name.includes(':')) return false;
    return true;
}

/**
 * Checks whether a path value is usable.
 * 
 * @param {string} filePath
 * @returns {boolean}
 */
function isValidPath(filePath) {
    if (typeof filePath !== 'string') return false;
    if (filePath.trim() === '') return false;
    return true;
}

/**
 * Throws an error if a required value is missing.
 * 
 * @param {any} value
 * @param {string} message
 */
function assertRequired(value, message) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        const error = new Error(message || 'Required value is missing');
        error.name = 'ValidationError';
        throw error;
    }
}

module.exports = {
    isValidHash,
    isValidObjectType,
    isValidRef,
    isValidBranchName,
    isValidPath,
    assertRequired
};
