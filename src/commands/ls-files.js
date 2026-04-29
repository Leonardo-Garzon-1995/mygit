const fs = require('fs')
const path = require('path')

const readIndex = require('../helpers/readIndex')
const { ensureRepo } = require('../core/repository')

function lsFiles() {
    ensureRepo()

    const index = readIndex()
    if (!index.entries || Object.keys(index.entries).length === 0) {
        return
    }

    const sorted = Object.keys(index.entries).sort()

    for (const filePath of sorted) {
        console.log(filePath)
    }
}

module.exports = lsFiles