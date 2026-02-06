/**
 * Green Code: Universal JSON-LD Extractor
 * ======================================
 * Extracts recipe data from ANY JSON-LD format variation.
 */

import type {
  RecipeData,
  JsonLdRecipe,
  HowToStep,
  ExtractionAttempt,
} from '../types';
import {
  INGREDIENT_FIELD_VARIANTS,
  INSTRUCTION_FIELD_VARIANTS,
  YIELD_FIELD_VARIANTS,
  TIME_FIELD_VARIANTS,
} from '../types';
import { calculateConfidence, generateWarnings } from '../utils/confidence';
import { parseIsoDuration, normalizeImageUrl, cleanHtml } from '../utils/normalization';

/**
 * Extract recipe data from JSON-LD
 */
export function extractFromJsonLdUniversal(
  html: string,
  url: string
): ExtractionAttempt {
  const warnings: string[] = [];

  // Extract all JSON-LD script tags
  const jsonLdMatches = extractJsonLdScripts(html);

  if (jsonLdMatches.length === 0) {
    return {
      method: 'json-ld',
      confidence: { overall: 0, title: 0, ingredients: 0, instructions: 0, metadata: 0 },
      data: {},
      warnings: ['No JSON-LD found'],
    };
  }

  // Find all Recipe objects
  const recipes = findAllRecipes(jsonLdMatches);

  if (recipes.length === 0) {
    return {
      method: 'json-ld',
      confidence: { overall: 0, title: 0, ingredients: 0, instructions: 0, metadata: 0 },
      data: {},
      warnings: ['No Recipe objects found in JSON-LD'],
    };
  }

  // Select best recipe
  const bestRecipe = selectBestRecipe(recipes);

  if (!bestRecipe) {
    return {
      method: 'json-ld',
      confidence: { overall: 0, title: 0, ingredients: 0, instructions: 0, metadata: 0 },
      data: {},
      warnings: ['Could not parse any valid recipe'],
    };
  }

  // Extract data
  const host = extractHostname(url);
  const result: Partial<RecipeData> = {
    title: bestRecipe.name || bestRecipe.title,
    ingredients: extractIngredientsUniversal(bestRecipe),
    instructions: extractInstructionsUniversal(bestRecipe),
    total_time: extractTimeUniversal(bestRecipe),
    yields: extractYieldUniversal(bestRecipe),
    image: normalizeImageUrl(bestRecipe.image),
    host,
  };

  const confidence = calculateConfidence(result);
  warnings.push(...generateWarnings(result, confidence));

  return {
    method: 'json-ld',
    confidence,
    data: result,
    warnings,
  };
}

// Helper functions

function extractJsonLdScripts(html: string): string[] {
  const pattern = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

function parseJsonLdContent(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function findAllRecipes(jsonLdMatches: string[]): JsonLdRecipe[] {
  const recipes: JsonLdRecipe[] = [];

  for (const content of jsonLdMatches) {
    const parsed = parseJsonLdContent(content);
    if (!parsed) continue;

    // Handle @graph structure
    if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
      for (const item of parsed['@graph']) {
        if (isRecipe(item)) recipes.push(item);
      }
    }

    // Handle array
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (isRecipe(item)) recipes.push(item);
      }
    }

    // Handle single object
    if (isRecipe(parsed)) {
      recipes.push(parsed);
    }
  }

  return recipes;
}

function isRecipe(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const type = item['@type'];
  if (!type) return false;
  if (type === 'Recipe') return true;
  if (Array.isArray(type) && type.includes('Recipe')) return true;
  return false;
}

