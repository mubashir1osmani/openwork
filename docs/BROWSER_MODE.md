# Running Openwork in Chromium Browsers

This guide explains how to run Openwork as a web application in Chromium-based browsers (Chrome, Edge, Brave, etc.) instead of the Electron desktop app.

## Architecture

Openwork now supports two modes:

1. **Electron Mode** (Default): Desktop app with IPC communication
2. **Browser Mode** (New): Web app with HTTP/WebSocket communication

### How It Works

- **Electron Mode**: Renderer ↔️ IPC ↔️ Main Process ↔️ Native APIs
- **Browser Mode**: Renderer ↔️ HTTP/WS ↔️ Web Server ↔️ Native APIs

The frontend automatically detects which mode it's running in and uses the appropriate API layer.

## Setup

### 1. Start the Web Server (Backend)

```bash
cd apps/web-server

# Copy environment config
cp .env.example .env

# IMPORTANT: Edit .env and change ENCRYPTION_KEY to a secure random string
nano .env

# Install dependencies (if not already done)
pnpm install

# Start the server
pnpm dev
```

The web server runs on:
- HTTP API: http://localhost:3001
- WebSocket: ws://localhost:3002

### 2. Configure the Frontend for Browser Mode

```bash
cd apps/desktop

# Create .env file with browser mode config
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
EOF
```

### 3. Start the Frontend

```bash
# From apps/desktop directory
pnpm dev
```

This starts Vite in development mode. **Don't use `pnpm dev` from the root** as it will try to start Electron.

### 4. Open in Browser

Navigate to http://localhost:5173 in your Chromium browser (Chrome, Edge, Brave, etc.)

The app will automatically detect it's not running in Electron and use the web server APIs.

## Features Status

### ✅ Working in Browser Mode

- Environment detection (automatically uses HTTP/WS instead of IPC)
- API key storage (encrypted in SQLite on server)
- Onboarding flow (uses localStorage)
- App version and platform info
- Opening external links

### ⚠️ Partially Implemented

- Task execution (endpoints exist but OpenCode CLI integration not complete)
- Real-time WebSocket events (infrastructure ready, needs testing)

### ❌ Not Yet Implemented in Browser Mode

- Task execution with OpenCode CLI
- File permission requests
- MCP server integration
- Provider-specific configurations (Ollama, Azure, Bedrock, etc.)
- Debug logging
- Session resumption

These features currently return "Not implemented in browser mode" errors.

## Development Workflow

### Terminal 1: Web Server
```bash
cd apps/web-server
pnpm dev
```

### Terminal 2: Frontend
```bash
cd apps/desktop
VITE_API_BASE_URL=http://localhost:3001 VITE_WS_URL=ws://localhost:3002 pnpm dev
```

### Terminal 3: Watch for Changes
```bash
# From repository root
pnpm typecheck  # Check types across all packages
```

## Production Deployment

### Build the Web Server

```bash
cd apps/web-server
pnpm build
pnpm start  # Or use a process manager like PM2
```

### Build the Frontend for Browser

```bash
cd apps/desktop

# Build with browser mode environment variables
VITE_API_BASE_URL=https://api.yourdo main.com \
VITE_WS_URL=wss://ws.yourdomain.com \
pnpm build

# The output is in apps/desktop/dist/
# Serve this directory with any static file server (nginx, Apache, etc.)
```

### Deployment Checklist

- [ ] Use HTTPS/WSS (not HTTP/WS) in production
- [ ] Set up proper CORS headers for your domain
- [ ] Change `ENCRYPTION_KEY` to a secure random string (32+ characters)
- [ ] Use environment variables for sensitive configuration
- [ ] Set up authentication (the current implementation has no auth!)
- [ ] Configure reverse proxy (nginx/Apache) for the web server
- [ ] Add rate limiting to prevent abuse
- [ ] Use a process manager (PM2, systemd) for the web server
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure firewall rules

## Security Considerations

⚠️ **IMPORTANT**: The current browser implementation is for development/demo purposes only!

For production deployment, you MUST implement:

1. **User Authentication**: Add JWT/OAuth/session-based auth
2. **API Keys per User**: Store API keys per authenticated user, not globally
3. **HTTPS Only**: Never deploy over HTTP
4. **Strong Encryption**: Use proper encryption for API keys (not the simple XOR in demo)
5. **CORS Configuration**: Limit allowed origins to your domain
6. **Rate Limiting**: Prevent API abuse
7. **Input Validation**: Validate all user inputs server-side
8. **CSP Headers**: Configure Content Security Policy
9. **Secure Cookies**: Use httpOnly, secure, sameSite flags

Consider using established solutions:
- **Authentication**: Auth0, Clerk, or Supabase
- **API Key Storage**: HashiCorp Vault, AWS Secrets Manager
- **Deployment**: Vercel, Netlify, Railway, Fly.io

## Troubleshooting

### "Accomplish API not available" Error

This means the frontend is trying to use Electron APIs but can't find them.

**Solution**: Make sure you're accessing the app via a browser (http://localhost:5173) and not opening the file directly.

### CORS Errors

**Symptom**: Console shows "blocked by CORS policy" errors

**Solution**: 
1. Check that `ALLOWED_ORIGINS` in web-server/.env includes your frontend URL
2. Restart the web server after changing .env

### WebSocket Connection Failed

**Symptom**: "WebSocket disconnected, reconnecting..." in console

**Solution**:
1. Verify web server is running on port 3002
2. Check firewall isn't blocking the WebSocket port
3. In production, use WSS (not WS) and ensure proxy supports WebSocket

### API Key Storage Errors

**Symptom**: "Failed to store API key" errors

**Solution**:
1. Check web-server/data directory exists and is writable
2. Check web server logs for SQLite errors
3. Try deleting web-server/data/*.db and restarting

## Differences from Electron Mode

| Feature | Electron Mode | Browser Mode |
|---------|---------------|---------------|
| Storage | OS Keychain (keytar) | SQLite with encryption |
| IPC | Electron IPC | HTTP/REST + WebSocket |
| File Access | Direct (node-pty, fs) | Via server API only |
| Security | OS-level isolation | Requires auth layer |
| Offline | Works offline | Requires server connection |
| Installation | DMG/installer | Just open URL |

## Next Steps

To complete browser mode, we need to:

1. Implement task execution endpoints on web server
2. Integrate OpenCode CLI execution server-side
3. Add WebSocket message handlers for real-time task updates
4. Implement user authentication
5. Add provider-specific API integrations (Ollama, etc.)
6. Comprehensive testing in multiple browsers

## Questions?

- Check the web server README: `apps/web-server/README.md`
- Review the architecture docs: `CLAUDE.md`
- Open an issue on GitHub

## License

MIT - Same as the main project
