const { writeObject, readObject } = require('./storage')
const { ValidationError, InvalidObjectError } = require('../../errors')
const { isValidHash, isValidObjectType, isValidTagName, isValidSignature } = require('../../utils/validation')
const { formatSignature, parseSignature } = require('./signatures')
const { parseTag } = require('./parser')
const { OBJECT_TYPES } = require('../../constants')


// HLEPERS

function validateTagData({object, type, tag, tagger}) {
    if (!object || !isValidHash(object)) throw new ValidationError('Tag object is required')
    if (!type || !isValidObjectType(type)) throw new ValidationError('Tag target type is required')
    if (!tag || !isValidTagName(tag)) throw new ValidationError('Tag name is required')
    if (!tagger || !isValidSignature(tagger)) throw new ValidationError('Tagger information is required')
}

/**
 * Serialize annotated tag object content
 * Format:
 *  `object <hash>`
 *  `type <type>`
 *  `tag <tag-name>`
 *  `tagger <name> <email> <timestamps> <timezone>`
 * 
 *  `<message`
 * @param {*} param0 
 * @returns 
 */
function serializeTagObject({object, type, tag, tagger, message=''}) {
    validateTagData({object, type, tag, tagger})

    const lines = [
        `object ${object}`,
        `type ${type}`,
        `tag ${tag}`,
        `tagger ${formatSignature(tagger)}`,
        '',
        message
    ]

    return Buffer.from(lines.join('\n'))
}

// ANNOTATED TAGS

/**
 * Create annotated tag object
 */
function writeTagObject(repo, {object, type, tag, tagger, message=''}) {
    const content = serializeTagObject({object, type, tag, tagger, message})

    return writeObject(repo, OBJECT_TYPES.TAG, content)
}

function readTagObject(repo, hash) {
    const object =  readObject(repo, hash)

    if (object.type !== OBJECT_TYPES.TAG) {
        throw new InvalidObjectError(`${hash} is not a tag object`)
    }

    return parseTag(object.content)
}

// LIGHTWEIGHT TAGS

/**
 * Extract tagged object hash
 * @param {*} repo 
 * @param {*} hash 
 * @returns 
 */
function getTaggedObject(repo, hash) {
    const tag = readTagObject(repo, hash)

    return tag.object
}

/**
 * Extract tagged object type
 * @param {*} repo 
 * @param {*} hash 
 * @returns 
 */
function getTaggedType(repo, hash) {
    const tag = readTagObject(repo, hash)

    return tag.type
}

module.exports = {
    serializeTagObject,
    formatSignature,
    writeTagObject,
    readTagObject,
    getTaggedObject,
    getTaggedType
}

