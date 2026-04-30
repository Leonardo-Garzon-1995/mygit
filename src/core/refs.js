const fs = require('fs')
const path = require('path')

const { getRepoPath } = require('./repository')
const { ref } = require('process')

function getHEADPath() {
    return path.join(getRepoPath(), 'HEAD')
}

function readHEAD() {
    const headPath = getHEADPath()

    if (!fs.existsSync(headPath)) {
        throw new Error('HEAD not found')
    }

    return fs.readFileSync(headPath, 'utf-8').trim()
}

/**
 * Returns:
 * - { type: 'ref', ref: 'refs/heads/main' }
 * - { type: 'commit', hash: 'abc123' }
 */
function resolveHEAD() {
    const content = readHEAD()

    if (content.startsWith('ref: ')) {
        return { type: 'ref', ref: content.slice(5) }
    }

    return { type: 'commit', hash: content }
}

function getHEADCommit() {
    const head = resolveHEAD()
    if (head.type === 'commit') {
        return head.hash
    }

    const refPath = path.join(getRepoPath(), head.ref)
    if (!fs.existsSync(refPath)) {
        return null 
    }

    return fs.readFileSync(refPath, 'utf-8').trim()

}

function updateHEADCommit(hash) {
    const head = resolveHEAD()

    if (head.type === 'commit') {
        // detached head
        fs.writeFileSync(getHEADPath(), hash + '\n')
        return
    }

    const refPath = path.join(getRepoPath(), head.ref)
    fs.mkdirSync(path.dirname(refPath), {recursive: true})
    fs.writeFileSync(refPath, hash + '\n')
}

function readRef(refPath) {
    const fullPath = path.join(getRepoPath(), refPath)

    if (!fs.existsSync(fullPath)) {
        return null 
    }

    return fs.readFileSync(fullPath, 'utf-8').trim()
}

function writeRef(refPath, hash) {
    const fullPath = path.join(getRepoPath(), refPath)

    if (!fs.existsSync(fullPath)) {
        console.error('ref path not found')
        return
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, hash + '\n')
}

function deleteRef(refPath) {
    const fullPath = path.join(getRepoPath(), refPath)

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
    }
}

module.exports = {
    getHEADCommit,
    updateHEADCommit,
    readRef,
    writeRef,
    deleteRef
}