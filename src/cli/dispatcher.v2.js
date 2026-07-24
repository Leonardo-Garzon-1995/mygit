const path = require('path')
const { ValidationError } = require('../errors')
const displayHelp = require('../utils/displayHelp')

const {
    requireArgument,
    requireOption
} = require('./CLIParser')

const COMMANDS_DIR = path.join(__dirname, '..', 'commands')

/**
 * Compatibility wrappers.
 *
 * During the migration these wrappers adapt the parsed command
 * to the old command API.
 *
 * Once every command has been migrated these wrappers can simply
 * become:
 *
 * handler(parsed)
 *
 * or disappear entirely.
 */
const commandAdapters = {

    init(handler, parsed) {
        return handler(parsed.args)
    },

    add(handler, parsed) {
        return handler(parsed.args)
    },

    rm(handler, parsed) {
        return handler(parsed.args)
    },

    commit(handler, parsed) {

        const message = requireOption(
            parsed,
            'm',
            'Commit message is required'
        )

        return handler(message)
    },

    log(handler, parsed) {

        return handler({
            oneline: !!parsed.options.oneline
        })
    },

    branch(handler, parsed) {
        return handler(parsed.args)
    },

    checkout(handler, parsed) {
        return handler(parsed.args)
    },

    status(handler) {
        return handler()
    },

    'hash-object'(handler, parsed) {
        return handler(parsed.args, parsed.options)
    },

    writeTree(handler) {
        return handler()
    },

    commitTree(handler, parsed) {

        const tree = requireArgument(
            parsed,
            0,
            'Tree hash required'
        )

        const message = requireOption(
            parsed,
            'm',
            'Commit message required'
        )

        const parent = parsed.options.p || null

        return handler(tree, message, parent)
    },

    'inspect-object'(handler, parsed) {

        return handler(
            requireArgument(parsed, 0, 'Object hash required')
        )
    },

    'cat-file'(handler, parsed) {
        return handler(parsed.args, parsed.options)
    },

    'ls-files'(handler) {
        return handler()
    },

    tag(handler, parsed) {
        return handler(parsed.args)
    },

    diff(handler, parsed) {
        return handler(parsed.args)
    },

    stash(handler, parsed) {
        return handler(parsed.args)
    },

    ignore(handler, parsed) {
        return handler(parsed.args)
    }
}

/**
 * Dispatch a parsed command.
 */
async function dispatch(parsed) {
    if (!parsed.command) {
        displayHelp()
    }

    if (parsed.command === 'help') {
        displayHelp(parsed.args[0])
    }

    const adapter = commandAdapters[parsed.command]

    if (!adapter) {
        throw new ValidationError(
            `Unknown command: ${parsed.command}`
        )
    }

    const handler = require(
        path.join(COMMANDS_DIR, parsed.command)
    )

    return await adapter(handler, parsed)
}

function hasCommand(command) {
    return command in handlers
}

function getCommands() {
    return Object.keys(handlers)
}

module.exports = {
    dispatch,
    hasCommand,
    getCommands
}