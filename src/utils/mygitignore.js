const path = require('path')
const fs = require('fs')

function parseMygitignore(mygitignorePath) {

    if (!fs.existsSync(mygitignorePath)) {
        return []
    }

    const content  = fs.readFileSync(mygitignorePath, 'utf-8')
    const lines = content.split('\n')

    const patterns = []

    for (let line of lines) {
        line = line.trim()

        // Skip empty lines and comments
        if (!line || line.startsWith('#')) {
            continue;
        }

        const negate = line.startsWith('!')
        if (negate) {
            line = line.substring(1)
        }

        patterns.push({
            pattern: line,
            negate: negate
        })
    }

    return patterns
}

function matchPattern(filePath, pattern) {
    // Normalize path (foward slashes)
    filePath = filePath.split(path.sep).join('/')

    // Handle dir patterns (end with /)
    const isDirectoryPattern = pattern.endsWith('/')
    if (isDirectoryPattern) {
        pattern = pattern.slice(0, -1) // removes trailing slash
    }

    let regexPattern = pattern

    // * and ?
    regexPattern = regexPattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&')

    // handle ** (matches any number of directories)
    regexPattern = regexPattern.replace(/\*\*/g, '§DOUBLESTAR§')

    // handle * (matches anything except /)
    regexPattern = regexPattern.replace(/\*/g, '[^/]*')

    // restore **
    regexPattern = regexPattern.replace(/§DOUBLESTAR§/g, '.*');

    // Handle ? (matches any single character)
    regexPattern = regexPattern.replace(/\?/g, '.');

    // If pattern doesn't contain /, it matches files in any directory
    if (!pattern.includes('/')) {
        regexPattern = `(^|.*/)${regexPattern}$`
    } else {
        // Pattern contains /, match form root
        regexPattern = `^${regexPattern}`

        if (isDirectoryPattern) {
            regexPattern = `${regexPattern}(/|$)`;
        } else {
            regexPattern = `${regexPattern}$`;
        }
    }

    const regex = new RegExp(regexPattern)
    return regex.test(filePath)
}

function isIgnored(filePath, mygitignorePatterns) {
    let ignored = false

    for (const { pattern, negate } of mygitignorePatterns) {
        if (matchPattern(filePath, pattern)) {
            if (negate) {
                ignored = false
            } else {
                ignored = true
            }
        }
    }

    return ignored
}

function getMygitignorePatterns(repoRoot = process.cwd()) {
    // Load .mygitignore

    const mygitignorePath = path.join(repoRoot, '.mygitignore')
    return parseMygitignore(mygitignorePath)
}

module.exports = {
    parseMygitignore,
    matchPattern,
    isIgnored,
    getMygitignorePatterns
}