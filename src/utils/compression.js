const zlib = require('zlib');

/**
 * Compress a string or a Buffer using zlib.
 * 
 * @param {string | Buffer} data
 * @returns {Buffer}
 */
function compress(data) {
  const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return zlib.deflateSync(inputBuffer);
}

/**
 * Decompress a Buffer using zlib.
 * 
 * @param {Buffer} data
 * @returns {Buffer}
 */
function decompress(data) {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('decompress() expects a Buffer as argument')
  }
  return zlib.inflateSync(data);
}

module.exports = {
  compress,
  decompress
};