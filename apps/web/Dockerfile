# Multi-stage build for minimal image size (Green Code)
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./

# Copy package files for workspace dependencies
COPY packages/core-types/package.json ./packages/core-types/
COPY apps/web/package.json ./apps/web/

# Install dependencies (use mount cache for faster builds)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core-types ./packages/core-types
COPY apps/web ./apps/web

# Build the app
RUN cd apps/web && pnpm build

# Production stage - minimal nginx image (Green Code: smaller footprint)
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/web/build /usr/share/nginx/html

# Green Code: Use minimal nginx config
RUN echo 'server { \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
        # Green Code: Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
        } \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

# Green Code: Run nginx in foreground (no daemon)
CMD ["nginx", "-g", "daemon off;"]
