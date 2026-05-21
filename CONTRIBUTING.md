# Contributing to mygit

Thanks for contributing to **mygit**. Before you start, please read this document to understand the project's goals and structure.
This project is a simplified Git implementation built in Node.js, focused on understanding how Git works internally.

---

>⚠️ Major Refactor In Progress
>
> The project architecture has recently changed.
> Contributors should read the discussion below before opening PRs:
> [Discussion: Refactor Repository Structure](https://github.com/Leonardo-Garzon-1995/mygit/discussions/45)

## Project Goals

mygit aims to:
- Recreate core Git behavior (init, add, commit, log, etc.)
- Keep the architecture clean and understandable
- Avoid unnecessary complexity or premature optimization
- Serve as a learning tool for Git internals

---

## Project Structure

Please try to stay close to the current architecture:
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
│   ├── core/             # Core data structures and logic
│   ├── helpers/          # Git functionality helpers
│   └── utils/            # Utility functions
├── tests/                # Test files
├── z-explanation/        # Educational documentation
└── package.json
```

## Before Opening a PR

Before implementing a feature:

1. Check **GitHub Discussions**
2. Open a discussion if it’s a new idea or architecture change
3. Wait for feedback before coding large changes

## Discussions First Policy

We use GitHub Discussions for:
- Feature proposals
- Architecture and refactors
- Questions about internal design

Only after agreement should a feature become a PR.

> For bug fixes or small improvements you can create issues and submit PRs directly. No need to go through 'Discussions' for minor changes.

---

## Coding Guidelines

- Keep functions small and single-purpose
- Prefer explicit logic over abstraction
- Avoid duplicating core logic (refactor instead)
- Keep CLI commands thin (they should call `src/core/` or `src/helpers/`)

---

## Commit Style

Use clear, minimal commit messages:
```
<type>: <description>

or

<type>(scope): <description>
```

types:
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code restructuring (no behavior change)
- `test`: only for tests
- `chore`: maintenance
- `docs`: documentation

Examples
- `feat: add commit command`
- `fix(index): handle missing staging file`


Avoid:
- “fix stuff”
- “update”
- “changes”

---

## Testing

- Ensure existing tests pass before submitting PR
- Add tests for new features when possible

---

## Pull Request Process

1. Fork repo
2. Create feature branch
3. Implement changes
4. Ensure tests pass
5. Open PR based on this [template](./.github/pull_request_template.md)


---

Thanks for contributing!