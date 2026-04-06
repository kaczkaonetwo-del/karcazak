# Karczak Scripts Verification Bot

A Discord verification bot for the Karczak Scripts server that automatically assigns roles to new members upon verification.

## Features

- ✅ Automatic member verification with role assignment
- 🎨 Beautiful embed messages
- 📝 Command logging (optional)
- 🔧 Easy configuration
- 🛡️ Error handling and logging

## Commands

- `!verify` - Verify yourself and get access to the server
- `!help` - Shows all available commands

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Edit the `.env` file with your server settings:

```env
DISCORD_TOKEN=your_bot_token_here
BOT_PREFIX=!
VERIFICATION_ROLE_ID=your_verification_role_id
WELCOME_CHANNEL_ID=your_welcome_channel_id
LOGS_CHANNEL_ID=your_logs_channel_id
```

### 3. Configure Bot Settings

Edit `config.json` to customize bot behavior:

```json
{
  "serverSettings": {
    "verificationEnabled": true,
    "welcomeMessage": "Welcome to Karczak Scripts! Please use !verify to get access to the server.",
    "verifiedRoleName": "Verified",
    "logCommands": true
  }
}
```

### 4. Run the Bot

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Required Permissions

The bot needs the following permissions:
- Read Messages
- Send Messages
- Embed Links
- Manage Roles
- Read Message History

## Role Setup

1. Create a role named "Verified" (or customize in config.json)
2. Get the role ID and add it to your `.env` file
3. Make sure the bot has permission to manage roles

## Channel Setup

1. Create a welcome channel (optional)
2. Create a logs channel (optional)
3. Add the channel IDs to your `.env` file

## Support

If you need help, contact the server administrator.

---

**Made with ❤️ for Karczak Scripts**
