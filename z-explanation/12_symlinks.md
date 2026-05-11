# Symbolic Links Handling in Mygit

Mygit implements a symlink tracking strategy mirroring Git's approach: tracking symbolic links as symlinks rather than following them.

## 1. The Strategy (Track vs. Follow)
A symlink points to a target path. Mygit treats symlinks differently from regular files or directories:
- **Following (Not Used):** If mygit followed a symlink, it would hash the *content* of the target file. If the target is a directory, it would traverse it. This could lead to infinite loops or unexpected inclusion of large external directories.
- **Tracking as Symlink (Used):** Instead, mygit reads the link itself. It hashes the *target path string* and stores it as a blob with a special file mode: `120000`. This ensures that when the repository is cloned or checked out elsewhere, the symlink is correctly reconstructed.

## 2. Modes and Hashing
Mygit uses different modes to track the file type:
- `100644`: Regular non-executable file
- `100755`: Executable file
- `40000`: Directory (Tree)
- `120000`: Symbolic Link

When adding a symlink to the index, mygit gets the path string that the link points to, creates a blob representing that string, and assigns it the `120000` mode.

## 3. Working Directory and the Index (`mygit add`)
In `src/commands/add.js`, when a file is checked using `fs.lstatSync(absolutePath)`, we can tell if it's a symbolic link using `stats.isSymbolicLink()`.
If it is a symlink:
```javascript
let content;
if (stats.isSymbolicLink()) {
    content = Buffer.from(fs.readlinkSync(absolutePath));
} else {
    // ...
}
```
This content (the path string) is then hashed and added to the index with mode `120000`.

## 4. Status Checks (`mygit status`)
To properly report untracked, modified, and staged changes for symlinks, `status.js` does the same:
```javascript
let content;
if (stats.isSymbolicLink()) {
    content = Buffer.from(fs.readlinkSync(fullPath));
} else {
    // ...
}
```
This computed hash is then compared against the hash recorded in the index and the most recent commit. Since `mygit` compares the symlink's target path hash to the stored hash, changing where the symlink points will correctly show up as "modified".

## 5. Checking Out Commits (`mygit checkout`, `mygit stash`)
During checkout or stash restoration, mygit needs to update the working directory based on a tree. In `src/helpers/checkoutCommit.js` and `src/commands/checkout.js`:
```javascript
if (fileInfo.mode === '120000') {
    fs.symlinkSync(content.toString(), fullPath);
} else {
    fs.writeFileSync(fullPath, content);
    // chmod if executable...
}
```
If a file has mode `120000`, mygit reads the content (the target path) and creates a symbolic link in the file system using `fs.symlinkSync()`, perfectly restoring the symlink's state.
