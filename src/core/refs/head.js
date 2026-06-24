const fs = require('../../utils/filesystem')
const { isValidRef } = require('../../utils/validation')
const { refPath } = require('../repository/paths')
const { InvalidReferenceError } = require('../../errors')


function readHEAD(repo) {
    const headPath = repo.paths.head

    if (!fs.exists(headPath)) {
        throw new InvalidReferenceError('HEAD does not exists')
    }

    return fs.readFile(headPath).trim()
}

function isSymbolicHEAD(repo) {
    return readHEAD(repo).startsWith('ref: ')
}

function getHEADref(repo) {
    const head = readHEAD(repo)

    if (!isSymbolicHEAD(repo)) return null

    const ref = head.replace(/^ref:\s*/, '')
    if (!isValidRef(ref)) {
        throw new InvalidReferenceError(`Invalid reference format: ${ref}`)
    }
    return ref
}

// Get detached heas
function getHEADHash(repo) {
    const head = readHEAD(repo)

    if (isSymbolicHEAD(repo)) return null

    return head
}

function setHEADRef(repo, ref) {
    fs.writeFile(repo.paths.head, `ref: ${ref}\n`)
}

function detachHEAD(repo, hash) {
    fs.writeFile(repo.paths.head, `${hash}\n`)
}

function isDetachedHEAD(repo) {
    return !isSymbolicHEAD(repo)
}

function resolveHEAD(repo) {
    const head = readHEAD(repo)

    if (!isSymbolicHEAD(repo)) {
        return head
    }

    const ref = getHEADref(repo)

    const filePath = refPath(repo, ref)

    if (!fs.exists(filePath)) {
        throw new InvalidReferenceError()
    }

    return fs.readFile(filePath).trim()
}

function getCurrentBranch(repo) {
    const headRef = getHEADref(repo)

    if (!headRef) {
        return null
    }

    return headRef.replace(/^refs\/heads\//, '').trim()
}

module.exports = {
    readHEAD,
    isSymbolicHEAD,
    getHEADref,
    getHEADHash,
    setHEADRef,
    detachHEAD,
    resolveHEAD,

    getCurrentBranch
}
