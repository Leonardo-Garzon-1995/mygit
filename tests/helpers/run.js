const { execSync } = require('child_process')

function run(cmd) {
    return execSync(cmd, {
        encoding: 'utf-8',
        env: {...process.env, NO_COLOR: '1'}
    }).trim()
}

module.exports = run 