# The `hash-object` command 
## What it is and what it does
- The `hash-object` command is used to create a new object in the mygit repository and return its SHA-1 hash. It takes a file as input and creates a blob object that contains the contents of the file. 

```bash
 C:\Users\user\Desktop\my-project> mygit hash-object file.txt
    3b18e5c8f9a1b2c3d4e5f6a7b8c9d0e1f2g3h4
```
1. It reads the contents of the specified file (file.txt in this case).
2. It creates a blob object that contains the contents of the file. A blob is a binary large object that represents the contents of a file in the mygit repository.
    - blob object format: `blob <size>\0<content>` where `<size>` is the size of the content in bytes and `<content>` is the actual content of the file as a binary string.
3. It calculates the SHA-1 hash of the blob object, which serves as a unique identifier for the object in the repository.
4. It stores the blob object in the .mygit/objects directory, using the first two characters of the hash as the subdirectory name and the remaining characters as the filename.
5. Finally, it outputs the SHA-1 hash of the blob object to the console.
## Implementation explained
- The `hash-object` command is implemented in the `hashObject.js` file in the `src/commands` directory.
- the hashObject function is responsible for creating a blob object, calculating its SHA-1 hash, and storing it in the .mygit/objects directory.
```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // we'll use it to calculate the SHA-1 hash of the blob object
const zlib = require('zlib'); // we'll use it to compress the blob object 

function hashObject(filePath, write = true) { // write=true means that the blob object will be stored in the .mygit/objects directory, if false it will only return the hash without storing the object

    // 1. Read the contents of the specified file
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath); // read the file content as a buffer ex: '<Buffer 41 42 43 ...>'

    // 2. Create a blob object

    const header = `blob ${content.length}\0`; // create the header for the blob object, it includes the type of the object (blob) and its size in bytes, followed by a null character
    const storeBuffer = Buffer.concat([Buffer.from(header), content]); // concatenate the header and the content to create the complete blob object. it now looks like this: <Buffer 62 6c 6f 62 20 31 30 00 41 42 43 ...>

    // 3. Calculate the SHA-1 hash of the blob object
    const hash = crypto.createHash('sha1').update(storeBuffer).digest('hex');

    // 4. Write and Store the blob object in the .mygit/objects directory if write is true
    if (write) {
        const dir = hash.slice(0, 2); // get the first two characters of the hash to use as a subdirectory
        const file = hash.slice(2); // get the remaining characters of the hash to use as the file name

        // Build the full path => .mygit/objects/8a/3b18e5c8f9a1b2c3d4e5f6a7b8c9d0e1f2g3h4
        const objectDir = path.join(process.cwd(),'.mygit', 'objects');
        const objDir = path.join(objectDir, dir);
        const objPath = path.join(objDir, file);

        // Create the subdirectory if it doesn't exist
        fs.mkdirSync(objDir, { recursive: true });

        // Compress the blob object using zlib and write it to the file
        const compressed = zlib.deflateSync(storeBuffer); // compress the blob object using zlib's deflateSync method, which returns a buffer containing the compressed data

        // Write the compressed blob object to the file in the .mygit/objects directory
        if (!fs.existsSync(objPath)) { // check if the object file already exists to avoid overwriting it
            fs.writeFileSync(objPath, compressed); // write the compressed blob object to the file
        }
    }

    return hash; // return the SHA-1 hash of the blob object
}

// Export the hashObject function to be used in the main mygit command handler
module.exports = hashObject;
```