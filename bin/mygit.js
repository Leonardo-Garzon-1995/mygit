#!/usr/bin/env node

const path = require('path')
const [,, command, ...args] = process.argv


const commands = {
    'init': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'init'),
        handler: function(args) {require(this.modulePath) ()}
    },
    'add': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'add'),
        handler: function(args) { require(this.modulePath) (args) }
    },
    'commit': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'commit'),
        handler: function (args) {
            const msgIndex = args.indexOf('-m')

            if (msgIndex === -1) {
                console.error('Error: -m flag required');
                console.error('Usage: mygit commit -m "message"');
                process.exit(1);
            }

            const commitMessage = args[msgIndex + 1]
            require(this.modulePath) (commitMessage)
        }
    },
    'log': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'log'),
        handler: function(args) {
            const options = { oneline: args.includes('--oneline')}
            require(this.modulePath) (options)
        }
    },
    'branch': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'branch'),
        handler: function(args) { require(this.modulePath) (args) }
    },
    'checkout': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'checkout'),
        handler: function(args) { require(this.modulePath) (args) }
    },
    'status': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'status'),
        handler: function (args)  { require(this.modulePath) () }
    },
    'hash-object': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'hash-object'),
        handler: function (args) {
            const hashObj = require(this.modulePath) (args[0])
            console.log(hashObj)
        }
    },
    'write-tree': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'write-tree'),
        handler: function (args) {
            const treeHash = require(this.modulePath) ()
            console.log(treeHash)
        }
    },
    'commit-tree': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'commit-tree'),
        handler: function (args) {
            const tree = args[0]
            const messageIndex = args.indexOf('-m')
            const parentIndex = args.indexOf('-p')

            if (messageIndex === -1) {
                console.error('Error: -m flag required for commit message')
                process.exit(1)
            }

            const message = args[messageIndex + 1]
            const parent = parentIndex !== -1 ? args[parentIndex + 1] : null
            const commitHash = require(this.modulePath) (tree, message, parent)

            console.log(commitHash)
        }
    },
    'inspect-object': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'inspect-object'),
        handler: function (args) { require(this.modulePath) (args[0]) }
    },
    'cat-file': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'cat-file'),
        handler: function(args) {
            if (args.length < 2) {
                console.error('Usage: mygit cat-file [-t | -s | -p] <object>');
                process.exit(1);
            }

            const mode = args[0]
            const hash = args[1]

            require(this.modulePath) (mode, hash)
        } 
    },
    'ls-files': {
        modulePath: path.join(__dirname, '..', 'src', 'commands', 'ls-files'),
        handler: function(args) { require(this.modulePath)() }
    },

    // THIS SECTION IS FOR TESTING PURPUSES ONLY - NON REAL COMMANDS
    'test': {
        module: path.join(__dirname, '..', 'test'),
        handler: function(args) { require(this.module) (args) }
    },
    'test2': {
        module: path.join(__dirname, '..', 'secondTest'),
        handler: function (args)  { require(this.module) (args) }
    },
    'ins-obj': {
        module: path.join(__dirname, '..', 'tests', 'inspect-object'),
        handler: function(args)  { require(this.module) (args[0])}
    },
    'show-tree': {
        module: path.join(__dirname, '..', 'tests', 'show-tree'),
        handler: function(args) { require(this.module) (args[0]) }
    }
}

const helpCommands = ['help', '-h']

if (helpCommands.includes(command)) {
    require(path.join(__dirname, '..', 'src', 'utils', 'displayHelp')) (args[0])
} else if (commands[command]) {
    commands[command].handler(args)
} else {
    require(path.join(__dirname, '..', 'src', 'utils', 'displayHelp'))();
}