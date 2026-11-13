# JavaScript Dependency Update Action

## Overview

This GitHub Action automatically checks for and updates npm package dependencies in a JavaScript/Node.js project, and creates a pull request with the updates. It's designed to be integrated into GitHub Actions workflows to keep npm dependencies current and secure.

---

## Main Purpose

The action performs the following workflow:
1. Checks for available npm package updates using `npm update`
2. Detects changes to `package.json` and `package-lock.json`
3. If updates are available:
   - Creates a new branch with the updated dependencies
   - Commits the changes with a descriptive message
   - Pushes the branch to the repository
   - Creates a pull request for review and merging
4. If no updates are available, exits gracefully with an informational message

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `base-branch` | No | `main` | The target branch where the PR will merge (base for comparison) |
| `head-branch` | No | `update-dependencies` | The branch name to create with the updated dependencies |
| `working-dir` | **Yes** | N/A | The working directory of the project containing package.json |
| `gh-token` | **Yes** | N/A | GitHub Personal Access Token or GITHUB_TOKEN with write access to contents and pull requests |
| `debug` | No | `false` | Enable debug-level logging for troubleshooting |

### Input Details

- **base-branch**: The branch that serves as the target for the PR. Typically your main development or production branch.
- **head-branch**: The branch name created in the repository. The PR will be created from this branch into the base-branch.
- **working-dir**: Path to the directory containing `package.json`. Use `"."` for the repository root or a subdirectory path like `"./apps/frontend"`.
- **gh-token**: Must have write permissions for `contents` (to push code) and `pull requests` (to create PRs). Usually `${{ secrets.GITHUB_TOKEN }}`.
- **debug**: When set to `true`, outputs verbose debugging information to help troubleshoot action execution.

---

## Runtime Environment

- **Runtime**: Node.js 20
- **Main Entry**: `index.js`

---

## Key Features

### 1. **Security Validation**
- Branch names are validated to contain only safe characters (alphanumeric, underscores, hyphens, dots, forward slashes)
- Directory paths are validated for safe characters
- GitHub tokens are masked in logs to prevent accidental exposure

### 2. **Structured Logging**
- All log messages include a prefix `[js-dependency-update]` for easy identification
- Debug mode provides detailed execution information when enabled
- Clear error messages for validation failures

### 3. **Smart Update Detection**
- Only creates a PR if actual updates are found
- Checks both `package.json` and `package-lock.json` for changes
- Gracefully handles scenarios where no updates are available

### 4. **Automated Git Operations**
- Configures git user identity automatically (`gh-automation`)
- Creates feature branch with specified branch name
- Commits with a clear, semantic commit message: `"chore: update dependencies"`
- Force pushes to handle existing branches

