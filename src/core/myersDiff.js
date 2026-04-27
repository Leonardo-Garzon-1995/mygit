
/**
 * FORWARD PASS
 *
 */
function forward(a, b) {
    const N = a.length
    const M = b.length
    const MAX = N + M

    const V = new Array(2 * MAX + 1).fill(0)
    const trace = []

    for (let d = 0; d <= MAX; d++) {
        // Snapshot V before editing this round
        trace.push(V.slice())

        for (let k = -d; k <= d; k += 2) {
            const i = k + MAX // shifted into V

            let x
            if (k === -d || (k !== d && V[i - 1] < V[i + 1])) {
                x = V[i + 1] // came from k+1: move DOWN (insert), x stays same
            } else {
                x = V[i - 1] + 1   // came from k-1: move RIGHT (delete), x advances
            }

            let y = x - k

            // Slide diagonally as far as tokens match (zero edit cost)
            while (x < N && a[x] === b[y]) {
                x++
                y++
            }

            V[i] = x

            // if we've consumed both arrays, we found the sdortest edit distance
            if (x >= N && y >= M) {
                return { trace, d }
            }

        }
    }

    // No edit script found. It shoud never reach this case for valid inputs 
    throw new Error('Myers diff failed: no solution found')

}

/**
 * BACKTRACK
 *
 */
function backtrack(trace, a, b, d) {
    const MAX = a.length + b.length
    const ops = [] // flat: { type: 'equal'|'insert'|'delete', token }

    let x = a.length
    let y = b.length

    for (let step = d; step > 0; step--) {
        const V = trace[step]
        const k = x - y // the diagonal
        const i = k + MAX

        // Same decision logic as foward pass
        const prevK = (k === -step || (k !== step && V[i - 1] < V[i + 1]))
            ? k + 1 // came via insert
            : k - 1 // came via delete
        
        const prevX = V[prevK + MAX]
        const prevY = prevX - prevK

        // walk back the diagonal (equal -tokes) - these happened after the edit 
        while (x > prevX && y > prevY) {
            ops.push({type: 'equal', token: a[x - 1]})
            x--
            y--
        }

        // Record the single edit that got us to (prevX, prevY)
        if (x === prevX) {
            // x did not change -> we moved down -> insert from b
            ops.push({type: 'insert', token: b[y - 1]})
            y--
        } else {
            // x advanceed -> we moved Right -> delete from a 
            ops.push({type: 'delete', token: a[x - 1]})
            x--
        }
    }

    // Remaining diagonal at d=0 (the equal prefix)
    while (x > 0 && y > 0) {
        ops.push({ type: 'equal', token: a[x - 1]})
        x--
        y--
    }

    return ops.reverse()
}

/**
 * STEP 3 — GROUP into hunks
 *
 * Collapse consecutive ops of the same type into a single hunk.
 * { type: 'delete', tokens: ['foo', ' ', 'bar'] }
 */
function groupHunks(ops) {
    if (ops.length === 0) return []

    const hunks = []

    let current = { type: ops[0].type, tokens: [ops[0].token] }

    for (let i = 1; i < ops.length; i++) {
        const op = ops[i]
        if (op.type === current.type) {
            current.tokens.push(op.token)
        } else {
            hunks.push(current)
            current = { type: op.type, tokens: [op.token]}
        }
    }

    hunks.push(current)
    return hunks
}

/**
 * myersDiff - PUBLIC API
 *
 * @param {string[]} a - token array (source)
 * @param {string[]} b - token array (target)
 * @returns {Array<{ type: 'equal'|'insert'|'delete', tokens: string[] }>}
 */
function myersDiff(a, b) {
    // edge cases
    if (a.length === 0 && b.length === 0) return [];
    if (a.length === 0) return [{ type: 'insert', tokens: [...b] }];
    if (b.length === 0) return [{ type: 'delete', tokens: [...a] }];

    const {trace, d} = forward(a, b)

    // d === 0 means files ar identical
    if (d.length === 0) return [{ type: 'equal', tokens: [...a]}]

    const ops = backtrack(trace, a, b, d)

    return groupHunks(ops)
}


module.exports = myersDiff
