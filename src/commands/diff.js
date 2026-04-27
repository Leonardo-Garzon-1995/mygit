const fs = require('fs')
const path = require('path')

const readObject = require('../helpers/readObject')
const getCurrentCommit = require('../helpers/getCurrentCommit')
const { ensureRepo } = require('../core/repository')
const readIndex = require('../helpers/readIndex')
const getTreeFiles = require('../helpers/getTreeFiles')
const myersDiff = require('../core/myersDiff')
const { tokenize } = require('../helpers/tokenize')
const formatDiff = require('../helpers/formatDiff')

/**
 * Extracts the tree hash from a commit object's raw content.
 * First line is always: "tree <hash>"
 */
function getTreeHashFromCommit(commitHash) {
    const { content, type } = readObject(commitHash)
    if (type !== 'commit') throw new Error(`Expected commit, got ${type}`)
    const firstLine = content.toString('utf8').split('\n')[0]
    return firstLine.replace('tree ', '').trim()
}

/**
 * Diffs two text contents and prints the result.
 * Returns early silently if files are identical.
 */
function diffContents(aText, bText, filePath, status, mode, aHash, bHash) {
    const hunks = myersDiff(
        aText ? tokenize(aText, 'word') : [],
        bText ? tokenize(bText, 'word') : []
    )
    const output = formatDiff(hunks, { filePath, status, mode, aHash, bHash })
    if (output) console.log(output)
}

/**
 * MODE 1: working tree vs index
 * For each file in the index, compare its stored blob to the current file on disk.
 */
function diffWorkingVsIndex() {
    const index = readIndex()
    const entries = index.entries
    if (Object.keys(entries).length === 0) { console.log('nothing staged'); return }

    for (const [filePath, fileInfo] of Object.entries(entries)) {
        const absPath = path.join(process.cwd(), filePath)

        if (!fs.existsSync(absPath)) {
            const { content } = readObject(fileInfo.hash)
            diffContents(content.toString('utf8'), '', filePath, 'deleted', fileInfo.mode, fileInfo.hash, null)
            continue
        }

        const workingText = fs.readFileSync(absPath, 'utf-8')
        const { content } = readObject(fileInfo.hash)
        const indexText = content.toString('utf8')

        if (indexText !== workingText) {
            diffContents(indexText, workingText, filePath, 'modified', fileInfo.mode, fileInfo.hash, null)
        }
    }
}

/**
 * MODE 2: index vs HEAD (--cached)
 * Compares what is staged against the last commit.
 */
function diffIndexVsHead() {
    const headCommit = getCurrentCommit()
    const index = readIndex()
    const indexEntries = index.entries
    const headFiles = headCommit
        ? getTreeFiles(getTreeHashFromCommit(headCommit))
        : new Map()

    const allPaths = new Set([...Object.keys(indexEntries), ...headFiles.keys()])

    for (const filePath of allPaths) {
        const inIndex  = indexEntries[filePath]
        const headInfo = headFiles.get(filePath)  // now { hash, mode }

        if (inIndex && !headInfo) {
            const { content } = readObject(inIndex.hash)
            diffContents('', content.toString('utf8'), filePath, 'new', inIndex.mode, null, inIndex.hash)
        } else if (!inIndex && headInfo) {
            const { content } = readObject(headInfo.hash)
            diffContents(content.toString('utf8'), '', filePath, 'deleted', headInfo.mode, headInfo.hash, null)
        } else if (inIndex.hash !== headInfo.hash) {
            const { content: aContent } = readObject(headInfo.hash)
            const { content: bContent } = readObject(inIndex.hash)
            diffContents(aContent.toString('utf8'), bContent.toString('utf8'), filePath, 'modified', inIndex.mode, headInfo.hash, inIndex.hash)
        }
    }
}

/**
 * MODE 3: commit vs commit
 * Compares all files between two arbitrary commits.
 */
function diffCommits(hashA, hashB) {
    const filesA = getTreeFiles(getTreeHashFromCommit(hashA))
    const filesB = getTreeFiles(getTreeHashFromCommit(hashB))
    const allPaths = new Set([...filesA.keys(), ...filesB.keys()])

    for (const filePath of allPaths) {
        const infoA = filesA.get(filePath)
        const infoB = filesB.get(filePath)

        if (infoA && !infoB) {
            const { content } = readObject(infoA.hash)
            diffContents(content.toString('utf8'), '', filePath, 'deleted', infoA.mode, infoA.hash, null)
        } else if (!infoA && infoB) {
            const { content } = readObject(infoB.hash)
            diffContents('', content.toString('utf8'), filePath, 'new', infoB.mode, null, infoB.hash)
        } else if (infoA.hash !== infoB.hash) {
            const { content: aContent } = readObject(infoA.hash)
            const { content: bContent } = readObject(infoB.hash)
            diffContents(aContent.toString('utf8'), bContent.toString('utf8'), filePath, 'modified', infoA.mode, infoA.hash, infoB.hash)
        }
    }
}

/**
 * CLI entry point.
 * @returns {void}
 */
function diff(args = []) {
    ensureRepo()

    if (args.includes('--cached')) {
        diffIndexVsHead()
    } else if (args.length >= 2) {
        diffCommits(args[0], args[1])
    } else {
        diffWorkingVsIndex()
    }
}

module.exports = diff 

