# the `log` command

The `log` command is used to display the commit history of a Git repository. It shows a list of commits, along with details such as the commit hash, author, date, and commit message. The `log` command can be customized with various options to filter and format the output according to your needs.

1. The `log` command starts by reading the HEAD file to determine the current branch and find latest commit hash.
2. It then traverses the commit history by following the parent commits, starting from the latest commit and moving backwards through the history.
3. For each commit, it retrieves the commit object from the .mygit/objects directory using the commit hash, and parses the commit object to extract the relevant information (author, date, message).
4. The commit information is then formatted and displayed to the user in a readable format.
5. The `log` command can also accept various options to filter the commit history, such as `--author` to show commits by a specific author, `--since` and `--until` to show commits within a specific date range, `--grep` to search for commits with messages that match a specific pattern, and `--oneline` to display the commit history in a more compact format.

## Implementation explained
The `log` command is implemented in the `log.js` file in the `src/commands` directory. The main function in this file is `log()`, which is responsible for executing the logic of the `log` command. The `log()` function uses three helper functions:
- `readObject()` to read the commit hash, parse the commit object, and return the header and the content of the commit object.
- `parseCommit()` to parse the content of the commit object and extract the relevant information (author, date, message).
- `formatCommit()` to format the commit information in a readable format for display.

