/**
 * @file cat-file
 * @description Implements the 'cat-file' command. This command eads an object from the object database and prints its type, size, or pretty content.
 * Short hash prefixes are resolved before the object is loaded.
 */

const { ValidationError, InvalidHashError } = require('../errors')
const { isValidObjectHash } = require('../utils/validation')
const Repository = require('../core/repository/repository')
const { readObject, resolveObjectHash } = require('../core/objects/storage')
const Output = require('../cli/output')
const { prettyPrintObject } = require('../core/objects/formatter')


module.exports = function catFile(args=[], options={}) {
    const key = Object.keys(options)[0]
    const value = Object.values(options)[0]

    if (!key || !value) {
        throw new ValidationError(`Invalid or incomplet input\nUsage: mygit cat-file -p|-s|-t <hash-object>`)
    }

    const repo = Repository.find()
    
    let hash = resolveObjectHash(repo, value)
    if (!isValidObjectHash(hash)) {
        throw new InvalidHashError(hash)
    }

    const { type, size, content } = readObject(repo, hash)

    switch(key) {
        case 's':
            Output.info(size)
            break
        case 't': 
            Output.info(type)
            break
        case 'p':
            prettyPrintObject(type, content)
            break
        default:
            throw new ValidationError(`Invalid or incomplete input.\nUsage: mygit cat-file -p|-s|-t <hash-object>`)
    }
}