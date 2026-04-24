const fs = require('fs')
const path = require('path')

const { ensureRepo } = require('../core/repository')
const getCurrentcommit = require('../helpers/getCurrentCommit')

function getTagsPath() {
    return path.join(process.cwd(), '.mygit', 'refs', 'tags')
}

function createTag(name) {
        const tagsPath =  getTagsPath()
        if (!fs.existsSync(tagsPath)) {
            fs.mkdirSync(tagsPath, {recursive: true})
        }

        const tagPath = path.join(tagsPath, name)
        if (fs.existsSync(tagPath)) {
            console.error(`fatal: tag '${name}' already exists`)
            process.exit(1)
        }

        const commitHash = getCurrentcommit()

        fs.writeFileSync(tagPath, commitHash + '\n')
}

function listTags() {
    const tagsPath = getTagsPath()
    if (!fs. existsSync(tagsPath)) {
        console.log('No tags found')
        return
    }

    const tags = fs.readdirSync(tagsPath)
    tags.sort().forEach(t => console.log(t))
}

function tag(args) {
    ensureRepo()

    if (!args ||args.length === 0) {
        listTags()
        return
    }

    const tagName = args[0]
    createTag(tagName)
}

module.exports = tag