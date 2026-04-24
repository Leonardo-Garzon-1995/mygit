
function captureOutput(fn, showLogInfo = false) {
    const originalLog = console.log
    const originalError = console.error
    const originalExit = process.exit
    let output = []
    let exitCode = null
    
    console.log = (...args) => {
        output.push(args.join(' '))
    }
    console.error = (...args) => {
        output.push(args.join(' '))
    }
    process.exit = (code) => {
        exitCode = code
        throw new Error(`EXIT ${code}`)
    }
    
    try {
        fn()
    } catch (err) {
        if (!err.message || !err.message.includes('EXIT')) {
            throw err
        }
    } finally {
        if (showLogInfo) {
            console.log = originalLog
            console.error = originalError
            process.exit = originalExit
        }
    }
    
    return { output: output.join('\n'), exitCode }
}

module.exports = captureOutput