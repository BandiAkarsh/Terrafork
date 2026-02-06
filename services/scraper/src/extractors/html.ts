/**
 * Green Code: HTML Structure Extractor
 * ===================================
 * Fallback extractor for sites without JSON-LD.
 * Uses semantic HTML patterns to extract recipe data.
 */

import type {
  RecipeData,
  ExtractionAttempt,
  HtmlExtractionConfig,
} from '../types';
import { calculateConfidence, generateWarnings } from '../utils/confidence';
import { cleanHtml } from '../utils/normalization';

/**
 * Green Code: HTML Extractor with fallback patterns
 * Handles complex HTML layouts using semantic patterns
 */
export function extractFromHtmlUniversal(
  html: string,
  url: string,
  config?: Partial<HtmlExtractionConfig>
): ExtractionAttempt {
  const warnings: string[] = [];
  const fullConfig = getDefaultConfig(config);

  // Extract all possible data
  const title = extractTitle(html, fullConfig);
  const ingredients = extractIngredients(html, fullConfig);
  const instructions = extractInstructions(html, fullConfig);
  const total_time = extractTime(html, fullConfig);
  const yields = extractYield(html, fullConfig);
  const image = extractImage(html);

  const host = extractHostname(url);

  const result: Partial<RecipeData> = {
    title,
    ingredients,
    instructions,
    total_time,
    yields,
    image,
    host,
  };

  const confidence = calculateConfidence(result);
  warnings.push(...generateWarnings(result, confidence));

  return {
    method: 'html',
    confidence,
    data: result,
    warnings,
  };
}

// ============================================================================
// Configuration
// ============================================================================

function getDefaultConfig(config?: Partial<HtmlExtractionConfig>): HtmlExtractionConfig {
  return {
    ingredientSelectors: [
      '[class*="ingredient"]',
      '[id*="ingredient"]',
      '.ingredients',
      '#ingredients',
      'ul.ingredients',
      '.recipe-ingredients',
      '[itemprop="recipeIngredient"]',
    ],
    instructionSelectors: [
      '[class*="instruction"]',
      '[id*="instruction"]',
      '.instructions',
      '.directions',
      '.steps',
      '.method',
      '[itemprop="recipeInstructions"]',
      '.recipe-instructions',
      '.cooking-instructions',
    ],
    timeSelectors: [
      '[class*="time"]',
      '[class*="duration"]',
      '.prep-time',
      '.cook-time',
      '.total-time',
      '[itemprop="totalTime"]',
    ],
    yieldSelectors: [
      '[class*="yield"]',
      '[class*="serving"]',
      '.servings',
      '.yield',
      '.recipe-yield',
      '[itemprop="recipeYield"]',
    ],
    titleSelectors: [
      'h1',
      '[class*="title"]',
      '[class*="recipe-name"]',
      '[itemprop="name"]',
      '.recipe-title',
      '.entry-title',
    ],
    ...config,
  };
}

// ============================================================================
// Title Extraction
// ============================================================================

function extractTitle(html: string, config: HtmlExtractionConfig): string | undefined {
  // Try structured selectors first
  for (const selector of config.titleSelectors) {
    const pattern = createSelectorPattern(selector);
    const match = html.match(pattern);
    if (match && match[1]) {
      const title = cleanHtml(match[1]);
      if (title.length > 3) {
        return title;
      }
    }
  }

  // Fallback to standard patterns
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    const title = cleanHtml(h1Match[1]);
    if (title.length > 3) {
      return title;
    }
  }

  const titleTag = html.match(/<title>([^<]+)<\/title>/i);
  if (titleTag) {
    return cleanHtml(titleTag[1]);
  }

  return undefined;
}

// ============================================================================
// Ingredients Extraction
// ============================================================================

