# The `checkout` command
> The `checkout` command is used to switch between branches in a mygit repo and also to create and switch to new branches.

## What it does 
- Validates the branch exists
- Updates the HEAD file to point to the new branch
- Reads the commit that the branch points to
- Reads the tree from that commit
- Updates the working directory to match the tree(creates, deletes or updates files as necessary)
- if you run `mygit checkout -b <branch>` it also creates a new branch

## implementation explained 
The `checkout` command is implemented in the the `src/commands/checkout.js` file. It takes an array of arguments as input and performs the appropriate action based on the first argument.

For this implementation we are also importing some helper functions from other files.
- `getCurrentBranch()` - Returns the name of the current branch, or null if HEAD is not a symbolic reference.
- `readObject()` - Reads the commit object and returns the header and the content of the commit object.
- `parseTree()` - Parses the tree object and returns an array of objects containing the mode, name, and hash of each entry.

There are several functions in this file.
- `readTree()` - Reads a tree object and returns an object containing the hash and the mode of each entry (file or directory).
- `getCurrentFiles()` - Returns a set of all the files relative paths in the current working directory.
- `updateWorkingDirectory()` - Updates the working directory to match the tree.
- `checkout()` - The main function that handles the `checkout` command.

## Implementation of each function

- The imports:
```javascript
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const getCurrentBranch = require('../helpers/getCurrentBranch')
const readObject = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')
```
- The `readTree()` function is a helper function responsible for:
    - Reading the contents of the tree onject. It takes a tree hash as an argument and uses the `readObject` function to read the object.
    - Parsing the content of the tree object and 