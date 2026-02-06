# TypeScript Cloudflare Workers Scraper
# Green Code: Minimal container with only what's needed

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --prefer-offline --no-audit

# Copy application code
COPY wrangler.toml .
COPY src/ ./src/

# Expose wrangler dev port (default 8788)
EXPOSE 8788

# Green Code: Run wrangler dev for local development
# In production, deploy directly to Cloudflare Workers
CMD ["pnpm", "run", "dev"]
