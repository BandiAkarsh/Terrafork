var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ZoOGGP/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.ts
var ALLOWED_ORIGIN = "https://terrafork.pages.dev";
var ALLOWED_METHODS = "GET, OPTIONS";
var ALLOWED_HEADERS = "Content-Type";
function validateUrl(urlString) {
  try {
    const url = new URL(urlString);
    const allowedProtocols = ["http:", "https:"];
    if (!allowedProtocols.includes(url.protocol)) {
      throw new Error("Invalid protocol. Only HTTP and HTTPS are allowed.");
    }
    const hostname = url.hostname.toLowerCase();
    const blockedHosts = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "[::1]"
    ];
    if (blockedHosts.includes(hostname)) {
      throw new Error("Cannot scrape local/internal addresses");
    }
    const privateIpPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^127\./,
      /^0\./
    ];
    if (privateIpPatterns.some((pattern) => pattern.test(hostname))) {
      throw new Error("Cannot scrape private IP ranges");
    }
    return urlString;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Invalid URL format");
  }
}
__name(validateUrl, "validateUrl");
async function scrapeRecipe(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TerraFork/1.0; +https://terrafork.pages.dev)"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  let bestRecipe = null;
  if (jsonLdMatch) {
    for (const scriptTag of jsonLdMatch) {
      try {
        const jsonContent = scriptTag.replace(/<script type="application\/ld\+json">|<\/script>/gi, "");
        const data = JSON.parse(jsonContent);
        const recipes = Array.isArray(data) ? data : [data];
        for (const item of recipes) {
          if (item["@type"] === "Recipe" || Array.isArray(item["@type"]) && item["@type"].includes("Recipe")) {
            const jsonRecipe = extractFromJsonLd(item, url);
            if (jsonRecipe.ingredients.length > 0 && jsonRecipe.instructions) {
              return jsonRecipe;
            }
            if (!bestRecipe || jsonRecipe.ingredients.length > bestRecipe.ingredients.length) {
              bestRecipe = jsonRecipe;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  }
  const htmlRecipe = extractFromHtml(html, url);
  if (bestRecipe) {
    return {
      ...bestRecipe,
      // Prefer JSON-LD ingredients if available, otherwise HTML
      ingredients: bestRecipe.ingredients.length > 0 ? bestRecipe.ingredients : htmlRecipe.ingredients,
      // Prefer JSON-LD instructions if available, otherwise HTML
      instructions: bestRecipe.instructions || htmlRecipe.instructions
    };
  }
  return htmlRecipe;
}
__name(scrapeRecipe, "scrapeRecipe");
function extractFromJsonLd(data, url) {
  const host = new URL(url).hostname.replace("www.", "");
  const rawIngredients = data.recipeIngredient;
  const ingredients = Array.isArray(rawIngredients) ? rawIngredients : typeof rawIngredients === "string" ? [rawIngredients] : [];
  return {
    title: data.name || "Untitled Recipe",
    total_time: data.totalTime || data.cookTime || void 0,
    yields: data.recipeYield || data.servingSize || void 0,
    image: typeof data.image === "string" ? data.image : data.image?.url || void 0,
    ingredients,
    instructions: extractInstructions(data.recipeInstructions),
    nutrients: data.nutrition || void 0,
    host
  };
}
__name(extractFromJsonLd, "extractFromJsonLd");
function extractInstructions(instructions) {
  if (!instructions) return "";
  if (typeof instructions === "string") {
    return instructions;
  }
  if (Array.isArray(instructions)) {
    return instructions.map((step, index) => {
      if (typeof step === "string") return `${index + 1}. ${step}`;
      if (step.itemListElement) {
        const sectionTitle = step.name ? `
### ${step.name}
` : "";
        return sectionTitle + extractInstructions(step.itemListElement);
      }
      const text = step.text || step.description || step.name;
      if (text) return `${index + 1}. ${text}`;
      return "";
    }).filter(Boolean).join("\n\n");
  }
  if (instructions.itemListElement) {
    return extractInstructions(instructions.itemListElement);
  }
  return "";
}
__name(extractInstructions, "extractInstructions");
function extractFromHtml(html, url) {
  const host = new URL(url).hostname.replace("www.", "");
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  const title = h1Match ? cleanHtml(h1Match[1]) : titleMatch ? cleanHtml(titleMatch[1]) : "Untitled Recipe";
  let ingredients = [];
  const ingredientBlockPatterns = [
    /(?:ingredients?:?)\s*<\/h[1-6]>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i
  ];
  for (const pattern of ingredientBlockPatterns) {
    const listMatch = html.match(pattern);
    if (listMatch && listMatch[1]) {
      const items = listMatch[1].match(/<li[^>]*>(.*?)<\/li>/gi);
      if (items) {
        ingredients = items.map((item) => cleanHtml(item));
        if (ingredients.length > 0) break;
      }
    }
  }
  if (ingredients.length === 0) {
    const ingredientItemPatterns = [
      /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>(.*?)<\/li>/gi
    ];
    for (const pattern of ingredientItemPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          ingredients.push(cleanHtml(match[1]));
        }
      }
      if (ingredients.length > 0) break;
    }
  }
  const instructionMatch = html.match(/(?:instructions|directions|steps|method):?\s*<\/h[1-6]>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i);
  let instructions = "";
  if (instructionMatch) {
    const steps = instructionMatch[1].match(/<li[^>]*>(.*?)<\/li>/gi);
    if (steps) {
      instructions = steps.map((step, index) => `${index + 1}. ${cleanHtml(step)}`).join("\n\n");
    }
  }
  return {
    title,
    ingredients,
    instructions,
    host
  };
}
__name(extractFromHtml, "extractFromHtml");
function cleanHtml(html) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}
__name(cleanHtml, "cleanHtml");
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS
  };
}
__name(getCorsHeaders, "getCorsHeaders");
var src_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "terrafork-scraper-ts",
        note: "TypeScript implementation - Python version available in future"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders()
        }
      });
    }
    if (url.pathname === "/scrape") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: "Missing url parameter" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders()
          }
        });
      }
      try {
        const validatedUrl = validateUrl(targetUrl);
        const recipe = await scrapeRecipe(validatedUrl);
        return new Response(JSON.stringify(recipe), {
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(),
            "Cache-Control": "public, max-age=86400, s-maxage=86400"
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const statusCode = errorMessage.includes("Invalid") || errorMessage.includes("Cannot scrape") ? 400 : 500;
        return new Response(JSON.stringify({
          error: "Failed to scrape recipe",
          details: errorMessage
        }), {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders()
          }
        });
      }
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders()
      }
    });
  }
};

// ../../node_modules/.pnpm/wrangler@4.63.0_@cloudflare+workers-types@4.20260205.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/.pnpm/wrangler@4.63.0_@cloudflare+workers-types@4.20260205.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ZoOGGP/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/.pnpm/wrangler@4.63.0_@cloudflare+workers-types@4.20260205.0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ZoOGGP/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
