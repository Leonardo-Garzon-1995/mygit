const path = require('path')

function join(...segments) {
    return path.join(...segments)
}

function resolve(...segments) {
    return path.resolve(...segments)
}

function dirname(filePath) {
    return path.dirname(filePath)
}

function basename(filePath) {
    return path. basename(filePath)
}

function extname(filePath) {
    return path.extname(filePath)
}

function normalize(filePath) {
    return path.normalize(filePath)
}

function relative(from, to) {
    return path.relative(from, to)
}

module.exports = {
    join,
    resolve,
    dirname,
    basename,
    extname,
    normalize,
    relative
}