const fs = require('../../utils/filesystem')
const { writeObject, readObject, objectExists } = require('./storage')
const { InvalidObjectError, ValidationError } = require('../../errors')

// constants not yet implemented
const { OBJECT_TYPES } = require('../../constants')

/**
 * Crate blob object from raw content
 * 
 * @param {*} repo 
 * @param {*} content 
 * @returns 
 */
function writeBlob(repo, content) {
    validateBlobContent(content)

    return writeObject(repo, OBJECT_TYPES.BLOB, content)
}

/**
 * Create blob from file contents
 * @param {*} repo 
 * @param {*} filePath 
 * @returns 
 */
function hashFile(repo, filePath) {
    if (!fs.existsSync(filePath)) {
        throw new ValidationError(`File does not exists: ${filePath}`)
    }

    const content =  fs.readFileSync(filePath)

    return writeBlob(repo, content)
}

// BLOB READING

/**
 * Read blob object - raw content
 * @param {*} repo 
 * @param {*} hash 
 * @returns 
 */
function readBlob(repo, hash) {
    const object = readObject(repo, hash) 

    if (object.type !== OBJECT_TYPES.BLOB) {
        throw new InvalidObjectError(`${hash} is not a blob object`)
    }

    return object.content
}

function readBlobAsString(repo, hash) {
    return readBlob(repo, hash).toString('utf8')
}

// BLOB WRITING

function writeBlobToFile(repo, hash, filePath) {
    const content = readBlob(repo, hash)

    fs.writeFileSync(filePath, content)
}

// UTILITIED

function validateBlobContent(content) {
    if (!Buffer.isBuffer(content) && typeof content !== 'string') {
        throw new ValidationError('Blob content must be a Buffer or string')
    }
}

function blobExists(repo, hash) {
    return objectExists(repo, hash)
}

function getBlobSize(repo, hash) {
    return readBlob(repo, hash).length 
}

function blobMatchesFile(repo, hash, filePath) {
    if (!fs.existsSync(filePath)) {
        return false
    }

    const blobContent = readBlob(repo, hash)

    const fileContent = fs.readFileSync(filePath)

    return blobContent.equals(fileContent)
}

module.exports = {
    writeBlob,
    writeBlobToFile,
    hashFile,
    readBlob,
    readBlobAsString,
    validateBlobContent,
    blobExists,
    getBlobSize,
    blobMatchesFile
}
