# The `commit` command

- The `commit` command is used to save changes to the repository. It creates a new commit object that represents the current state of the repository, including the changes made since the last commit. Each commit has a unique identifier (hash) and contains information about the author, committer (usually the same as the author), date, and commit message.

## Format of the commit object
A commit object in mygit has the following format:
- `tree <tree_hash>`: This line references the tree object that represents the state of the files in the repository at the time of the commit.
- `parent <parent_hash>`: This line references the parent commit(s), if any, of the current commit.
- `author <author_name> <author_email> <timestamp> <timezone>`: This line contains the name, email, and timestamp in Unix timestamp format, and timezone of the author of the commit.
- `committer <committer_name> <committer_email> <timestamp> <timezone>`: This line contains the name, email, and timestamp in Unix timestamp format, and timezone of the committer of the commit.
- `<commit_message>`: This is the commit message provided by the user, describing the changes made in the commit.
- The commit object is stored in the `objects/` directory of the .mygit repository, and its filename is the hash of the commit content. The content of the commit object is a plain text representation of the above format.

### Example commit object
```
tree a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
parent 1234567890abcdef1234567890abcdef1234567890
author Leonardo Garzon <example.com> 1234567890 -0700
committer Leonardo Garzon <example.com> 1234567890 -0700

Initial commit
```

## Implementation explained
- The `commit` command is implemented in the `commit.js` file in the `src/commands` directory.
- The `commit` function is responsible for creating a new commit object based on the current state of the repository and the changes made since the last commit. It generates a unique hash for the commit, creates the commit object content, and stores it in the `objects/` directory.
- The `commit` function imports the `writeTree` function from the `/src/commands/write-tree.js` module to create a tree object representing the current state of the files in the repository. It also imports the `commitTree` function from the `/src/commands/commit-tree.js` module to create the commit object and store it in the `objects/` directory.
```javascript
const fs = require('fs');
const path = require('path');
const writeTree = require('./write-tree');
const commitTree = require('./commit-tree');

function commit(message) {
    // 1. Validate the commit message
    if (!message) {
        console.error('Error: commit message required');
        console.error('Usage: mygit commit -m <message>');
        process.exit(1);
    }

    // 2. Check if you are in a mygit repository
    const gitDir = path.join(process.cwd(), '.mygit');
    if (!fs.existsSync(gitDir)) {
        console.error('fatal: not a mygit repository');
        console.error('Run "mygit init" first');
        process.exit(1);
    }

    // 3. Read the HEAD file to find the current branch 
    // The HEAD file constains a reference to the current branch, it looks like this: "ref: refs/heads/main"
    // We need to extract "refs/heads/main", this will be used to store the new commit in the correct branch reference
    const headPath = path.join(gitDir, 'HEAD'); // Use gitDir (which is the path to the '.mygit' directory) to build the path to the HEAD file
    const headContent = fs.readFileSync(headPath, 'utf-8').trim();

    // Check if HEAD is a symbolic reference (pointing to a branch)
    if (!headContent.startsWith('ref: ')) {
        console.error('Error: HEAD is in detached state');
        process.exit(1);
    }

    // Extract the branch reference
    const branchRef = headContent.substring(5); // Remove 'ref: ' prefix

    // 4. Get the parent commit (if any)
    // The branch file contains the hash of the latest commit on that branch, we need to read it to get the parent commit hash
    // If this is the first commit, the branch file will be empty, so we need to handle that case as well

    const branchPath = path.join(gitDir, branchRef); // '.mygit/refs/heads/main'
    let parentCommit = null;

    if (fs.existsSync(branchPath)) {
        // Branch already exists, read the latest commit hash from the branch file
        parentCommit = fs.readFileSync(branchPath, 'utf-8').trim();

        // validate the parent hash (it should be a valid 40-character hexadecimal string)
        if (parentCommit && !/^[0-9a-f]{40}$/.test(parentCommit)) {
            console.error('Error: invalid parent commit hash');
            process.exit(1);
        }
    } else {
        // First commit on this branch, no parent commit
        console.log(`Creatin initial commit on branch ${branchRef.split('/').pop()}`); // main
    }

    // 5. Create the tree object/snapshot of the current state of the files in the repository
    // The writeTree function will create a tree object based on the current state of the files
    const treeHash = writeTree();

    // 6. Create the commit object
    // The commitTree function will create the commit object and store it in the 'objects/' directory
    const commitHash = commitTree(treeHash, parentCommit, message);

    // 7. Update the branch reference to point to the new commit
    // Write the new commit hash to the branch file
    // This 'moves' the branch pointer to the new commit, making it the latest commit on that branch

    // If the branch file doesnt exist, create it

    // Ensure the refs/heads directory exists before writing the branch file
    const refsHeadsDir = path.dirname(branchPath); // '.mygit/refs/heads' - it ommits the branch name, we need to ensure this directory exists before writing the branch file
    fs.mkdirSync(refsHeadsDir, { recursive: true }); // Create the refs/heads directory if it doesn't exist

    // Write the new commit hash to the branch file
    fs.writeFileSync(branchPath, commitHash + '\n'); // Write the commit hash followed by a newline to the branch file

    // 8. Output success message -- Feedback to the user about the new commit
    const branchName = branchRef.split('/').pop(); // 'refs/heads/main' -> 'main'

    if (parentCommit) {
        console.log(`[${branchName} ${commitHash.substring(0, 7)}] ${message}`);
    } else {
        console.log(`[${branchName} (root-commit) ${commitHash.substring(0, 7)}] ${message}`);
    }

    return commitHash; // Return the commit hash for potential use in other commands (e.g., for testing or chaining commands)
        
}