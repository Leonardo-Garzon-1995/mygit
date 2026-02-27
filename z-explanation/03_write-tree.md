# The `write-tree` command
## What it is and what it does
- The `write-tree` command is used to create a new tree object in the mygit repository and return its SHA-1 hash. A tree object represents a directory in the mygit repository and contains references to the files and subdirectories within that directory.

```bash
 C:\Users\user\Desktop\my-project> mygit write-tree
    4a5e6f7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3
```
1. It creates a new tree object that contains references to the files and subdirectories within the current directory.
2. It calculates the SHA-1 hash of the tree object, which serves as a unique identifier for the object in the repository.
3. It stores the tree object in the .mygit/objects directory, using the first two characters of the hash as the subdirectory name and the remaining characters as the filename.
4. Finally, it outputs the SHA-1 hash of the tree object to the console.
5. The tree object format is as follows: `tree <size>\0<entries>` where:
    - `<size>` is the size of the content in bytes
    - `<entries>` is a binary string that contains the references to the files and subdirectories in the directory. Each reference is formatted as follows: `<mode> <filename>\0<hash>` where:
        - `<mode>` is the file mode (e.g., 100644 for regular files, 40000 for directories), `<filename>` is the name of the file or subdirectory, and 
        - `<hash>` is the SHA-1 hash of the corresponding blob or tree object.
## Implementation explained
- The `write-tree` command is implemented in the `writeTree.js` file in the `src/commands` directory. There are three functions in this file.
    - `hashObject(content, type)` function
    - `getMode(stats)` function 
    - `writeTree(dir)` function. THIS IS THE MAIN FUNCTION, the others are helpers

### Implementations of each function:
- The `hashObjectContent` function is a helper function responsible for:
    - Building the header of the hash object according to its type, either a blob (`blob <size>\0`) or a tree (`tree <size>\0`).
    - concatenating the header and the content to create the complete hash object
    - calculating the SHA-1 hash of the hash object, which serves as a unique identifier for the object in the repository.
    - Compressing the hash object using zlib's deflateSync method, which returns a buffer containing the compressed data.
    - writeing the compressed hash object to the file in the .mygit/objects directory if the write parameter is true, otherwise it only returns the hash without storing the object.
```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

function hashObjectContent(content, type = 'blob') { // content must be a Buffer
    // 1. Build the header
    const header = `${type} ${conten.length}\0`

    // 2. concatenating the header and the content 
    const store = Buffer.concat([Buffer.from(header), content])

    // 3.claculating the hash
    const hash = crypto.createHash('sha1')
        .update(store)
        .digest('hex')
    
    // 4. Compress the hash object 
    const compressed = zlib.deflateSync(store)

    // 5. Write the compressed hash object to the file in the .mygit/objects directory      
    const dir = hash.slice(0, 2);
    const file = hash.slice(2);
    const objDir = path.join(process.cwd(), '.mygit', 'objects', dir);
    const objPath = path.join(objDir, file);

    fs.mkdirSync(objDir, { recursive: true });

    if (!fs.existsSync(objPath)) {
        fs.writeFileSync(objPath, compressed);
    }

    // 6. Return the SHA-1 hash of the hash object
    return hash;
}
```

- The `getMode` function is a  helper function responsible for:
    - Determining the type of the object (regular file, directory, etc.) 
    - It takes a `stats` object as input, which is obtained by calling `fs.statSync()` on a file or directory.
    - it returns the corresponding file mode as a string based on the type of the objecct.
        - 040000 — directory (tree)
        - 100644 — regular non-executable file
        - 100755 — executable file
        - 120000 — symbolic link
    - Later on the string returned by this function will be used in the tree object entries to indicate the type of each entry, file or directory (blob or tree).
```javascript
function getMode(stats) {
    if (stats.isDirectory()) {
        return '40000'; // directory (tree)
    } 
    if (stats.isSymbolicLink()) {
        return '120000'; // symbolic link
    }

    const isExecutable = (stats.mode & 0o111) !== 0
    return isExecutable ? '100755' : '100644'; // file (blob), executable or non-executable
}
```

- The `writeTree` function is the main function responsible for:
    - Reading the contents of the current directory and creating a tree object that contains references to the files and subdirectories within that directory.
    - It uses the `hashObjectContent` function to create blob objects for each file and tree objects for each subdirectory, and it builds the content of the tree object accordingly.
    - Finally, it calculates the SHA-1 hash of the tree object, stores it in the .mygit/objects directory, and returns the hash.
```javascript
const fs = require('fs')
function writeTree(dir = process.cwd()) {
    // 1. Read the directory contents
    const entries = fs.readfirSync(dir).sort() // an array with the names of the files and directories

    // 2. Filter out the .mygit folder so it does not get process
    const filteredEntries = entries.filter(name => name !== '.mygit')

    // 3. Build the tree entries 
    // For each file/directory we create a tree entry
    // Each entry is: <mode> <name>\0<20-byte-binary-hash>
    const treeEntries = [] // stores tree entries as Buffers

    for (const item of filteredItems) {
        const fullPath = path.join(dir, item) //recreates the full path between the item and the root directory

        // Get the file/folder stats
        const stats = fs.statSync(fullPath)

        // Determine the mode using the getMode helper function
        const mode = getMode(stats)

        let hash

        if (stats.isDirectory()) {
            // Recursively write the subdirectories trees
            hash = writeTree(fullPath)
        } else if (stats.isFile()) {
            // Read the file content and hash it as a blob
            const content = fs.readFileSyn(fullpath)
            hash = hashObjectContent(content, 'blob')
        } else {
            continue
        }

        // Build the tree entry buffer
        // Format: <mode> <name>\0<20-byte-hash>
        const entry = Buffer.concat([
            Buffer.from(`${mode} ${item}\0`),
            Buffer.from(hash, 'hex')
        ])

        treeEntries.push(entry)
    }

    // concatenate all entries 
    // Join the array of Buffers into one single Buffer
    const treeContent = Buffer.concat(treeEntries)

    // Hash and store the tree object 

    const treeHash = hashObjectContent(treeContent, 'tree')

    return treeHash
}

// Export it to use it in the command line interface
module.exports = writeTree
```