const fs = require('fs')
const path = require('path')

const { ensureRepo } = require('../core/repository')
const getCurrentCommit = require('../helpers/getCurrentCommit')
const readObject = require('../helpers/readObject')

function getTagsPath() {
    return path.join(process.cwd(), '.mygit', 'refs', 'tags')
}

function getRefPath(kind, name) {
    return path.join(process.cwd(), '.mygit', 'refs', kind, name)
}

function isFullHash(s) {
    return typeof s === 'string' && /^[0-9a-f]{40}$/.test(s)
}

// validateTagName rejects names that would escape refs/tags via path
// traversal or that don't form a usable single-segment ref. Mirrors a
// subset of `git check-ref-format`: no embedded slashes, no leading
// '-' or '.', no whitespace or NUL.
function validateTagName(name) {
    if (typeof name !== 'string' || name.length === 0) {
        return 'tag name must be a non-empty string'
    }
    if (name.includes('/') || name.includes('\\')) {
        return `invalid tag name '${name}': must not contain '/' or '\\'`
    }
    if (/[\s\0]/.test(name)) {
        return `invalid tag name '${name}': must not contain whitespace or NUL`
    }
    if (name.startsWith('-') || name.startsWith('.')) {
        return `invalid tag name '${name}': must not start with '-' or '.'`
    }
    return null
}

function ensureTagNameValid(name) {
    const err = validateTagName(name)
    if (err) {
        console.error(`fatal: ${err}`)
        process.exit(1)
    }
}

// isSimpleRefName allows the same set as a tag name: a single path segment
// with no separators, no whitespace, no leading '-' / '.'. This prevents
// '../../HEAD' from being treated as a branch / tag lookup.
function isSimpleRefName(ref) {
    return validateTagName(ref) === null
}

function resolveCommit(ref) {
    if (isFullHash(ref)) {
        let obj
        try {
            obj = readObject(ref)
        } catch (e) {
            console.error(`fatal: '${ref}' is not a valid ref`)
            process.exit(1)
        }
        if (obj.type !== 'commit') {
            console.error(`fatal: '${ref}' is a ${obj.type}, not a commit`)
            process.exit(1)
        }
        return ref
    }
    if (!isSimpleRefName(ref)) {
        console.error(`fatal: '${ref}' is not a valid ref`)
        process.exit(1)
    }
    const branchPath = getRefPath('heads', ref)
    if (fs.existsSync(branchPath)) {
        return fs.readFileSync(branchPath, 'utf-8').trim()
    }
    const tagPath = getRefPath('tags', ref)
    if (fs.existsSync(tagPath)) {
        return fs.readFileSync(tagPath, 'utf-8').trim()
    }
    console.error(`fatal: '${ref}' is not a valid ref`)
    process.exit(1)
}

function createTag(name, commitHash, force) {
    ensureTagNameValid(name)

    const tagsPath = getTagsPath()
    if (!fs.existsSync(tagsPath)) {
        fs.mkdirSync(tagsPath, { recursive: true })
    }

    const tagPath = path.join(tagsPath, name)
    if (fs.existsSync(tagPath) && !force) {
        console.error(`fatal: tag '${name}' already exists`)
        process.exit(1)
    }

    fs.writeFileSync(tagPath, commitHash + '\n')
}

function deleteTag(name) {
    ensureTagNameValid(name)

    const tagPath = path.join(getTagsPath(), name)
    if (!fs.existsSync(tagPath)) {
        console.error(`fatal: tag '${name}' not found`)
        process.exit(1)
    }
    fs.unlinkSync(tagPath)
}

function listTags() {
    const tagsPath = getTagsPath()
    if (!fs.existsSync(tagsPath)) {
        console.log('No tags found')
        return
    }

    const tags = fs.readdirSync(tagsPath)
    if (tags.length === 0) {
        console.log('No tags found')
        return
    }
    tags.sort().forEach(t => console.log(t))
}

function parseArgs(args) {
    const opts = { delete: false, force: false }
    const positional = []
    for (const a of args) {
        if (a === '-d' || a === '--delete') opts.delete = true
        else if (a === '-f' || a === '--force') opts.force = true
        else positional.push(a)
    }
    return { opts, positional }
}

function tag(args) {
    ensureRepo()

    const { opts, positional } = parseArgs(args || [])

    if (opts.delete) {
        if (positional.length === 0) {
            console.error('fatal: tag name required for delete')
            process.exit(1)
        }
        deleteTag(positional[0])
        return
    }

    if (positional.length === 0) {
        listTags()
        return
    }

    const name = positional[0]
    const commitHash = positional.length >= 2
        ? resolveCommit(positional[1])
        : getCurrentCommit()

    createTag(name, commitHash, opts.force)
}

module.exports = tag
