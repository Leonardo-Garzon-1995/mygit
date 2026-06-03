const fs = require('../../utils/filesystem')

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

    return head.replace(/^ref:\s*/, '')
}

// Get detached heas
function getHEADHash(repo) {
    const head = readHEAD(repo)

    if (isSymbolicHEAD) return null

    return head
}

function setHEADRef(repo, ref) {
    fs.writeFile(repo.paths.head, `ref: ${ref}\n`)
}

function detachHEAD(repo, hash) {
    fs.writeFile(repo.paths.head, `${hash}\n`)
}

function resolveHEAD(repo) {
    const head = readHEAD(repo)

    if (!isSymbolicHEAD(repo)) {
        return head
    }

    const ref = getHEADref(repo)

    const filePath = refPath(repo, ref)

    if (!fs.exists(filePath)) {
        return null
    }

    return fs.readFile(filePath).trim()
}

module.exports = {
    readHEAD,
    isSymbolicHEAD,
    getHEADref,
    getHEADHash,
    setHEADRef,
    detachHEAD,
    resolveHEAD
}
