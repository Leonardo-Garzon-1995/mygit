const { readObject, writeObject } = require('./storage')
const { parseTree } = require('./parser')
const { OBJECT_TYPES } = require('../../constants')
const { isValidHash } = require('../../utils/validation')
const { ValidationError, InvalidObjectError, InvalidHashError } = require('../../errors')

/* Tree object format:
    tree <size>\0<entries>

    entry format:
    <mode> <name>\0<hash>
    
    hash is a sha1 20-byte-binary
*/

// Helpers

/**
 * Validate a tree entry
 * 
 * @param {Object} entry 
 */
function validateTreeEntry(entry) {
    if (!entry)      throw new ValidationError('Tree entry is required')
    if (!entry.mode) throw new ValidationError('Tree entry mode is required')
    if (typeof entry.mode !== 'string') throw new ValidationError('Tree entry mode must be of type string')
    if (!entry.name) throw new ValidationError('Tree entry name is required')
    if (typeof entry.name !== 'string') throw new ValidationError('Tree entry name must be of type string')
    if (!entry.hash) throw new ValidationError('Tree entry hash is required')
    if (!isValidHash(entry.hash)) throw new InvalidHashError(entry.hash)
}

/**
 * Serialize tree entries into git tree format
 * 
 * @param {Array<Object>} entries 
 * @returns  {Buffer}
 */
function serializeTree(entries) {
    const chunks = []

    const sorted = [...entries].sort(
        (a, b) => a.name.localeCompare(b.name)
    )

    for (const entry of sorted) {
        validateTreeEntry(entry)

        const header = Buffer.from(`${entry.mode} ${entry.name}\0`)

        const hash = Buffer.from(entry.hash, 'hex')

        chunks.push(header)
        chunks.push(hash)
    }

    return Buffer.concat(chunks)
}

// TREE OBJECTS

/**
 * Create a tree object
 * 
 * @param {Repository} repo 
 * @param {Array<Object>} entries 
 * @returns {string}
 */
function writeTreeObject(repo, entries) {
    if (!Array.isArray(entries)) {
        throw new ValidationError('Tree entries must be an array')
    }

    const content = serializeTree(entries)

    return writeObject(repo, OBJECT_TYPES.TREE, content)
}

/**
 * Read and parse a tree object
 * 
 * @param {Repository} repo 
 * @param {string} hash 
 * @returns {Array<Object>}
 */
function readTreeObject(repo, hash) {
    const object = readObject(repo, hash)

    if (object.type !== OBJECT_TYPES.TREE) {
        throw new InvalidObjectError(`${hash} is not a tree object`)
    }

    return parseTree(object.content)
}


// Queries

/**
 * Find an entry by name
 * 
 * @param {Repository} repo 
 * @param {string} treeHash 
 * @param {string} name 
 * @returns {Object/null}
 */
function findEntry(repo, treeHash, name) {
    const entries = readTreeObject(repo, treeHash)

    return (entries.find(entry => entry.name === name) || null)
}

/**
 * Find an entry hash
 * 
 * @param {Repository} repo 
 * @param {string} treeHash 
 * @param {string} name 
 * @returns {string}
 */
function findEntryHash(repo, treeHash, name) {
    const entry = findEntry(repo, treeHash, name)

    return entry ? entry.hash : null
}

/**
 * Returns an array with the names of tree entry
 * @param {Repository} repo 
 * @param {string} treeHash 
 * @returns {Array<string>}
 */
function getEntryNames(repo, treeHash) {
    return readTreeObject(repo, treeHash).map(entry => entry.name)
}

// To implement later 
// findEntryByPath
module.exports = {
    // serializeTree,
    writeTreeObject,
    readTreeObject,
    findEntry,
    findEntryHash,
    validateTreeEntry
}