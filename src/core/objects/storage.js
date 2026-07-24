
const fs = require('../../utils/filesystem')
const path = require('../../utils/paths')
const { compress, decompress } = require('../../utils/compression')
const { sha1 } = require('../../utils/hash')
const { objectPath } = require('../repository/paths')
const { 
    ObjectNotFoundError, 
    InvalidObjectError, 
    AmbiguousObjectError,
    ValidationError
} = require('../../errors')
const { isValidObjectType } = require('../../utils/validation')
const { OBJECT_TYPES } = require('../../constants')

/**
 * Serialize mygit object.
 * Format: `<type> <size>\0<content>`
 * @param {string} type 
 * @param {string} content
 * @returns {Buffer} 
 */
function serializeObject(type, content) {
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content)

    const header = Buffer.from(`${type} ${body.length}\0`)

    return Buffer.concat([header, body])
}

/**
 * Parse serialized mygit object
 * @param {Buffer} data 
 */
function parseObject(data) {
    const nullIndex = data.indexOf(0)

    if (nullIndex === -1) {
        throw new InvalidObjectError('Missing object header separator')
    }

    const header = data.slice(0, nullIndex).toString()
    const [type, size] = header.split(' ')
    const content = data.slice(nullIndex + 1)

    if (content.length !== Number(size)) {
        throw new InvalidObjectError(`Object size mismatch`)
    }

    return { header, type, size: Number(size), content}
}

/**
 * Write mygit object
 * @param {Repository} repo 
 * @param {string} type 
 * @param {*} content 
 * @returns {String} 
 */
function writeObject(repo, type, content) {
    if (!isValidObjectType(type)) {
        throw new InvalidObjectError(`Invalid object type: ${type}`)
    }
    const serialized = serializeObject(type, content)

    const hash = sha1(serialized)

    const filePath = objectPath(repo, hash)

    if (!fs.exists(filePath)) {
        fs.ensureDir(path.dirname(filePath))

        const compressed = compress(serialized)

        fs.writeFile(filePath, compressed)
    }

    return hash
}

/**
 * Read and parse a mygit object 
 * 
 * @param {Repository} repo 
 * @param {String} hash 
 * @returns {Object}
 */
function readObject(repo, hash) {
    const filePath = objectPath(repo, hash)

    if (!fs.exists(filePath)) {
        throw new ObjectNotFoundError(hash)
    }

    const compressed = fs.readFileBuffer(filePath)

    const serialized = decompress(compressed)

    return parseObject(serialized)
}

/**
 * Check if object exists
 * @param {*} repo 
 * @param {*} hash 
 * @returns 
 */
function objectExists(repo, hash) {
    return fs.exists(objectPath(repo, hash))
}

/**
 * Compute the hash of an object without writing it.
 *
 * @param {string} type
 * @param {Buffer|string} content
 * @returns {string}
 */
function computeObjectHash(type, content) {
    const serialized = serializeObject(type, content)
    return sha1(serialized)
}

// To implement (maybe) - findObjectByPrefix(prexix) to find a full hash from its short version

/**
 * Given a hash (at least for digits long) it resolves and returns the full hash of a git oobject
 * 
 * @param {Repository} repo 
 * @param {string} objectName 
 * @returns {string}
 */
function resolveObjectHash(repo, objectName) {
    if (!objectName || typeof objectName !== 'string' || objectName.length < 4) {
        throw new ValidationError('A hash is required and must be of type string.')
    }
    const dir = objectName.slice(0, 2)
    const objDir = path.join(repo.paths.objects, dir)

    if (!fs.exists(objDir)) {
        return null
    }

    const files = fs.listDir(objDir)
    const suffix = objectName.slice(2)

    // Find files that start with the remaining prefix

    const matches = files.filter( file => file.startsWith(suffix))

    if (matches.length === 0) {
        throw new ObjectNotFoundError(objectName)
    }

    if (matches.length > 1) {
        const candidates = []
        for (const match of matches) {
            const fullHash = dir + match;
            const { type } = readObject(repo, fullHash);
            candidates.push(`${fullHash} ${type}`);
        }
        throw new AmbiguousObjectError(objectName, candidates)
    }
    // Return the full hash
    return dir + matches[0]
}

module.exports = {
    serializeObject,
    parseObject,
    writeObject,
    readObject,
    objectExists,
    computeObjectHash,
    resolveObjectHash
}