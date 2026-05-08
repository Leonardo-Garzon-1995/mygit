const fs = require('fs')
const path = require('path')

/**
 * Creates the .mygit directory structure and initial HEAD file in the target directory.
 * If the repository already exists, it reports that and leaves the directory unchanged.
 * @param {string} [targetDir=process.cwd()] - Directory where the .mygit repository should be created
 * @throws {Error} If repository initialisation fails
 */
function mygitInit(targetDir=process.cwd()) {
    const mygitDir = path.join(targetDir, ".mygit")
    const objectsDir = path.join(mygitDir, "objects")
    const refsDir = path.join(mygitDir, "refs")
    const headsDir = path.join(refsDir, 'heads')
    const headFile = path.join(mygitDir, 'HEAD')

    
    try {
        if (fs.existsSync(mygitDir)) {
            console.log("A '.mygit' directory already exists inside this folder.")
            return
        }
        fs.mkdirSync(mygitDir, {recursive: true})
        fs.mkdirSync(objectsDir, {recursive: true})
        fs.mkdirSync(refsDir, {recursive: true})
        fs.mkdirSync(headsDir, {recursive: true})

        fs.writeFileSync(headFile, 'ref: refs/heads/main\n')

        console.log(`Initialized empty mygit repository in ${mygitDir}`)
    } catch (error) {
        throw new Error(`Init failed: ${error.message}`)
    }

}

module.exports = mygitInit
