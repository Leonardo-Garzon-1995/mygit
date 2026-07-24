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

module.exports = {
    prettyPrintObject
}