const { InvalidObjectError } = require('../../errors')

function createSignature(name, email) {
    const timezoneOffset = -new Date().getTimezoneOffset()
    const hours = Math.floor(Math.abs(timezoneOffset) / 60)
    const minutes = Math.abs(timezoneOffset) % 60
    const sign = timezoneOffset >= 0 ? '+' : '-'

    const timezone = `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`

    return {
        name,
        email,
        timestamp: Math.floor(Date.now() / 1000),
        timezone: timezone
    }
}

function formatSignature(signature) {
    return (
        `${signature.name} ` +
        `<${signature.email}> ` +
        `${signature.timestamp} ` +
        `${signature.timezone}`
    )
}

/**
 * Parse author/committer/tagger signature
 * Format: `Name <email> timestamp timezone
 * @param {string} signature 
 * @returns {Object}
 */
function parseSignature(signature) {
    const match = signature.match(
        /^(.*?) <(.*?)> (\d+) ([+-]\d{4})$/
    )

    if (!match) {
        throw new InvalidObjectError(`Invalid signature: ${signature}`)
    }

    return {
        name: match[1],
        email: match[2],
        timestamp: Number(match[3]),
        timezone: match[4]
    }
}


module.exports = {
    createSignature,
    formatSignature,
    parseSignature
}