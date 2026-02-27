const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function parseTree(buffer) {
    let i = 0
    while (i < buffer.length) {
        const spaceIndex = buffer.indexOf(32, i)
        const nullIndex = buffer.indexOf(0, spaceIndex)

        const mode = buffer.slice(i, spaceIndex).toString()
        const name = buffer.slice(spaceIndex + 1, nullIndex).toString()

        const hash = buffer
            .slice(nullIndex + 1, nullIndex + 21)
            .toString('hex')

        console.log(`${mode} ${name} ${hash}`)

        i = nullIndex + 21
    }
}
function parseObject(buffer) {
    const nullIndex = buffer.indexOf(0)

    const header = buffer.slice(0, nullIndex).toString()
    const content = buffer.slice(nullIndex + 1)

    const [type, size] = header.split(' ')

    console.log(`type: ${type}`)
    console.log(`size: ${size}`)
    console.log(`-------------------------`)

    if (type === 'blob') {
        console.log(content.toString())
    } else if (type === 'tree') {
        parseTree(content)
    } else {
        console.log(content.toString())
    }
}
function inspectObject(hash) {
    const dir = hash.slice(0,2)
    const file = hash.slice(2)

    const objPath = path.join(process.cwd(), '.mygit', 'objects', dir, file)

    if (!fs.existsSync(objPath)) {
        console.error(`Object ${hash} not found`)
        process.exit(1)
    }

    const compressed = fs.readFileSync(objPath)
    const decompressed = zlib.inflateSync(compressed)

    parseObject(decompressed)
}

module.exports = inspectObject