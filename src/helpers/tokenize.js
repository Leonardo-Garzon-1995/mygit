/**
 * Tokenizes a string into an array of tokens for diff comparison.
 *
 * Word mode: splits on whitespace boundaries, preserving whitespace as tokens.
 *
 * Char mode: each character is a token.
 *
 * @param {string} text
 * @param {'word'|'char'} mode
 * @returns {string[]}
 */
function tokenize(text, mode='word') {
    if (typeof text !== 'string') throw new TypeError(`tokenize: expected string, got ${typeof text}`)
    
    if (mode === 'char') return text.split('')
    
    if (mode === 'word') {
        // Splits into: words AND whitespace chunks (both are tokens)
        // 'foo  bar\nbaz' → ['foo', '  ', 'bar', '\n', 'baz']
        return text.match(/\S+|\s+/g) ?? []
    }

    throw new Error(`tokenize: unknown mode "${mode}"`)

}

/**
 * Reconstructs the original string from a token array.
 * Round-trip guarantee: detokenize(tokenize(str)) === str
 */
function detokenize(tokens) {
    return tokens.join('');
}

module.exports = { tokenize, detokenize };