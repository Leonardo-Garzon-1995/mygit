const fs = require('../../utils/filesystem')
const { validateIndex } = require('./entries')
const { ValidationError} = require('../../errors')

function serializeIndex(index) {
    validateIndex(index)

    return JSON.stringify(index, null, 2)
}

function writeIndex(repo, index) {
    if (!repo || !repo.paths?.index) {
        throw new ValidationError('Repository is required')
    }

    const content = serializeIndex(index)

    fs.writeFile(repo.paths.index, content)
}

module.exports = {
    writeIndex,
    serializeIndex
}
