/*
Tree object structure
    tree <size>\0<entires>

Each entry of <entries>
    <mode> <name>\0<20-byte-binary-hash(sha1)>    

<mode> = file type (dir, file, .exe)
<name> = file or dir name
\0 = null byte separator
<20-byte-binary-hash(sha1)> = the hash of the blob/tree stored as raw binary */
const fs = require('fs')
const path = require('path')

const hashObjectContent = require('../helpers/hashObjectContent')
const getFileMode = require('../helpers/getFileMode')


/**
 * Recursively writes the directory contents as tree and blob objects.
 * Returns the hash of the tree object representing the requested directory.
 * @param {string} [dir=process.cwd()] - Directory path to convert into a tree object
 * @returns {string} Hash of the stored tree object
 */
function writeTree(dir=process.cwd()) {
    // ─── STEP 1: Read directory contents ────────────────────────────────────────
  //
  // fs.readdirSync returns an array of filenames (strings).
  // We sort them because Git stores tree entries in sorted order.
  // Git actually uses a special sort order (directories get a trailing /
  // for sorting purposes), but alphabetical is close enough for learning.
    const entries = fs.readdirSync(dir).sort()

  // ─── STEP 2: Filter out .mygit directory ──────────────────────────────────────
  //
  // We don't want to include .mygit itself in the tree — that would be recursive
  // madness. Real Git also ignores .mygit.
    const filteredEntries = entries.filter(name => name !== '.mygit')

    // ─── STEP 3: Build tree entries ─────────────────────────────────────────────
  //
  // For each file/directory, we create a tree entry buffer.
  // Each entry is: <mode> <name>\0<20-byte-binary-hash>
    const treeEntries = [] // stores tree entries as buffers

    for (const name of filteredEntries) {
        const fullPath = path.join(dir, name)
        // Get file stats (size, permissions, type, etc)
        const stats = fs.lstatSync(fullPath)

        // Determine the mode
        const mode = getFileMode(fullPath)

        let hash;

        if (stats.isDirectory()) {
            // ─── Recursively write the subdirectory's tree ────────────────────────
            //
            // This is where the magic happens. We call writeTree on the subdirectory,
             // which returns its tree hash. That hash becomes a pointer in OUR tree.
            //
            // This is how Git represents nested directories — trees pointing to trees.
            hash = writeTree(fullPath)

        } else if (stats.isFile() || stats.isSymbolicLink()) {
            // ─── Hash the file as a blob ──────────────────────────────────────────
      //
      // Read the file content, hash it exactly like hash-object does and store it in .mygit/objects/.
            let content;
            if (stats.isSymbolicLink()) {
                content = Buffer.from(fs.readlinkSync(fullPath));
            } else {
                content = fs.readFileSync(fullPath)
            }
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
