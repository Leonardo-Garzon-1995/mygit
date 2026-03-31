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
    console.log('   init'.padEnd(16) + 'Create an empty mygit repo')
    console.log('   commit'.padEnd(16) + 'Record changes to the repo')
    console.log('   log'.padEnd(16) + 'Show commit logs')
    console.log('   branch'.padEnd(16) + 'List branches')
    console.log('   cat-file'.padEnd(16) + 'Show info about a mygit object')
    console.log('   checkout'.padEnd(16) + 'Switch branches')
    console.log('   status'.padEnd(16) + 'Shows the current status of your files in a specific branch')
    console.log('   show-tree'.padEnd(16) + 'Show the contents of a tree object')
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
        case 'commit':
            commitHelp()
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
        default:
            console.log('   Unknown command')
            break
    }
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
    console.log('   mygit log')
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
}

module.exports = displayHelp