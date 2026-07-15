const { readIndex, isIndexEmpty } = require('../core/index')
const { writeTree } = require('./write-tree-service')

const { writeCommitObject } = require('../core/objects/commits')

const {
    getCurrentBranch,
    resolveHEAD,
    isSymbolicHEAD
} = require('../core/refs/head')

const {
    updateBranch
} = require('../core/refs/branches')

const { createSignature } = require('../core/objects/signatures')

const { ValidationError } = require('../errors')

/**
 * Resolve commit parent(s).
 *
 * Returns:
 * []
 *     Initial commit
 *
 * [<hash>]
 *     Normal commit
 *
 * @param {Repository} repo
 * @returns {string[]}
 */
function resolveParents(repo) {
    const parent = resolveHEAD(repo)

    return parent ? [parent] : []
}

/**
 * Create a commit from the current index.
 *
 * Flow:
 * 1. Validate commit.
 * 2. Build tree.
 * 3. Resolve parents.
 * 4. Create commit object.
 * 5. Update current reference.
 *
 * @param {Repository} repo
 * @param {Object} options
 * @returns {string}
 */
function commit(
    repo,
    {
        message,
        authorName,
        authorEmail
    }
) {
    if (!message || message.trim() === '') {
        throw new ValidationError(
            'Commit message is required'
        )
    }

    const index = readIndex(repo)

    if (isIndexEmpty(index)) {
        throw new ValidationError(
            'Nothing to commit'
        )
    }

    const tree = writeTree(repo)

    const signature =
        createSignature(authorName, authorEmail)

    const commitHash = writeCommitObject(repo, {
        tree,
        parents: resolveParents(repo),
        author: signature,
        committer: signature,
        message
    })

    if (isSymbolicHEAD(repo)) {
        updateBranch(
            repo,
            getCurrentBranch(repo),
            commitHash
        )
    } else {
        // Detached HEAD support
        // TODO:
        // updateHEAD(repo, commitHash)
    }

    return commitHash
}

/**
 * Return current HEAD commit hash.
 *
 * @param {Repository} repo
 * @returns {string|null}
 */
function getHeadCommit(repo) {
    return resolveHEAD(repo)
}

module.exports = {
    commit,
    getHeadCommit,
    resolveParents
}