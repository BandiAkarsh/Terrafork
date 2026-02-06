/**
 * Green Code: Data Normalization Module
 * =====================================
 * Standardizes recipe data from various sources into a consistent format.
 * Handles ISO 8601 durations, measurements, and text cleaning.
 */

// ============================================================================
// ISO 8601 Duration Parsing (PT30M -> "30 mins")
// ============================================================================

/**
 * Parse ISO 8601 duration string to human-readable format
 * Examples: PT30M -> "30 mins", PT1H30M -> "1 hr 30 mins", P1D -> "1 day"
 */
export function parseIsoDuration(isoDuration: string | undefined): string | undefined {
  if (!isoDuration) return undefined;

  // Green Code: Handle common formats efficiently
  const isoPattern = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?|(?:(\d+)D))$/;
  const match = isoDuration.match(isoPattern);

  if (!match) {
    // Not a valid ISO duration, return as-is
    return isoDuration;
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const days = match[4] ? parseInt(match[4], 10) : 0;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  if (seconds > 0 && hours === 0 && minutes === 0) {
    parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) return isoDuration;

  return parts.join(' ');
}

/**
 * Convert ISO duration to minutes
 */
export function durationToMinutes(isoDuration: string | undefined): number | undefined {
  if (!isoDuration) return undefined;

  const isoPattern = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?|(?:(\d+)D))$/;
  const match = isoDuration.match(isoPattern);

  if (!match) return undefined;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const days = match[4] ? parseInt(match[4], 10) : 0;

  return (days * 24 * 60) + (hours * 60) + minutes + Math.round(seconds / 60);
}

// ============================================================================
// Text Cleaning and Normalization
// ============================================================================

/**
 * Clean and normalize HTML content
 * Green Code: Efficient string operations
 */
export function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')           // Remove HTML tags
    .replace(/&nbsp;/g, ' ')            // HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')               // Multiple spaces to single
    .trim();
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Capitalize first letter of string
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Truncate text to maximum length
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

// ============================================================================
// Measurement and Quantity Parsing
// ============================================================================

/**
 * Parse ingredient quantity (e.g., "1 1/2 cups" -> ["1 1/2", "cups"])
 */
export function parseIngredientLine(line: string): {
  quantity: string;
  unit: string;
  item: string;
} {
  // Common measurement units
  const unitPattern = /^(cups?|c?|teaspoons?|tsp?|tablespoons?|tbsp?|ounces?|oz?|pounds?|lbs?|grams?|g?|kilograms?|kg?|milliliters?|ml?|liters?|l?|cups?|pints?|quarts?|gallons?|gallons?|sticks?|cloves?|pinches?|dashes?|packages?|pkgs?|cans?|jars?|bunches?|heads?|slices?|pieces?|chunks?|medium|large|small|whole)\s+/i;

  const match = line.match(unitPattern);

  if (match) {
    const unit = match[1];
    const item = line.slice(match[0].length);
    return { quantity: '', unit, item: item.trim() };
  }

  return { quantity: '', unit: '', item: line.trim() };
}

/**
 * Normalize fraction characters (½ -> 1/2)
 */
export function normalizeFractions(text: string): string {
  const fractionMap: Record<string, string> = {
    '½': '1/2',
    '⅓': '1/3',
    '⅔': '2/3',
    '¼': '1/4',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
  };

  let result = text;
  for (const [fraction, unicode] of Object.entries(fractionMap)) {
    result = result.replace(new RegExp(fraction, 'g'), unicode);
  }

  return result;
}

// ============================================================================
// Time Format Normalization
// ============================================================================

/**
 * Normalize various time formats to consistent display
 */
export function normalizeTime(time: string | undefined): string | undefined {
  if (!time) return undefined;

  // Already in good format
  if (/^\d+\s*(mins?|minutes?|hrs?|hours?|days?)$/i.test(time)) {
    return time.toLowerCase().replace(/\s+/g, ' ');
  }

  // Try to parse ISO duration
  const isoResult = parseIsoDuration(time);
  if (isoResult && isoResult !== time) {
    return isoResult;
  }

  // Return original if no transformation needed
  return time;
}

// ============================================================================
// Yield/Servings Normalization
// ============================================================================

/**
 * Normalize yield/servings to consistent format
 */
export function normalizeYield(yieldText: string | undefined): string | undefined {
  if (!yieldText) return undefined;

  // Extract number
  const match = yieldText.match(/(\d+)/);
  if (match) {
    return `${match[1]} servings`;
  }

  return yieldText;
}

// ============================================================================
// Image URL Normalization
// ============================================================================

/**
 * Normalize image URL (handle different formats)
 */
export function normalizeImageUrl(image: string | { url?: string } | string[] | undefined): string | undefined {
  if (!image) return undefined;

  if (typeof image === 'string') {
    return image;
  }

  if (Array.isArray(image) && image.length > 0) {
    const firstItem = image[0];
    if (typeof firstItem === 'string') {
      return firstItem;
    }
    if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
      return (firstItem as { url?: string }).url;
    }
  }

  if (typeof image === 'object' && image !== null && 'url' in image) {
    return (image as { url?: string }).url;
  }

  return undefined;
}

// ============================================================================
// Recipe Data Normalization
// ============================================================================

export interface NormalizedRecipeData {
  title: string;
  total_time?: string;
  yields?: string;
  image?: string;
  ingredients: string[];
  instructions: string;
  nutrients?: Record<string, string>;
  host?: string;
}

/**
 * Normalize complete recipe data
 * Green Code: Single pass normalization for efficiency
 */
export function normalizeRecipeData(data: Partial<NormalizedRecipeData>): NormalizedRecipeData {
  return {
    title: data.title?.trim() || 'Untitled Recipe',
    total_time: normalizeTime(data.total_time),
    yields: normalizeYield(data.yields),
    image: normalizeImageUrl(data.image),
    ingredients: (data.ingredients || []).map((ing) => {
      const parsed = parseIngredientLine(ing);
      return normalizeWhitespace(cleanHtml(ing));
    }),
    instructions: normalizeWhitespace(cleanHtml(data.instructions || '')),
    nutrients: data.nutrients,
    host: data.host,
  };
}

// ============================================================================
// Export Constants
// ============================================================================

export const TIME_PATTERNS = [
  { regex: /(\d+)\s*hours?/i, multiplier: 60 },
  { regex: /(\d+)\s*mins?/i, multiplier: 1 },
  { regex: /(\d+)\s*seconds?/i, multiplier: 1 / 60 },
];

export const COMMON_UNITS = [
  'cup', 'cups', 'c',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs',
  'teaspoon', 'teaspoons', 'tsp',
  'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l',
  'pinch', 'pinches',
  'dash', 'dashes',
  'clove', 'cloves',
  'stick', 'sticks',
];
