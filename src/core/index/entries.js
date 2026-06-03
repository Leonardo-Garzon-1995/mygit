const { ValidationError } = require('../../errors')
const { isValidHash } = require('../../utils/validation')

function validateIndexEntry(entry) {
    if (!entry) {
        throw new ValidationError('Entry is required')
    }
    if (!isValidHash(entry.hash)) {
        throw new ValidationError(`Invalid object hash: ${entry.hash}`)
    }
    if (typeof entry.mode !== 'string' || entry.mode.trim() === '') {
        throw new ValidationError('Entry mode is required')
    }
}

function validateIndex(index) {
    if (!index || typeof index !== 'object') {
        throw new ValidationError('Index must be an object')
    }
    if (!index.entries || index.entries !== 'object') {
        throw new ValidationError('Index entries are missing')
    }
}

function createIndexEntry(hash, mode='100644') {
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
    return filePath in index.entries
}

function getIndexEntry(index, filePath) {
    validateIndex(index)
    return (index.entries[filePath] ?? null)
}

function listIndexEntries(index) {
    validateIndex(index)

    return Object.entries(index.entries)
}

// mutations

function setIndexEntry(index, filePath,entry) {
    validateIndex(index)
    validateIndexEntry(entry)

    index.entries[filepath] = entry

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
    return Object.keys(index.entries).length
}

function isIndexEmpty(index) {
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
    listIndexEntries,
    setIndexEntry,
    removeIndexEntry,
    clearIndexEntries,
    indexEntryCount,
    isIndexEmpty,
    getIndexStoredPaths
}