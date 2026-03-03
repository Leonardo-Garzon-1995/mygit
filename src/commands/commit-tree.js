// THE COMMIT-TREE COMMAND FORMAT
/*
commit <size>\0tree <tree hash>
parent <parent hash>
author <name> <email> <timestamp> <timezone>
commiter <name> <email> <timestamp> <timezone>

<commit message>*/
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

function hashObjectContent(content, type='blob') {
    const header = `${type} ${content.length}\0`
    const store = Buffer.concat([Buffer.from(header), content])
    const hash = crypto.createHash('sha1').update(store).digest('hex')
    const compressed = zlib.deflateSync(store)

    const dir = hash.slice(0, 2)
    const file = hash.slice(2)
    const objDir = path.join(process.cwd(), '.mygit', 'objects', dir)
    const objPath = path.join(objDir, file)

    fs.mkdirSync(objDir, {recursive: true})

    if (!fs.existsSync(objPath)) {
        fs.writeFileSync(objPath, compressed)
    }

    return hash
}

function commitTree(treeHash, message, parentHash = null) {
    //  1. Validate inputs
    if (!treeHash) {
        console.error('Error: tree hash required')
        process.exit(1)
    }
    if (!message) {
        console.error('Error: commit message required')
        process.exit(1)
    }

    // 2. Get author info
    // We will implement a config feature later on 
    // For now well jus use enviroment variables or defaults
    const authorName = process.env.MYGIT_AUTHOR_NAME || 'Leonardo Garzon'
    const authorEmail = process.env.MYGIT_AUTHOR_EMAIL || 'example@gmail.com'
    const committerName = authorName
    const committerEmail = authorEmail

    // 3. Get timestamp
    // Unix timestamp
    const timestamp = Math.floor(Date.now() / 1000)

    // Get timezone offset
    const timezoneOffset = -new Date().getTimezoneOffset()
    const hours = Math.floor(Math.abs(timezoneOffset) / 60)
    const minutes = Math.abs(timezoneOffset) % 60
    const sign = timezoneOffset >= 0 ? '+' : '-'
    const timezone = `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`

    // 4. Build the content of the commit 

    let commitContent =  `tree ${treeHash}\n`

    // add parent if this isn't the first commit
    if (parentHash) {
        commitContent += `parent ${parentHash}\n`
    }

    commitContent += `author ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n`
    commitContent += `committer ${committerName} <${committerEmail}> ${timestamp} ${timezone}\n`
    commitContent += `\n${message}\n`

    // 5. Hash and store the commit object
    // This is the same process as blobs and trees:
    //   - Prepend header: "commit <size>\0"
    //   - Hash it with SHA-1
    //   - Compress with zlib
    //   - Store in .mygit/objects/

    const commitHash = hashObjectContent(Buffer.from(commitContent), 'commit')

    return commitHash
}

module.exports = commitTree