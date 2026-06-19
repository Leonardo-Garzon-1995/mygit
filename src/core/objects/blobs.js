const fs = require("../../utils/filesystem");
const { writeObject, readObject, objectExists } = require("./storage");
const { InvalidObjectError, ValidationError } = require("../../errors");

const { OBJECT_TYPES } = require('../../constants')

/**
 * Crate blob object from raw content
 *
 * @param {*} repo
 * @param {*} content
 * @returns
 */
function writeBlobObject(repo, content) {
  validateBlobContent(content);

  return writeObject(repo, OBJECT_TYPES.BLOB, content);
}

// Rename hashFile to createBlobFromFile - this is gonna be userd by hash-object

/**
 * Create blob from file contents
 * @param {*} repo
 * @param {*} filePath
 * @returns
 */
function hashFile(repo, filePath) {
    if (!fs.exists(filePath) || !fs.isFile(filePath)) {
        throw new ValidationError(`File does not exists: ${filePath}`)
    }

    const content =  fs.readFile(filePath)

  return writeBlobObject(repo, content);
}

// BLOB READING

/**
 * Read blob object - raw content
 * @param {*} repo
 * @param {*} hash
 * @returns
 */
function readBlobObject(repo, hash) {
  const object = readObject(repo, hash);

  if (object.type !== OBJECT_TYPES.BLOB) {
    throw new InvalidObjectError(`${hash} is not a blob object`);
  }

  return object.content;
}

function readBlobAsString(repo, hash) {
    return readBlobObject(repo, hash).toString('utf8')
}

// BLOB WRITING

function writeBlobToFile(repo, hash, filePath) {
    const content = readBlobObject(repo, hash)

    fs.writeFile(filePath, content)
}

// UTILITIED

function validateBlobContent(content) {
  if (!Buffer.isBuffer(content) && typeof content !== "string") {
    throw new ValidationError("Blob content must be a Buffer or string");
  }
}

function blobExists(repo, hash) {
  return objectExists(repo, hash);
}

function getBlobSize(repo, hash) {
    return readBlobObject(repo, hash).length 
}

function blobMatchesFile(repo, hash, filePath) {
    if (!fs.exists(filePath)) {
        return false
    }

  const blobContent = readBlob(repo, hash);

    const fileContent = fs.readFile(filePath)

  return blobContent.equals(fileContent);
}

// To implement later

/* 
- readBlobMetadata()
- readBlobLines
- crate a blob from file*/

module.exports = {
    writeBlobObject,
    writeBlobToFile,
    hashFile,
    readBlobObject,
    readBlobAsString,
    validateBlobContent,
    blobExists,
    getBlobSize,
    blobMatchesFile
}

/** Returns blob content as an array of lines. */
function readBlobLines(repo, hash) {
  const content = readBlobObject(repo, hash);

  return content.toString("utf8").split(/\r?\n/);
}

module.exports = {
  writeBlobObject,
  writeBlobToFile,
  hashFile,
  readBlobObject,
  readBlobAsString,
  readBlobMetadata,
  readBlobLines,
  validateBlobContent,
  blobExists,
  getBlobSize,
  blobMatchesFile,
};
