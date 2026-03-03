# The `commit-tree` command

The `commit-tree` command is used to create a new commit object from a tree object. It takes the following arguments:

- `<tree hash>`: The SHA-1 hash of the tree object to be committed.
- `<commit message>`: The commit message to be associated with the new commit. 
- `-p <parent commit hash>`: (Optional) The SHA-1 hash of the parent commit. If not provided, the new commit will be a root commit.

## Structure of a commit object
A commit object in Git has the following structure:

```
commit <size>\0tree <tree-hash>
parent <parent-commit-hash>
author <author-name> <author-email> <timestamp> <timezone>
committer <committer-name> <committer-email> <timestamp> <timezone>
\n<commit-message>
```
## Implementation
- The `commit-tree` command is implemented in the `commit-tree.js` file in the `src/commands` directory. 
- The `commitTree` function is responsible for creating a commit object, calculating its SHA-1 hash, and storing it in the .mygit/objects directory.

### Implementation of each funtion
- The `hashObjectContent` function is a helper function responsible for:
    - Building the header of the hash object according to its type, either a blob (`blob <size>\0`) or a tree (`tree <size>\0`).
    - concatenating the header and the content to create the complete object
    - calculating the SHA-1 hash of the hash object, which serves as a unique identifier for the object in the repository.
    - Compressing the hash object using zlib's deflateSync method, which returns a buffer containing the compressed data.
    - writeing the compressed hash object to the file in the .mygit/objects directory if the write parameter is true, otherwise it only returns the hash without storing the object.
```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

function hashObjectContent(content, type='blob') {
    // Create the object, hash it and compress it 
    const header = `${type} ${content.length}\0`
    const store = Buffer.concat([Buffer.from(header), content])
    const hash = crypto.createHash(sha1).update(store).digest('hex')
    const compressed = zlib.deflateSync(store)

    // Create the path 
    const dir = hash.slice(0, 2)
    const file = hash.slice(2)
    const objDir = path.join(process.cwd(), '.mygit', 'objects', dir)
    const objPath = path.join(objDir, file)

    // Create the object's folder if it does not exist
    fs.mkdir(objdir, {recursive: true})

    // Write the file with the compressed data
    if (!fs.existSync(objPath)) {
        fs.writeFileSync(objPath, compressed)
    }

    return hash
}
```

- The `commitTree` function is the main function and it is responsible for:
    - Building the content of the commit object by concatenating the tree hash, parent commit hash (if provided), author and committer information, and the commit message.
    - Calling the `hashObjectContent` function to create the commit object, calculate its SHA-1 hash, and store it in the .mygit/objects directory.
    - Returning the SHA-1 hash of the newly created commit object.

```javascript
function commitTree(treehash, message, parentHash=null){
    // 1. Validate inputs
    if (!treeHash) {
        console.error('Error: tree hash required')
        process.exit(1)
    }
    if(!message) {
        console.log('Error: commit message required')
        process.exit(1)
    }

    // 2. Get author and committer info
    const authorName = process.env.MYGIT_AUTHOR_NAME || 'Leonardo Garzon'
    const authorEmail = process.env.MYGIT_AUTHOR_EMAIL || 'randomemail@example.com'
    const committerName = authorName
    const committerEmail = authorEmail

    // Get timestamp
    // Unix timestamp
    const timestamp = Math.floor(Date.now() / 1000)

    // Get timezone offset
    const timezoneOffset = -new Date().getTimezoneOffset()
    const hours = Math.floor(Math.abs(timezoneOffset) / 60)
    const minutes = Math.abs(timezoneOffset) % 60
    const sign = timezoneOffset >= 0 ? "+" : "-"
    const timezone = `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`

    // 3. Build the content of the commit object
    let commitContent = `tree ${treeHash}\n`

    // Add parent commit hash if this isn't the first commit
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
```
