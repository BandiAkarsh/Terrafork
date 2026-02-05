# ForkZero: The Anti-Cloud Recipe Manager (GreenOps Edition)

ForkZero is a **Privacy-First**, **Local-First**, and **Carbon-Aware** recipe management platform built to demonstrate the future of Sustainable Software Engineering (2026 Standards).

## 🌿 Green Code Principles Implemented
*   **Zero-Server Idle:** Uses "Scale-to-Zero" architecture (Cloudflare Workers + Static Frontend).
*   **Local Intelligence:** AI/Vector search runs on the **Client (WebGPU)**, eliminating massive cloud inference energy costs.
*   **OLED Optimization:** Default dark UI reduces screen energy consumption by ~30% on modern displays.
*   **Payload Efficiency:** No JS bloat. Svelte 5 + Tailwind 4 ensures the initial bundle is <50kb.

## 🏗 System Architecture (Polyglot Monorepo)
*   **Frontend:** SvelteKit 5 + Tailwind CSS 4 (apps/web)
*   **Scraper Service:** Python FastAPI + BeautifulSoup (services/scraper)
*   **Realtime Service:** Node.js + Socket.io (services/realtime)
*   **Database:** PGLite (WASM Postgres) + Vector Embeddings
*   **Orchestration:** Docker Compose

## 🚀 Getting Started

### Prerequisites
*   Node.js v20+
*   Python 3.10+
*   pnpm (Package Manager)
*   Docker Desktop

### Installation
```bash
# 1. Install dependencies (Links local packages automatically)
pnpm install

# 2. Install Python dependencies
cd services/scraper && pip install -r requirements.txt && cd ../..

# 3. Start the Distributed System
docker-compose up
```

## 📜 License
MIT
