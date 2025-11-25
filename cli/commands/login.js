const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const open = require('open');
const api = require('../utils/api');
const config = require('../utils/config');

async function login(options) {
  console.log(chalk.blue.bold('\n🔐 API Response Manager - Login\n'));

  // Check if social login is requested
  if (options.provider) {
    return await socialLogin(options.provider);
  }

  // Ask for login method
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'Choose login method:',
      choices: [
        { name: '📧 Email & Password', value: 'email' },
        { name: '🌐 Google', value: 'google' },
        { name: '🐙 GitHub', value: 'github' },
        { name: '🪟 Microsoft', value: 'microsoft' }
      ]
    }
  ]);

  if (method !== 'email') {
    return await socialLogin(method);
  }

  // Traditional email/password login
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

async function socialLogin(provider) {
  console.log(chalk.blue(`\n🌐 Logging in with ${provider}...\n`));

  const spinner = ora('Initiating OAuth flow...').start();

  try {
    // Request device code from backend
    const deviceResponse = await api.requestDeviceCode(provider);
    
    spinner.stop();

    const { device_code, user_code, verification_uri, expires_in } = deviceResponse;

    console.log(chalk.yellow('\n📋 Please complete authentication:\n'));
    console.log(chalk.white('  1. Visit:'), chalk.cyan.underline(verification_uri));
    console.log(chalk.white('  2. Enter code:'), chalk.green.bold(user_code));
    console.log(chalk.gray(`\n  Code expires in ${expires_in} seconds\n`));

    // Open browser automatically
    const { openBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Open browser automatically?',
        default: true
      }
    ]);

    if (openBrowser) {
      await open(verification_uri);
      console.log(chalk.gray('  ✓ Browser opened\n'));
    }

    const pollSpinner = ora('Waiting for authentication...').start();

    // Poll for token
    const pollInterval = 5000; // 5 seconds
    const maxAttempts = Math.ceil(expires_in / (pollInterval / 1000));
    let attempts = 0;

    const pollForToken = async () => {
      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          const tokenResponse = await api.pollDeviceToken(device_code, provider);
          
          if (tokenResponse.token) {
            pollSpinner.succeed(chalk.green('Authentication successful!'));
            
            // Store credentials
            api.setToken(tokenResponse.token);
            
            const userId = tokenResponse.user?._id || tokenResponse.user?.id;
            const userEmail = tokenResponse.user?.email;
            const userName = tokenResponse.user?.name;
            
            if (userId) config.set('userId', userId);
            if (userEmail) config.set('email', userEmail);
            
            console.log(chalk.gray('\nUser:'), chalk.white(userName || userEmail));
            console.log(chalk.gray('Provider:'), chalk.white(provider));
            console.log(chalk.gray('Token saved to:'), chalk.white(config.path));
            console.log(chalk.green('\n✓ You can now use all ARM CLI commands\n'));
            
            return;
          }
        } catch (error) {
          if (error.response?.status === 428) {
            // Still pending, continue polling
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }
          throw error;
        }
      }
      
      throw new Error('Authentication timeout - please try again');
    };

    await pollForToken();

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n✗ Social login failed'));
    
    if (error.response?.data?.msg) {
      console.error(chalk.red(`✗ ${error.response.data.msg}\n`));
    } else {
      console.error(chalk.red(`✗ ${error.message}\n`));
    }
    
    process.exit(1);
  }
}

module.exports = login;
