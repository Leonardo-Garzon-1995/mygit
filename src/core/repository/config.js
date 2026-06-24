const fs = require('../../utils/filesystem')
const { InvalidConfigError } = require('../../errors')
const { type } = require('os')

function readConfig(repo) {
    try {
        const configPath = repo.paths.config

        if (!fs.exists(configPath)) {
            return {}
        }

        const raw = fs.readFile(configPath, 'utf8')

        return JSON.parse(raw)
    } catch (error) {
        throw new InvalidConfigError(`Invalid repository config: ${error.message}`)
    }
}

function writeConfig(repo, config) {
    if (typeof config !== 'object' || config === null) {
        throw new InvalidConfigError('Invalid repository config')
    }
    const configPath = repo.paths.config

    fs.writeFile(configPath, JSON.stringify(config, null, 2))
}

function getConfigValue(repo, key, defaultValue=null) {
    const config = readConfig(repo)

    return key in config ? config[key] : defaultValue
}

function setConfigValue(repo, key, value) {
    const config = readConfig(repo)

    config[key] = value

    writeConfig(repo, config)
}

module.exports = {
    readConfig,
    writeConfig,
    getConfigValue,
    setConfigValue
}