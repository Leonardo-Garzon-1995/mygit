const fs = require('fs')
const path = require('path')
const crypto = require('crypto') 
const zlib = require('zlib') 

function hashObject(filePath, write=true) {
    const absolutePath = path.resolve(filePath)
    const content = fs.readFileSync(absolutePath)

    const header = `blob ${content.length}\0` 
    const storeBuffer = Buffer.concat([Buffer.from(header), content])

    const hash = crypto
        .createHash('sha1')
        .update(storeBuffer)
        .digest('hex')

    if (write) {
        const dir = hash.slice(0, 2)
        const fileName = hash.slice(2)

        // build the full path: .git/objects/8a/b686eafe...
        const objectsDir = path.join(process.cwd(), '.mygit', 'objects')
        const objDir = path.join(objectsDir, dir)
        const objPath = path.join(objDir, fileName)

        // create te subfolder if it does not exist yet
        fs.mkdirSync(objDir, {recursive: true})

        // Compress the whole storeBuffer
        const compressed = zlib.deflateSync(storeBuffer)

        // Write the compressed blob object to the file
        if (!fs.existsSync(objPath)) {
            fs.writeFileSync(objPath, compressed)
        }
    }

    console.log(hash)

    return hash
}

module.exports = hashObject