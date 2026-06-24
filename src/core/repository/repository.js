const fs = require('../../utils/filesystem')
const path = require('../../utils/paths')
const { MYGITDIR_NAME } = require('../../constants')
const { RepositoryNotFoundError } = require('../../errors')

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
        const repo = new Repository(
            repoPath,
            path.join(repoPath, MYGITDIR_NAME)
        )

        repo.ensure()

        return repo
    }

    static find(startPath=process.cwd()) {
        let current = path.resolve(startPath)

        while(true) {
            const mygitDir = path.join(current, MYGITDIR_NAME)

            if (fs.exists(mygitDir)) {
                return new Repository(current, mygitDir)
            }

            const parent = path.dirname(current)

            if (parent === current) {
                throw new RepositoryNotFoundError()
            }

            current = parent 
        }
    }
    
    static init(targetDir=process.cwd()) {
        const worktree = path.resolve(targetDir)
        const mygitDir = path.join(worktree, MYGITDIR_NAME)

        if (fs.exists(mygitDir)) {
            throw new Error("fatal: A '.mygit' directory already exists inside this folder.")
        }

        fs.ensureDir(path.join(mygitDir, 'objects'))
        fs.ensureDir(path.join(mygitDir, 'refs', 'heads'))
        fs.ensureDir(path.join(mygitDir, 'refs', 'tags'))

        fs.writeFile(path.join(mygitDir, 'HEAD'), 'ref: refs/heads/main\n')
        fs.writeFile(path.join(mygitDir, 'config'), JSON.stringify({repositoryFormatVersion: 0, defaultBranch: 'main'}, null, 2))

        return new Repository(worktree, mygitDir)
    }

    exists() {
        return fs.exists(this.mygitDir)
    }

    ensure() {
        if (!this.exists()) {
            throw new RepositoryNotFoundError()
        }
    }

    resolveMygitPath(...segments) {
        return path.join(this.mygitDir, ...segments)
    }

    resolveWorktreePath(...segments) {
        return path.join(this.worktree, ...segments)
    }
}

module.exports = Repository