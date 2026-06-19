
const fs = require('../../utils/filesystem')
const path = require('../../utils/paths')
const { compress, decompress } = require('../../utils/compression')
const { sha1 } = require('../../utils/hash')
const { objectPath } = require('../repository/paths')
const { ObjectNotFoundError, InvalidObjectError } = require('../../errors')
const { isValidObjectType } = require('../../utils/validation')

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

    return { type, size: Number(size), content}
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

module.exports = {
    serializeObject,
    parseObject,
    writeObject,
    readObject,
    objectExists
}