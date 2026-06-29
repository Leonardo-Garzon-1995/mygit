const { readIndex, createEmptyIndex } = require('./read')
const { writeIndex, serializeIndex } = require('./write')
const { 
    createIndexEntry,
    validateIndex,
    validateIndexEntry,
    hasIndexEntry,
    getIndexEntry,
    getIndexEntries,
    setIndexEntry,
    removeIndexEntry,
    clearIndexEntries,
    indexEntryCount,
    isIndexEmpty,
    getIndexStoredPaths
} = require('./entries')

module.exports = {
    //read
    readIndex,
    createEmptyIndex,

    // write
    writeIndex,
    serializeIndex,
    validateIndex,

    // entries
    createIndexEntry,
    validateIndexEntry,
    
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