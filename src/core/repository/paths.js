const path = require('../../utils/paths')
const { isValidHash, isValidRef } = require('../../utils/validation')
const { InvalidHashError, InvalidReferenceError } = require('../../errors')


/**
 * Returns the path of a given git object by its hash
 * 
 * @param {Repository} repo 
 * @param {string} hash 
 * @returns {string} 
 */
function objectPath(repo, hash) {
    if (!isValidHash(hash)) {
        throw new InvalidHashError(hash)
    }

    return path.join(repo.paths.objects, hash.slice(0, 2), hash.slice(2))
}

function refPath(repo, ref) {
    if (!isValidRef(ref)) {
        throw new InvalidReferenceError(`Invalid reference format: ${ref}`)
    }
    return repo.resolveMygitPath(ref)
}

function branchPath(repo, branchName) {
    return repo.resolveMygitPath('refs', 'heads', branchName)
}
function headPath(repo) {
    return repo.paths.head
}

function indexPath(repo) {
    return repo.paths.index
}

function configPath(repo) {
    return repo.paths.config
}

function tagPath(repo, tagName) {
    return repo.resolveMygitPath('refs', 'tags', tagName)
}

module.exports = {
    objectPath,
    refPath,
    branchPath,
    headPath,
    indexPath,
    tagPath
}