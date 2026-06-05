# The `add` command

## What it is and what it does

`mygit add` stages one or more files (or an entire directory tree) into the
**index**, preparing their content to be included in the next commit.

```bash
C:\Users\user\Desktop\my-project> mygit add file.txt        # stage one file
C:\Users\user\Desktop\my-project> mygit add src/            # stage a directory
C:\Users\user\Desktop\my-project> mygit add .              # stage everything
```

At its core `add` does two things:

1. **Creates a blob object** – reads the file content, hashes it with SHA-1,
   and writes the compressed object into `.mygit/objects/` (using the same
   two-character prefix / remainder structure Git uses).
2. **Updates the index** – records the file's relative path, its blob hash,
   and its mode (`100644` for regular files, `100755` for executables,
   `120000` for symlinks) in the `.mygit/INDEX` file.

If the same file is added twice, the existing index entry is simply overwritten
with the latest hash — snapshots are deduplicated automatically because two
identical files produce the same blob hash.

Files matching patterns in `.mygitignore` are silently skipped when staging a
directory or `.`.

## Implementation explained

The command is implemented in `src/commands/add.js`.

### `normalizePath(filePath)`

Converts any absolute or OS-specific path to a **forward-slash relative path**
from the repository root.  This ensures that index entries are portable across
platforms.

```javascript
function normalizePath(filePath) {
    const repoRoot    = process.cwd()
    const absolutePath = path.resolve(filePath)
    let relativePath   = path.relative(repoRoot, absolutePath)
    // Convert back-slashes (Windows) to forward slashes
    return relativePath.split(path.sep).join('/')
}
```

### `addFile(filePath)`

Stages a single file:

```javascript
function addFile(filePath) {
    const absolutePath = path.resolve(filePath)
    const stats        = fs.lstatSync(absolutePath)

    // read content (or symlink target)
    const content = stats.isSymbolicLink()
        ? Buffer.from(fs.readlinkSync(absolutePath))
        : fs.readFileSync(absolutePath)

    const hash = hashObjectContent(content, 'blob')   // sha1("blob <len>\0<data>")
    const mode = getFileMode(absolutePath)             // '100644' | '100755' | '120000'
    const normalizedPath = normalizePath(filePath)

    const index = readIndex()
    index.entries[normalizedPath] = { hash, mode }
    writeIndex(index)

    return normalizedPath
}
```

### `addDirectory(dirPath)` — recursive traversal

```javascript
function addDirectory(dirPath) {
    const mygitignorePatterns = getMygitignorePatterns()

    function traverse(currentDir) {
        for (const entry of fs.readdirSync(currentDir)) {
            if (entry === '.mygit') continue          // never touch the metadata dir

            const fullPath = path.join(currentDir, entry)
            const stats    = fs.lstatSync(fullPath)

            if (isIgnored(fullPath, mygitignorePatterns)) continue

            if (stats.isDirectory())  traverse(fullPath)
            else                      addFile(fullPath)
        }
    }

    traverse(absolutePath)
}
```

### `add(args)` — entry point

```javascript
function add(args) {
    ensureRepo()                  // throws if not inside a .mygit repo

    for (const arg of args) {
        if (arg === '.') {
            addDirectory(process.cwd())
        } else {
            const stats = fs.lstatSync(path.resolve(arg))
            stats.isDirectory() ? addDirectory(arg) : addFile(arg)
        }
    }
}

module.exports = add
```

## Key data flows

```
mygit add file.txt
       │
       ├─ lstatSync()              ← verify file exists
       ├─ readFileSync()           ← read raw bytes
       ├─ hashObjectContent()      ← "blob <len>\0<data>" → SHA-1
       ├─ writeObject()            ← .mygit/objects/ab/cdef…
       ├─ normalizePath()          ← absolute → relative forward-slash
       └─ writeIndex()             ← .mygit/INDEX  { path → { hash, mode } }
```
