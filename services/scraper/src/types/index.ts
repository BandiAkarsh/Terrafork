/**
 * Green Code: Universal Type Definitions for Recipe Extraction
 * =============================================================
 * This module provides comprehensive type definitions for handling
 * recipes from any source format while maintaining type safety.
 */

// ============================================================================
// Core Recipe Types
// ============================================================================

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

export interface RecipeDataExtended extends RecipeData {
  _metadata?: ExtractionMetadata;
}

// ============================================================================
// Extraction Metadata (Green Code: Transparency about data quality)
// ============================================================================

export interface ExtractionMetadata {
  confidence: ConfidenceScore;
  extractionMethod: ExtractionMethod;
  fieldsExtracted: string[];
  fieldsMissing: string[];
  warnings: string[];
  timestamp: string;
  url: string;
}

export type ExtractionMethod = 
  | 'json-ld'          // Primary: Schema.org JSON-LD
  | 'microdata'        // Secondary: HTML microdata
  | 'html'            // Tertiary: HTML structure analysis
  | 'heuristic';      // Last resort: Pattern matching

export interface ConfidenceScore {
  overall: number;        // 0-100%
  title: number;          // 0-100%
  ingredients: number;     // 0-100%
  instructions: number;    // 0-100%
  metadata: number;       // 0-100%
}

// ============================================================================
// JSON-LD Types (Schema.org Recipe Variants)
// ============================================================================

export interface JsonLdRecipe {
  '@type'?: string | string[];
  '@graph'?: any[];
  name?: string;
  title?: string;                    // Variant field name
  recipeIngredient?: any;            // Standard Schema.org
  ingredients?: any;                  // Variant (some sites use this)
  ingredient?: any;                   // Single ingredient variant
  recipeInstructions?: any;          // Standard Schema.org
  instructions?: any;                 // Variant
  recipeYield?: any;                 // Standard Schema.org
  yield?: any;                       // Variant
  yields?: any;                      // Variant
  servingSize?: string;              // Alternative yield field
  totalTime?: string;                // ISO 8601 duration
  cookTime?: string;                  // ISO 8601 duration
  prepTime?: string;                 // ISO 8601 duration
  image?: string | { url?: string } | string[];
  nutrition?: Record<string, string>;
  datePublished?: string;
  description?: string;
  author?: { name?: string } | string;
  publisher?: { name?: string };
}

export interface HowToStep {
  '@type'?: string;
  text?: string;
  name?: string;
  description?: string;
  url?: string;
  itemListElement?: HowToStep[];
  direction?: HowToStep;
}

export interface HowToSection {
  '@type'?: string;
  name?: string;
  itemListElement?: HowToStep[];
}

// ============================================================================
// Microdata Types (Schema.org Microdata in HTML)
// ============================================================================

export interface MicrodataRecipe {
  itemscope?: string;
  itemtype?: string;
  itemprop?: Record<string, any>;
}

// ============================================================================
// HTML Parsing Types
// ============================================================================

export interface HtmlExtractionConfig {
  ingredientSelectors: string[];
  instructionSelectors: string[];
  timeSelectors: string[];
  yieldSelectors: string[];
  titleSelectors: string[];
}

export interface HtmlExtractionResult {
  title: string | null;
  ingredients: string[];
  instructions: string;
  total_time: string | null;
  yields: string | null;
  image: string | null;
}

// ============================================================================
// Normalization Types
// ============================================================================

export interface NormalizedTime {
  iso?: string;      // PT30M
  display: string;   // "30 mins"
  minutes?: number;  // 30
}

export interface NormalizedIngredient {
  original: string;
  quantity?: string;
  unit?: string;
  item?: string;
}

// ============================================================================
// Extraction Result Types
// ============================================================================

export interface ExtractionResult {
  data: RecipeDataExtended;
  success: boolean;
  error?: string;
}

export interface ExtractionAttempt {
  method: ExtractionMethod;
  confidence: ConfidenceScore;
  data: Partial<RecipeData>;
  warnings: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type NonEmptyString = string & { length: number };

export interface UrlInfo {
  hostname: string;
  pathname: string;
  search: string;
  protocol: string;
  isValid: boolean;
  isBlocked: boolean;
  blockReason?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ExtractorConfig {
  maxExtractionTime: number;       // ms - Green Code: prevent infinite loops
  maxIngredients: number;           // Cap at reasonable amount
  maxInstructionLength: number;     // Cap at reasonable length
  enableHeuristics: boolean;        // Allow fallback
  enableMicrodata: boolean;         // Parse microdata
  confidenceThreshold: number;      // Minimum confidence to accept
}

// Green Code: Default configuration optimized for efficiency
export const DEFAULT_EXTRACTOR_CONFIG: ExtractorConfig = {
  maxExtractionTime: 5000,          // 5 seconds max per extraction
  maxIngredients: 100,              // Cap ingredients
  maxInstructionLength: 50000,       // Cap instructions
  enableHeuristics: true,           // Allow fallback
  enableMicrodata: true,            // Parse microdata
  confidenceThreshold: 25,          // Accept low confidence if nothing else
};

// ============================================================================
// Site Registry Types (Optional Enhancement)
// ============================================================================

export interface SiteConfig {
  domain: string;
  patterns: {
    jsonLdSelector?: string;
    ingredientSelector?: string;
    instructionSelector?: string;
  };
  fieldMappings?: Record<string, string>;
  examples?: string[];
  priority?: number;                // Higher = more reliable
}

// ============================================================================
// Export Constants
// ============================================================================

export const EXTRACTION_METHOD_PRIORITY: ExtractionMethod[] = [
  'json-ld',
  'microdata',
  'html',
  'heuristic',
];

export const INGREDIENT_FIELD_VARIANTS = [
  'recipeIngredient',
  'ingredients',
  'ingredient',
  'recipeIngredients',
  'Ingredient',
];

export const INSTRUCTION_FIELD_VARIANTS = [
  'recipeInstructions',
  'instructions',
  'instruction',
  'recipeInstructions',
  'Instruction',
];

export const YIELD_FIELD_VARIANTS = [
  'recipeYield',
  'yield',
  'yields',
  'servingSize',
  'servings',
];

export const TIME_FIELD_VARIANTS = [
  'totalTime',
  'cookTime',
  'prepTime',
  'total_time',
  'cook_time',
  'prep_time',
];
