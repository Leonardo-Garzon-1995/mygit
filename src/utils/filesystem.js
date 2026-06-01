const fs = require('fs')
const path = require('path')

// Only synchronus implementation for now
/* When importing import as:
    const fs = require('...') 
    
    to make avoid name collisions and to make sure youre referring to filesystem functionality*/

function exists(filePath) {
    return fs.existsSync(filePath)
}

function isFile(filePath) {
    return exists(filePath) && fs.statSync(filePath).isFile()
}

function isDirectory(filePath) {
    return exists(filePath) && fs.statSync(filePath).isDirectory()
}

// Dir operations 

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true })
}

function removeDir(dirPath, f=true) {
    if (!exists(dirPath)) return 

    fs.rmSync(dirPath, {
        recursive: true,
        force: f
    })
}

function listDir(DirPath) {
    return fs.readdirSync(DirPath)
}

// File REading

function readFile(filePath, encoding='utf8') {
    return fs.readFileSync(filePath, encoding)
}

function readFileBuffer(filePath) {
    return fs.readFileSync(filePath)
}

function readJSON(filePath) {
    return JSON.parse(readFile(filePath))
}

// File writing

function writeFile(filePath, content) {
    ensureDir(path.dirname(filePath))

    fs.writeFileSync(filePath, content)
}

function appendFile(filePath, content) {
    ensureDir(path.dirname(filePath))

    fs.appendFileSync(filePath, content)
}

function writeJSON(filePath, data, spacing=2) {
    writeFile(filePath, JSON.stringify(data, null, spacing))
}

// File removal

function removeFile(filePath) {
    if (!exists(filePath)) return 

    fs.unlinkSync(filePath)
}

// Copy and move

function copyFile(source, destination) {
    ensureDir(path.dirname(destination))

    fs.copyFileSync(source, destination)
}

function moveFile(source, destination) {
    ensureDir(path.dirname(destination))

    fs.renameSync(source, destination)
}

// METADATA utilities

function stat(filePath) {
    return fs.statSync(filePath)
}

function fileSize(filePath) {
    return stat(filePath).size
}

function modifiedTime(filePath) {
    return stat(filePath).mtime
}

// Path utilities 

function resolve(...segments) {
    return path.resolve(...segments)
}

function join(...segments) {
    return path.join(...segments)
}

function dirname(filePath) {
    return path.dirname(filePath)
}

function basename(filePath) {
    return path.basename(filePath)
}

function extname(filePath) {
    return path.extname(filePath)
}


module.exports = {
    exists,
    isFile,
    isDirectory,
    ensureDir,
    removeDir,
    listDir,
    readFile,
    readFileBuffer,
    readJSON,
    writeFile,
    writeJSON,
    appendFile,
    removeFile,
    copyFile,
    moveFile,
    stat,
    fileSize,
    modifiedTime,
    resolve,
    join,
    dirname,
    basename,
    extname
}