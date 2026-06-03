const { readObject, writeObject } = require('./storage')
const { parseCommit, parseSignature } = require('./parser')
const { ValidationError, InvalidObjectError } = require('../../errors')

// Helpers

function formatSignature(signature) {
    return (
        `${signature.name} ` +
        `<${signature.email}> ` +
        `${signature.timestamp} ` +
        `${signature.timezone}`
    )
}

function validateCommitData({tree, author, committer}) {
    if (!tree)      throw new ValidationError('Commit tree is required')
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
    validateCommitData({tree, author, commiter})

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

    return writeObject(repo, 'commit', content)
}

function readCommitObject(repo, hash) {
    const object = readObject(repo, hash)

    if (object.type !== 'commit') {
        throw new InvalidObjectError(`${hash} is not a commit object`)
    }

    return parseCommit(object.content)
}

// QUERIES

function getCommitTree(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.tree
}

function getcommitParents(repo, hash) {
    const commit = readCommitObject(repo, hash)

    return commit.parents
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
    getcommitParents,
    getCommitMessage,
    getCommitAuthor,
    getCommitCommitter,
    validateCommitData
}