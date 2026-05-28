const { ValidationError } = require('../errors')
const path = require('path')

const COMMANDS_DIR = path.join(__dirname, '..', 'commands')

const commands = {
    init: require(path.join(COMMANDS_DIR, 'init')),
    status: require(path.join(COMMANDS_DIR, 'status')),
    add: require(path.join(COMMANDS_DIR, 'add')),
    commit: require(path.join(COMMANDS_DIR, 'commit')),
    branch: require(path.join(COMMANDS_DIR, 'branch')),
    log: require(path.join(COMMANDS_DIR, 'log')),
    checkout: require(path.join(COMMANDS_DIR, 'checkout')),
    catFile: require(path.join(COMMANDS_DIR, 'cat-file')),
    diff: require(path.join(COMMANDS_DIR, 'diff')),
    lsFiles: require(path.join(COMMANDS_DIR, 'ls-files')),
    rm: require(path.join(COMMANDS_DIR, 'rm')),
    tag: require(path.join(COMMANDS_DIR, 'tag')),
    stash: require(path.join(COMMANDS_DIR, 'stash')),
    ignore: require(path.join(COMMANDS_DIR, 'ignore')),
    inspectObject: require(path.join(COMMANDS_DIR, 'inspect-object')),
    hashObject: require(path.join(COMMANDS_DIR, 'hash-object')),
    writeTree: require(path.join(COMMANDS_DIR, 'write-tree')),
    commitTree: require(path.join(COMMANDS_DIR, 'commit-tree'))
}

/**
 * Dispatches a parsed command to its corresponding handler
 * @param {Object} parsed - The parsed command object
 * @returns {Promise} - A promise resolving to the result of the command
 */
async function dispatch(parsed) {
    if (!parsed || !parsed.command) {
        throw new ValidationError('No command provided')
    }

    const handler = commands[parsed.command]

    if (!handler) {
        throw new ValidationError(`Unknown command: ${parsed.command}`)
    }

    // Execute command
    return handler(parsed.args, parsed.options, parsed)
}

// UTILITIES 

/**
 * Checks whether a command exists
 * @param {String} command 
 * @returns {Boolean}
 */
function hasCommand(command) {
    return command in commands
}

/**
 * List available commands
 * @returns {Array<String>} An array with all existing commands
 */
function getCommands() {
    return Object.keys(commands)
}


// USeful later for plugins and extensions 
/**
 * Registe commands dynamically
 * @param {String} name 
 * @param {Function} handler 
 */
function registerCommand(name, handler) {
    if (name in commands) {
        throw new ValidationError(`A command named '${name}' already exists`)
    }
    if (typeof handler !== 'function') {
        throw new ValidationError('Command handler must be a function')
    }

    commands[name] = handler
}


module.exports = {
    dispatch,
    hasCommand,
    getCommands,
    registerCommand
}