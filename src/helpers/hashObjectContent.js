const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

/**
 * hashObjectContent - hash and store a Git-style loose object.
 *
 * Builds the canonical Git object format (`<type> <length>\0<content>`),
 * computes its SHA-1, and writes a zlib-deflated copy to
 * `.mygit/objects/<first-2-of-hash>/<rest-of-hash>`. Existing objects on
 * disk are never overwritten because Git loose objects are
 * content-addressed: the same payload produces the same hash, so a
 * second write would only re-encode identical bytes.
 *
 * Side effects: creates the `.mygit/objects/<xx>/` directory if missing,
 * writes the compressed object file if it does not already exist.
 *
 * @param {Buffer|string} content - raw object payload (file bytes for a
 *   blob, the serialized tree entries for a tree, the commit text for a
 *   commit). When a `string` is passed it is wrapped in a `Buffer` via
 *   `Buffer.concat`, so callers may pass either.
 * @param {'blob'|'tree'|'commit'|'tag'} [type='blob'] - Git object type
 *   that becomes the header prefix. Defaults to `'blob'`.
 * @returns {string} the 40-character hex SHA-1 of the canonical
 *   `<type> <length>\0<content>` payload - the stable identifier
 *   under `.mygit/objects/`.
 * @throws {TypeError} when `content.length` is unreadable (e.g. a
 *   non-Buffer, non-string value), via `Buffer.concat`.
 * @throws {Error} when the underlying filesystem write fails (permission
 *   denied, full disk, etc.) - the failure surfaces from
 *   `fs.mkdirSync` or `fs.writeFileSync`.
 */
function hashObjectContent(content, type='blob') {
    // Hash and store content as a blob

    const header = `${type} ${content.length}\0`
    const store = Buffer.concat([Buffer.from(header), content])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    // Compress and store

    const compressed = zlib.deflateSync(store)

    const dir = hash.slice(0, 2)
    const filename = hash.slice(2)
    const objectsDir = path.join(process.cwd(), '.mygit', 'objects')
    const objDir = path.join(objectsDir, dir)
    const objPath = path.join(objDir, filename)

    fs.mkdirSync(objDir, {recursive: true})

    if (!fs.existsSync(objPath)) {
        fs.writeFileSync(objPath, compressed)
    }

    return hash
}

module.exports = hashObjectContent
