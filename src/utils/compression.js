const zlib = require('zlib');

/**
 * @param {string | Buffer} data
 * @returns {Buffer}
 */
function compress(data) {
  const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return zlib.deflateSync(inputBuffer);
}

/**
 * @param {Buffer} data
 * @returns {Buffer}
 */
function decompress(data) {
  return zlib.inflateSync(data);
}
module.exports = {
  compress,
  decompress
};