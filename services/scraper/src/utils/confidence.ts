/**
 * Green Code: Confidence Scoring Module
 * ======================================
 * Calculates extraction confidence scores to provide transparency
 * about data quality and extraction reliability.
 */

import type {
  RecipeData,
  ConfidenceScore,
  ExtractionMethod,
  ExtractionAttempt,
} from '../types';

/**
 * Calculate confidence score for extracted recipe data
 * Green Code: Transparent scoring helps users understand data quality
 */
export function calculateConfidence(data: Partial<RecipeData>): ConfidenceScore {
  let score = 0;
  const maxScore = 100;

  // Title extraction (10 points)
  const titleScore = data.title && data.title.trim().length > 0 ? 10 : 0;
  score += titleScore;

  // Ingredients extraction (30 points - most important)
  let ingredientsScore = 0;
  if (data.ingredients && Array.isArray(data.ingredients)) {
    if (data.ingredients.length >= 3) {
      ingredientsScore = 30;  // Good amount
    } else if (data.ingredients.length >= 1) {
      ingredientsScore = 20;  // Minimal
    } else {
      ingredientsScore = 0;   // Empty
    }
  }
  score += ingredientsScore;

  // Instructions extraction (30 points)
  const instructionsScore = 
    data.instructions && data.instructions.trim().length > 10 ? 30 :
    data.instructions && data.instructions.trim().length > 0 ? 20 : 0;
  score += instructionsScore;

  // Metadata (30 points bonus - less critical)
  let metadataScore = 0;
  if (data.total_time) metadataScore += 10;
  if (data.yields) metadataScore += 10;
  if (data.image) metadataScore += 10;
  score = Math.min(score + metadataScore, maxScore);

  return {
    overall: Math.round(score),
    title: titleScore,
    ingredients: ingredientsScore,
    instructions: instructionsScore,
    metadata: metadataScore,
  };
}

/**
 * Compare multiple extraction attempts and return the best result
 * Green Code: Select best extraction method efficiently
 */
export function selectBestExtraction(
  attempts: ExtractionAttempt[],
  config?: { confidenceThreshold?: number }
): ExtractionAttempt | null {
  if (attempts.length === 0) return null;

  const threshold = config?.confidenceThreshold ?? 0;

  // Filter by threshold first
  const validAttempts = attempts.filter(
    (a) => a.confidence.overall >= threshold
  );

  if (validAttempts.length === 0) {
    // Return highest confidence even if below threshold
    return attempts.reduce((best, current) =>
      current.confidence.overall > best.confidence.overall ? current : best
    );
  }

  // Return best confidence
  return validAttempts.reduce((best, current) =>
    current.confidence.overall > best.confidence.overall ? current : best
  );
}

/**
 * Calculate extraction method reliability score
 * Green Code: Prioritize reliable extraction methods
 */
export function getMethodReliability(method: ExtractionMethod): number {
  const reliabilityScores: Record<ExtractionMethod, number> = {
    'json-ld': 95,      // Most reliable - structured data
    'microdata': 85,    // Very reliable - embedded metadata
    'html': 60,         // Moderate - requires heuristics
    'heuristic': 30,    // Low - pattern matching fallback
  };

  return reliabilityScores[method];
}

/**
 * Estimate extraction completeness as percentage
 */
export function calculateCompleteness(data: Partial<RecipeData>): number {
  const requiredFields = ['title', 'ingredients', 'instructions'];
  const optionalFields = ['total_time', 'yields', 'image', 'nutrients', 'host'];

  let score = 0;
  let total = requiredFields.length + optionalFields.length;

  // Required fields (higher weight)
  for (const field of requiredFields) {
    if (field === 'ingredients') {
      if (data.ingredients && data.ingredients.length > 0) score += 25;
    } else if (data[field as keyof RecipeData]) {
      score += 25;
    }
  }

  // Optional fields (lower weight)
  for (const field of optionalFields) {
    if (data[field as keyof RecipeData]) {
      score += 10 / optionalFields.length;
    }
  }

  return Math.round((score / total) * 100);
}

/**
 * Generate warnings based on extraction quality
 * Green Code: Inform users about potential issues
 */
export function generateWarnings(
  data: Partial<RecipeData>,
  confidence: ConfidenceScore
): string[] {
  const warnings: string[] = [];

  if (confidence.ingredients < 20) {
    warnings.push('Few or no ingredients extracted');
  }

  if (confidence.instructions < 20) {
    warnings.push('Instructions may be incomplete or missing');
  }

  if (confidence.title < 10) {
    warnings.push('Recipe title could not be extracted');
  }

  if (confidence.overall < 50) {
    warnings.push('Low confidence extraction - please verify data');
  }

  if (!data.image) {
    warnings.push('No image found - recipe may not display correctly');
  }

  if (!data.total_time) {
    warnings.push('Cooking time not available');
  }

  return warnings;
}

/**
 * Format confidence score for display
 */
export function formatConfidence(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 25) return 'Poor';
  return 'Very Poor';
}

/**
 * Determine if extraction is usable based on confidence
 */
export function isExtractionUsable(confidence: ConfidenceScore): boolean {
  // Must have at least some ingredients and instructions
  return confidence.ingredients >= 20 && confidence.instructions >= 20;
}

/**
 * Calculate overall confidence with method reliability weighting
 */
export function calculateWeightedConfidence(
  baseConfidence: ConfidenceScore,
  method: ExtractionMethod
): number {
  const methodReliability = getMethodReliability(method) / 100;
  const weightedScore = baseConfidence.overall * (0.7 + 0.3 * methodReliability);
  
  return Math.round(Math.min(weightedScore, 100));
}
