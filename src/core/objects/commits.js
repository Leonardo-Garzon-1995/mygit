const { readObject, writeObject } = require('./storage')
const { parseCommit } = require('./parser')
const { OBJECT_TYPES } = require('../../constants')
const { isValidHash } = require('../../utils/validation')
const { ValidationError, InvalidObjectError, InvalidHashError } = require('../../errors')
const { formatSignature, parseSignature } = require('./signatures')

// Helpers

// Refactor to make validation stronger
function validateCommitData({tree, author, committer}) {
    if (!tree)      throw new ValidationError('Commit tree is required')
    if (!isValidHash(tree)) throw new InvalidHashError(tree)
    if (!author)    throw new ValidationError('Commit author is required')
    if (!committer) throw new ValidationError('Commit committer is required')
}

// ------------------------------------------------------------------

function serializeCommit({
    tree,
    parents = [],
    author,
    committer,
    message = ''
}) {
    validateCommitData({tree, author, committer})

    const lines = [] 

    lines.push(`tree ${tree}`)

    for (const parent of parents) {
        lines.push(`parent ${parent}`)
    }

    lines.push(`author ${formatSignature(author)}`)
    lines.push(`committer ${formatSignature(committer)}`)

    lines.push('')

    lines.push(message)

    return Buffer.from(lines.join('\n'))
}

function writeCommitObject(repo, {
    tree,
    parents = [],
    author,
    committer,
    message = ''
}) {
    const content = serializeCommit({tree, parents, author, committer, message})

    return writeObject(repo, OBJECT_TYPES.COMMIT, content)
}

function readCommitObject(repo, hash) {
    const object = readObject(repo, hash)

    if (object.type !== OBJECT_TYPES.COMMIT) {
        throw new InvalidObjectError(`${hash} is not a commit object`)
    }

    const commit = parseCommit(object.content)

    commit.author = parseSignature(commit.author)
    commit.committer = parseSignature(commit.committer)

    return commit
}

// QUERIES

function getCommitTree(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.tree
}

function getCommitParents(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.parents
}

function getFirstParent(repo, hash) {
    const parents = getCommitParents(repo, hash)

    return parents[0] || null
}

function getCommitMessage(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.message
}

function getCommitAuthor(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.author
}

function getCommitCommitter(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.committer
}

module.exports = {
    formatSignature,
    serializeCommit,
    writeCommitObject,
    readCommitObject,
    getCommitTree,
    getCommitParents,
    getFirstParent,
    getCommitMessage,
    getCommitAuthor,
    getCommitCommitter,
    validateCommitData
}