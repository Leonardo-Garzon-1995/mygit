const path = require('path')
const fs = require('fs')

const logger = require('../utils/logger')
const { ensureRepo } = require('../core/repository')

function getMygitignorePath() {
    return path.join(process.cwd(), '.mygitignore')
}

function ensureMygitignoreFile() {
    const mygitignorePath = getMygitignorePath()

    const fd = fs.openSync(mygitignorePath, 'a') 
    fs.closeSync(fd)
}

function writeToMygitignoreFile(pattern) {
    if (!pattern) {
        return
    }

    const mygitignorePath = getMygitignorePath()
    const entry = pattern.trim() + '\n'

    fs.appendFileSync(mygitignorePath, entry)
}

function listPatternsInFile() {
    const mygitignorePath = getMygitignorePath()

    const stats = fs.statSync(mygitignorePath)

    if (stats.size === 0) {
        console.log(`'.mygitignore' file is empty`)
        console.log(`use 'mygit ignore <pattern>' to add a pattern.`)
        return
    }

    const content = fs.readFileSync(mygitignorePath, 'utf-8')
    const patterns  = content.split('\n')
    
    console.log(`\nPatterns tracked by '.mygitignore' in ${process.cwd()}\n`)
    for (const p of patterns) {
        if (p === '') continue
        console.log(`- ${p}`)
    }

    console.log('')
}

function removePatternFromFile(pattern) {
    if (!pattern) {
        console.log(`usage: mygit ignore --remove <pattern>`)
        return
    }

    const mygitignorePath = getMygitignorePath()
    const content = fs.readFileSync(mygitignorePath, 'utf-8')
    const lines = content.split('\n')

    const target = pattern.trim()
    let found = false
    const remaining = lines.filter(line => {
        if (line.trim() === target) {
            found = true
            return false
        }
        return true
    })

    if (!found) {
        console.log(`pattern '${target}' not found in .mygitignore`)
        return
    }

    fs.writeFileSync(mygitignorePath, remaining.join('\n'))
    console.log(`pattern '${target}' removed from .mygitignore`)
}

function removeAllPatternsFromFile() {
    const mygitignorePath = getMygitignorePath()

    fs.writeFileSync(mygitignorePath, '')
}

function ignore(args=[]) {
    ensureRepo()
    ensureMygitignoreFile()

    try {
        if (args[0] === '--list') {
        listPatternsInFile()
        } else if (args[0] === '--remove') {
            removePatternFromFile(args[1])
        } else if (args[0] === '--remove-all') {
            removeAllPatternsFromFile()
        } else {
            writeToMygitignoreFile(args[0])
        }
    } catch (error) {
        logger.error(error.stack)
        console.error(`Error: ${error.message}`)
        return
    }
    
    
}

module.exports = ignore