function extractIngredients(html: string, config: HtmlExtractionConfig): string[] {
  const ingredients: string[] = [];

  // Try structured selectors first
  for (const selector of config.ingredientSelectors) {
    const pattern = createSelectorPattern(selector);
    const sectionMatch = html.match(pattern);
    
    if (sectionMatch && sectionMatch[1]) {
      const listItems = extractListItems(sectionMatch[1]);
      if (listItems.length > 0) {
        return listItems;
      }
    }
  }

  // Try common ingredient list patterns
  const commonPatterns = [
    /(?:ingredients?)[:\s]*<\/h[1-6][^>]*>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i,
    /(?:ingredients?)[:\s]*<\/h[1-6][^>]*>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i,
  ];

  for (const pattern of commonPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const listItems = extractListItems(match[1]);
      if (listItems.length > 0) {
        return listItems;
      }
    }
  }

  // Try finding list items with ingredient class
  const classPattern = /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/li>/gi;
  const matches = html.matchAll(classPattern);
  for (const match of matches) {
    if (match[1]) {
      const ingredient = cleanHtml(match[1]);
      if (ingredient.length > 0) {
        ingredients.push(ingredient);
      }
    }
  }

  if (ingredients.length > 0) {
    return ingredients;
  }

  // Last resort: find any list that looks like ingredients
  const genericLists = extractGenericLists(html);
  return genericLists;
}

function extractListItems(html: string): string[] {
  const items: string[] = [];

  // Match <li> items
  const liPattern = /<li[^>]*>([^<]+)<\/li>/gi;
  const matches = html.matchAll(liPattern);

  for (const match of matches) {
    if (match[1]) {
      const item = cleanHtml(match[1]);
      if (item.length > 0) {
        items.push(item);
      }
    }
  }

  // Also check for <li> with nested content
  const nestedPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const nestedMatches = html.matchAll(nestedPattern);

  for (const match of nestedMatches) {
    if (match[1]) {
      const item = cleanHtml(match[1]);
      if (item.length > 0 && !items.includes(item)) {
        items.push(item);
      }
    }
  }

  return items;
}

function extractGenericLists(html: string): string[] {
  const items: string[] = [];

  // Find <ul> or <ol> with reasonable number of items (3-20)
  const listPattern = /<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi;
  const lists = html.matchAll(listPattern);

  for (const listMatch of lists) {
    if (listMatch[1]) {
      const listItems = extractListItems(listMatch[1]);
      if (listItems.length >= 3 && listItems.length <= 20) {
        return listItems;
      }
    }
  }

  return items;
}

// ============================================================================
// Instructions Extraction
// ============================================================================

function extractInstructions(html: string, config: HtmlExtractionConfig): string | undefined {
  // Try structured selectors first
  for (const selector of config.instructionSelectors) {
    const pattern = createSelectorPattern(selector);
    const sectionMatch = html.match(pattern);

    if (sectionMatch && sectionMatch[1]) {
      const instructions = parseInstructions(sectionMatch[1]);
      if (instructions && instructions.length > 10) {
        return instructions;
      }
    }
  }

  // Try common instruction patterns
  const commonPatterns = [
    /(?:instructions?|directions?|steps?|method)[:\s]*<\/h[1-6][^>]*>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i,
    /(?:instructions?|directions?|steps?|method)[:\s]*<\/h[1-6][^>]*>\s*<div[^>]*class="[^"]*instructions?[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of commonPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const instructions = parseInstructions(match[1]);
      if (instructions && instructions.length > 10) {
        return instructions;
      }
    }
  }

  // Try numbered steps
  const stepsPattern = /(?:step|directions?)[:\s]*\d+[:\.]?\s*([^<\n]+)/gi;
  const steps = html.match(stepsPattern);

  if (steps && steps.length >= 3) {
    return steps.map((step, index) => `${index + 1}. ${cleanHtml(step)}`).join('\n\n');
  }

  return undefined;
}

