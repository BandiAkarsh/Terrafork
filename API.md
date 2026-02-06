# TerraFork Scraper API Documentation

## Overview

The TerraFork Scraper is a Cloudflare Worker that extracts structured recipe data from URLs. It implements a dual-parsing strategy using JSON-LD structured data as the primary source and HTML parsing as a fallback.

## Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://terrafork-scraper.workers.dev`

## Endpoints

### GET /scrape

Extract recipe data from a URL.

**Query Parameters:**
- `url` (required): The URL of the recipe to scrape

**Example Request:**
```bash
curl "https://terrafork-scraper.workers.dev/scrape?url=https://example.com/delicious-recipe"
```

**Success Response (200):**
```json
{
  "id": "recipe-uuid",
  "title": "Delicious Recipe Name",
  "total_time": "30 mins",
  "yields": "4 servings",
  "image": "https://example.com/recipe-image.jpg",
  "ingredients": [
    "1 cup flour",
    "2 large eggs",
    "1/2 cup milk"
  ],
  "instructions": "Step 1: Mix all ingredients...\nStep 2: Bake at 350°F...",
  "nutrients": {
    "calories": "250",
    "protein": "8g"
  },
  "host": "example.com",
  "url": "https://example.com/delicious-recipe"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid URL or unable to scrape"
}
```

**Error Response (403):**
```json
{
  "error": "URL validation failed"
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
  "status": "healthy",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

## URL Validation

The scraper implements SSRF (Server-Side Request Forgery) protection:

### Blocked URLs
- Private IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- Localhost and 127.0.0.1
- Non-HTTP/HTTPS protocols

### Supported Sites
The scraper works best with sites that use:
- JSON-LD structured data (`application/ld+json` with `@type: Recipe`)
- Standard recipe schema markup
- Standard HTML ingredient and instruction formats

## Caching

- **Cache Duration:** 24 hours
- **Cache Key:** URL hash
- **Cache Control:** Respects origin headers

## Rate Limiting

- Requests are cached for 24 hours per URL
- No explicit rate limits (uses Cloudflare Workers free tier)

## Error Handling

| Error Code | Description |
|------------|-------------|
| 400 | Invalid URL or missing parameter |
| 403 | Blocked URL (SSRF protection) |
| 404 | Recipe not found on page |
| 500 | Internal server error |
| 503 | Service unavailable |

## Response Headers

```
Cache-Control: public, max-age=86400
Content-Type: application/json
Access-Control-Allow-Origin: *
```
