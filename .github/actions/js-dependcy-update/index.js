// GitHub Actions libraries for core functions, command execution, and GitHub API
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

// Configures Git user identity for automated commits
const setupGit = async () => {
  await exec.exec('git config --global user.name "gh-automation"');
  await exec.exec('git config --global user.email "gh-automation@email.com"');
};

// Validates branch name contains only safe characters: alphanumeric, underscores, hyphens, dots, forward slashes
const validateBranchName = ({ branchName }) => /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);

// Validates directory name contains only safe characters: alphanumeric, underscores, hyphens, forward slashes
const validateDirectoryName = ({ dirName }) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

// Creates a logger object with debug, info, and error methods that prefix messages
const setupLogger = ({ debug, prefix } = { debug: false, prefix: '' })  => ({
  debug: (message) => {
    if (debug) {
      core.info(`DEBUG ${prefix}${prefix ? ' : ' : ''}${message}`)
    }
  },
  info: (message) => {
    core.info(`${prefix}${prefix ? ' : ' : ''}${message}`)
  },
  error: (message) => {
    core.error(`${prefix}${prefix ? ' : ' : ''}${message}`);
  }
});

// Main action function: checks for npm updates and creates a PR if updates are found
async function run() {
  // Retrieve action inputs from GitHub Actions workflow
  const baseBranch = core.getInput('base-branch', { required: true });
  const headBranch = core.getInput('head-branch', { required: true});
  const workingDir = core.getInput('working-dir', { required: true });
  const ghToken = core.getInput('gh-token', { required: true });
  const debug = core.getBooleanInput('debug');

  const logger = setupLogger({ debug, prefix: '[js-dependency-update]' });

  const commonExecOpts = {
    cwd: workingDir
  };

  // Mask the token in action logs for security
  core.setSecret(ghToken);

  logger.debug('Validating inputs - base-branch, head-branch, working-directory');

  // Validate branch and directory names for security
  if (!validateBranchName({ branchName: baseBranch })) {
    core.setFailed('Invalid base branch name. Branch name should include only characters, numbers, underscores, dots, hyphens, and forwardslashes.');
    return;
  }

  if (!validateBranchName({ branchName: headBranch })) {
    core.setFailed('Invalid head branch name. Branch name should include only characters, numbers, underscores, dots, hyphens, and forwardslashes.');
    return;
  }

  if (!validateDirectoryName({ dirName: workingDir })) {
    core.setFailed('Invalid working directory name. Directory name should include only characters, numbers, underscores, hyphens, and forwardslashes.');
    return;
  }

  logger.debug(`base branch is ${baseBranch}`);
  logger.debug(`head branch is ${headBranch}`);
  logger.debug(`working directory is ${workingDir}`);

  // Run npm update to check for available package updates
  logger.debug('Checking for package updates');
  await exec.exec('npm update', [], {  
    ...commonExecOpts
  });

  // Check if package files have been modified (indicating updates are available)
  const gitStatus = await exec.getExecOutput(
    'git status -s package*.json', 
    [], 
    {
      ...commonExecOpts
    }
  );

  if (gitStatus.stdout.length > 0) {
    logger.debug('There are updates available!');
    logger.debug('Setting up git');
    await setupGit();

    logger.debug('Committing and pushing package*.json changes');
    // Create new branch and commit package updates
    await exec.exec(`git checkout -b ${headBranch}`, [], {
      ...commonExecOpts
    });
    await exec.exec('git add package.json package-lock.json', [], {
      ...commonExecOpts
    });
    await exec.exec('git commit -m "chore: update dependencies"', [], {
      ...commonExecOpts
    });
    await exec.exec(`git push origin ${headBranch} --force`, [], {
      ...commonExecOpts
    });

    // Initialize GitHub API client and create pull request
    logger.debug('Fetching octokit API');
    const octokit = github.getOctokit(ghToken);

    try {
      logger.debug(`Creating PR using head branch ${headBranch}`);
      await octokit.rest.pulls.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        head: headBranch,
        base: baseBranch,
        title: 'Update NPM dependencies',
        body: 'This pull request updates NPM packages'
      });
    } catch (e) {
      logger.error('Something went wrong while creating the PR. Check logs below.');
      core.setFailed(e.message);
      logger.error(e);
    }
  } else {
    logger.info('No updates at this point in time.');
  }
}

// Execute the action
run();