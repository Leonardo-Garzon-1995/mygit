# The `init` command 

## What it is and what it does


- creates a new mygit('git') repository in the current directory. .mygit is the directory where mygit stores all the information about the repository, including commits, branches, and configuration settings.
```bash
 C:\Users\user\Desktop\my-project> mygit init
    Initialized empty mygit repository inC:\Users\user\Desktop\my-project\.mygit
```
- .mygit folder contains all the initial necessary files and directories for mygit to function properly. It includes:
  - `objects/`: This directory stores all the objects (commits, trees, blobs) that make up the history of the repository.
  - `refs/`: This directory contains references to commits, such as branches and tags.
  - `HEAD`: This file points to the current branch or commit that is checked out.
  - `config`: This file contains configuration settings for the repository, such as user information and remote repository URLs.

## Implementation explained 
- The `init` command is implemented in the `init.js` file in the `src/commands` directory.
- the mygitInit function is responsible for creating the .mygit directory and its contents. It checks if the .mygit directory already exists, and if not, it creates the necessary files and directories.
```javascript
const fs = require('fs'); //file system module to interact with the files and directories
const path = require('path'); //path module to handle file paths

function mygitInit(targetDir=process.cwd()) { //targetDir is the directory where the .mygit directory will be created
    // 1. Build the path to .mygit and subdirectories
    const gitDir = path.join(targetDir, ".mygit")
    const objectsDir = path.join(gitDir, "objects")
    const refsDir = path.join(gitDir, "refs")
    const headsDir = path.join(refsDir, 'heads')
    const headFile = path.join(gitDir, 'HEAD')
    
    // 2. Check if .mygit directory already exists
    if (fs.existsSync(gitDir)) {
        console.log("mygit repository already exists in this directory.");
        return;
    }

    // 3. Create the .mygit directory and subdirectories
    fs.mkdirSync(gitDir, { recursive: true });
    fs.mkdirSync(objectsDir, { recursive: true });
    fs.mkdirSync(refsDir, { recursive: true });
    fs.mkdirSync(headsDir, { recursive: true });

    // 4. Create the HEAD file with initial content
    fs.writeFileSync(headFile, "ref: refs/heads/main\n");

    // 5. Output success message
    console.log(`Initialized empty mygit repository in ${gitDir}`);
}

// Export the mygitInit function to be used in the main mygit command handler
module.exports = mygitInit;
```