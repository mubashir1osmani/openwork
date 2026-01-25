# Openwork Web Server

Browser-compatible backend server for running Openwork in Chromium browsers (Chrome, Edge, Brave, etc.).

## Overview

This server provides HTTP/REST APIs and WebSocket support to replace Electron's IPC communication, enabling Openwork to run as a web application in any modern Chromium-based browser.

## Features

- ✅ HTTP/REST API endpoints mirroring Electron IPC handlers
- ✅ WebSocket server for real-time task updates
- ✅ SQLite database for app settings and task history
- ✅ Secure API key storage (encrypted in database)
- ⚠️ Task execution (coming soon)
- ⚠️ MCP server integration (coming soon)

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env and update ENCRYPTION_KEY to a secure random string
nano .env
```

### Running

```bash
# Development mode (with auto-reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

The server will start on:
- HTTP API: http://localhost:3001
- WebSocket: ws://localhost:3002

## API Endpoints

### App Info
- `GET /api/app/version` - Get app version
- `GET /api/app/platform` - Get platform info

### API Keys
- `GET /api/api-keys/has-any` - Check if any API key exists
- `GET /api/api-keys/all` - Get all API key providers
- `GET /api/api-keys/:provider` - Get API key for provider
- `POST /api/api-keys/:provider` - Store API key
- `DELETE /api/api-keys/:provider` - Delete API key
- `POST /api/api-keys/:provider/validate` - Validate API key

### Health
- `GET /health` - Health check

## Environment Variables

See `.env.example` for all available configuration options.

**IMPORTANT**: Change `ENCRYPTION_KEY` to a secure random string in production!

## Security Considerations

⚠️ **This is a development implementation**. For production deployment:

1. Use HTTPS only (configure reverse proxy like nginx)
2. Implement proper user authentication (JWT, OAuth, etc.)
3. Use strong encryption for API keys (consider HashiCorp Vault or AWS Secrets Manager)
4. Set up CORS properly for your domain
5. Add rate limiting
6. Use environment variables for sensitive configuration
7. Run behind a reverse proxy
8. Consider using a more robust database for multi-user scenarios

## Directory Structure

```
apps/web-server/
├── src/
│   ├── index.ts          # Main server entry point
│   ├── routes/           # HTTP route handlers
│   │   └── apiKeys.ts    # API key routes
│   └── store/            # Data storage
│       ├── db.ts         # SQLite database
│       └── secureStorage.ts  # API key storage
├── .env.example          # Example environment config
└── package.json
```

## Using with Openwork Frontend

To run the Openwork frontend in browser mode:

1. Start the web server:
   ```bash
   cd apps/web-server
   pnpm dev
   ```

2. Start the frontend in browser mode:
   ```bash
   cd apps/desktop
   VITE_API_BASE_URL=http://localhost:3001 VITE_WS_URL=ws://localhost:3002 pnpm dev
   ```

3. Open http://localhost:5173 in your Chromium browser

The frontend will automatically detect it's not running in Electron and use HTTP/WebSocket APIs instead of IPC.

## License

MIT
