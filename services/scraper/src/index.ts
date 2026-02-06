/**
 * TERRAFORK UNIVERSAL RECIPE SCRAPER
 * ==================================
 * Green Code: Universal, resilient recipe extraction from ANY website
 * Supports: JSON-LD, Microdata, HTML patterns, and heuristic fallback
 */

// ============================================================================
// Imports
// ============================================================================

import { extractFromJsonLdUniversal } from './extractors/jsonld';
import { extractFromHtmlUniversal } from './extractors/html';
import { calculateConfidence, selectBestExtraction } from './utils/confidence';
import { parseIsoDuration, normalizeImageUrl, cleanHtml } from './utils/normalization';
import type {
  RecipeData,
  RecipeDataExtended,
  ExtractionAttempt,
  ExtractionMetadata,
  ConfidenceScore,
  ExtractionMethod,
  ExtractorConfig,
  DEFAULT_EXTRACTOR_CONFIG,
} from './types';

// ============================================================================
// Security Configuration
// ============================================================================

const ALLOWED_ORIGIN = 'https://terrafork.pages.dev';
const ALLOWED_METHODS = 'GET, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type';

// ============================================================================
// Types
// ============================================================================

export interface Env {
  // Add environment variables here
}

export interface ScrapeResponse {
  success: boolean;
  data?: RecipeDataExtended;
  error?: string;
  warnings?: string[];
  metadata?: ExtractionMetadata;
}

// ============================================================================
// Green Code: Configuration with sensible defaults
// ============================================================================

const EXTRACTOR_CONFIG = {
  maxExtractionTime: 5000,
  maxIngredients: 100,
  maxInstructionLength: 50000,
  enableHeuristics: true,
  enableMicrodata: true,
  confidenceThreshold: 25,
};

// ============================================================================
// Main Scraper Function
// ============================================================================

/**
 * Green Code: Universal recipe scraper with multi-layer extraction
 * Returns comprehensive metadata for transparency
 */
export async function scrapeRecipeUniversal(
  url: string,
  html?: string
): Promise<ScrapeResponse> {
  // If no HTML provided, fetch it
  if (!html) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TerraFork/1.0; +https://terrafork.pages.dev)',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch: ${response.status} ${response.statusText}`,
        };
      }

      html = await response.text();
    } catch (fetchError) {
      return {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
      };
    }
  }

  // Attempt 1: JSON-LD Extraction (Primary - Best Results)
  const jsonLdAttempt = extractFromJsonLdUniversal(html, url);

  // Attempt 2: HTML Structure Extraction (Fallback)
  const htmlAttempt = extractFromHtmlUniversal(html, url);

  // Attempt 3: Microdata (if enabled and needed)
  let microdataAttempt: ExtractionAttempt | null = null;
  if (EXTRACTOR_CONFIG.enableMicrodata) {
    // Microdata extraction can be added here if needed
    microdataAttempt = null;
  }

  // Collect all attempts
  const attempts: ExtractionAttempt[] = [jsonLdAttempt];
  if (htmlAttempt.confidence.overall > 0) {
    attempts.push(htmlAttempt);
  }
  if (microdataAttempt) {
    attempts.push(microdataAttempt);
  }

  // Select best extraction result
  const bestAttempt = selectBestExtraction(attempts, {
    confidenceThreshold: EXTRACTOR_CONFIG.confidenceThreshold,
  });

  if (!bestAttempt || !bestAttempt.data) {
    return {
      success: false,
      error: 'Could not extract recipe data from page',
      warnings: attempts.flatMap((a) => a.warnings),
    };
  }

  // Build final recipe data
  const recipe: RecipeData = {
    title: bestAttempt.data.title || 'Untitled Recipe',
    total_time: bestAttempt.data.total_time,
    yields: bestAttempt.data.yields,
    image: bestAttempt.data.image,
    ingredients: bestAttempt.data.ingredients || [],
    instructions: bestAttempt.data.instructions || '',
    nutrients: bestAttempt.data.nutrients,
    host: bestAttempt.data.host,
  };

  // Build metadata
  const metadata: ExtractionMetadata = {
    confidence: bestAttempt.confidence,
    extractionMethod: bestAttempt.method,
    fieldsExtracted: getExtractedFields(bestAttempt.data),
    fieldsMissing: getMissingFields(bestAttempt.data),
    warnings: bestAttempt.warnings,
    timestamp: new Date().toISOString(),
    url,
  };

  return {
    success: true,
    data: {
      ...recipe,
      _metadata: metadata,
    },
    warnings: bestAttempt.warnings,
    metadata,
  };
}

// ============================================================================
// Security: URL Validation (Enhanced SSRF Protection)
// ============================================================================

export function validateUrl(urlString: string): string {
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
      '[::1]',
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
      /^0\./,
    ];

    if (privateIpPatterns.some((pattern) => pattern.test(hostname))) {
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

// ============================================================================
// Helper Functions
// ============================================================================

function getExtractedFields(data: Partial<RecipeData>): string[] {
  const fields: string[] = [];

  if (data.title) fields.push('title');
  if (data.total_time) fields.push('total_time');
  if (data.yields) fields.push('yields');
  if (data.image) fields.push('image');
  if (data.ingredients && data.ingredients.length > 0) fields.push('ingredients');
  if (data.instructions) fields.push('instructions');
  if (data.nutrients) fields.push('nutrients');
  if (data.host) fields.push('host');

  return fields;
}

function getMissingFields(data: Partial<RecipeData>): string[] {
  const fields: string[] = [];

  if (!data.title) fields.push('title');
  if (!data.ingredients || data.ingredients.length === 0) fields.push('ingredients');
  if (!data.instructions) fields.push('instructions');

  return fields;
}

// ============================================================================
// CORS Headers
// ============================================================================

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  };
}

// ============================================================================
// Main Request Handler
// ============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(),
      });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'terrafork-universal-scraper',
          version: '2.0.0',
          features: [
            'json-ld-extraction',
            'html-structure-extraction',
            'confidence-scoring',
            '24h-caching',
          ],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Scrape endpoint
    if (url.pathname === '/scrape') {
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing url parameter' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders(),
            },
          }
        );
      }

      try {
        // Security: Validate URL before scraping
        const validatedUrl = validateUrl(targetUrl);

        // Scrape the recipe
        const result = await scrapeRecipeUniversal(validatedUrl);

        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: result.error,
              warnings: result.warnings,
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...getCorsHeaders(),
              },
            }
          );
        }

        // Green Code: Cache for 24 hours
        return new Response(JSON.stringify(result.data), {
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(),
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const statusCode =
          errorMessage.includes('Invalid') || errorMessage.includes('Cannot scrape')
            ? 400
            : 500;

        return new Response(
          JSON.stringify({
            error: 'Failed to scrape recipe',
            details: errorMessage,
          }),
          {
            status: statusCode,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders(),
            },
          }
        );
      }
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
      },
    });
  },
};
