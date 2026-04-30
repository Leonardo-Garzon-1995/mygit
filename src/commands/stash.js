const {
    stashPush,
    stashList,
    stashApply,
    stashPop,
    stashDrop,
    stashClear,
    stashShow
} = require('../core/stash')

function stash(args) {
    const cmd = args[0]

    if (!cmd) {
        return stashPush()
    }

    switch(cmd) {
        case 'save':
            return stashPush(args.slice(1).join(' ') || 'WIP: stash')

        case 'list':
            return stashList()

        case 'apply':
            return stashApply(args[1])

        case 'pop':
            return stashPop()

        case 'drop':
            return stashDrop(args[1])

        case 'clear':
            return stashClear()

        case 'show':
            return stashShow(args[1])

        default:
            console.error('Unknown stash command')
    }
}

module.exports = stash