# The `stash` command

## What it is and what it does

`mygit stash` temporarily shelves (stashes) uncommitted changes so you can
switch context and come back to them later.

```bash
mygit stash                     # save current state as "WIP: stash"
mygit stash save "my message"   # save with a custom label
mygit stash list                # show all saved stashes
mygit stash apply [ref]         # restore without removing the stash
mygit stash pop                 # restore and remove the latest stash
mygit stash drop [ref]          # delete one stash
mygit stash clear               # delete all stashes
mygit stash show [ref]          # show what a stash contains
```

### What gets stashed?

When you run `mygit stash`, the current working-tree state (tracked files)
is saved into the stash stack and the working tree is restored to the last
commit.  The stash stack behaves like a LIFO queue — `pop` always restores
the most recently saved entry.

## Implementation explained

The command router lives in `src/commands/stash.js`; the actual logic is in
`src/core/stash.js`.

### Router: `stash(args)`

```javascript
function stash(args) {
    ensureRepo()
    const cmd = args[0]

    if (!cmd) return stashPush()           // bare `mygit stash`

    switch (cmd) {
        case 'save':  return stashPush(args.slice(1).join(' ') || 'WIP: stash')
        case 'list':  return stashList()
        case 'apply': return stashApply(args[1])
        case 'pop':   return stashPop()
        case 'drop':  return stashDrop(args[1])
        case 'clear': return stashClear()
        case 'show':  return stashShow(args[1])
        default:      console.error('Unknown stash command')
    }
}

module.exports = stash
```

### Stash storage

Stashes are stored in `.mygit/stash` as a JSON array of stash entries.
Each entry records:

```json
[
  {
    "message": "WIP: stash",
    "timestamp": 1716000000000,
    "files": {
      "src/index.js": { "content": "…", "hash": "abc…", "mode": "100644" }
    }
  }
]
```

### Subcommand behaviour

| Subcommand | Behaviour |
|---|---|
| `push` / (no arg) | Snapshots working-tree files, resets them to HEAD, prepends entry to stack |
| `list` | Prints `stash@{n}: <message>` for each entry |
| `apply [ref]` | Restores files from `ref` (default: `stash@{0}`) without removing the entry |
| `pop` | Same as `apply` then `drop stash@{0}` |
| `drop [ref]` | Removes one entry from the stack |
| `clear` | Empties the entire stash stack |
| `show [ref]` | Lists the files stored in a stash entry |
