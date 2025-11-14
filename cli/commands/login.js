const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const api = require('../utils/api');
const config = require('../utils/config');

async function login(options) {
  console.log(chalk.blue.bold('\n🔐 API Response Manager - Login\n'));

  let email = options.email;
  let password = options.password;

  // Prompt for credentials if not provided
  if (!email || !password) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        when: !email,
        validate: (input) => {
          if (!input) return 'Email is required';
          if (!/\S+@\S+\.\S+/.test(input)) return 'Invalid email format';
          return true;
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        when: !password,
        mask: '*',
        validate: (input) => {
          if (!input) return 'Password is required';
          if (input.length < 6) return 'Password must be at least 6 characters';
          return true;
        }
      }
    ]);

    email = email || answers.email;
    password = password || answers.password;
  }

  const spinner = ora('Authenticating...').start();

  try {
    const response = await api.login(email, password);
    
    if (!response.token) {
      throw new Error('No token received from server');
    }

    // Store credentials
    api.setToken(response.token);
    
    const userId = response.user?._id || response.user?.id;
    const userEmail = response.user?.email || email;
    
    if (userId) {
      config.set('userId', userId);
    }
    if (userEmail) {
      config.set('email', userEmail);
    }

    spinner.succeed(chalk.green('Login successful!'));
    
    console.log(chalk.gray('\nUser:'), chalk.white(userEmail));
    console.log(chalk.gray('Token saved to:'), chalk.white(config.path));
    console.log(chalk.green('\n✓ You can now use all ARM CLI commands\n'));

  } catch (error) {
    spinner.fail(chalk.red('Login failed'));
    
    if (error.response?.status === 401) {
      console.error(chalk.red('\n✗ Invalid email or password\n'));
    } else if (error.response?.data?.msg) {
      console.error(chalk.red(`\n✗ ${error.response.data.msg}\n`));
    } else {
      console.error(chalk.red(`\n✗ ${error.message}\n`));
    }
    
    process.exit(1);
  }
}

module.exports = login;
