const Output = require('../../cli/output')
const { parseTree } = require('../objects/parser')


function prettyPrintObject(type, content) {
    // Format object content for display

    if (type === 'blob') {
        process.stdout.write(content)
    } else if (type === 'tree') {
        const entries = parseTree(content)

        for (const entry of entries) {
            // Format: <mode> <type> <hash>\t<name>
            // Git uses tabs between hash and name
            Output.info(`${entry.mode.padStart(6, '0')} ${entry.type} ${entry.hash}\t${entry.name}`)
        }
    } else if (type === 'commit') {
        // For commits, just display as text
        Output.info(content.toString())
    } else {
        Output.info(content.toString())
    }
}

function parseAndFormatTree(buffer) {
    let i = 0
    let result = ''
    while (i < buffer.length) {
        const spaceIndex = buffer.indexOf(32, i)
        const nullIndex = buffer.indexOf(0, spaceIndex)

        const mode = buffer.slice(i, spaceIndex).toString()
        const name = buffer.slice(spaceIndex + 1, nullIndex).toString()

        const hash = buffer
            .slice(nullIndex + 1, nullIndex + 21)
            .toString('hex')

        result += `${mode.padStart(6, '0')} ${name} ${hash}`

        i = nullIndex + 21
    }

    return result
}

function formatObject(mygitObj) {
    const {type, size, content } = mygitObj

    let result = `Type: ${type}\n`
    result += `Size: ${size} bytes\n`
    result += `-------------------------\n`

    if (type === 'blob') {
        result += content.toString()
    } else if (type === 'tree') {
        result += parseAndFormatTree(content)
    } else {
        result += content.toString()
    }

    return result
}

module.exports = {
    prettyPrintObject,
    formatObject,
    parseAndFormatTree
}