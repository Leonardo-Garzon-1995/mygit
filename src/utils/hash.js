const crypto = require('crypto')

/**
 * Compute the SHA-1 digest of `data` and return it as a 40-character
 * lower-case hexadecimal string.
 *
 * @param {string | Buffer} data - The content to hash.
 * @returns {string} A 40-character hex-encoded SHA-1 hash.
 *
 * @example
 * const { sha1 } = require('./hash')
 * sha1('hello world') // => 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'
 */
function sha1(data) {
    return crypto.createHash('sha1').update(data).digest('hex')
}

/**
 * Compute the SHA-1 digest of `data` and return it as a 20-byte
 * {@link Buffer} of raw binary (not hex-encoded).
 *
 * This is the form required when writing hash bytes directly into binary
 * Git object files (e.g., tree entries or pack-file index records).
 *
 * @param {string | Buffer} data - The content to hash.
 * @returns {Buffer} A 20-byte Buffer containing the raw SHA-1 digest.
 *
 * @example
 * const { sha1Buffer } = require('./hash')
 * const buf = sha1Buffer('hello world')
 * buf.length // => 20
 */
function sha1Buffer(data) {
    return crypto.createHash('sha1').update(data).digest()
}

module.exports = {
    sha1,
    sha1Buffer
}