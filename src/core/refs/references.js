const path = require('../../utils/paths')
const fs = require('../../utils/filesystem')
const { ValidationError, InvalidReferenceError } = require('../../errors')
const { isValidHash, isValidRef, isValidBranchName } = require('../../utils/validation')

function validateReferenceName(name) {
    if (typeof name !== 'string' || name.trim() === '') {
        throw new ValidationError(`Invalid reference: ${name}`)
    }
}


// Core operations 

function createReference(filePath, hash) {
    if (hash !== '' && !isValidHash(hash)) {
        throw new ValidationError(`Invalid hash: ${hash}`)
    }

    fs.ensureDir(path.dirname(filePath))

    fs.writeFile(filePath, `${hash}\n`)
}

function readReference(filePath) {
    if (!fs.exists(filePath)) {
        throw new InvalidReferenceError(`Reference dos not exist: ${filePath}`)
    }

    return fs.readFile(filePath).trim()
}

function updateReference(filePath, hash) {
    if (!fs.exists(filePath)) {
        throw new InvalidReferenceError(`Reference does not exist: ${filePath}`)
    }
    if (!isValidHash(hash)) {
        throw new ValidationError(`Invalid hash: ${hash}`)
    }

    fs.writeFile(filePath, `${hash}\n`)
}

function deleteReference(filePath) {
    if (!fs.exists(filePath)) {
        throw new InvalidReferenceError(`Reference does not exist: ${filePath}`)
    }

    fs.removeFile(filePath)
}

// Queries 

function referenceExists(filePath) {
    return fs.exists(filePath)
}

/**
 * Build full reference path
 * 
 * Example: refs/heads/main or refs/tags/v1.0.0
 * 
 * @param {string} namespace 
 * @param {string} name 
 * @returns {string}
 */
function buildReference(namespace, name) {
    validateReferenceName(name)

    const ref = `refs/${namespace}/${name}`

    if (!isValidRef(ref)) {
        throw new ValidationError(`Invalid reference: ${ref}`)
    }

    return ref
}

module.exports = {
    createReference,
    readReference,
    updateReference,
    deleteReference,
    referenceExists,
    buildReference,
    validateReferenceName
}
