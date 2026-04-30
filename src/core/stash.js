const fs = require('fs')
const path = require('path')

const writeTree = require('../commands/write-tree')
const commitTree = require('../commands/commit-tree')
const readObject = require('../helpers/readObject')
const checkoutCommit = require('../helpers/checkoutCommit')
const { getRepoPath } = require('../core/repository')
const { getHEADCommit, updateHEADCommit } = require('../core/refs')
const { timeStamp } = require('console')
const { monitorEventLoopDelay } = require('perf_hooks')

function getStashPath() {
    return path.join(getRepoPath(), 'refs', 'stash.json')
}

function readStash() {
    const stashPath = getStashPath()
    if(!fs.existsSync(stashPath)) {
        return { stashes: []}
    }

    return JSON.parse(fs.readFileSync(stashPath, 'utf-8'))
}

function writeStash(data) {
    fs.mkdirSync(path.dirname(getStashPath()), { recursive: true })
    fs.writeFileSync(getStashPath(), JSON.stringify(data, null, 2))
} 

function reindex(stash) {
    stash.stashes.forEach((s, index) => {
        s.id = `stash@{${index}}`
    })
}

function parseIndex(ref) {
    if (!ref) return 0

    const match = ref.match(/stash@\{(\d+)\}/)
    if(!match) throw new Error('Invalid stash reference')
    
    return parseInt(match[1])
}

// FEATURES
function stashPush(message='WIP: stash') {
    const head = getHEADCommit()
    const tree = writeTree()
    const commit = commitTree(tree, message, head)

    const stash = readStash()

    stash.stashes.unshift({
        id: 'stash@{0}',
        commit,
        message,
        timestamp: Date.now()
    })

    reindex(stash)
    writeStash(stash)

    // Clean working dir
    if (head) {
        checkoutCommit(head)
    }

    console.log(`Saved working directory to ${stash.stashes[0].id}`)
}

function stashList() {
    const stash = readStash()

    if (stash.stashes.length === 0) {
        console.log('No stashes')
        return
    }

    stash.stashes.forEach((s, index) => {
        console.log(`stash@{${index}}: ${s.message}`)
    })
}

function stashApply(ref) {
    const stash = readStash()
    const index = parseIndex(ref)


    const entry = stash.stashes[index]
    if (!entry) {
        console.error('Invalid stash reference')
        return
    }

    checkoutCommit(entry.commit)

    console.log(`Applied ${entry.id}`)
}

function stashPop() {
    const stash = readStash()

    if (stash.stashes.length === 0) {
        console.log('No stashes to pop')
        return
    }

    const entry = stash.stashes.shift()

    checkoutCommit(entry.commit)

    reindex(stash)
    writeStash(stash)

    console.log(`Popped ${entry.id}`)
}

function stashDrop(ref) {
    const stash = readStash()
    const index = parseIndex(ref)

    if (!stash.stashes[index]) {
        console.error('Invalid stash reference')
        return
    }

    stash.stashes.splice(index, 1)

    reindex(stash)
    writeStash(stash)

    console.log(`Dropped stash@{${index}}`)
} 

function stashClear() {
    writeStash({ stashes: [] })
    console.log('Cleared all stashes')
}

function stashShow(ref) {
    const stash = readStash()
    const index = parseIndex(ref)

    const entry = stash.stashes[index]
    if (!entry) {
        console.error('Invalid stash reference')
        return
    }

    const { content } = readObject(entry.commit)

    console.log(`\n--- ${entry.id} ---`)
    console.log(content.toString())
}

module.exports = {
    stashPush,
    stashList,
    stashApply,
    stashPop,
    stashDrop,
    stashClear,
    stashShow
}