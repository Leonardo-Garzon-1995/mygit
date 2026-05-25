const crypto = require('crypto')

function sha1(data) {
    return crypto.createHash('sha1').update(data).digest('hex')
}

function sha1Buffer(data) {
    return crypto.createHash('sha1').update(data).digest()
}

module.exports = {
    sha1,
    sha1Buffer
}