## Implementation of each function
- The `readObject()` function is a helper function responsible for reading and parsing the commit hash, it takes a commit hash as an arguemnet:
```javascript
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function readObject(hash) {
    // 1. Read the commit object (extracted from the .mygit/objects directory). It uses the commit hash to locate the object file

    const dir = hash.slice(0, 2); // First two characters of the commit hash - commit object directory
    const file = hash.slice(2); // Remaining characters of the commit hash - commit object file
    const objPath = path.join(process.cwd(), '.mygit', 'objects', dir, file); // Full path to the commit object file
    if (!fs.existsSync(objPath)) {
        throw new Error(`Object ${hash} not found`);
    }

    const compressed = fs.readFileSync(objPath); // Read the compressed commit object from the file

    // 2. Decompress the commit object using zlib's inflateSync method, which returns a buffer containing the decompressed data.
    const decompressed = zlib.inflateSync(compressed);

    // 3. Parse the commit object to extract the header and the content. The header contains the type of the object (commit) and its size, while the content contains the actual commit data (author, date, message, etc.).
    const nullIndex = decompressed.indexOf(0); // Find the index of the null byte that separates the header and the content
    const header = decompressed.slice(0, nullIndex); 
    const content = decompressed.slice(nullIndex + 1); 

    // 4. Return the header and the content of the commit object. An object will be returned
    return { header, content };
}
```
- The `parseCommit()` function is a helper function responsible for parsing the content of the commit object and extracting the relevant information (author, date, message). It takes the content (as a buffer) of the commit object as an argument and returns an object containing the author, date, and message of the commit:
```js
function parseCommit(content) {
    // 1. Parse the commit's object content into structured data
    /*COMMIT FORMAT
        tree <hash>
        parent <hash> (if parent)
        author <name> <email> <timestamp> <timezone>
        
        <commit message>
    */
    const lines = content.toString().split('\n'); // Array containing each line of the commit content

    // Format the commit information into an object - This will be the return value of the function
    const commit = {
        tree: null,
        parents: [],
        author: null,
        committer: null,
        message: null
    };

    // Keep track of the lines index
    let i = 0;

    // 2. Loop through the lines of the commit content to extract the desired information
    while (i < lines.length && lines[i] !== '') {
        const line = lines[i];

        if (line.startsWith('tree ')) {
            commit.tree = line.slice(5); // Extract the tree hash
        } else if (line.startsWith('parent ')) {
            commit.parents.push(line.slice(7)); // Extract the parent commit hash and add it to the parents array
        } else if (line.startsWith('author ')) {
            commit.author = line.slice(7); // Extract the author information
        } else if (line.startsWith('committer ')) {
            commit.committer = line.slice(10); // Extract the committer information
        }

        // Move to the next line
        i++;
    }

    // 3. Get the commit message, which starts after the first empty line
    commit.message = lines.slice(i).join('\n').trim(); 

    // 4. Return the structured commit information as an object
    return commit;
}
```
- The `formatCommit()` function is a helper function responsible for formatting the commit information in a readable format for display. It takes, the hash, the commit object (containing the author, date, and message) as an argument and returns a formatted string:
```js
function formatCommit(hash, commit, isShort=false) {
    
    // Short format: <hash> <message>
    if (isShort) {
        return `${hash.slice(0, 7)} ${commit.message.split('\n')[0]}`; // Return the first line of the commit message
    }

    // FULL FORMAT:

    let output = `commit ${hash}\n`; // Start with the commit hash

    // Parse the author information for a better display
    if (commit.author) {
        const authorMatch = commit.author.match(/^(.+?) <(.+?)> (\d+) ([+-]\d{4})$/) // / name <email> timestamp timezone
        if (authorMatch) {
            const [, name, email, timestamp, timezone] = authorMatch;

            // Convert unix timestamp to human-readable date
            const date = new Date(parseInt(timestamp) * 1000);
            output += `Author: ${name} <${email}>\n`; // Add the author information to the output
            output += `Date: ${date.toDateString()} ${date.toTimeString().split(' ')[0]} ${timezone}\n`; // Add the date information to the output
        } else {
            output += `Author: ${commit.author}\n`; // If the author information is not in the expected format, display it as is
        }
    }

    output += '\n'; // Add a blank line before the commit message

    // Indent the commit message for better readability
    const messageLines = commit.message.split('\n');
    for (const line of messageLines) {
        output += `    ${line}\n`; // Indent each line of the commit message
    }

    return output; // Return the formatted commit information
}
```
- The `log()` function is the main function responsible for executing the logic of the `log` command. It uses the helper functions to read and parse the commit objects, and formats the output for display:
```js
function log(opotions={}) {
    // 1. Check if the user is in a mygit repository
    const mygitDir = path.join(process.cwd(), '.mygit');
    if (!fs.existsSync(mygitDir)) {
        console.error('fatal: not a mygit repository');
        process.exit(1);
    }

    // 2. Read the HEAD file to determine the current branch and find latest commit hash
    const headPath = path.join(mygitDir, 'HEAD');
    if (!fs.existsSync(headPath)) {
        console.error('Error: HEAD file not found');
        process.exit(1);
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim();
    if(!headContent.startsWith('ref: ')) {
        console.error('Error: HEAD is not a symbolic reference');
        process.exit(1);
    }

    const branchRef = headContent.substring(5); // Remove 'ref: ' prefix to get the branch reference

    // 3. Read the branch reference to get the latest commit hash
    const branchRefPath = path.join(mygitDir, branchRef);
    if (!fs.existsSync(branchRefPath)) {
        console.log('No commits yet');
        return;
    }

    let currentHash = fs.readFileSync(branchRefPath, 'utf-8').trim(); // Latest commit hash

    // 4. Follow the commit chain and display each commit

    const commits = [] //Keep track of the commits to display them in the correct order (from oldest to newest)

    const visited = new Set(); // Keep track of visited commits to avoid infinite loops

    while( currentHash && !visited.has(currentHash)) {
        visited.add(currentHash); // Mark the current commit as visited and add it to the visited set

        try {
            // Read the commit object using the current commit hash
            const { header, content } = readObject(currentHash);

            // Verify it is an actual commit object
            if (!header.toString().startsWith('commit ')) {
                console.error(`Error: Object ${currentHash} is not a commit`);
                break;
            }

            // Parse the commit content to extract the relevant information
            const commit = parseCommit(content);

            // Store in the commits array
            commits.push({ hash: currentHash, commit });

            // Move to the parent commit (if it exists) to continue traversing the commit history
            if (commit.parents.length > 0) {
                currentHash = commit.parents[0]; // Follow the first parent commit (for simplicity, we are not handling merge commits with multiple parents in this implementation)
            } else {
                currentHash = null; // No more parent commits, end the loop
            }
        } catch (error) {
            console.error(`Error reading commit ${currentHash}: ${error.message}`);
            break;
        }
    }

    // 5. Display the commits in reverse chronological order (from oldest to newest)

    if (commits.length === 0) {
        console.log('No commits yet');
        return;
    }

    const isShort = options.oneline

    for (let i = 0; i < commits.length; i++) {
        const { hash, commit } = commits[i];
        const formattedCommit = formatCommit(hash, commit, isShort);
        console.log(formattedCommit); // Display the formatted commit information

        // Add a balnk line between commits for better readability (except for oneline and last commit)
        if (!isShort && i < commits.length - 1) {
            console.log(''); // Add a blank line between commits for better readability
        }
    }
}

module.exports = log;
```