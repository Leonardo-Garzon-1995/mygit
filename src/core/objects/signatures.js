const { InvalidObjectError } = require('../../errors')

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

// Implement validateSignature() later

module.exports = {
    formatSignature,
    parseSignature
}