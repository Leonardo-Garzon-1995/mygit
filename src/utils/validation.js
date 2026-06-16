/**
 * @fileoverview Centralized validation utility module.
 * Provides reusable validation helpers shared across multiple subsystems.
 */

const { OBJECT_TYPES } = require('../constants')

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
    const validTypes = Object.values(OBJECT_TYPES);
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
    if (typeof name !== 'string' || name.trim() == '') return false;
    if (name.trim() === '') return false;
    if (name.includes(' ')) return false;
    if (name.includes('..')) return false;
    if (name.includes('~')) return false;
    if (name.includes('^')) return false;
    if (name.includes(':')) return false;
    if (name.includes('*')) return false;
    if (name.includes('[')) return false;
    if (name.includes('\\')) return false;
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
 * Checks weather a tag name is valid
 * 
 * @param {string} tagName 
 * @returns {boolean}
 */
function isValidTagName(tagName) {
        if (typeof tagName !== 'string') {
            return false
        }

        const invalid = ['..', '~', '^', ':', '?', '*', '[', '\\']

        for (const token of invalid) {
            if (tagName.includes(token)) {
                return false
            }
        }
    
        return true
}

/**
 * Checks whether a signature is valid
 * 
 * @param {string} signature 
 * @returns {boolean}
 */
function isValidSignature(signature) {
    if (typeof signature !== 'string') return false;
    
    return /^(.*?) <(.*?)> (\d+) ([+-]\d{4})$/.test(signature)
}

/**
 * Checks whether a string is a valid SHA-1 object hash. (case-insensitive)
 * A valid hash must be exactly 40 hexadecimal characters (0-9, a-f, A-F).
 * 
 * @param {string} hash - The hash string to validate. 
 * @returns {boolean} True if valid SHA-1 format, otherwise false.
 */
function isValidObjectHash(hash) {
    return (typeof hash === "string" && /^[a-fA-F0-9]{40}$/.test(hash));
}

/**
 * Validates whether a string has a basic email format.
 * Note: This is a simplified validation, not fully RFC-compliant.
 * 
 * @param {string} email - Email address to validate. 
 * @returns {boolean} True if email format is valid, otherwise false.
 */
function isValidEmail(email) {
    return (typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

/**
 * Checks whether an object is a valid repository structure.
 *
 * Required properties:
 * - worktree
 * - mygitDir
 * - paths
 *
 * @param {object} repo - Repository object to validate.
 * @returns {boolean} True if repository is valid, otherwise false.
 */
function isValidRepository(repo) {
    return (repo !== null && typeof repo === "object" && Object.prototype.hasOwnProperty.call(repo, 'worktree') && Object.prototype.hasOwnProperty.call(repo, 'mygitDir') && Object.prototype.hasOwnProperty.call(repo, 'paths'));
}

/**
 * Validates a commit message.
 * Must be a non-empty string after trimming whitespace.
 *
 * @param {string} message - Commit message.
 * @returns {boolean} True if valid, otherwise false.
 */
function isValidCommitMessage(message) {
    return (typeof message === "string" && message.trim().length !== 0);
}



module.exports = {
    isValidHash,
    isValidObjectType,
    isValidRef,
    isValidTagName,
    isValidBranchName,
    isValidPath,
    isValidSignature,
    assertRequired,
    isValidObjectHash,
    isValidEmail,
    isValidRepository,
    isValidCommitMessage
};
