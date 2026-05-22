const fs = require('fs')
const path = require('path')

const logger = require('../../utils/logger')

class Repository {
    constructor(worktree, mygitDir) {
        this.worktree = worktree
        this.mygitDir = mygitDir

        this.paths = {
            head: path.join(mygitDir, 'HEAD'),
            objects: path.join(mygitDir, 'objects'),
            refs: path.join(mygitDir,'refs'),
            heads: path.join(mygitDir, 'refs', 'heads'),
            tags: path.join(mygitDir, 'refs', 'tags'),
            index: path.join(mygitDir, 'index'),
            config: path.join(mygitDir, 'config')
        }
    }

    static open(repoPath=process.cwd()) {
        const mygitDir = path.join(repoPath, '.mygit')
        return new Repository(repoPath, mygitDir)
    }

    static find(startPath=process.cwd()) {
        let current = path.resolve(startPath)

        while(true) {
            const mygitDir = path.join(current, '.mygit')

            if (fs.existsSync(mygitDir)) {
                return new Repository(current, mygitDir)
            }

            const parent = path.dirname(current)

            if (parent === current) {
                logger.error(`fatal: not a mygit repositore - path=${current}`)
                throw new Error('fatal: not a mygit repository')
            }

            current = parent 
        }
    }
    
    static init(targetDir=process.cwd()) {
        const worktree = path.resolve(targetDir)
        const mygitDir = path.join(worktree, '.mygit')

        if (fs.existsSync(mygitDir)) {
            throw new Error("A '.mygit' directory already exists inside this folder.")
        }

        fs.mkdirSync(path.join(mygitDir, 'objects'), { recursive: true })
        fs.mkdirSync(path.join(mygitDir, 'refs', 'heads'), { recursive: true })
        fs.mkdirSync(path.join(mygitDir, 'refs', 'tags'), { recursive: true })

        fs.writeFileSync(path.join(mygitDir, 'HEAD'), 'ref: refs/heads/main\n')

        return new Repository(worktree, mygitDir)
    }

    exists() {
        return fs.existsSync(this.mygitDir)
    }

    ensure() {
        if (!this.exists()) {
            logger.warn('fatal: not a mygit repository')
            throw new Error('fatal: not a mygit repository')
        }
    }

    resolveMygitPath(...segments) {
        return path.join(this.mygitDir, ...segments)
    }

    resolveWorktreePath(...segments) {
        return path.join(this.worktree, ...segments)
    }

    hasHead() {
        return fs.existsSync(this.paths.head)
    }

    readHead() {
        return fs.readFileSync(this.paths.head, 'utf8').trim()
    }
}

module.exports = Repository