# Local Development Guide

This guide covers how to run TerraFork locally for development and testing.

## Prerequisites

- Node.js v20+
- pnpm: `npm install -g pnpm`
- Docker & Docker Compose (optional, for containerized development)

## Quick Start (Recommended)

### Option 1: Run Services Separately (Recommended for Development)

This is the easiest way to run the project locally with hot reloading.

**Terminal 1 - Start the Scraper Service:**
```bash
cd services/scraper
pnpm install
pnpm run dev
```

**Terminal 2 - Start the Web Application:**
```bash
cd apps/web
pnpm install
pnpm run dev
```

**Access Points:**
- **Web App:** http://localhost:5173
- **Scraper API:** http://localhost:8788

### Option 2: Docker Compose

```bash
# Build and start all services
docker compose up

# Access:
# - Web: http://localhost:5173
# - Scraper: http://localhost:8788
```

## Testing with Playwright

### Run Existing E2E Tests

```bash
cd apps/web

# Install Playwright browsers
npx playwright install

# Run tests
npx playwright test
```

### Test with a Specific Recipe URL

1. Start both services (Option 1 or 2)
2. Open http://localhost:5173
3. Paste a recipe URL (e.g., `https://www.allrecipes.com/wisconsin-old-fashioned-recipe-11894926`)
4. Click "Fork"
5. Verify the recipe data is extracted correctly

## Development Commands

### Web Application (apps/web)

```bash
# Start dev server
pnpm run dev

# Type checking
pnpm run check

# Linting
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format

# Run unit tests
pnpm run test

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Scraper Service (services/scraper)

```bash
# Start dev server (wrangler)
pnpm run dev

# Type checking
pnpm run check

# Linting
pnpm run lint

# Deploy to Cloudflare Workers
pnpm run deploy
```

## Environment Variables

### Web App (.env)

Copy `apps/web/.env.example` to `apps/web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8788  # Local scraper
# VITE_API_BASE_URL=https://terrafork-scraper.workers.dev  # Production
```

### Scraper Service

Copy `services/scraper/.env.example` to `services/scraper/.env`:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

For local development, wrangler uses `.dev.vars` for secrets:

```bash
# services/scraper/.dev.vars
CLOUDFLARE_API_TOKEN=your_local_dev_token
```

## Troubleshooting

### Port 8000 vs 8788

The scraper service runs on port **8788** (wrangler default), not 8000. Make sure:
- Your code references `localhost:8788` for local development
- Docker Compose is configured for port 8788

### Playwright Tests Failing

1. Make sure both services are running
2. Install Playwright browsers: `npx playwright install`
3. Check test configuration in `apps/web/playwright.config.ts`

### CORS Errors

If you see CORS errors:
1. Verify the scraper is running on http://localhost:8788
2. Check the `ALLOWED_ORIGIN` in `services/scraper/src/index.ts`
3. The web app should be served from http://localhost:5173

### Docker Issues

If Docker Compose fails:
1. Remove the obsolete `version` field from docker-compose.yml
2. Ensure Docker daemon is running
3. Check container logs: `docker compose logs`

## Supported Recipe URLs

The scraper works best with:
- **JSON-LD sites:** AllRecipes, Food Network, Serious Eats, Epicurious
- **Standard HTML:** Sites with proper `<ul>/<li>` ingredient structure

See [API.md](API.md) for complete documentation.

## Code Quality

### Running All Checks

```bash
# Type check
cd apps/web && pnpm run check
cd services/scraper && pnpm run check

# Lint
pnpm run lint

# Test
pnpm run test
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:
- ESLint auto-fixes
- Prettier formatting
- Unit tests run before commit
