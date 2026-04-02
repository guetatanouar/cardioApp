# Environment Configuration Guide

This document explains how to configure the CardioManager application for different environments.

## Quick Setup

### Option 1: Automated Setup (Recommended)

**On macOS/Linux:**
```bash
bash setup-env.sh
```

**On Windows:**
```bash
setup-env.bat
```

This will copy `.env.example` files to the appropriate locations and provide guidance.

### Option 2: Manual Setup

1. **API Configuration** (`apps/api/.env`)
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Then edit `apps/api/.env` with your settings.

2. **Web Configuration** (`apps/web/.env.local`)
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   Then edit `apps/web/.env.local` with your settings (optional, defaults work locally).

## Environment Variables

### API Environment Variables (`apps/api/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | No | Environment mode | `development`, `production` |
| `PORT` | No | Server port | `4000` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PG_ADMIN_DB` | No | PostgreSQL admin database | `postgres` |
| `JWT_SECRET` | **Yes** | JWT signing secret (min 32 chars for production) | `your-super-secret-key-...` |
| `JWT_EXPIRES_IN` | No | JWT token expiration | `7d`, `24h` |
| `CORS_ORIGIN` | No | Allowed CORS origins (comma-separated) | `http://localhost:3000,https://example.com` |
| `MAX_FILE_SIZE` | No | Max upload size in bytes | `10485760` (10MB) |
| `UPLOAD_DIR` | No | Directory for file uploads | `uploads` |

### Web Environment Variables (`apps/web/.env.local`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | No | Backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_APP_NAME` | No | Application display name | `CardioManager` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | No | App description | `Gestion de cabinet cardiologique` |
| `NEXT_PUBLIC_APP_VERSION` | No | App version | `1.0.0` |
| `NEXT_PUBLIC_DEFAULT_THEME` | No | Default UI theme | `light`, `dark` |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | No | Default language | `fr`, `en`, `ar` |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | No | Enable demo mode | `true`, `false` |
| `NEXT_PUBLIC_ENABLE_OFFLINE_MODE` | No | Enable offline mode fallback | `true`, `false` |

## Database Connection String

### Format
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

### Example
```
postgresql://postgres:mypassword@localhost:5432/cardiomanager
```

### Special Characters in Passwords

If your password contains special characters (e.g., `@`, `#`, `$`, `%`), URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `:` | `%3A` |

**Example:** Password `P@ss#word` becomes `P%40ss%23word`

```
postgresql://postgres:P%40ss%23word@localhost:5432/cardiomanager
```

## Configuration Priority

The application loads configuration in this order (first match wins):

1. **Environment Variables** - Set directly in the shell/system
2. **`.env` file** - Root level env file
3. **`.env.local`** - Local overrides (ignored by git)
4. **`.env.example`** - Default template (checked into git)
5. **Hard-coded defaults** - Fallback values in code

## Security Considerations

### Development
- Use simple, short secrets
- Database can be local/unprotected
- CORS can be permissive

### Production
- **JWT_SECRET**: Use a strong, random 32+ character string
  ```bash
  # Generate a strong secret
  openssl rand -base64 32
  ```
- **DATABASE_URL**: Use a secure, authenticated database
- **CORS_ORIGIN**: Restrict to your front-end domain only
- **NODE_ENV**: Set to `production`

## Troubleshooting

### "Missing DATABASE_URL"
- Ensure `apps/api/.env` has `DATABASE_URL` set
- Check that PostgreSQL is running
- Verify the connection string format

### "JWT_SECRET must be set to a strong secret"
- The default placeholder value cannot be used in production
- Generate a strong secret: `openssl rand -base64 32`
- Update `JWT_SECRET` in `apps/api/.env`

### "API offline"
- Ensure backend is running: `npm run dev`
- Check `NEXT_PUBLIC_API_BASE` points to correct URL
- Verify CORS is configured correctly

### Configuration not loading
- Restart the development server
- Check file permissions on `.env` files
- Ensure no syntax errors in `.env` (valid KEY=VALUE format)

## Configuration Access in Code

### Server-side (Node.js/API)
```typescript
import { config } from "@/config";

console.log(config.server.port);
console.log(config.database.url);
```

### Client-side (React/Web)
Variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser:
```typescript
import { config } from "@/lib/config";

console.log(config.api.baseUrl);
```

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Express Configuration](https://expressjs.com/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
