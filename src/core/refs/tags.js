// fs is not yet implemented
const { readFile, writeFile, exists, removeFile, ensureDir } = require('../../utils/fs')
// validation.js is not implemented yet
const { isValidHash, isValidRef } = require('../../utils/validation')

const { tagPath } = require('../repository/paths')
const { ValidationError, InvalidReferenceError } = require('../../errors')
const { write } = require('fs')

// HELPERS

function getTagRef(tagName) {
    return `refs/tags/${tagname}`
}

function validateTagname(tagName) {
    if (typeof tagName !== 'string' || tagname.trim() === '') {
        throw new ValidationError('Tag name is required')
    }

    const invalid = [
        '..',
        '~',
        '^',
        ':',
        '?',
        '*',
        '[',
        '\\'
    ]

    for (const token of invalid) {
        if (tagName.includes(token)) {
            throw new ValidationError(`Invalid tag name: ${tagname}. Tag name includes inavlid char: '${token}'`)
        }
    }
}

// TAG references 

/**
 * Create a lightweight tag
 * @param {*} repo 
 * @param {*} tagName 
 * @param {*} hash 
 */
function createTag(repo, tagName, hash) {
    validateTagname(tagName)

    if (!isValidHash(hash)) {
        throw new ValidationError(`Invalid object hash: ${hash}`)
    }

    const filePath = tagPath(repo, tagName)
    ensureDir(require('path').dirname(filePath))

    writeFile(filePath, `${hash}\n`)
}


/**
 * Reaf lightweight tag reference
 * @param {*} repo 
 * @param {*} tagName 
 * @returns 
 */
function readTag(repo, tagName) {
    validateTagname(tagName)

    const filePath = tagPath((repo, tagName))
    
    if (!exists(filePath)) {
        throw new InvalidReferenceError(`Tag '${tagName}' does not exist`)
    }

    return readFile(filePath).trim()
}

/**
 * Update existing tag
 * @param {*} repo 
 * @param {*} tagName 
 * @param {*} hash 
 */
function updateTag(repo, tagName, hash) {
    if (!tagExists(repo, tagName)) {
        throw new InvalidReferenceError(`Tag '${tagName}' does not exist`)
    }

    createTag(repo, tagName, hash)
}

function deleteTag(repo, tagName) {
    const filePath = tagPath(repo, tagName)

    if (!exists(filePath)) {
        throw new InvalidReferenceError(`Tag '${tagName}' does not exist`)
    }

    removeFile(filePath)
}

// Queries
function tagExists(repo, name) {
    validateTagname(repo, name)

    return exist(tagPath(repo, name))
}

function resolveTag(repo, name) {
    return readTag(repo, name)
}

function getTagPath(repo, tagName) {
    return tagPath(repo, tagName)
}

function getTagReference(tagName) {
    validateTagName(tagName)

    const ref = getTagRef(tagName)

    if (!isValidRef(ref)) {
        throw new ValidationError(
            `Invalid tag reference: ${ref}`
        )
    }

    return ref
}

module.exports = {
    createTag,
    readTag,
    updateTag,
    deleteTag,

    tagExists,
    resolveTag,

    getTagPath,
    getTagReference,

    validateTagname
}


