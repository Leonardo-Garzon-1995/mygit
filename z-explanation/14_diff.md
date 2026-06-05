# The `diff` command

## What it is and what it does

`mygit diff` shows line-level changes between two versions of one or more
files.  It supports three comparison modes:

| Invocation | Compared | Typical question answered |
|---|---|---|
| `mygit diff` | working tree ↔ index | "What have I changed but not yet staged?" |
| `mygit diff --cached` | index ↔ HEAD | "What have I staged but not yet committed?" |
| `mygit diff <hashA> <hashB>` | commit A ↔ commit B | "What changed between two commits?" |

```bash
C:\my-project> mygit diff                  # unstaged changes
C:\my-project> mygit diff --cached         # staged-but-not-committed changes
C:\my-project> mygit diff abc1234 def5678  # compare two commits
```

The output follows a unified-diff-style format:

```
diff --mygit a/src/index.js b/src/index.js
--- a/src/index.js
+++ b/src/index.js
@@ -1,4 +1,4 @@
-console.log('hello')
+console.log('world')
```

## Myers diff algorithm

Under the hood mygit uses the **Myers diff algorithm** (`src/core/myersDiff.js`)
to compute the shortest edit script between two sequences of lines (tokens).
This is the same algorithm used by Git.

```
tokenize(text, 'line')  →  ['line1\n', 'line2\n', ...]
myersDiff(aLines, bLines) → hunks[{ type, lines }]
formatDiff(hunks, meta)   → unified-diff string
```

## Implementation explained

The command is implemented in `src/commands/diff.js`.

### Helper: `getTreeHashFromCommit(commitHash)`

Reads a commit object and extracts the tree hash from its first line (`"tree <hash>"`).

```javascript
function getTreeHashFromCommit(commitHash) {
    const { content, type } = readObject(commitHash)
    if (type !== 'commit') throw new Error(`Expected commit, got ${type}`)
    const firstLine = content.toString('utf8').split('\n')[0]
    return firstLine.replace('tree ', '').trim()
}
```

### Helper: `diffContents(aText, bText, filePath, status, mode, aHash, bHash)`

Tokenises two text bodies into lines, runs `myersDiff`, and prints the
formatted patch to stdout.  If the files are identical no output is produced.

### Mode 1 — `diffWorkingVsIndex()`

```javascript
function diffWorkingVsIndex() {
    const index = readIndex()

    for (const [filePath, fileInfo] of Object.entries(index.entries)) {
        const absPath    = path.join(process.cwd(), filePath)
        const workingTxt = fs.readFileSync(absPath, 'utf-8')
        const { content } = readObject(fileInfo.hash)        // blob stored in index
        const indexTxt   = content.toString('utf8')

        if (indexTxt !== workingTxt)
            diffContents(indexTxt, workingTxt, filePath, 'modified', fileInfo.mode, fileInfo.hash, null)
    }
}
```

### Mode 2 — `diffIndexVsHead()` (`--cached`)

Builds a union of all paths from the index and the HEAD tree, then diffs each
pair:

- **In index only → new file** (was not committed)
- **In HEAD only → deleted file** (was removed from staging)
- **In both, hashes differ → modified**

### Mode 3 — `diffCommits(hashA, hashB)`

Resolves both commit hashes to their tree objects, expands all files
recursively via `getTreeFiles()`, and diffs matching paths.

### Entry point: `diff(args)`

```javascript
function diff(args = []) {
    ensureRepo()

    if (args.includes('--cached')) diffIndexVsHead()
    else if (args.length >= 2)      diffCommits(args[0], args[1])
    else                            diffWorkingVsIndex()
}

module.exports = diff
```
