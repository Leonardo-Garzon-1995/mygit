#!/usr/bin/env node

const [,, command, ...args] = process.argv;


switch(command) {
    case 'init':
        require('../src/commands/init')()
        break;
    case 'hash-object':
        const hashObj = require('../src/commands/hash-object')(args[0])
        console.log(hashObj)
        break;
    case 'write-tree':
        const treeHash =require('../src/commands/write-tree')()
        console.log(treeHash)
        break;
    case 'inspect-object':
        require('../src/commands/inspect-object')(args[0])
        break;
    case 'ins-obj':
        require('../tests/inspect-object')(args[0])
        break;
    case 'show-tree':
        require('../tests/show-tree')(args[0])
        break;
    case 'commit-tree':
        const tree = args[0]
        const messageIndex = args.indexOf('-m')
        const parentIndex = args.indexOf('-p')

        if (messageIndex === -1) {
            console.error('Error: -m flag required for commit message')
            process.exit(1)
        }

        const message = args[messageIndex + 1]
        const parent = parentIndex !== -1 ? args[parentIndex + 1] : null
        const commitHash = require('../src/commands/commit-tree') (tree, message, parent)
        console.log(commitHash);
        break;
    case 'commit':
        // Usage: mygit commit -m "message"
        const msgIndex = args.indexOf('-m');
        
        if (msgIndex === -1) {
            console.error('Error: -m flag required');
            console.error('Usage: mygit commit -m "message"');
            process.exit(1);
        }
        
        const commitMessage = args[msgIndex + 1];
        require('../src/commands/commit')(commitMessage);
        break;
    case "log":
        // Usage: mygit log [--oneline]
        const options = {
            oneline: args.includes('--oneline')
        };
        require('../src/commands/log')(options);
        break;
    case 'cat-file':
        // Usage: mygit cat-file [-t | -s | -p] <hash>
        if (args.length < 2) {
            console.error('Usage: mygit cat-file [-t | -s | -p] <object>');
            process.exit(1);
        }
        
        const mode = args[0];
        const hash = args[1];
        require('../src/commands/cat-file')(mode, hash);
        break;
    default:
        console.log("Unknown Command")
        break;
}