function selectBestRecipe(recipes: JsonLdRecipe[]): JsonLdRecipe | null {
  if (recipes.length === 0) return null;
  if (recipes.length === 1) return recipes[0];

  const scored = recipes.map((recipe) => {
    let score = 0;
    if (recipe.name) score += 10;
    const ingredients = getIngredientValue(recipe);
    if (ingredients.length >= 3) score += 30;
    else if (ingredients.length >= 1) score += 15;
    const instructions = getInstructionValue(recipe);
    if (instructions && instructions.length > 50) score += 30;
    else if (instructions) score += 15;
    if (recipe.totalTime || recipe.cookTime || recipe.prepTime) score += 10;
    if (recipe.recipeYield || recipe.yield || recipe.yields) score += 10;
    if (recipe.image) score += 10;
    return { recipe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].recipe;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function extractIngredientsUniversal(recipe: JsonLdRecipe): string[] {
  for (const fieldName of INGREDIENT_FIELD_VARIANTS) {
    const value = (recipe as any)[fieldName];
    if (value !== undefined) {
      const ingredients = parseIngredientsValue(value);
      if (ingredients.length > 0) {
        return ingredients;
      }
    }
  }
  return [];
}

function parseIngredientsValue(value: any): string[] {
  if (!value) return [];

  if (typeof value === 'string') {
    return [cleanHtml(value)];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return cleanHtml(item);
        }
        if (typeof item === 'object' && item !== null) {
          return cleanHtml(item.text || item.name || item.item || String(item));
        }
        return String(item);
      })
      .filter(Boolean);
  }

  return [];
}

function extractInstructionsUniversal(recipe: JsonLdRecipe): string | undefined {
  for (const fieldName of INSTRUCTION_FIELD_VARIANTS) {
    const value = (recipe as any)[fieldName];
    if (value !== undefined) {
      const instructions = parseInstructionsValue(value);
      if (instructions) {
        return instructions;
      }
    }
  }
  return undefined;
}

function parseInstructionsValue(value: any): string | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return cleanHtml(value);
  }

  if (Array.isArray(value)) {
    return parseHowToSteps(value);
  }

  if (typeof value === 'object' && value !== null) {
    if (value.itemListElement) {
      return parseHowToSteps(value.itemListElement);
    }
    if (value.text || value.description || value.name) {
      return cleanHtml(value.text || value.description || value.name);
    }
  }

  return undefined;
}

function parseHowToSteps(steps: HowToStep[]): string {
  if (!steps || !Array.isArray(steps)) return '';

  const parsedSteps = steps.map((step: HowToStep, index: number) => {
    if (step.itemListElement) {
      const sectionTitle = step.name ? `\n### ${cleanHtml(step.name)}\n` : '';
      return sectionTitle + parseHowToSteps(step.itemListElement);
    }

    const text = step.text || step.description || step.name;
    if (text) {
      return `${index + 1}. ${cleanHtml(text)}`;
    }

    return '';
  });

  return parsedSteps.filter(Boolean).join('\n\n');
}

function extractTimeUniversal(recipe: JsonLdRecipe): string | undefined {
  for (const fieldName of TIME_FIELD_VARIANTS) {
    const value = (recipe as any)[fieldName];
    if (value) {
      const parsed = parseIsoDuration(value);
      if (parsed) {
        return parsed;
      }
    }
  }
  return undefined;
}

function extractYieldUniversal(recipe: JsonLdRecipe): string | undefined {
  for (const fieldName of YIELD_FIELD_VARIANTS) {
    const value = (recipe as any)[fieldName];
    if (value) {
      if (typeof value === 'string') {
        return cleanHtml(value);
      }
      if (typeof value === 'object' && value !== null) {
        return cleanHtml(String(value.text || value.name || value.value));
      }
      return cleanHtml(String(value));
    }
  }
  return undefined;
}

function getIngredientValue(recipe: JsonLdRecipe): string[] {
  for (const fieldName of INGREDIENT_FIELD_VARIANTS) {
    const value = (recipe as any)[fieldName];
    if (value !== undefined) {
      const ingredients = parseIngredientsValue(value);
      if (ingredients.length > 0) {
        return ingredients;
      }
    }
  }
  return [];
}

function getInstructionValue(recipe: JsonLdRecipe): string | undefined {
  for (const fieldName of INSTRUCTION_FIELD_VARIANTS) {
    const value = (recipe as any)[fieldName];
    if (value !== undefined) {
      const instructions = parseInstructionsValue(value);
      if (instructions) {
        return instructions;
      }
    }
  }
  return undefined;
}
