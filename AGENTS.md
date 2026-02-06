# AGENTS.md - Operational Guide for AI Agents

This repository hosts **ForkZero**, a Green Code-compliant, polyglot monorepo application. 
Your primary directive is to maintain the project's **Zero Cost**, **Local-First**, and **Sustainability** goals.

## 🏗 Project Structure & Tech Stack

This is a **pnpm workspace** monorepo with the following components:

- **Root:** Orchestration via `pnpm` and `docker-compose`.
- **`apps/web`:** Frontend Application.
  - **Framework:** SvelteKit (Svelte 5 Runes).
  - **Styling:** Tailwind CSS v4 (No config, just works).
  - **Build:** Vite + adapter-static.
- **`services/scraper`:** Microservice #1.
  - **Language:** Python 3.10+.
  - **Framework:** FastAPI.
  - **Library:** BeautifulSoup4, recipe-scrapers.
- **`services/realtime`:** Microservice #2.
  - **Language:** Node.js (TypeScript).
  - **Framework:** Express + Socket.io.
- **`packages/core-types`:** Shared TypeScript definitions.

## 🛠 Operational Commands

### Development
- **Start All Services (Docker):** `docker-compose up`
- **Start Web + Realtime (Local):** `pnpm dev` (Run from root)
- **Start Scraper (Local):** `cd services/scraper && python3 main.py` (or `uvicorn main:app --reload`)

### Installation
- **Node.js Dependencies:** `pnpm install` (Root handles workspace linking).
- **Python Dependencies:** `pip install -r services/scraper/requirements.txt`.

### Verification (Build/Lint/Test)
- **Type Check (Web):** `cd apps/web && pnpm check`
- **Lint:** `pnpm lint` (if configured) or per-project linting.
- **Build All:** `pnpm build` (Root).

## 🌿 Green Code Directives (CRITICAL)
Every code change must adhere to these sustainability principles:
1.  **Zero Idle Compute:** Prefer event-driven (Serverless/Edge) patterns over always-on servers where possible.
2.  **Payload Efficiency:** Keep JS bundles small. Use Svelte 5's fine-grained reactivity.
3.  **OLED Optimization:** Default UI should be `dark` mode (Zinc-950 background) to save battery on OLED screens.
4.  **Local-First:** Prioritize `IndexedDB` (RxDB/PGLite) and `WebGPU` over network calls.

## 📝 Coding Standards & Style

### General
- **Pathing:** ALWAYS use **absolute paths** when reading/writing files (e.g., `/home/akarsh/project_2/...`).
- **Imports:** Use specific imports. Avoid `import *`.

### TypeScript (Web & Realtime)
- **Strictness:** `strict: true` is enabled. No `any`.
- **Interfaces:** Use `interface` for object definitions (e.g., `packages/core-types`).
- **Naming:** CamelCase for variables/functions, PascalCase for components/interfaces.

### Svelte 5 (The Standard)
- **Reactivity:** Use **Runes** exclusively.
  - ✅ `let count = $state(0);`
  - ❌ `export let count;` (Legacy)
  - ❌ `$: double = count * 2;` (Legacy) -> ✅ `let double = $derived(count * 2);`
- **Components:** Single File Components (`.svelte`). Keep logic in `<script>` tag.

### Python (Scraper)
- **Style:** PEP 8 compliance.
- **Typing:** **Required** for all function arguments and returns.
  ```python
  def get_recipe(url: str) -> dict[str, Any]: ...
  ```
- **Error Handling:** Use `try/except` blocks and return HTTP exceptions via FastAPI.

### Tailwind CSS
- **Usage:** Utility-first. Do not write custom CSS unless absolutely necessary.
- **Config:** Tailwind 4 uses CSS-based config (`@theme`). Check `app.css` before adding config files.

## 🧪 Testing Guidelines
- **Unit Tests:** (Future) Vitest for JS, Pytest for Python.
- **Manual Verification:** Ensure `docker-compose up` builds cleanly after architectural changes.

## 🔄 Common Refactoring Patterns (Svelte 5)

When migrating or writing new components, strictly follow these patterns:

**1. State Management**
*   **Legacy:** `let count;` / `export let count;`
*   **Modern:** `let count = $state(0);` / `let { count }: { count: number } = $props();`

**2. Derived State**
*   **Legacy:** `$: double = count * 2;`
*   **Modern:** `let double = $derived(count * 2);`

**3. Side Effects**
*   **Legacy:** `$: { if (count > 10) alert('High'); }`
*   **Modern:** 
    ```typescript
    $effect(() => {
        if (count > 10) alert('High');
    });
    ```

**4. Event Handling**
*   **Legacy:** `on:click={handleClick}`
*   **Modern:** `onclick={handleClick}` (Standard HTML attributes)

## 🤖 Agent Workflow
1.  **Plan:** Analyze the `pnpm-workspace.yaml` and `docker-compose.yml` before adding services.
2.  **Edit:** When modifying `apps/web`, ensure you are using Svelte 5 syntax.
3.  **Verify:** Run `pnpm check` in the relevant package after TypeScript changes.
4.  **Refactor:** Proactively identify "Legacy Svelte" patterns and convert them to Runes.
