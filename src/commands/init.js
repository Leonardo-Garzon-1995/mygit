const fs = require('fs')
const path = require('path')

function mygitInit(targetDir=process.cwd()) {
    const gitDir = path.join(targetDir, ".mygit")
    const objectsDir = path.join(gitDir, "objects")
    const refsDir = path.join(gitDir, "refs")
    const headsDir = path.join(refsDir, 'heads')
    const headFile = path.join(gitDir, 'HEAD')

    if (fs.existsSync(gitDir)) {
        console.log("A '.mygit' file already exist in this folder")
        return
    }

    fs.mkdirSync(gitDir, {recursive: true})
    fs.mkdirSync(objectsDir, {recursive: true})
    fs.mkdirSync(refsDir, {recursive: true})
    fs.mkdirSync(headsDir, {recursive: true})

    fs.writeFileSync(headFile, 'ref: refs/heads/main\n')

    console.log(`Initialized empty mygit repository in ${gitDir}`)

}

module.exports = mygitInit