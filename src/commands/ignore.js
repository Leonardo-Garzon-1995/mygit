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
    // if (!fs.existsSync(mygitignorePath)) {
    //     fs.writeFileSync(mygitignorePath, '')
    // }
}

function writeToMygitignoreFile(filename) {
    if (!filename) {
        return
    }

    const mygitignorePath = getMygitignorePath()
    const entry = filename.trim() + '\n'

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
        console.log('')
    }
}

function removePatternFromFile(filenam) {
    throw new Error('Not implemented yet')
}

function removeAllPatternsFromFile() {
    const mygitignorePath = getMygitignorePath()

    fs.writeFileSync(mygitignorePath, '')
}

function ignore(args=[]) {
    ensureRepo()
    ensureMygitignoreFile()


    if (args[0] === '--list') {
        listPatternsInFile()
    } else if (args[0] === '--remove') {
        removePatternFromFile(args[1])
    } else if (args[0] === '--remove-all') {
        removeAllPatternsFromFile()
    } else {
        writeToMygitignoreFile(args[0])
    }
    
}

module.exports = ignore