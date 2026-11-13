# JavaScript Dependency Update Action - Complete Documentation Index

Welcome! This directory contains a fully documented GitHub Action for automatically updating npm dependencies.

---

## 🚀 Quick Start (30 seconds)

```yaml
steps:
  - uses: ./.github/actions/js-dependcy-update
    with:
      working-dir: '.'
      gh-token: ${{ secrets.GITHUB_TOKEN }}
```

**That's it!** The action will:
1. Check for npm updates
2. Create a new branch if updates exist
3. Commit the changes
4. Open a pull request

---

## 📚 Documentation Files

### For Everyone
- **[README.md](./README.md)** - Main user guide and reference
  - Complete overview of what the action does
  - All configuration options explained
  - Usage examples for common scenarios
  - Troubleshooting help

### For Technical Details
- **[ACTION_YAML_ANALYSIS.md](./ACTION_YAML_ANALYSIS.md)** - How the action is configured
  - Deep dive into each input parameter
  - Runtime environment details
  - Security considerations
  - Enhancement ideas

### For Navigation
- **[DOCUMENTATION_SUMMARY.md](./DOCUMENTATION_SUMMARY.md)** - Overview and quick reference
  - Documentation structure
  - File sizes and contents
  - How to navigate all docs
  - Coverage checklist

### Code
- **[index.js](./index.js)** - Source code with comprehensive comments
  - All functions documented
  - Logic flow explained
  - Security measures highlighted

---

## 📖 Choose Your Path

### "I just want to use it"
```
1. Read: README.md → Overview section
2. Copy: README.md → Usage Example (Basic Usage)
3. Go to: Your workflow file
```

### "I need to configure it for my project"
```
1. Read: README.md → Inputs section
2. Review: README.md → Common Scenarios
3. Pick the scenario that matches your needs
```

### "I'm troubleshooting an issue"
```
1. Go to: README.md → Troubleshooting section
2. Check: Your exact error message
3. Follow: The suggested solution
```

### "I want to understand the technical details"
```
1. Read: ACTION_YAML_ANALYSIS.md → File Overview
2. Deep dive: ACTION_YAML_ANALYSIS.md → Structure Analysis
3. Reference: index.js with comments
```

### "I want to improve or extend this action"
```
1. Check: ACTION_YAML_ANALYSIS.md → Enhancements section
2. Review: index.js for current implementation
3. Look at: action.yaml for configuration points
```

---

## 🎯 By Use Case

