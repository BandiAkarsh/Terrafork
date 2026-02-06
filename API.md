# TerraFork Universal Scraper API Documentation

## Overview

The TerraFork Scraper is a **Universal Recipe Extraction Engine** built on Cloudflare Workers. It implements a **multi-layer extraction strategy** that can extract recipes from **ANY website format** while maintaining Green Code compliance (24h caching, minimal compute, energy efficiency).

### Key Features

- **Universal Format Support**: JSON-LD, Microdata, HTML patterns, and heuristic fallback
- **Confidence Scoring**: Transparent data quality metrics
- **Green Code**: 24-hour Edge caching, serverless architecture
- **Security**: Enhanced SSRF protection
- **Type Safety**: Full TypeScript implementation

## Base URL

- **Development**: `http://localhost:8788`
- **Production**: `https://terrafork-scraper.workers.dev`

## Endpoints

### GET /scrape

Extract recipe data from a URL with full metadata and confidence scoring.

**Query Parameters:**
- `url` (required): The URL of the recipe to scrape

**Example Request:**
```bash
curl "https://terrafork-scraper.workers.dev/scrape?url=https://www.allrecipes.com/recipe/229559/best-ever-meat-loaf/"
```

**Success Response (200):**
```json
{
  "title": "Best Ever Meat Loaf",
  "total_time": "1 hr 15 mins",
  "yields": "8 servings",
  "image": "https://www.allrecipes.com/...",
  "ingredients": [
    "1 1/2 cups dried bread crumbs",
    "1/3 cup chopped onion",
    "1/2 cup milk",
    "1 egg, beaten",
    "1 pound ground beef",
    "1/4 cup ketchup",
    "2 tablespoons brown sugar",
    "1 teaspoon salt",
    "1/4 teaspoon ground black pepper"
  ],
  "instructions": "1. Preheat oven to 350°F...",
  "host": "allrecipes.com",
  "url": "https://www.allrecipes.com/recipe/229559/best-ever-meat-loaf/",
  "_metadata": {
    "confidence": {
      "overall": 95,
      "title": 10,
      "ingredients": 30,
      "instructions": 30,
      "metadata": 25
    },
    "extractionMethod": "json-ld",
    "fieldsExtracted": ["title", "total_time", "yields", "image", "ingredients", "instructions", "host"],
    "fieldsMissing": ["nutrients"],
    "warnings": ["Nutritional information not available"],
    "timestamp": "2026-02-06T12:00:00Z",
    "url": "https://www.allrecipes.com/recipe/229559/best-ever-meat-loaf/"
  }
}
```

### GET /health

Health check endpoint for monitoring.

**Example Request:**
```bash
curl "https://terrafork-scraper.workers.dev/health"
```

**Success Response (200):**
```json
{
  "status": "ok",
  "service": "terrafork-universal-scraper",
  "version": "2.0.0",
  "features": [
    "json-ld-extraction",
    "html-structure-extraction",
    "confidence-scoring",
    "24h-caching"
  ]
}
```

## Extraction Methods

The scraper uses a **priority-based extraction strategy**:

### 1. JSON-LD (Primary - Best Results)
Extracts structured data from `application/ld+json` script tags with `@type: Recipe`. Handles:
- Standard Schema.org Recipe format
- @graph structures (nested JSON-LD)
- All field name variants (recipeIngredient, ingredients, etc.)
- HowToStep and HowToSection nested instructions

### 2. Microdata (Secondary)
Parses HTML microdata attributes like `itemscope="https://schema.org/Recipe"` and `itemprop`.

### 3. HTML Structure (Tertiary)
Uses semantic HTML patterns to extract:
- Ingredient lists (ul, ol, dl)
- Instruction sections
- Time and yield information
- Recipe titles

### 4. Heuristic (Last Resort)
Pattern matching fallback for complex layouts:
- Common CSS class patterns
- Text-based section detection
- Measurement parsing

## Confidence Scoring

Each extraction includes a confidence score (0-100%) for transparency:

| Score Range | Quality |
|------------|---------|
| 90-100% | Excellent - Complete data from structured source |
| 75-89% | Good - Most fields extracted |
| 50-74% | Fair - Partial data, some manual verification needed |
| 25-49% | Poor - Limited data, significant verification needed |
| 0-24% | Very Poor - May not be a recipe page |

