// Performs a commit operation
/* 
Tha is:
Read index, build tree, read current HEAD,
create commit object, update branch reference, return commit hash
*/

const { readIndex, isIndexEmpty } = require('../core/index/index')
const { writeTreeObject } = require('../core/objects/trees')
const { writeCommitObject } = require('../core/objects/commits')
const { getCurrentBranch } = require('../core/refs/head')
const { readBranch, updateBranch } = require('../core/refs/branches')
const { createSignature } = require('../core/objects/signatures')
const { ValidationError } =  require('../errors')
const { resolve } = require('../utils/paths')

/**
 * Convert index entries into tree entries
 * @param {Object} index 
 * @returns {Array<Object>}
 */
function buildTreeEntries(index) {
    const entries = []

    for (const [filePath, entry] of Object.entries(index.entries)) {
        entries.push({
            mode: entry.mode,
            name: filePath,
            hash: entry.hash
        })
    }

    return entries
}   

function resolveParents(repo) {
    try {
        const branchName = getCurrentBranch(repo)
        const parentHash = readBranch(repo, branchName)
        if (!parentHash) {
            return []
        }

        return [parentHash]
    } catch (error) {
        return []
    }
}

function commit(repo, {message, authorName, authorEmail}) {
    if (!message || message.trim() === '') {
        throw new ValidationError('Commit message is required')
    }

    const index = readIndex(repo) 
    if (isIndexEmpty(index)) {
        throw new ValidationError('Nothing to commit')
    }

    const treeEntries = buildTreeEntries(index)

    const treeHash = writeTreeObject(repo, treeEntries)

    const parents = resolveParents(repo)

    const signature = createSignature(authorName, authorEmail)

    const commitHash = writeCommitObject(repo, {
        tree: treeHash,
        parents,
        author: signature,
        committer: signature,
        message
    })

    const branchName = getCurrentBranch(repo)

    updateBranch(repo, branchName, commitHash)

    return commitHash
}

function getHeadCommit(repo) {
    try {
        const branchName = getCurrentBranch(repo) 
        const hash = readBranch(repo, branchName) 

        return hash || null
    } catch (error) {
        return null
    }
}

module.exports = {
    commit,
    getHeadCommit,

    buildTreeEntries,
    resolveParents
}