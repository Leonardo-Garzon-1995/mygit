const path = require('path')

function objectPath(repo, hash) {
    return path.join(repo.paths.objects, hash.slice(0, 2), hash.slice(2))
}

function refPath(repo, ref) {
    return repo.resolveMygitPath(ref)
}

function branchPath(repo, branchName) {
    return repo.resolveMygitPath('refs', 'heads', branchName)
}

function tagPath(repo, tagName) {
    return repo.resolveMygitPath('refs', 'tags', tagName)
}

module.exports = {
    objectPath,
    refPath,
    branchPath,
    tagPath
}