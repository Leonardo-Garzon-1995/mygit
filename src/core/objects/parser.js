const { InvalidObjectError } = require('../../errors')

/**
 * Parses a commit object into a human-readable javascript object
 * @param {Buffer} content - The content of a commit object (excluding the header)
 * @returns {Object} - An object with five properties: 'tree', 'parents', 'author', 'committer' and 'message'
 */
function parseCommit(content) {
    if (!content || !Buffer.isBuffer(content)) {
        throw new InvalidObjectError(`Commit content must be a Buffer`)
    }

    const lines = content.toString().split('\n') // Array of lines with the commit content
    const commit = {
        tree: null,
        parents: [],
        author: null,
        committer: null,
        message: null
    }

    // Keep track of the lines index
    let i = 0

    
    // 2. Parse header lines (tree, parent, author, commiter)
    while (i < lines.length && lines[i] !== '') {
        const line = lines[i]

        if (line.startsWith('tree ')) {
            commit.tree = line.substring(5)
        } else if (line.startsWith('parent ')) {
            commit.parents.push(line.substring(7))
        } else if (line.startsWith('author ')) {
            commit.author = line.substring(7)
        } else if (line.startsWith('committer ')) {
            commit.committer = line.substring(10)
        }

        i++
    }

    // skip the blank line 
    i++

    // Everything else is the commit message
    commit.message = lines.slice(i).join('\n').trim()

    // Return the parsed commit object
    return commit
}

/**
 * Parse a tree object into human-readable javascript object
 * @param {Buffer} content - The content of the tree object (a Buffer)
 * @returns {Array<Object>} - An array of objects containing the mode, name, and hash of each entry
 * @throws {Error} - If the tree content is malformed or incomplete
 */
function parseTree(content) {
    if (!content || !Buffer.isBuffer(content)) {
        throw new InvalidObjectError('Tree content must be a Buffer');
    }
    
    if (content.length === 0) {
        return [];
    }
    
    const entries = [];
    let offset = 0;
    
    while (offset < content.length) {
        let nullPos = offset;
        while (nullPos < content.length && content[nullPos] !== 0) {
            nullPos++;
        }
        
        if (nullPos >= content.length) {
            throw new InvalidObjectError('Malformed tree: missing null terminator');
        }
        
        const entry = content.slice(offset, nullPos).toString();
        const spaceIndex = entry.indexOf(' ');
        
        if (spaceIndex === -1) {
            throw new InvalidObjectError(`Malformed tree entry: ${entry}`);
        }
        
        const mode = entry.substring(0, spaceIndex);
        const name = entry.substring(spaceIndex + 1);
        
        if (nullPos + 21 > content.length) {
            throw new InvalidObjectError('Malformed tree: incomplete hash');
        }
        
        const hashBytes = content.slice(nullPos + 1, nullPos + 21);
        const hash = hashBytes.toString('hex');

        let type;
        if (mode === '40000') {
            type = 'tree';
        } else if (mode === '160000') {
            type = 'commit';
        } else {
            type = 'blob';
        }
        
        entries.push({ mode, type, name, hash });
        offset = nullPos + 21;
    }
    
    return entries;
}

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
/**
 * Reads a git object (hash) from disk and returns its header, content type and size.
 * @param {string} hash - The hash of the object to read.
 * @returns {Object} - An object with four properties: 'header', 'content', 'type', 'size'. 'header' is a string representing the header of the object,
 * the 'header' is a string in the format '<type> <size>\0'. 
 * the 'content' is a Buffer containing the content of the object, 
 * the 'type' is the type of object of the entry and 
 * the 'size' is the size of the object in bytes
 * @throws {Error} - If the object is not found, or if it is malformed (i.e. it does not contain a null byte separator).
 */
function parseObjectByHash(hash) {
    const mygitDir = path.join(process.cwd(), '.mygit');
    const dir = hash.slice(0, 2);
    const filename = hash.slice(2);
    const objectPath = path.join(mygitDir, 'objects', dir, filename);
    
    if (!fs.existsSync(objectPath)) {
        throw new InvalidObjectError(`Object ${hash} not found at ${objectPath}`);
    }
    
    const compressed = fs.readFileSync(objectPath);
    const decompressed = zlib.inflateSync(compressed);
    
    const nullIndex = decompressed.indexOf(0);
    
    if (nullIndex === -1) {
        throw new InvalidObjectError(`Malformed object ${hash}: no null byte separator`);
    }
    
    const header = decompressed.slice(0, nullIndex).toString();
    const content = decompressed.slice(nullIndex + 1);

    const spaceIndex = header.indexOf(' ')
    const type = header.substring(0, spaceIndex) // 'blob' or 'tree' or 'commit'
    const size = parseInt(header.substring(spaceIndex + 1)) // size in bytes
    
    return { header, content, type, size };
}


function parseObjectContent(type, content) {
    switch (type) {
        case 'commit':
            return parseCommit(content)
        case 'tree':
            return parseTree(content)
        case 'blob':
            return content

        default:
            throw new InvalidObjectError(`Unknown object type: ${type}`)
    }
}

/**
 * Parse author/committer/tagger signature
 * Format: `Name <email> timestamp timezone
 * @param {string} signature 
 * @returns {Object}
 */
function parseSignature(signature) {
    const match = signature.match(
        /^(.*?) <(.*?)> (\d+) ([+-]\d+)$/
    )

    if (!match) {
        throw new InvalidObjectError(`Invalid signature: ${signature}`)
    }

    return {
        name: match[1],
        email: match[2],
        timestamp: Number(match[3]),
        timezone: match[4]
    }
}

// To add later

/*
parseTag()
parseCommitMessage()
 */

module.exports = {
    parseCommit,
    parseTree,
    parseObjectByHash,
    parseSignature,
    parseObjectContent
}

