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
    // TESTS ------------------------
    case 'inspect-object':
        require('../src/commands/inspect-object')(args[0])
        break;
    case 'ins-obj':
        require('../tests/inspect-object')(args[0])
        break;
    case 'show-tree':
        require('../tests/show-tree')(args[0])
        break;
    default:
        console.log("Unknown Command")
        break;
}