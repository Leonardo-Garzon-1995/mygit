/*
Tree object structure
    tree <size>\0<entires>

Each entry <entry>
    <mode> <name>\0<20-byte-binary-hash(sha1)>    

<mode> = file type (dir, file, .exe)
<name> = file or dir name
\0 = null byte separator
<20-byte-binary-hash(sha1)> = the hash of the blob/tree stored as raw binary */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

function hashObjectContent(content, type='blob') {
    // Build header: "blob 12\0" or "tree 156\0"
    const header = `${type} ${content.length}\0`

    // Concatenate header + content
    const store = Buffer.concat([Buffer.from(header), content])

    // Hash it
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    // Compress it
    const compressed = zlib.deflateSync(store)

    // Write to .mygit/objects/xx/xxxxx.....
    const dir = hash.slice(0, 2)
    const filename = hash.slice(2)
    const objDir = path.join(process.cwd(), '.mygit', 'objects', dir)
    const objPath = path.join(objDir, filename)

    fs.mkdirSync(objDir, {recursive: true})

    if (!fs.existsSync(objPath)) {
        fs.writeFileSync(objPath, compressed)
    }

    return hash
}

// GET FILE MODE
/*
mode values:
040000 — directory (tree)
100644 — regular non-executable file
100755 — executable file
120000 — symbolic link
fs.statSync() gives us stats.mode which is a number. We check the bits
to determine the type and executable status.
 */

function getMode(filePath, stats) {
    if (stats.isDirectory()) {
        return '40000'
    }
    if (stats.isSymbolicLink()) {
        return '120000'
    }

    const isExecuatble = (stats.mode & 0o111) !== 0
    return isExecuatble ? '100755' : '100644'
}


/**
 * Write a tree object to disk.
 *
 * A tree object is a Git object that stores a hierarchical directory
 * structure. It is used to represent the files and directories in a
 * repository.
 *
 * This function takes a directory path as an argument and recursively
 * traverses the directory, creating tree entries for each file and
 * directory. The tree entries are concatenated into a single byte
 * array, which is then hashed and stored as a tree object in the
 * .mygit/objects directory.
 *
 * @param {string} dir the directory path to write the tree object for
 * @returns {string} the hash of the tree object
 */
function writeTree(dir=process.cwd()) {
    // ─── STEP 1: Read directory contents ────────────────────────────────────────
  //
  // fs.readdirSync returns an array of filenames (strings).
  // We sort them because Git stores tree entries in sorted order.
  // Git actually uses a special sort order (directories get a trailing /
  // for sorting purposes), but alphabetical is close enough for learning.
    const entries = fs.readdirSync(dir).sort()

  // ─── STEP 2: Filter out .git directory ──────────────────────────────────────
  //
  // We don't want to include .git itself in the tree — that would be recursive
  // madness. Real Git also ignores .git.
    const filteredEntries = entries.filter(name => name !== '.mygit')

    // ─── STEP 3: Build tree entries ─────────────────────────────────────────────
  //
  // For each file/directory, we create a tree entry buffer.
  // Each entry is: <mode> <name>\0<20-byte-binary-hash>
    const treeEntries = [] // stores tree entries as buffers

    for (const name of filteredEntries) {
        const fullPath = path.join(dir, name)
        // Get file stats (size, permissions, type, etc)
        const stats = fs.statSync(fullPath)

        // Determine the mode
        const mode = getMode(fullPath, stats)

        let hash;

        if (stats.isDirectory()) {
            // ─── Recursively write the subdirectory's tree ────────────────────────
            //
            // This is where the magic happens. We call writeTree on the subdirectory,
             // which returns its tree hash. That hash becomes a pointer in OUR tree.
            //
            // This is how Git represents nested directories — trees pointing to trees.
            hash = writeTree(fullPath)

        } else if (stats.isFile()) {
            // ─── Hash the file as a blob ──────────────────────────────────────────
      //
      // Read the file content and hash it exactly like hash-object does.
            const content = fs.readFileSync(fullPath)
            hash = hashObjectContent(content, "blob")
        } else {
            continue
        }

        // ─── Build the tree entry buffer ─────────────────────────────────────────────
    //
    // Format: "<mode> <name>\0<20-byte-hash>"
    //
    // The mode and name are text, but the hash must be stored as raw bytes.
    // Buffer.from(hash, 'hex') converts the 40-char hex string into 20 bytes.
        const entry = Buffer.concat([
            Buffer.from(`${mode} ${name}\0`),
            Buffer.from(hash, 'hex')
        ])

        treeEntries.push(entry)


    }

    // ─── STEP 4: Concatenate all entries ────────────────────────────────────────
  //
  // Now we have an array of Buffers. Buffer.concat joins them into one
  // contiguous byte array that represents the tree's content.
    const treeContent = Buffer.concat(treeEntries)

    // ─── STEP 5: Hash and store the tree object ─────────────────────────────────
  //
  // This is identical to hashing a blob, except:
  //   - The header says "tree" instead of "blob"
  //   - The content is our concatenated tree entries
    const treeHash = hashObjectContent(treeContent, 'tree')

    return treeHash
}

module.exports = writeTree