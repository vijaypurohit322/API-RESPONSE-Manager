const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const api = require('../utils/api');
const config = require('../utils/config');

// List projects
async function list() {
  const spinner = ora('Fetching projects...').start();

  try {
    const response = await api.getProjects();
    // Backend returns array directly, not wrapped in { projects: [] }
    const projects = Array.isArray(response) ? response : (response.projects || []);

    spinner.stop();

    if (projects.length === 0) {
      console.log(chalk.yellow('\n⚠ No projects found\n'));
      console.log(chalk.gray('Create a project with: arm project:create <name>\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n📊 Projects (${projects.length})\n`));

    const table = new Table({
      head: ['Name', 'Responses', 'Created', 'ID'],
      style: {
        head: ['cyan']
      }
    });

    projects.forEach(project => {
      const created = new Date(project.createdAt).toLocaleDateString();
      
      table.push([
        project.name,
        project.responseCount || 0,
        created,
        project._id.substring(0, 8) + '...'
      ]);
    });

    console.log(table.toString());
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch projects'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Create project
async function create(name, options) {
  const spinner = ora('Creating project...').start();

  try {
    const projectData = {
      name,
      description: options.description || ''
    };

    const response = await api.createProject(projectData);
    // Backend returns project directly
    const project = response.project || response;

    spinner.succeed(chalk.green('Project created successfully!'));

    // Construct share link from shareToken
    const baseUrl = config.get('webUrl') || 'http://localhost:5173';
    const shareLink = project.shareLink || `${baseUrl}/share/${project.shareToken}`;

    console.log(chalk.gray('\n┌─────────────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white.bold('  Project Information                        ') + chalk.gray('│'));
    console.log(chalk.gray('├─────────────────────────────────────────────┤'));
    console.log(chalk.gray('│') + chalk.gray('  Name:        ') + chalk.white(project.name.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Project ID:  ') + chalk.yellow(project._id.padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('│') + chalk.gray('  Share Link:  ') + chalk.cyan(shareLink.substring(0, 28).padEnd(28)) + chalk.gray('│'));
    console.log(chalk.gray('└─────────────────────────────────────────────┘\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Get share link
async function share(projectId) {
  const spinner = ora('Fetching project...').start();

  try {
    const response = await api.getProject(projectId);
    // Backend returns project directly
    const project = response.project || response;

    spinner.stop();

    // Construct share link from shareToken
    const baseUrl = config.get('webUrl') || 'http://localhost:5173';
    const shareLink = project.shareLink || `${baseUrl}/share/${project.shareToken}`;

    console.log(chalk.blue.bold('\n🔗 Shareable Link\n'));
    console.log(chalk.white('Project:'), chalk.cyan(project.name));
    console.log(chalk.white('Share Link:'), chalk.cyan.bold(shareLink));
    console.log(chalk.gray('\nAnyone with this link can view the project (no login required)\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch project'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// View project responses
async function responses(projectId, options) {
  const spinner = ora('Fetching responses...').start();

  try {
    const response = await api.getProjectResponses(projectId, {
      limit: parseInt(options.limit)
    });
    const apiResponses = response.responses || [];

    spinner.stop();

    if (apiResponses.length === 0) {
      console.log(chalk.yellow('\n⚠ No responses found\n'));
      return;
    }

    console.log(chalk.blue.bold(`\n📊 API Responses (${apiResponses.length})\n`));

    const table = new Table({
      head: ['Method', 'URL', 'Status', 'Time', 'Date'],
      style: {
        head: ['cyan']
      }
    });

    apiResponses.forEach(resp => {
      const statusColor = resp.statusCode >= 200 && resp.statusCode < 300 ? chalk.green : chalk.red;
      const date = new Date(resp.createdAt).toLocaleString();
      
      table.push([
        resp.method,
        resp.url.substring(0, 30),
        statusColor(resp.statusCode),
        `${resp.responseTime}ms`,
        date
      ]);
    });

    console.log(table.toString());
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch responses'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

// Get project ID by name
async function getIdByName(name) {
  const spinner = ora('Searching for project...').start();

  try {
    const response = await api.getProjects();
    const projects = Array.isArray(response) ? response : (response.projects || []);

    spinner.stop();

    // Search for project by name (case-insensitive)
    const project = projects.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (!project) {
      console.log(chalk.yellow(`\n⚠ Project "${name}" not found\n`));
      console.log(chalk.gray('Available projects:'));
      projects.forEach(p => console.log(chalk.gray(`  - ${p.name}`)));
      console.log();
      return;
    }

    console.log(chalk.blue.bold('\n📋 Project Found\n'));
    console.log(chalk.white('Name:'), chalk.cyan(project.name));
    console.log(chalk.white('ID:'), chalk.yellow(project._id));
    console.log(chalk.gray('\nUse this ID with other commands:\n'));
    console.log(chalk.gray(`  arm project:share ${project._id}`));
    console.log(chalk.gray(`  arm project:responses ${project._id}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to search projects'));
    console.error(chalk.red(`\n✗ ${error.response?.data?.msg || error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  list,
  create,
  getIdByName,
  share,
  responses
};
