/* COMMIT TREE FORMAT
commit <size>\0tree <tree hash>
parent <parent hash>
author <name> <email> <timestamp> <timezone>
commiter <name> <email> <timestamp> <timezone>

<commit message>
*/
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

const hashObjectContent = require('../helpers/hashObjectContent')

/**
 * Builds and stores a commit object for a tree, including author metadata and optional parent commits.
 * Returns the SHA-1 hash of the newly stored commit object.
 * @param {string} treeHash - Hash of the tree object to commit
 * @param {string} message - Commit message to store in the commit object
 * @param {string|string[]|null} [parentHash=null] - Parent commit hash or hashes, if any
 * @returns {string} Hash of the stored commit object
 * @throws {Error} If the tree hash or commit message is missing
 */
function commitTree(treeHash, message, parentHash = null) {
    //  1. Validate inputs
    if (!treeHash) {
        console.error('Error: tree hash required')
        process.exit(1)
    }
    if (!message) {
        console.error('Error: commit message required')
        process.exit(1)
    }

    // Need to implement configure file laer
    const authorName = process.env.MYGIT_AUTHOR_NAME || 'Leonardo Garzon'
    const authorEmail = process.env.MYGIT_AUTHOR_EMAIL || 'example@gmail.com'
    const committerName = authorName
    const committerEmail = authorEmail

    // 3. Get timestamp
    // Unix timestamp
    const timestamp = Math.floor(Date.now() / 1000)

    // Get timezone offset
    const timezoneOffset = -new Date().getTimezoneOffset()
    const hours = Math.floor(Math.abs(timezoneOffset) / 60)
    const minutes = Math.abs(timezoneOffset) % 60
    const sign = timezoneOffset >= 0 ? '+' : '-'
    const timezone = `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`

    // 4. Build the content of the commit 

    let commitContent =  `tree ${treeHash}\n`

    // add parent if this isn't the first commit
    if (parentHash) {
    if (Array.isArray(parentHash)) {
        for (const parent of parentHash) {
            commitContent += `parent ${parent}\n`
        }
    } else {
        commitContent += `parent ${parentHash}\n`
    }
}

    commitContent += `author ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n`
    commitContent += `committer ${committerName} <${committerEmail}> ${timestamp} ${timezone}\n`
    commitContent += `\n${message}\n`

    const commitHash = hashObjectContent(Buffer.from(commitContent), 'commit')

    return commitHash
}

module.exports = commitTree
