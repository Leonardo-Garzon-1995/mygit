# The `ls-files` command

## What it is and what it does

`mygit ls-files` prints the **relative paths** of every file currently recorded
in the index (staging area), sorted alphabetically.

```bash
C:\my-project> mygit ls-files
README.md
src/commands/add.js
src/constants.js
src/utils/hash.js
```

This is useful for answering: *"Exactly which files does mygit think are
staged right now?"*  It mirrors Git's `git ls-files` (without flags).

The index only contains files that have been explicitly staged with
`mygit add`.  Files that exist on disk but have never been staged will not
appear.

## Implementation explained

The command is implemented in `src/commands/ls-files.js` — it is intentionally
kept simple.

```javascript
const { readIndex } = require('../core/index')
const { ensureRepo } = require('../core/repository')

function lsFiles() {
    ensureRepo()                       // ← throws if not in a mygit repo

    const index = readIndex()          // ← parses .mygit/INDEX → { entries: { path → { hash, mode } } }

    if (!index.entries || Object.keys(index.entries).length === 0) {
        return                         // ← nothing staged: print nothing
    }

    const sorted = Object.keys(index.entries).sort()

    for (const filePath of sorted) {
        console.log(filePath)          // ← forward-slash relative paths, sorted A–Z
    }
}

module.exports = lsFiles
```

### Why sort?

The index stores entries in insertion order (a plain JS object), which is the
order files were added.  Sorting makes the output deterministic and easy to
scan, regardless of the order in which `mygit add` was called.

### Index format

The index is a JSON file at `.mygit/INDEX`:

```json
{
  "version": 1,
  "entries": {
    "README.md":         { "hash": "a1b2c3…", "mode": "100644" },
    "src/constants.js":  { "hash": "d4e5f6…", "mode": "100644" }
  }
}
```

`ls-files` only reads the keys of `entries` — it does not need the hash or
mode values.
