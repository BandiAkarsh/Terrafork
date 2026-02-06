// TERRAFORK RECIPE SCRAPER
// ======================
// Current Implementation: TypeScript (Cloudflare Workers compatible)
// Future Implementation: Python (when Cloudflare Workers Python supports packages)

// Security Configuration
const ALLOWED_ORIGIN = 'https://terrafork.pages.dev';
const ALLOWED_METHODS = 'GET, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type';

export interface Env {
  // Add any environment variables here
}

export interface RecipeData {
  title: string;
  total_time?: string;
  yields?: string;
  image?: string;
  ingredients: string[];
  instructions: string;
  nutrients?: Record<string, string>;
  host?: string;
}

// Security: Validate URL to prevent SSRF attacks
function validateUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    
    // Block dangerous protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(url.protocol)) {
      throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
    }
    
    // Block private/internal IP addresses
    const hostname = url.hostname.toLowerCase();
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '[::1]'
    ];
    
    if (blockedHosts.includes(hostname)) {
      throw new Error('Cannot scrape local/internal addresses');
    }
    
    // Block private IP ranges
    const privateIpPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^127\./,
      /^0\./
    ];
    
    if (privateIpPatterns.some(pattern => pattern.test(hostname))) {
      throw new Error('Cannot scrape private IP ranges');
    }
    
    return urlString;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid URL format');
  }
}

// Green Code: Parse recipe using lightweight cheerio
async function scrapeRecipe(url: string): Promise<RecipeData> {
  // Fetch the recipe page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TerraFork/1.0; +https://terrafork.pages.dev)'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  
  // Try to extract JSON-LD structured data first (most reliable)
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  
  if (jsonLdMatch) {
    for (const scriptTag of jsonLdMatch) {
      try {
        const jsonContent = scriptTag.replace(/<script type="application\/ld\+json">|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        
        // Handle both single object and array of objects
        const recipes = Array.isArray(data) ? data : [data];
        
        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            return extractFromJsonLd(item, url);
          }
        }
      } catch (e) {
        // Continue to next script tag
        continue;
      }
    }
  }
  
  // Fallback: Basic HTML parsing with regex
  return extractFromHtml(html, url);
}

function extractFromJsonLd(data: any, url: string): RecipeData {
  const host = new URL(url).hostname.replace('www.', '');
  
  return {
    title: data.name || 'Untitled Recipe',
    total_time: data.totalTime || data.cookTime || undefined,
    yields: data.recipeYield || data.servingSize || undefined,
    image: typeof data.image === 'string' ? data.image : data.image?.url || undefined,
    ingredients: Array.isArray(data.recipeIngredient) ? data.recipeIngredient : [],
    instructions: extractInstructions(data.recipeInstructions),
    nutrients: data.nutrition || undefined,
    host: host
  };
}

function extractInstructions(instructions: any): string {
  if (!instructions) return '';
  
  if (typeof instructions === 'string') {
    return instructions;
  }
  
  if (Array.isArray(instructions)) {
    return instructions.map((step: any, index: number) => {
      if (typeof step === 'string') return `${index + 1}. ${step}`;
      if (step.text) return `${index + 1}. ${step.text}`;
      return '';
    }).filter(Boolean).join('\n\n');
  }
  
  return '';
}

function extractFromHtml(html: string, url: string): RecipeData {
  const host = new URL(url).hostname.replace('www.', '');
  
  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  const title = h1Match ? cleanHtml(h1Match[1]) : (titleMatch ? cleanHtml(titleMatch[1]) : 'Untitled Recipe');
  
  // Try to find ingredients (common patterns)
  const ingredientPatterns = [
    /(?:ingredients?:?)\s*<\/h[1-6]>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i,
    /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>(.*?)<\/li>/gi
  ];
  
  let ingredients: string[] = [];
  for (const pattern of ingredientPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        ingredients.push(cleanHtml(match[1]));
      }
    }
    if (ingredients.length > 0) break;
  }
  
  // Try to find instructions
  const instructionMatch = html.match(/(?:instructions|directions|steps|method):?\s*<\/h[1-6]>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i);
  let instructions = '';
  if (instructionMatch) {
    const steps = instructionMatch[1].match(/<li[^>]*>(.*?)<\/li>/gi);
    if (steps) {
      instructions = steps.map((step, index) => `${index + 1}. ${cleanHtml(step)}`).join('\n\n');
    }
  }
  
  return {
    title,
    ingredients,
    instructions,
    host
  };
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Helper function for CORS headers
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS
  };
}

// Main request handler
export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }
    
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'terrafork-scraper-ts',
        note: 'TypeScript implementation - Python version available in future'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders()
        }
      });
    }
    
    // Scrape endpoint
    if (url.pathname === '/scrape') {
      const targetUrl = url.searchParams.get('url');
      
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        });
      }
      
      try {
        // Security: Validate URL before scraping
        const validatedUrl = validateUrl(targetUrl);
        const recipe = await scrapeRecipe(validatedUrl);
        
        // Green Code: Cache for 24 hours
        return new Response(JSON.stringify(recipe), {
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(),
            'Cache-Control': 'public, max-age=86400, s-maxage=86400'
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const statusCode = errorMessage.includes('Invalid') || errorMessage.includes('Cannot scrape') ? 400 : 500;
        
        return new Response(JSON.stringify({ 
          error: 'Failed to scrape recipe',
          details: errorMessage
        }), {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        });
      }
    }
    
    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders()
      }
    });
  }
};