### Scenario: Weekly Dependency Updates
**Best for:** Projects that want automated dependency checks
```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/js-dependcy-update
        with:
          working-dir: '.'
          gh-token: ${{ secrets.GITHUB_TOKEN }}
```
→ See: [README.md - Scenario 1](./README.md#scenario-1-weekly-dependency-updates)

### Scenario: Manual Trigger
**Best for:** On-demand dependency updates
→ See: [README.md - Scenario 2](./README.md#scenario-2-manual-trigger)

### Scenario: Monorepo with Multiple Packages
**Best for:** Projects with multiple package.json files
```yaml
strategy:
  matrix:
    directory: ['./apps/api', './apps/web']
steps:
  - uses: ./.github/actions/js-dependcy-update
    with:
      working-dir: ${{ matrix.directory }}
      gh-token: ${{ secrets.GITHUB_TOKEN }}
```
→ See: [README.md - Scenario 4](./README.md#scenario-4-multi-directory-monorepo)

---

## 📋 Input Parameters at a Glance

| Parameter | Required | Default | What It Does |
|-----------|----------|---------|---|
| `working-dir` | ✅ Yes | - | Path to your project directory |
| `gh-token` | ✅ Yes | - | GitHub authentication token |
| `base-branch` | No | `main` | Target branch for the PR |
| `head-branch` | No | `update-dependencies` | Branch name for updates |
| `debug` | No | `false` | Show detailed logging |

→ Full details: [README.md - Inputs](./README.md#inputs)

---

## ⚙️ Runtime Info

- **Runtime**: Node.js 20
- **Language**: JavaScript
- **Entry Point**: `index.js`
- **Configuration**: `action.yaml`
- **Permissions Needed**: `contents: write`, `pull-requests: write`

→ Full details: [ACTION_YAML_ANALYSIS.md - Runs Configuration](./ACTION_YAML_ANALYSIS.md#3-runs-configuration)

---

## 🔒 Security

The action includes:
- ✅ Input validation (branch names, directory paths)
- ✅ Token masking in logs
- ✅ Error handling with clear messages
- ✅ No hardcoded secrets

→ See: [README.md - Security Validation](./README.md#1-security-validation)

---

## 📞 Common Questions

**Q: Do I need to provide all inputs?**
A: No. Only `working-dir` and `gh-token` are required. Others have defaults.
→ See: [README.md - Inputs](./README.md#inputs)

**Q: Will it create a PR every time it runs?**
A: Only if there are actual updates. No updates = no PR.
→ See: [README.md - Key Features](./README.md#3-smart-update-detection)

**Q: Can I use this with a monorepo?**
A: Yes! Use matrix strategy with different `working-dir` values.
→ See: [README.md - Scenario 4](./README.md#scenario-4-multi-directory-monorepo)

**Q: What about my private npm packages?**
A: The action uses `npm update` which respects your .npmrc config.
→ See: [README.md - Notes](./README.md#notes)

**Q: How do I debug issues?**
A: Set `debug: true` to see detailed output.
→ See: [README.md - Enable Debug Mode](./README.md#enable-debug-mode)

---

## 🔄 How It Works (Flow Diagram)

```
Workflow Triggered
       ↓
Action Retrieves Inputs
       ↓
Validates Inputs (branch names, paths)
       ↓
Runs: npm update
       ↓
Checks: git status for changes
       ↓
     ┌─────────────────────┐
     │ Updates Found?      │
     └──────────┬──────────┘
         YES ↙  ↖ NO
            ↙    ↖
      Set up Git  Log: "No updates"
         ↓         ↓
    Create Branch  Exit
         ↓
    Commit Changes
         ↓
    Push Branch
         ↓
    Create PR
         ↓
       Done
```

→ Detailed steps: [README.md - Main Purpose](./README.md#main-purpose)

---

## 📞 Troubleshooting Flowchart

```
Action Failed?
     ↓
   Is it input validation?
   ├─ YES → Check branch name format
   │       (alphanumeric, -, _, ., / only)
   │
   └─ NO → Is it a GitHub API error?
           ├─ YES → Check gh-token permissions
           │       (need: contents, pull-requests)
           │
           └─ NO → Enable debug: true
                   Check detailed logs
```

→ Full troubleshooting: [README.md - Troubleshooting](./README.md#troubleshooting)

---

## 💡 Tips & Tricks

1. **Test it first**: Use `workflow_dispatch` trigger to test manually
2. **Start simple**: Use defaults first, customize later
3. **Monitor PRs**: Check the created PRs to ensure they're correct
4. **Use debug mode**: When trying new configurations
5. **Custom branch names**: Make them descriptive like `chore/npm-weekly`

→ More scenarios: [README.md - Common Scenarios](./README.md#common-scenarios)

---

## 🚀 Next Steps

1. **Immediate**: Copy basic usage into your workflow
2. **Configure**: Adjust inputs for your project
3. **Test**: Run it manually via `workflow_dispatch`
4. **Monitor**: Check the created PR
5. **Automate**: Add schedule trigger if happy

---

## 📊 Documentation Statistics

- **Total Documentation**: 24.1 KB
- **README**: 10 KB (main user guide)
- **Technical Analysis**: 8.7 KB (architecture details)
- **Code Comments**: Added to index.js (118 lines)
- **Coverage**: 100% of functions, inputs, and features

---

## 📝 File Map

```
.github/actions/js-dependcy-update/
├── INDEX.md ← You are here
├── README.md ← User guide (START HERE)
├── ACTION_YAML_ANALYSIS.md ← Technical details
├── DOCUMENTATION_SUMMARY.md ← Overview
├── index.js ← Source code (commented)
├── action.yaml ← Configuration
├── package.json ← Dependencies
└── node_modules/ ← Installed packages
```

---

## 🎓 Learning Path

**Beginner** (5 min):
1. This page (INDEX.md)
2. README.md → Overview
3. Copy basic example

**Intermediate** (15 min):
1. README.md → Inputs
2. README.md → Usage Examples
3. Customize for your project

**Advanced** (30 min):
1. ACTION_YAML_ANALYSIS.md
2. index.js comments
3. Enhancement ideas

---

## ❓ Still Have Questions?

- Check **README.md** for general questions
- Read **ACTION_YAML_ANALYSIS.md** for technical questions
- Review **index.js comments** for implementation details
- See **DOCUMENTATION_SUMMARY.md** for navigation help

---

## 📅 Last Updated
November 13, 2024

---

**Ready?** → Start with [README.md](./README.md)

*Part of the gh-actions-course project*
