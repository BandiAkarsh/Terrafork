# Multi-stage build for minimal image size (Green Code)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./

# Copy package files for workspace dependencies
COPY packages/core-types/package.json ./packages/core-types/
COPY apps/web/package.json ./apps/web/

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies in workspace root
RUN pnpm install

# Copy source code
COPY packages/core-types ./packages/core-types
COPY apps/web ./apps/web

# Copy node_modules to apps/web so build can find dependencies
RUN cp -r /app/node_modules /app/apps/node_modules

# Build the web app from correct directory
WORKDIR /app/apps/web
RUN pnpm build

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
        # Green Code: Cache static assets \
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
        } \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

# Green Code: Run nginx in foreground (no daemon)
CMD ["nginx", "-g", "daemon off;"]