### Confidence Components

- **title** (10 pts): Title extraction quality
- **ingredients** (30 pts): Ingredient extraction quality (most important)
- **instructions** (30 pts): Instructions extraction quality
- **metadata** (30 pts): Time, yields, image quality

## Supported Formats

### JSON-LD Field Variants

| Standard Field | Variants Supported |
|---------------|-------------------|
| recipeIngredient | ingredients, ingredient, recipeIngredients |
| recipeInstructions | instructions, instruction, recipeInstructions |
| recipeYield | yield, yields, servingSize, servings |
| totalTime | cookTime, prepTime, total_time, cook_time |
| image | Full URL, object with url property, array |

### HTML Patterns

The scraper recognizes common HTML patterns:
- `<ul class="ingredients">`
- `<ol class="instructions">`
- `<div class="recipe-yield">`
- Schema.org microdata attributes
- Common class names: `ingredient`, `direction`, `step`, `method`

## URL Validation

The scraper implements **SSRF protection** to prevent abuse:

### Blocked URLs
- Private IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- Localhost and 127.0.0.1
- Non-HTTP/HTTPS protocols (file:, ftp:, etc.)
- Link-local addresses (169.254.x.x)

### Supported Protocols
- `http://` - Standard HTTP
- `https://` - Secure HTTP (recommended)

## Caching

### Green Code: 24-Hour Edge Caching

```
Cache-Control: public, max-age=86400, s-maxage=86400
```

- **Duration**: 24 hours (86400 seconds)
- **Strategy**: URL-based cache key
- **Benefit**: ~90% compute reduction on repeat requests

### Cache Behavior

- First request: Full extraction
- Repeat requests (within 24h): Cached response
- Cache hit includes original extraction metadata

## Error Handling

| Error Code | Description |
|-----------|-------------|
| 400 | Invalid URL, missing parameter, or extraction failed |
| 403 | URL blocked by SSRF protection |
| 404 | Unknown route |
| 500 | Internal server error |

### Error Response Format

```json
{
  "error": "Failed to extract recipe data",
  "details": "Specific error message",
  "warnings": ["List of extraction warnings"]
}
```

## Response Headers

```
Content-Type: application/json
Access-Control-Allow-Origin: https://terrafork.pages.dev
Cache-Control: public, max-age=86400, s-maxage=86400
```

## Green Code Compliance

### Energy Efficiency

- **Serverless**: Cloudflare Workers scale to zero
- **Lightweight Parsing**: Regex + minimal DOM processing
- **Edge Caching**: 24-hour cache reduces compute by ~90%
- **Minimal Bundle**: Small footprint for fast loading

### Best Practices

1. **Cache Results**: Store extracted data locally (PGLite)
2. **Batch Requests**: Group recipe extractions
3. **Verify Data**: Check confidence scores before storage
4. **Report Issues**: Submit problematic URLs for site registry updates

## Testing

### Test Recipe URLs

**JSON-LD Sites (Excellent Results):**
- AllRecipes: https://www.allrecipes.com/recipe/229559/best-ever-meat-loaf/
- Food Network: https://www.foodnetwork.com/recipes/chicken-parmesan
- Serious Eats: https://www.seriouseats.com/perfect-pizza-dough

**HTML-Only Sites (Good Results):**
- Small food blogs with standard HTML structure
- WordPress recipe plugins
- Custom CMS implementations

### Example Test Command

```bash
# Test with AllRecipes
curl "http://localhost:8788/scrape?url=https://www.allrecipes.com/recipe/229559/best-ever-meat-loaf/" | jq

# Check confidence score
curl "http://localhost:8788/scrape?url=https://example.com/recipe" | jq '._metadata.confidence'
```

## Site Registry (Optional)

The scraper can be enhanced with site-specific patterns for improved extraction on known recipe sites. Contact the maintainers to contribute site patterns.

---

## Summary

The TerraFork Universal Scraper provides:

✅ **Universal Compatibility** - Extracts from any recipe website  
✅ **Transparency** - Confidence scoring for data quality  
✅ **Green Code** - 24h caching, serverless architecture  
✅ **Security** - SSRF protection prevents abuse  
✅ **Type Safety** - Full TypeScript implementation  
