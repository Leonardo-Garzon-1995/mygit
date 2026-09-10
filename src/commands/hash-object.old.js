const fs = require('fs')
const path = require('path')
const crypto = require('crypto') 
const zlib = require('zlib') 


/*
Blob object structure
    'blob <size>\0<content>'
*/ 

/**
 * Hashes a file as a blob object using the same header and compression format as mygit objects.
 * Optionally writes the compressed blob into the object database.
 * @param {string} filePath - Path of the file to hash
 * @param {boolean} [write=true] - Whether to write the blob object to .mygit/objects
 * @returns {string} SHA-1 hash of the blob object
 * @throws {Error} If the file path is missing or the file does not exist
 */
function hashObject(type='blob', filePath, write=false) {

    if (!filePath) {
        console.error('Error: No file path provided');
        console.error(' Usage: mygit hash-object <file-path> -t <type>');
        process.exit(1);
    }

    const absolutePath = path.resolve(filePath)
    if (!fs.existsSync(absolutePath)) {
        console.error(` Error: File ${filePath} does not exist`)
        process.exit(1)
    }

    try {
        const content = fs.readFileSync(absolutePath)

        const header = `${type} ${content.length}\0` 
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
        return hash
    } catch (error) {
        throw Error(`Error: ${error.message}`)
    }
}

module.exports = hashObject
