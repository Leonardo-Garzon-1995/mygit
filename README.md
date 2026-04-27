# Mygit

A simple version control system (git-like) implemented in JavaScript. This project implements core Git functionality including repository initialization, staging, committing, branching, and more.

## Features

Mygit supports the following commands:

- **`init`** - Creates an empty mygit repository
- **`add`** - Adds file contents to the staging area
- **`commit`** - Records staged changes to the repository
- **`log`** - Shows commit history with optional one-line format
- **`branch`** - List, create, or delete branches
- **`checkout`** - Switch branches or create new ones
- **`status`** - Shows the current status of files
- **`cat-file`** - Display information about repository objects (-t type, -s size, -p pretty-print)
- **`hash-object`** - Compute object hash and optionally create a blob from a file
- **`write-tree`** - Create a tree object from the current index
- **`commit-tree`** - Create a commit object from a tree
- **`inspect-object`** - Show detailed information about any mygit object
- **`ls-files`** - Show information about files in the index
- **`tag`** - Create or list tags
- **`diff`** - Show changes between commits, commit and working tree, or index and working tree

## Installation

### Prerequisites
- Node.js (version 14 or higher)

### Install from source
```bash
git clone https://github.com/Leonardo-Garzon-1995/mygit.git
cd mygit
npm install
npm link
```

This will install mygit globally on your system, allowing you to use it from any directory.

## Usage

### Basic Workflow

1. **Initialize a repository:**
   ```bash
   mygit init
   ```

2. **Add files to staging area:**
   ```bash
   mygit add file.txt
   mygit add .  # Add all files
   ```

3. **Commit changes:**
   ```bash
   mygit commit -m "Your commit message"
   ```

4. **View commit history:**
   ```bash
   mygit log
   mygit log --oneline
   ```

### Branching

```bash
# List branches
mygit branch

# Create and switch to a new branch
mygit checkout -b feature-branch

# Switch to existing branch
mygit checkout main

# Delete a branch
mygit branch -d feature-branch
```

### Inspecting Objects

```bash
# Show object type
mygit cat-file -t <object-hash>

# Show object size
mygit cat-file -s <object-hash>

# Pretty-print object content
mygit cat-file -p <object-hash>

# Detailed object inspection
mygit inspect-object <object-hash>
```

### Low-Level Operations

```bash
# Hash a file (create blob object)
mygit hash-object file.txt

# Create tree object
mygit write-tree

# Create commit from tree
mygit commit-tree <tree-hash> -m "Commit message" -p <parent-commit-optional>
```

## Project Structure

```
mygit/
├── bin/
│   └── mygit.js          # CLI entry point
├── src/
│   ├── commands/         # Command implementations
│   │   ├── init.js
│   │   ├── add.js
│   │   ├── commit.js
│   │   └── ...
│   ├── core/
│   ├── helpers/      # Git functionality helpers
│   └── utils/            # Utility functions
├── tests/                # Test files
├── z-explanation/        # Educational documentation
└── package.json
```

## Testing

Run the test suite:

```bash
npm test
```

Tests are written using Node.js built-in test runner and cover all major functionality.

## How It Works

Mygit implements Git's core concepts:

- **Objects**: Blobs (files), Trees (directories), and Commits
- **References**: Branches and HEAD pointing to commits
- **Index/Staging Area**: Tracks files ready for commit
- **Repository Structure**: `.mygit` directory containing all metadata

Each command manipulates these core data structures to provide version control functionality. The `z-explanation/` directory contains detailed documentation explaining how each feature works internally.

Mygit is an experimental project and is still in development and by no means it is meant to be use as a production-ready product. 

## Contributing

Contributions are welcome! Areas for improvement:

- Additional Git commands (merge, rebase, etc.)
- Performance optimizations
- Better error handling
- More comprehensive tests

## License

MIT [LICENSE](/LICENSE)

## Author

Leonardo Garzon <lgarzonlc@gmail.com> 