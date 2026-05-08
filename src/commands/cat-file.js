/*
Lets you inspect any object in the mygit database

MODES:
    -p <hash>: Pretty-print the object content 
    -s <hash>: Show the object's size in bytes
    -t <hash>: Show the object's type (blob, tree, commit)
*/

const fs = require('fs');
const path = require('path');

const parseTree = require('../helpers/parseTree')
const readObject = require('../helpers/readObject')


function prettyPrint(type, content) {
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

/**
 * Reads an object from the object database and prints its type, size, or pretty content.
 * Short hash prefixes are resolved before the object is loaded.
 * @param {string} flags - Display mode: -t for type, -s for size, or -p for pretty content
 * @param {string} hash - Full object hash or unique hash prefix to inspect
 * @throws {Error} If arguments are missing, the hash is invalid or ambiguous, or the mode is unknown
 */
function catFile(flags, hash) {
    // 1. Validate inputs

    if (!flags || !hash) {
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

    switch (flags) {
        case '-t':
            console.log(type)
            break;
        case '-s':
            console.log(size)
            break;
        case '-p':
            prettyPrint(type, content)
            break;
        default:
            console.error(`Unknown mode: ${flags}`)
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
