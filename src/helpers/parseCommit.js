/**
 * Parses a commit object into a human-readable javascript object
 * @param {Buffer} content - The content of a commit object (excluding the header)
 * @returns {Object} - An object with five properties: 'tree', 'parents', 'author', 'committer' and 'message'
 */
function parseCommit(content) {
    const lines = content.toString().split('\n') // Array of lines with the commit content
    const commit = {
        tree: null,
        parents: [],
        author: null,
        committer: null,
        message: null
    }

    // Keep track of the lines index
    let i = 0

    
    // 2. Parse header lines (tree, parent, author, commiter)
    while (i < lines.length && lines[i] !== '') {
        const line = lines[i]

        if (line.startsWith('tree ')) {
            commit.tree = line.substring(5)
        } else if (line.startsWith('parent ')) {
            commit.parents.push(line.substring(7))
        } else if (line.startsWith('author ')) {
            commit.author = line.substring(7)
        } else if (line.startsWith('committer ')) {
            commit.committer = line.substring(10)
        }

        i++
    }

    // skip the blank line 
    i++

    // Everything else is the commit message
    commit.message = lines.slice(i).join('\n').trim()

    // Return the parsed commit object
    return commit
}

module.exports = parseCommit