const chalk = require('chalk');
const config = require('../utils/config');
const Table = require('cli-table3');

// Set config value
function set(key, value) {
  try {
    config.set(key, value);
    console.log(chalk.green(`\n✓ Configuration updated: ${key} = ${value}\n`));
  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to set configuration: ${error.message}\n`));
    process.exit(1);
  }
}

// Get config value
function get(key) {
  try {
    if (key) {
      const value = config.get(key);
      if (value === undefined) {
        console.log(chalk.yellow(`\n⚠ Configuration key '${key}' not found\n`));
      } else {
        console.log(chalk.white(`\n${key}: ${value}\n`));
      }
    } else {
      // Show all config
      const allConfig = config.store;
      
      console.log(chalk.blue.bold('\n⚙️  Configuration\n'));
      
      const table = new Table({
        head: ['Key', 'Value'],
        style: {
          head: ['cyan']
        }
      });

      Object.entries(allConfig).forEach(([key, value]) => {
        // Hide sensitive values
        const displayValue = key === 'token' && value 
          ? value.substring(0, 20) + '...' 
          : String(value);
        table.push([key, displayValue]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`\nConfig file: ${config.path}\n`));
    }
  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to get configuration: ${error.message}\n`));
    process.exit(1);
  }
}

// Delete config value
function deleteConfig(key) {
  try {
    if (!config.has(key)) {
      console.log(chalk.yellow(`\n⚠ Configuration key '${key}' not found\n`));
      return;
    }
    
    config.delete(key);
    console.log(chalk.green(`\n✓ Configuration deleted: ${key}\n`));
  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to delete configuration: ${error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  set,
  get,
  delete: deleteConfig
};
