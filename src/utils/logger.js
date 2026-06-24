const fs = require('fs')
const path = require('path')
const util = require('util')

const LOG_DIR = path.join(__dirname, '..', '..', 'logs')
const LOG_FILE = path.join(LOG_DIR, "mygit.log")

function ensureLogFile() {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, {recursive: true})
    }

    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, '')
    }
}

function formatLogMessage(message) {
    if (typeof message === 'object') {
        return JSON.stringify(message)
    } else if (message instanceof Error) {
        return util.inspect(message, {
            despth: null,
            showHidden: true
        })
    } else {
        return message
    }
}

function getTimeStamp() {
    return new Date().toISOString()
}

function write(mode, message) {
    ensureLogFile()
    
    const line = `[${getTimeStamp()}] [${mode}] ${formatLogMessage(message)}\n`

    fs.appendFileSync(LOG_FILE, line)
}

function error(message) {
    if (!message) {
        return
    }
    write("ERROR", message)
}

function debug(message) {
    if (!message) {
        return
    }
    write("DEBUG", message)
}

function info(message) {
    if (!message) {
        return
    }
    write("INFO", message)
}

function warn(message) {
    if (!message) {
        return
    }
    write("WARN", message)
}

module.exports = {
    error,
    debug,
    info,
    warn
}

