/*
Lets you inspect any object in the mygit database

MODES:
    -p <hash>: Pretty-print the object content 
    -s <hash>: Show the object's size in bytes
    -t <hash>: Show the object's type (blob, tree, commit)
*/

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function readObject(hash) {
    // 1. Read and decompress object from .mygit/objects
    const dir = hash.slice(0, 2)
    const file = hash.slice(2)
    const objPath = path.join(process.cwd(), '.mygit', 'objects', dir, file)

    if (!fs.existsSync(objPath)) {
        console.error(`fatal: Not a valid object name ${hash}`)
        process.exit(1)
    }

    const compressed = fs.readFileSync(objPath)
    const decompressed = zlib.inflateSync(compressed)

    // 2. Split at the null byte to separate header from content
    const nullIndex = decompressed.indexOf(0)
    const header = decompressed.slice(0, nullIndex).toString() // now as a readable string
    const content = decompressed.slice(nullIndex + 1) // Content is still a Buffer, we can keep it as is for size calculations or type-specific processing

    // 3. Parse header ('blob 12' or 'tree 143' or 'commit 345')
    const spaceIndex = header.indexOf(' ')
    const type = header.substring(0, spaceIndex) // 'blob' or 'tree' or 'commit'
    const size = parseInt(header.substring(spaceIndex + 1)) // size in bytes

    return { type, size, content }
}

function parseTree(content) {
    // PARSE A TREE OBJECT INTO HUMAN-READABLE ENTRIES
    // Tree format: <mode> <name>\0<20-byte-hash>

    const entries = []
    let offset = 0

    while (offset < content.length) {
        // find the null byte after the name
        let nullPos = offset
        while (content[nullPos] !== 0) nullPos++

        // Extract mode and name
        const entry = content.slice(offset, nullPos).toString()
        const [mode, name] = entry.split(' ')

        // Extract the 20-byte hash and convert it to hex
        const hashBytes = content.slice(nullPos + 1, nullPos + 21)
        const hash = hashBytes.toString('hex')

        // Determine type from mode 
        let type;

        if (mode === '40000') {
            type = 'tree'
        } else if (mode === '160000') {
            type = 'commit'
        } else {
            type = 'blob'
        }

        entries.push({mode, type, hash, name})

        offset = nullPos + 21
    }

    return entries // An array with all the entries as js objects 
}

function prettyPrint(hash, type, content) {
    // Format object content for display

    if (type === 'blob') {
        process.stdout.write(content)
    } else if (type === 'tree') {
        const entries = parseTree(content)

        for (const entry of entries) {
            // Format: <mode> <type> <hash>\t<name>
            // Git uses tabs between hash and name
            console.log(`${entry.mode.padStart(6, '0')} ${entry.type} ${entry.hash}\t${entry.name}`)
        }
    } else if (type === 'commit') {
        // For commits, just display as text
        console.log(content.toString())
    } else {
        console.log(content.toString())
    }
}

function catFile(mode, hash) {
    // 1. Validate inputs

    if (!mode || !hash) {
        console.error('Usage: mygit cat-file -p|-s|-t <hash-object>')
        process.exit(1)
    }
    // Validate hash format (should be 40 hex characters or a prefix)
    if (!/^[0-9a-f]{4,40}$/i.test(hash)) {
        console.error(`fatal: Not a valid object name ${hash}`)
        process.exit(1)
    }

    // If hash is less than 40 chars, it's a prefix - we need to find the full hash
    let fullHash = hash

    if (hash.length < 40) {
        fullHash = findObjectByPrefix(hash)
        if (!fullHash) {
            console.error(`fatal: Not a valid object name ${hash}`)
            process.exit(1)
        }
    }

    // 2. Read the object
    const { type, size, content } = readObject(fullHash)

    // 3. Handle different modes

    switch (mode) {
        case '-t':
            console.log(type)
            break;
        case '-s':
            console.log(size)
            break;
        case '-p':
            prettyPrint(fullHash, type, content)
            break;
        default:
            console.error(`Unknown mode: ${mode}`)
            console.error('Usage: mygit cat-file [-t | -s | -p] <object>');
            process.exit(1);
    }
}

function findObjectByPrefix(prefix) {
    // Find objects by short hash version 
    // example: 
    //  mygit cat-file -p a1b2c3
    // instead og (full hash):
    // mygit cat-file -p a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

    // Search in the dir corresponfing to the first two chars of the prefix

    const dir = prefix.slice(0, 2)
    const objectsDir = path.join(process.cwd(), '.mygit', 'objects', dir)

    if (!fs.existsSync(objectsDir)) {
        return null
    }

    const files = fs.readdirSync(objectsDir)
    const suffix = prefix.slice(2)

    // Find files that start with the remaining prefix

    const matches = files.filter( file => file.startsWith(suffix))

    if (matches.length === 0) {
        return null
    }

    if (matches.length > 1) {
        console.error(`error: short SHA1 ${prefix} is ambiguous`);
        console.error('The candidates are:');
        for (const match of matches) {
            const fullHash = dir + match;
            const { type } = readObject(fullHash);
            console.error(`  ${fullHash} ${type}`);
        }
        process.exit(1);
    }

    // Return the full hash
    return dir + matches[0]
}

module.exports = catFile