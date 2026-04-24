const colors = require('./colors')

function displayHelp(command="") {

    if (command) {
        getCommandHelp(command)
        return
    }
    console.log('')
    console.log(`   ${colors.green}USAGE:${colors.reset}\n`)
    console.log(`   mygit <command> [<options/flags>] [<args>]\n`)
    console.log(`   ${colors.green}COMMANDS:${colors.reset}\n`)
    console.log('   init'.padEnd(16) + 'Creates an empty mygit repo')
    console.log('   add'.padEnd(16) + 'Adds file contents to the staging area')
    console.log('   commit'.padEnd(16) + 'Records any staged changes to the repo')
    console.log('   log'.padEnd(16) + 'Shows commit logs')
    console.log('   branch'.padEnd(16) + 'List branches')
    console.log('   cat-file'.padEnd(16) + 'Show info about a mygit object')
    console.log('   checkout'.padEnd(16) + 'Switch branches')
    console.log('   status'.padEnd(16) + 'Shows the current status of your files in a specific branch')
    console.log('   show-tree'.padEnd(16) + 'Show the contents of a tree object')
    console.log('   ls-files'.padEnd(16) + 'List all the files in the staging area')
    console.log('   tag'.padEnd(16) + 'Manage tags')
    console.log(`   inspect-object`.padEnd(18) + 'Show detailed info about a mygit object')
    console.log('')
    console.log('   help, -h'.padEnd(16) + 'Display this help message')
    console.log('   For a more detailed description of each command, run `mygit help <command>`')
    console.log('')
}

function getCommandHelp(command) {
    switch (command) {
        case 'cat-file':
            catFileHelp()
            break;
        case 'add':
            addHelp()
            break;
        case 'commit':
            commitHelp()
            break
        case 'status':
            statusHelp()
            break
        case 'log':
            logHelp()
            break
        case 'checkout':
            checkoutHelp()
            break;
        case 'inspect-object':
            inspectObjectHelp()
            break;
        case 'show-tree':
            showTreeHelp()
            break
        case 'branch':
            branchHelp()
            break
        case 'tag':
            tagHelp()
            break;
        default:
            console.log('   Unknown command')
            break
    }
}

function statusHelp() {
    console.log('')
    console.log('   status'.padEnd(16) + 'Shows the current status of your files in a specific branch\n')
    console.log('   mygit status')
    console.log('')
}
function catFileHelp() {
    console.log('')
    console.log('   cat-file'.padEnd(16) + 'Show info about a mygit object\n')
    console.log('   mygit cat-file [-t] [-s] [-p] <object-hash>')
    console.log('   -t'.padEnd(16) + 'Show object type')
    console.log('   -s'.padEnd(16) + 'Show object size')
    console.log('   -p'.padEnd(16) + 'Show object pretty-printed info')
    console.log('')
}

function commitHelp() {
    console.log('')
    console.log('   commit'.padEnd(16) + 'Record changes to the repo\n')
    console.log('   mygit commit -m "message"')
    console.log('   -m'.padEnd(16) + 'Commit message')
    console.log('')
}

function logHelp() {
    console.log('')
    console.log('   log'.padEnd(16) + 'Show commit logs\n')
    console.log('   mygit log [--oneline]')
    console.log('   --oneline'.padEnd(16) + 'Show commit logs in one-line format')
    console.log('')
}

function checkoutHelp() {
    console.log('')
    console.log('   checkout'.padEnd(16) + 'Switch or create branches\n')
    console.log('   mygit checkout [-b] <branch-name>')
    console.log('   -b <branch>'.padEnd(16) + 'Create and switch to a new branch')
    console.log('')
}

function inspectObjectHelp() {
    console.log('')
    console.log('   inspect-object'.padEnd(18) + 'Show detailed info about a mygit object\n')
    console.log('   mygit inspect-object <object-hash>')
    console.log('')
}

function showTreeHelp() {
    console.log('')
    console.log('   show-tree'.padEnd(16) + 'Show the contents of a tree object\n')
    console.log('   mygit show-tree <tree-hash>')
    console.log('')
}

function branchHelp() {
    console.log('')
    console.log('   branch'.padEnd(19) + 'List, create or delete branches\n')
    console.log('   mygit branch <options/branch-name>')
    console.log('   branch'.padEnd(19) + 'List all branches')
    console.log('   -v, --verbose'. padEnd(19) + 'List branches with commit and message info')
    console.log('   -d, --delete'.padEnd(19) + 'Delete a branch')
    console.log('   <name>'.padEnd(19) + "Create a new branch")
    console.log('')
}

function addHelp() {
    console.log('')
    console.log('   add'.padEnd(16) + 'Add files to the staging area for committing.\n')
    console.log('   mygit add <file\\s>')
    console.log('')
}

function tagHelp() {
    console.log('')
    console.log('   tag'.padEnd(16) + 'List existing tags or create tags')
    console.log('   mygit tag'.padEnd(16) + 'List all tags')
    console.log('   mygit tag <name>'.padEnd(16) + 'Create a new tag')
    console.log('')
}

module.exports = displayHelp