# CLI v1.0.1 - Initial Release 🎉

## 📦 Installation

```bash
npm install -g @vijaypurohit322-arm/cli
```

## 🚀 Features

### Authentication
- `arm login` - Login with email/password
- `arm logout` - Logout from CLI
- Persistent token storage

### Tunnel Management
- `arm tunnel <port>` - Start tunnel to expose local server
- `arm tunnel:list` - List all active tunnels
- `arm tunnel:stop <id>` - Stop a tunnel
- `arm tunnel:logs <id>` - View tunnel request logs
- Custom subdomains, authentication, rate limiting

### Webhook Management
- `arm webhook` - Create new webhook
- `arm webhook:list` - List all webhooks
- `arm webhook:id <name>` - Get webhook ID by name
- `arm webhook:delete <id>` - Delete webhook
- `arm webhook:logs <id>` - View webhook logs
- `arm webhook:replay <webhookId> <requestId>` - Replay requests
- Forward to URL or tunnel

### Project Management
- `arm projects` - List all projects
- `arm project:create <name>` - Create new project
- `arm project:id <name>` - Get project ID by name
- `arm project:share <id>` - Get shareable link
- `arm project:responses <id>` - View API responses

### Configuration
- `arm config:set <key> <value>` - Set config value
- `arm config:get [key]` - Get config value(s)
- `arm config:delete <key>` - Delete config value

## 📚 Documentation

- [CLI README](cli/README.md) - Complete usage guide
- [Installation Guide](cli/INSTALLATION.md) - Platform-specific instructions
- [Publishing Guide](cli/PUBLISHING.md) - For maintainers

## 🔗 Links

- **npm Package:** https://www.npmjs.com/package/@vijaypurohit322-arm/cli
- **GitHub Repository:** https://github.com/vijaypurohit322/api-response-manager
- **Issues:** https://github.com/vijaypurohit322/api-response-manager/issues

## 🐛 Bug Fixes

- Fixed tunnel request count display (now shows actual count from stats API)
- Fixed project share link generation from shareToken
- Fixed config import in project commands
- Removed update-notifier errors

## 📝 Technical Details

- **Package Size:** 10.0 kB
- **Unpacked Size:** 45.2 kB
- **Node Version:** >=14.0.0
- **Dependencies:** commander, chalk, inquirer, ora, axios, ws, conf, cli-table3

## 🙏 Credits

Created by Vijay Singh Purohit

## 📄 License

MIT License
