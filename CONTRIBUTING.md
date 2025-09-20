# Contributing to jsonjsdb

- [Getting Started](#getting-started)
  - [Standard Workflow](#standard-workflow)
  - [Quick Workflow (WIP branches)](#quick-workflow-wip-branches)
  - [Git Setup (Optional)](#git-setup-optional)
- [Development Scripts](#development-scripts)
- [Guidelines](#guidelines)
  - [Pull Requests](#pull-requests)
  - [Tests & Quality](#tests--quality)
  - [Documentation](#documentation)
- [Project Architecture](#project-architecture)
  - [Tech Stack](#tech-stack)
  - [Key Directories](#key-directories)
- [Releases & Maintenance](#releases--maintenance)
  - [Release Process](#release-process)
  - [Branch Cleanup](#branch-cleanup)
- [Support](#support)

## Getting Started

### Standard Workflow

1. Fork the repository and create a branch:

   ```bash
   git checkout -b add-feature-x
   npm ci
   ```

2. Develop and test:

   ```bash
   npm run dev      # Start development (vitest watch mode)
   npm run test     # Run tests before pushing
   npm run build    # Build both packages
   ```

3. Submit your changes:

   ```bash
   git add .
   git commit -m "add dataset filter logic"
   git push origin add-feature-x
   ```

4. Open a Pull Request to `main` - ensure CI passes

### Quick Workflow (WIP branches)

For faster iterations, you can optionally install the WIP alias:

```bash
# Optional one-time setup
git config --global alias.wip '!f(){ n=${1:-wip-$(date +%Y%m%d-%H%M%S)}; git switch -c "$n"; }; f'
```

Then for each change:

```bash
git checkout main
git pull
git wip add-feature-x       # creates branch add-feature-x
# ... commits ...
git push -u origin HEAD
# Open PR → CI → squash merge → delete branch
```

Without the alias, simply use: `git checkout -b add-feature-x`

### Git Setup (Optional)

For better branch management, you can optionally configure these Git aliases:

```bash
# One-time setup for automatic branch pruning
git config --global fetch.prune true

# Add cleanup alias for merged branches
# Add cleanup alias for squash merged branches
git config --global alias.cleanup '!f(){ current=$(git branch --show-current); if [ "$current" != "main" ] && [ "$current" != "master" ]; then git checkout main && git pull --ff-only && git branch -D "$current"; else git checkout main && git pull --ff-only; fi; }; f'
```

Then use `git cleanup` to automatically switch to main, pull changes, and delete the current branch.

## Development Scripts

| Command                 | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Development mode (core package vitest watch) |
| `npm run dev:core`      | Development mode (core package only)         |
| `npm run build`         | Build both packages                          |
| `npm run build:core`    | Build core jsonjsdb library only             |
| `npm run build:builder` | Build jsonjsdb-builder package only          |
| `npm run test`          | Run test suite (both packages)               |
| `npm run test:core`     | Run tests (core package only)                |
| `npm run test:builder`  | Run tests (builder package only)             |
| `npm run lint`          | Lint all packages                            |
| `npm run lint:core`     | Lint core package only                       |
| `npm run lint:builder`  | Lint builder package only                    |

## Guidelines

### Pull Requests

Keep PRs focused - one feature, one bug fix, or one refactor. Avoid mixing stylistic changes with functional ones.

### Tests & Quality

- Run `npm run test` locally (runs tests for both packages)
- Run `npm run test:core` for core package tests only
- Run `npm run test:builder` for builder package tests only
- All tests use Vitest with browser environment for realistic testing
- Build must pass: `npm run build`
- Linting must pass: `npm run lint`

### Documentation

Update `README.md` for new visible features.

## Project Architecture

### Tech Stack

- **Core Library**: TypeScript + Vite
- **Builder Tools**: TypeScript + Vite
- **Testing**: Vitest (browser environment for core package)
- **Linting**: ESLint + TypeScript ESLint
- **Build**: Vite (ES modules + TypeScript definitions)
- **Package Management**: NPM (monorepo structure)

### Key Directories

- `jsonjsdb/` - Core library package
  - `src/` - Core library source (Jsonjsdb, Loader, DBrowser, IntegrityChecker)
  - `test/` - Core library tests and test database fixtures
- `jsonjsdb-builder/` - Builder tools package
  - `src/` - Builder tools source (JsonjsdbBuilder, comparison, Excel import)
  - `test/` - Builder tests and fixtures
- Root level configuration files (ESLint, TypeScript, package.json)

## Releases & Maintenance

### Release Process

Releases are handled manually by maintainers when needed:

1. Update versions in package.json files
2. Update CHANGELOG.md files
3. Create a git tag
4. Build and publish packages if needed

### Branch Cleanup

After PR merge, use the Git cleanup alias (see [Git Setup](#git-setup-optional)):

```bash
git cleanup  # Switches to main, pulls changes, deletes current branch
```

## Support

- **CI**: Tests can be run locally with npm scripts
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Monorepo**: Each package has its own version and can be released independently

**Bug Reports**: Provide clear title, steps to reproduce, expected vs actual behavior, relevant package (core or builder).
