#!/usr/bin/env node

const { parseArgs } = require('../src/cli/CLIParser')
const { dispatch } = require('../src/cli/dispatcher.v2') // Uses a simpler dispatcher adapted to the old command API architecture
const Output = require('../src/cli/output')
const logger = require('../src/utils/logger')

async function main() {
    try {
        const parsed = parseArgs(process.argv.slice(2))
        logger.debug(parsed)

        await dispatch(parsed)
    } catch (error) {
        logger.error(error.stack)
        Output.error(error.message)
        process.exit(1)
    }
}

main()