const { ValidationError, InvalidHashError } = require('../../errors')
const { FILE_MODES } = require('../../constants')
const { isValidHash, isValidPath } = require('../../utils/validation')

const MODES = Object.values(FILE_MODES)

function validateIndexEntry(entry) {
    if (!entry) {
        throw new ValidationError('Entry is required')
    }
    if (!isValidHash(entry.hash)) {
        throw new InvalidHashError(entry.hash)
    }
    if (typeof entry.mode !== 'string' || entry.mode.trim() === '' || !MODES.includes(entry.mode)) {
        throw new ValidationError('Entry mode is required')
    }
}

function validateIndex(index) {
    if (!index || typeof index !== 'object') {
        throw new ValidationError('Index must be an object')
    }
    if (typeof index.version !== 'number') {
        throw new ValidationError('Index version is required')
    }
    if (!index.entries || typeof index.entries !== 'object') {
        throw new ValidationError('Index entries are missing')
    }
}

function createIndexEntry(hash, mode=FILE_MODES.NORMAL) {
    const entry = {
        hash,
        mode
    }

    validateIndexEntry(entry)

    return entry
}

// QUEARY

function hasIndexEntry(index, filePath) {
    validateIndex(index)
    if (!isValidPath(filePath)) {
        throw new ValidationError(`Invalid path: ${filePath}`)
    }
    return filePath in index.entries
}

function getIndexEntry(index, filePath) {
    validateIndex(index)
    if (!isValidPath(filePath)) {
        throw new ValidationError(`Invalid path: ${filePath}`)
    }
    return (index.entries[filePath] ?? null)
}

function getIndexEntries(index) {
    validateIndex(index)

    return Object.entries(index.entries)
}

// mutations

function setIndexEntry(index, filePath, entry) {
    validateIndex(index)
    validateIndexEntry(entry)

    if (!isValidPath(filePath)) {
        throw new ValidationError(`Invalid path: ${filePath}`)
    }

    index.entries[filePath] = entry

    return index
}

function removeIndexEntry(index, filePath) {
    validateIndex(index)

    delete index.entries[filePath]

    return index
}

function clearIndexEntries(index) {
    validateIndex(index)

    index.entries = {}

    return index
}

// Utilites

function indexEntryCount(index) {
    validateIndex(index)
    return Object.keys(index.entries).length
}

function isIndexEmpty(index) {
    validateIndex(index)
    return indexEntryCount(index) === 0
}

function getIndexStoredPaths(index) {
    validateIndex(index)

    return Object.keys(index.entries).sort()
}

module.exports = {
    validateIndexEntry,
    validateIndex,
    createIndexEntry,
    hasIndexEntry,
    getIndexEntry,
    getIndexEntries,
    setIndexEntry,
    removeIndexEntry,
    clearIndexEntries,
    indexEntryCount,
    isIndexEmpty,
    getIndexStoredPaths
}