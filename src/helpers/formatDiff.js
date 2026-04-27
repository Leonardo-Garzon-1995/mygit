const colors = require('../utils/colors')
/**
 * Flattens grouped hunks into a flat indexed op list for context windowing.
 *
 * @param {Array<{type: string, tokens: string[]}>} hunks
 * @returns {Array<{type: string, token: string}>}
 */
function flatten(hunks) {
    const ops = [];
    for (const hunk of hunks) {
        for (const token of hunk.tokens) {
            ops.push({ type: hunk.type, token });
        }
    }
    return ops;
}

/**
 * Computes which flat op indices are "visible" — i.e. within `context`
 * distance of at least one non-equal op.
 *
 * @param {Array<{type: string, token: string}>} ops
 * @param {number} context - number of equal tokens to show around changes
 * @returns {Set<number>}
 */
function visibleIndices(ops, context) {
    const visible = new Set();

    for (let i = 0; i < ops.length; i++) {
        if (ops[i].type !== 'equal') {
            // Mark context tokens before and after this change
            for (let j = Math.max(0, i - context); j <= Math.min(ops.length - 1, i + context); j++) {
                visible.add(j);
            }
        }
    }

    return visible;
}

/**
 * Count text lines in a token array.
 * Filters to relevant op types so each side (a/b) is counted independently.
 */
function countLines(tokens) {
    const text = tokens.join('')
    if (!text) return 0
    const newlines = (text.match(/\n/g) || []).length
    return text.endsWith('\n') ? newlines : newlines + 1
}

function newlineCount(token) {
    return (token.match(/\n/g) || []).length
}

/**
 * @param {Array<{type: string, tokens: string[]}>} hunks
 * @param {object} options
 * @param {string}  options.filePath  - e.g. 'src/foo.js'
 * @param {string}  [options.status]  - 'new' | 'deleted' | 'modified'
 * @param {string}  [options.mode]    - e.g. '100644'
 * @param {string}  [options.aHash]   - blob hash for a side (null for new files)
 * @param {string}  [options.bHash]   - blob hash for b side (null for deleted files)
 * @param {number}  [options.context] - context tokens around changes (default 3)
 */
function formatDiff(hunks, {
    filePath = '',
    status = 'modified',
    mode = '100644',
    aHash = null,
    bHash = null,
    context = 3
} = {}) {
    const ops = flatten(hunks)
    const visible = visibleIndices(ops, context)

    if (visible.size === 0 && status === 'modified') return ''

    const out = []

    // --- File header ---
    out.push(`${colors.yellow}diff --mygit a/${filePath} b/${filePath}${colors.reset}`)

    if (status === 'new') {
        out.push(`new file mode ${mode}`)
    } else if (status === 'deleted') {
        out.push(`deleted file mode ${mode}`)
    }

    // index line: short hashes, 0000000 for non-existent side
    const shortA = aHash ? aHash.substring(0, 7) : '0000000'
    const shortB = bHash ? bHash.substring(0, 7) : '0000000'
    const indexSuffix = status === 'modified' ? ` ${mode}` : ''
    out.push(`index ${shortA}..${shortB}${indexSuffix}`)

    // --- and +++ lines
    const aLabel = status === 'new'     ? '/dev/null' : `a/${filePath}`
    const bLabel = status === 'deleted' ? '/dev/null' : `b/${filePath}`
    out.push(`--- ${aLabel}`)
    out.push(`+++ ${bLabel}`)

    // --- Hunks ---
    // Track current line in each file as we scan ops
    let aLine = 1
    let bLine = 1

    const flushLine = (type, text) => {
        if (type === 'insert') {
            out.push(`${colors.green}+${text}${colors.reset}`)
        } else if (type === 'delete') {
            out.push(`${colors.red}-${text}${colors.reset}`)
        } else {
            out.push(` ${text}`)
        }
    }

    let i = 0
    while (i < ops.length) {
        // Skip invisible ops but advance line counters
        if (!visible.has(i)) {
            const op = ops[i]
            const nl = newlineCount(op.token)
            if (op.type !== 'insert') aLine += nl
            if (op.type !== 'delete') bLine += nl
            i++
            continue
        }

        // Collect the visible block
        const block = []
        while (i < ops.length && visible.has(i)) {
            block.push(ops[i])
            i++
        }

        // Compute @@ line ranges
        const aStart = aLine
        const bStart = bLine

        // a side = equal + delete tokens; b side = equal + insert tokens
        const aTokens = block.filter(op => op.type !== 'insert').map(op => op.token)
        const bTokens = block.filter(op => op.type !== 'delete').map(op => op.token)
        const aCount = countLines(aTokens)
        const bCount = countLines(bTokens)

        // Advance line counters past this block
        for (const op of block) {
            const nl = newlineCount(op.token)
            if (op.type !== 'insert') aLine += nl
            if (op.type !== 'delete') bLine += nl
        }

        out.push(`${colors.cyan}@@ -${aStart},${aCount} +${bStart},${bCount} @@${colors.reset}`)

        // Render content lines
        let current = ''
        let currentType = block[0].type

        for (const op of block) {
            if (op.type !== currentType) {
                if (current.length > 0) flushLine(currentType, current)
                current = ''
                currentType = op.type
            }

            current += op.token

            if (op.token.includes('\n')) {
                const parts = current.split('\n')
                parts.forEach((part, idx) => {
                    if (idx < parts.length - 1) {
                        flushLine(currentType, part)
                    } else {
                        current = part
                    }
                })
            }
        }

        if (current.length > 0) flushLine(currentType, current)
    }

    return out.join('\n')
}

module.exports = formatDiff;