function parseInstructions(html: string): string | undefined {
  const steps: string[] = [];

  // Extract numbered list items
  const numberedPattern = /<li[^>]*>(?:<span[^>]*>\d+[\.\)]?<\/span>|[0-9]+[\.\)]?)\s*([^<]+)<\/li>/gi;
  const numberedMatches = html.matchAll(numberedPattern);

  for (const match of numberedMatches) {
    if (match[1]) {
      const step = cleanHtml(match[1]);
      if (step.length > 0) {
        steps.push(step);
      }
    }
  }

  if (steps.length > 0) {
    return steps.map((step, index) => `${index + 1}. ${step}`).join('\n\n');
  }

  // Extract unnumbered list items
  const listPattern = /<li[^>]*>([^<]+)<\/li>/gi;
  const listMatches = html.matchAll(listPattern);

  for (const match of listMatches) {
    if (match[1]) {
      const step = cleanHtml(match[1]);
      if (step.length > 5) {
        steps.push(step);
      }
    }
  }

  if (steps.length > 0) {
    return steps.map((step, index) => `${index + 1}. ${step}`).join('\n\n');
  }

  // Return plain text if nothing else
  const plainText = cleanHtml(html);
  return plainText.length > 10 ? plainText : undefined;
}

// ============================================================================
// Time Extraction
// ============================================================================

function extractTime(html: string, config: HtmlExtractionConfig): string | undefined {
  // Try structured selectors
  for (const selector of config.timeSelectors) {
    const pattern = createSelectorPattern(selector);
    const match = html.match(pattern);
    if (match && match[1]) {
      const time = cleanHtml(match[1]);
      if (time.length > 0 && time.length < 50) {
        return time;
      }
    }
  }

  // Try common time patterns
  const timePatterns = [
    /(?:prep|cook|total)\s*time[:\s]*(\d+\s*(?:mins?|minutes?|hrs?|hours?|seconds?))/i,
    /(?:time|total\s*time)[:\s]*(\d+\s*(?:mins?|minutes?|hrs?|hours?))/i,
    /(\d+\s*(?:mins?|minutes?|hrs?|hours?))\s*(?:prep|cook|total)?/i,
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i,
  ];

  for (const pattern of timePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return cleanHtml(match[1]);
    }
  }

  return undefined;
}

// ============================================================================
// Yield/Servings Extraction
// ============================================================================

function extractYield(html: string, config: HtmlExtractionConfig): string | undefined {
  // Try structured selectors
  for (const selector of config.yieldSelectors) {
    const pattern = createSelectorPattern(selector);
    const match = html.match(pattern);
    if (match && match[1]) {
      const yieldText = cleanHtml(match[1]);
      if (yieldText.length > 0 && yieldText.length < 30) {
        return yieldText;
      }
    }
  }

  // Try common yield patterns
  const yieldPatterns = [
    /(\d+)\s*(?:servings?|portions?|people|cups?)?/i,
    /yields?[:\s]*(\d+)/i,
    /makes?[:\s]*(\d+)/i,
    /serves?\s*(\d+)/i,
  ];

  for (const pattern of yieldPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return `${match[1]} servings`;
    }
  }

  return undefined;
}

// ============================================================================
// Image Extraction
// ============================================================================

function extractImage(html: string): string | undefined {
  // Try og:image
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImage && ogImage[1]) {
    return ogImage[1];
  }

  // Try schema.org image
  const schemaImage = html.match(/<img[^>]*itemprop=["']image["'][^>]*src=["']([^"']+)["']/i);
  if (schemaImage && schemaImage[1]) {
    return schemaImage[1];
  }

  // Try first reasonable image
  const firstImg = html.match(/<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp|svg)[^"']*)["']/i);
  if (firstImg && firstImg[1]) {
    return firstImg[1];
  }

  return undefined;
}

// ============================================================================
// Utility Functions
// ============================================================================

function createSelectorPattern(selector: string): RegExp {
  // Convert CSS selector to regex pattern
  let pattern = selector
    .replace(/[\.\#\:\[\]]/g, '\\$&')
    .replace(/\\\*/g, '.*')
    .replace(/\\\s/g, '\\s');

  return new RegExp(`<[^>]*class=["'][^"']*${pattern}[^"']*["'][^>]*>([^<]+)<\/[^>]+>`, 'i');
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