### 5. **GitHub API Integration**
- Uses Octokit (GitHub's official API client) for PR creation
- Creates PRs with descriptive title and body
- Full error handling with detailed error messages

---

## Functions Reference

### `setupGit()`
**Purpose**: Configures Git user identity for automated commits.

**Configuration**:
- User name: `"gh-automation"`
- User email: `"gh-automation@email.com"`

**Called**: Before making automated commits

---

### `validateBranchName({ branchName })`
**Purpose**: Validates the format of a Git branch name.

**Parameters**: 
- `branchName` (string): The branch name to validate

**Returns**: `boolean` - `true` if valid, `false` otherwise

**Validation Rules**: 
- Allows: `a-z`, `A-Z`, `0-9`, `_`, `-`, `.`, `/`

**Usage**: Ensures branch names are safe for Git operations

---

### `validateDirectoryName({ dirName })`
**Purpose**: Validates the format of a directory path.

**Parameters**: 
- `dirName` (string): The directory name/path to validate

**Returns**: `boolean` - `true` if valid, `false` otherwise

**Validation Rules**: 
- Allows: `a-z`, `A-Z`, `0-9`, `_`, `-`, `/`

**Usage**: Ensures the working directory path is safe

---

### `setupLogger({ debug, prefix })`
**Purpose**: Creates a structured logging utility with prefixed messages.

**Parameters**: 
- `debug` (boolean, optional): Enable debug-level logging (default: `false`)
- `prefix` (string, optional): Prefix to add to all log messages (default: `''`)

**Returns**: Object with three methods:
  - `debug(message)` - Logs debug messages (only if debug mode is enabled)
  - `info(message)` - Logs informational messages
  - `error(message)` - Logs error messages

**Usage**: Provides consistent, formatted logging throughout the action execution

---

### `run()`
**Purpose**: Main orchestrator function that executes the dependency update workflow.

**Workflow Steps**:

1. **Retrieve Inputs**: Gets configuration from GitHub Actions workflow
2. **Validate Inputs**: Checks branch names and directory paths for safety
3. **Check for Updates**: 
   - Executes `npm update` to check available updates
   - Runs `git status` to detect changes in package files
4. **If Updates Found**:
   - Configures Git user identity
   - Creates new branch from head-branch name
   - Stages and commits `package.json` and `package-lock.json`
   - Pushes branch to origin with `--force` flag
   - Creates GitHub Pull Request with title and description
5. **If No Updates**: Logs informational message and exits

**Error Handling**: 
- Catches and logs errors during PR creation
- Sets action as failed with detailed error message

---

## Usage Example

### Basic Usage in Workflow

```yaml
name: Update Dependencies

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday at midnight
  workflow_dispatch:

jobs:
  update-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: ./.github/actions/js-dependcy-update
        with:
          base-branch: 'main'
          head-branch: 'chore/npm-updates'
          working-dir: '.'
          gh-token: ${{ secrets.GITHUB_TOKEN }}
```

### With Debug Mode

```yaml
- uses: ./.github/actions/js-dependcy-update
  with:
    base-branch: 'develop'
    head-branch: 'chore/dependency-updates'
    working-dir: './packages/app'
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    debug: true
```

### For Monorepo (Multiple Directories)

```yaml
jobs:
  update-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/js-dependcy-update
        with:
          working-dir: './apps/frontend'
          gh-token: ${{ secrets.GITHUB_TOKEN }}

  update-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/js-dependcy-update
        with:
          working-dir: './apps/backend'
          gh-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## Dependencies

The action uses the following npm packages:
- `@actions/core` - GitHub Actions core utilities for inputs, outputs, and logging
- `@actions/exec` - Command execution utilities for running shell commands
- `@actions/github` - GitHub API client (Octokit) for repository operations

---

## Permissions Required

The `gh-token` must have the following permissions:
- **contents**: `write` - To push code changes to branches
- **pull-requests**: `write` - To create pull requests

If using `${{ secrets.GITHUB_TOKEN }}`, ensure your workflow has the required permissions:

```yaml
permissions:
  contents: write
  pull-requests: write
```

---

## Common Scenarios

### Scenario 1: Weekly Dependency Updates
Run the action every Sunday to check for updates:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight UTC
```

### Scenario 2: Manual Trigger
Allow manual execution via workflow dispatch:

```yaml
on:
  workflow_dispatch
```

### Scenario 3: On Pull Request Events
Trigger when PRs are opened or updated:

```yaml
on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'
```

### Scenario 4: Multi-Directory Monorepo
Update dependencies in multiple project directories:

```yaml
strategy:
  matrix:
    directory: ['./services/api', './services/web', './services/admin']
steps:
  - uses: ./.github/actions/js-dependcy-update
    with:
      working-dir: ${{ matrix.directory }}
      gh-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## Error Handling

The action handles the following error scenarios:

| Error | Handling |
|-------|----------|
| Invalid branch name | Action fails with clear error message about allowed characters |
| Invalid directory path | Action fails with clear error message about allowed characters |
| Invalid gh-token | GitHub API call fails; error is logged and action fails |
| PR creation failure | Error is logged with details; action fails with error message |
| No write permissions | GitHub API returns permission error; action fails |

---

## Troubleshooting

### Enable Debug Mode
Set `debug: true` to see detailed execution steps:

```yaml
- uses: ./.github/actions/js-dependcy-update
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    working-dir: '.'
    debug: true
```

### Verify Permissions
Check that the token has write access:
```yaml
permissions:
  contents: write
  pull-requests: write
```

### Check Branch Names
Ensure branch names contain only valid characters:
- Valid: `main`, `develop`, `chore/deps`, `update-2024`, `feature_1.0`
- Invalid: `feature@main`, `update/2024$`, `deps?new`

### Verify Working Directory
Ensure the working directory exists and contains `package.json`:

```bash
ls -la ./path/to/working-dir/package.json
```

---

## Action Metadata

| Property | Value |
|----------|-------|
| Name | Update NPM dependencies |
| Runtime | Node.js 20 |
| Main Entry | index.js |
| Category | Dependency Management |

---

## Contributing

To modify this action:
1. Edit `index.js` for logic changes
2. Update `action.yaml` for input/output changes
3. Test in a branch workflow before merging
4. Ensure all validations pass

---

## Notes

- The action uses `npm update` which respects semantic versioning constraints in `package.json`
- Each run creates a new branch; use `--force` push to overwrite existing branches
- The action is idempotent; running multiple times won't create duplicate PRs if the branch already exists
- Branch names should be descriptive for easy identification in repository history
