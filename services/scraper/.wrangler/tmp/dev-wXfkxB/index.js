var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-CZY7jI/checked-fetch.js
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

// src/types/index.ts
var INGREDIENT_FIELD_VARIANTS = [
  "recipeIngredient",
  "ingredients",
  "ingredient",
  "recipeIngredients",
  "Ingredient"
];
var INSTRUCTION_FIELD_VARIANTS = [
  "recipeInstructions",
  "instructions",
  "instruction",
  "recipeInstructions",
  "Instruction"
];
var YIELD_FIELD_VARIANTS = [
  "recipeYield",
  "yield",
  "yields",
  "servingSize",
  "servings"
];
var TIME_FIELD_VARIANTS = [
  "totalTime",
  "cookTime",
  "prepTime",
  "total_time",
  "cook_time",
  "prep_time"
];

// src/utils/confidence.ts
function calculateConfidence(data) {
  let score = 0;
  const maxScore = 100;
  const titleScore = data.title && data.title.trim().length > 0 ? 10 : 0;
  score += titleScore;
  let ingredientsScore = 0;
  if (data.ingredients && Array.isArray(data.ingredients)) {
    if (data.ingredients.length >= 3) {
      ingredientsScore = 30;
    } else if (data.ingredients.length >= 1) {
      ingredientsScore = 20;
    } else {
      ingredientsScore = 0;
    }
  }
  score += ingredientsScore;
  const instructionsScore = data.instructions && data.instructions.trim().length > 10 ? 30 : data.instructions && data.instructions.trim().length > 0 ? 20 : 0;
  score += instructionsScore;
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
    metadata: metadataScore
  };
}
__name(calculateConfidence, "calculateConfidence");
function selectBestExtraction(attempts, config) {
  if (attempts.length === 0) return null;
  const threshold = config?.confidenceThreshold ?? 0;
  const validAttempts = attempts.filter(
    (a) => a.confidence.overall >= threshold
  );
  if (validAttempts.length === 0) {
    return attempts.reduce(
      (best, current) => current.confidence.overall > best.confidence.overall ? current : best
    );
  }
  return validAttempts.reduce(
    (best, current) => current.confidence.overall > best.confidence.overall ? current : best
  );
}
__name(selectBestExtraction, "selectBestExtraction");
function generateWarnings(data, confidence) {
  const warnings = [];
  if (confidence.ingredients < 20) {
    warnings.push("Few or no ingredients extracted");
  }
  if (confidence.instructions < 20) {
    warnings.push("Instructions may be incomplete or missing");
  }
  if (confidence.title < 10) {
    warnings.push("Recipe title could not be extracted");
  }
  if (confidence.overall < 50) {
    warnings.push("Low confidence extraction - please verify data");
  }
  if (!data.image) {
    warnings.push("No image found - recipe may not display correctly");
  }
  if (!data.total_time) {
    warnings.push("Cooking time not available");
  }
  return warnings;
}
__name(generateWarnings, "generateWarnings");

// src/utils/normalization.ts
function parseIsoDuration(isoDuration) {
  if (!isoDuration) return void 0;
  const isoPattern = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?|(?:(\d+)D))$/;
  const match = isoDuration.match(isoPattern);
  if (!match) {
    return isoDuration;
  }
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const days = match[4] ? parseInt(match[4], 10) : 0;
  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 && hours === 0 && minutes === 0) {
    parts.push(`${seconds} sec${seconds > 1 ? "s" : ""}`);
  }
  if (parts.length === 0) return isoDuration;
  return parts.join(" ");
}
__name(parseIsoDuration, "parseIsoDuration");
function cleanHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/\s+/g, " ").trim();
}
__name(cleanHtml, "cleanHtml");
function normalizeImageUrl(image) {
  if (!image) return void 0;
  if (typeof image === "string") {
    return image;
  }
  if (Array.isArray(image) && image.length > 0) {
    const firstItem = image[0];
    if (typeof firstItem === "string") {
      return firstItem;
    }
    if (firstItem && typeof firstItem === "object" && "url" in firstItem) {
      return firstItem.url;
    }
  }
  if (typeof image === "object" && image !== null && "url" in image) {
    return image.url;
  }
  return void 0;
}
__name(normalizeImageUrl, "normalizeImageUrl");
var TIME_PATTERNS = [
  { regex: /(\d+)\s*hours?/i, multiplier: 60 },
  { regex: /(\d+)\s*mins?/i, multiplier: 1 },
  { regex: /(\d+)\s*seconds?/i, multiplier: 1 / 60 }
];

// src/extractors/jsonld.ts
function extractFromJsonLdUniversal(html, url) {
  const warnings = [];
  const jsonLdMatches = extractJsonLdScripts(html);
  if (jsonLdMatches.length === 0) {
    return {
      method: "json-ld",
      confidence: { overall: 0, title: 0, ingredients: 0, instructions: 0, metadata: 0 },
      data: {},
      warnings: ["No JSON-LD found"]
    };
  }
  const recipes = findAllRecipes(jsonLdMatches);
  if (recipes.length === 0) {
    return {
      method: "json-ld",
      confidence: { overall: 0, title: 0, ingredients: 0, instructions: 0, metadata: 0 },
      data: {},
      warnings: ["No Recipe objects found in JSON-LD"]
    };
  }
  const bestRecipe = selectBestRecipe(recipes);
  if (!bestRecipe) {
    return {
      method: "json-ld",
      confidence: { overall: 0, title: 0, ingredients: 0, instructions: 0, metadata: 0 },
      data: {},
      warnings: ["Could not parse any valid recipe"]
    };
  }
  const host = extractHostname(url);
  const result = {
    title: bestRecipe.name || bestRecipe.title,
    ingredients: extractIngredientsUniversal(bestRecipe),
    instructions: extractInstructionsUniversal(bestRecipe),
    total_time: extractTimeUniversal(bestRecipe),
    yields: extractYieldUniversal(bestRecipe),
    image: normalizeImageUrl(bestRecipe.image),
    host
  };
  const confidence = calculateConfidence(result);
  warnings.push(...generateWarnings(result, confidence));
  return {
    method: "json-ld",
    confidence,
    data: result,
    warnings
  };
}
__name(extractFromJsonLdUniversal, "extractFromJsonLdUniversal");
function extractJsonLdScripts(html) {
  const pattern = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [];
  let match;
  while ((match = pattern.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}
__name(extractJsonLdScripts, "extractJsonLdScripts");
function parseJsonLdContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
__name(parseJsonLdContent, "parseJsonLdContent");
function findAllRecipes(jsonLdMatches) {
  const recipes = [];
  for (const content of jsonLdMatches) {
    const parsed = parseJsonLdContent(content);
    if (!parsed) continue;
    if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
      for (const item of parsed["@graph"]) {
        if (isRecipe(item)) recipes.push(item);
      }
    }
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (isRecipe(item)) recipes.push(item);
      }
    }
    if (isRecipe(parsed)) {
      recipes.push(parsed);
    }
  }
  return recipes;
}
__name(findAllRecipes, "findAllRecipes");
function isRecipe(item) {
  if (!item || typeof item !== "object") return false;
  const type = item["@type"];
  if (!type) return false;
  if (type === "Recipe") return true;
  if (Array.isArray(type) && type.includes("Recipe")) return true;
  return false;
}
__name(isRecipe, "isRecipe");
function selectBestRecipe(recipes) {
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
__name(selectBestRecipe, "selectBestRecipe");
function extractHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
__name(extractHostname, "extractHostname");
function extractIngredientsUniversal(recipe) {
  for (const fieldName of INGREDIENT_FIELD_VARIANTS) {
    const value = recipe[fieldName];
    if (value !== void 0) {
      const ingredients = parseIngredientsValue(value);
      if (ingredients.length > 0) {
        return ingredients;
      }
    }
  }
  return [];
}
__name(extractIngredientsUniversal, "extractIngredientsUniversal");
function parseIngredientsValue(value) {
  if (!value) return [];
  if (typeof value === "string") {
    return [cleanHtml(value)];
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") {
        return cleanHtml(item);
      }
      if (typeof item === "object" && item !== null) {
        return cleanHtml(item.text || item.name || item.item || String(item));
      }
      return String(item);
    }).filter(Boolean);
  }
  return [];
}
__name(parseIngredientsValue, "parseIngredientsValue");
function extractInstructionsUniversal(recipe) {
  for (const fieldName of INSTRUCTION_FIELD_VARIANTS) {
    const value = recipe[fieldName];
    if (value !== void 0) {
      const instructions = parseInstructionsValue(value);
      if (instructions) {
        return instructions;
      }
    }
  }
  return void 0;
}
__name(extractInstructionsUniversal, "extractInstructionsUniversal");
function parseInstructionsValue(value) {
  if (!value) return void 0;
  if (typeof value === "string") {
    return cleanHtml(value);
  }
  if (Array.isArray(value)) {
    return parseHowToSteps(value);
  }
  if (typeof value === "object" && value !== null) {
    if (value.itemListElement) {
      return parseHowToSteps(value.itemListElement);
    }
    if (value.text || value.description || value.name) {
      return cleanHtml(value.text || value.description || value.name);
    }
  }
  return void 0;
}
__name(parseInstructionsValue, "parseInstructionsValue");
function parseHowToSteps(steps) {
  if (!steps || !Array.isArray(steps)) return "";
  const parsedSteps = steps.map((step, index) => {
    if (step.itemListElement) {
      const sectionTitle = step.name ? `
### ${cleanHtml(step.name)}
` : "";
      return sectionTitle + parseHowToSteps(step.itemListElement);
    }
    const text = step.text || step.description || step.name;
    if (text) {
      return `${index + 1}. ${cleanHtml(text)}`;
    }
    return "";
  });
  return parsedSteps.filter(Boolean).join("\n\n");
}
__name(parseHowToSteps, "parseHowToSteps");
function extractTimeUniversal(recipe) {
  for (const fieldName of TIME_FIELD_VARIANTS) {
    const value = recipe[fieldName];
    if (value) {
      const parsed = parseIsoDuration(value);
      if (parsed) {
        return parsed;
      }
    }
  }
  return void 0;
}
__name(extractTimeUniversal, "extractTimeUniversal");
function extractYieldUniversal(recipe) {
  for (const fieldName of YIELD_FIELD_VARIANTS) {
    const value = recipe[fieldName];
    if (value) {
      if (typeof value === "string") {
        return cleanHtml(value);
      }
      if (typeof value === "object" && value !== null) {
        return cleanHtml(String(value.text || value.name || value.value));
      }
      return cleanHtml(String(value));
    }
  }
  return void 0;
}
__name(extractYieldUniversal, "extractYieldUniversal");
function getIngredientValue(recipe) {
  for (const fieldName of INGREDIENT_FIELD_VARIANTS) {
    const value = recipe[fieldName];
    if (value !== void 0) {
      const ingredients = parseIngredientsValue(value);
      if (ingredients.length > 0) {
        return ingredients;
      }
    }
  }
  return [];
}
__name(getIngredientValue, "getIngredientValue");
function getInstructionValue(recipe) {
  for (const fieldName of INSTRUCTION_FIELD_VARIANTS) {
    const value = recipe[fieldName];
    if (value !== void 0) {
      const instructions = parseInstructionsValue(value);
      if (instructions) {
        return instructions;
      }
    }
  }
  return void 0;
}
__name(getInstructionValue, "getInstructionValue");

// src/extractors/html.ts
function extractFromHtmlUniversal(html, url, config) {
  const warnings = [];
  const fullConfig = getDefaultConfig(config);
  const title = extractTitle(html, fullConfig);
  const ingredients = extractIngredients(html, fullConfig);
  const instructions = extractInstructions(html, fullConfig);
  const total_time = extractTime(html, fullConfig);
  const yields = extractYield(html, fullConfig);
  const image = extractImage(html);
  const host = extractHostname2(url);
  const result = {
    title,
    ingredients,
    instructions,
    total_time,
    yields,
    image,
    host
  };
  const confidence = calculateConfidence(result);
  warnings.push(...generateWarnings(result, confidence));
  return {
    method: "html",
    confidence,
    data: result,
    warnings
  };
}
__name(extractFromHtmlUniversal, "extractFromHtmlUniversal");
function getDefaultConfig(config) {
  return {
    ingredientSelectors: [
      '[class*="ingredient"]',
      '[id*="ingredient"]',
      ".ingredients",
      "#ingredients",
      "ul.ingredients",
      ".recipe-ingredients",
      '[itemprop="recipeIngredient"]'
    ],
    instructionSelectors: [
      '[class*="instruction"]',
      '[id*="instruction"]',
      ".instructions",
      ".directions",
      ".steps",
      ".method",
      '[itemprop="recipeInstructions"]',
      ".recipe-instructions",
      ".cooking-instructions"
    ],
    timeSelectors: [
      '[class*="time"]',
      '[class*="duration"]',
      ".prep-time",
      ".cook-time",
      ".total-time",
      '[itemprop="totalTime"]'
    ],
    yieldSelectors: [
      '[class*="yield"]',
      '[class*="serving"]',
      ".servings",
      ".yield",
      ".recipe-yield",
      '[itemprop="recipeYield"]'
    ],
    titleSelectors: [
      "h1",
      '[class*="title"]',
      '[class*="recipe-name"]',
      '[itemprop="name"]',
      ".recipe-title",
      ".entry-title"
    ],
    ...config
  };
}
__name(getDefaultConfig, "getDefaultConfig");
function extractTitle(html, config) {
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
  return void 0;
}
__name(extractTitle, "extractTitle");
function extractIngredients(html, config) {
  const ingredients = [];
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
  const commonPatterns = [
    /(?:ingredients?)[:\s]*<\/h[1-6][^>]*>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i,
    /(?:ingredients?)[:\s]*<\/h[1-6][^>]*>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i
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
  const genericLists = extractGenericLists(html);
  return genericLists;
}
__name(extractIngredients, "extractIngredients");
function extractListItems(html) {
  const items = [];
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
__name(extractListItems, "extractListItems");
function extractGenericLists(html) {
  const items = [];
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
__name(extractGenericLists, "extractGenericLists");
function extractInstructions(html, config) {
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
  const commonPatterns = [
    /(?:instructions?|directions?|steps?|method)[:\s]*<\/h[1-6][^>]*>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i,
    /(?:instructions?|directions?|steps?|method)[:\s]*<\/h[1-6][^>]*>\s*<div[^>]*class="[^"]*instructions?[^"]*"[^>]*>([\s\S]*?)<\/div>/i
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
  const stepsPattern = /(?:step|directions?)[:\s]*\d+[:\.]?\s*([^<\n]+)/gi;
  const steps = html.match(stepsPattern);
  if (steps && steps.length >= 3) {
    return steps.map((step, index) => `${index + 1}. ${cleanHtml(step)}`).join("\n\n");
  }
  return void 0;
}
__name(extractInstructions, "extractInstructions");
function parseInstructions(html) {
  const steps = [];
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
    return steps.map((step, index) => `${index + 1}. ${step}`).join("\n\n");
  }
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
    return steps.map((step, index) => `${index + 1}. ${step}`).join("\n\n");
  }
  const plainText = cleanHtml(html);
  return plainText.length > 10 ? plainText : void 0;
}
__name(parseInstructions, "parseInstructions");
function extractTime(html, config) {
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
  const timePatterns = [
    /(?:prep|cook|total)\s*time[:\s]*(\d+\s*(?:mins?|minutes?|hrs?|hours?|seconds?))/i,
    /(?:time|total\s*time)[:\s]*(\d+\s*(?:mins?|minutes?|hrs?|hours?))/i,
    /(\d+\s*(?:mins?|minutes?|hrs?|hours?))\s*(?:prep|cook|total)?/i,
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i
  ];
  for (const pattern of timePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return cleanHtml(match[1]);
    }
  }
  return void 0;
}
__name(extractTime, "extractTime");
function extractYield(html, config) {
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
  const yieldPatterns = [
    /(\d+)\s*(?:servings?|portions?|people|cups?)?/i,
    /yields?[:\s]*(\d+)/i,
    /makes?[:\s]*(\d+)/i,
    /serves?\s*(\d+)/i
  ];
  for (const pattern of yieldPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return `${match[1]} servings`;
    }
  }
  return void 0;
}
__name(extractYield, "extractYield");
function extractImage(html) {
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImage && ogImage[1]) {
    return ogImage[1];
  }
  const schemaImage = html.match(/<img[^>]*itemprop=["']image["'][^>]*src=["']([^"']+)["']/i);
  if (schemaImage && schemaImage[1]) {
    return schemaImage[1];
  }
  const firstImg = html.match(/<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp|svg)[^"']*)["']/i);
  if (firstImg && firstImg[1]) {
    return firstImg[1];
  }
  return void 0;
}
__name(extractImage, "extractImage");
function createSelectorPattern(selector) {
  let pattern = selector.replace(/[\.\#\:\[\]]/g, "\\$&").replace(/\\\*/g, ".*").replace(/\\\s/g, "\\s");
  return new RegExp(`<[^>]*class=["'][^"']*${pattern}[^"']*["'][^>]*>([^<]+)</[^>]+>`, "i");
}
__name(createSelectorPattern, "createSelectorPattern");
function extractHostname2(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
__name(extractHostname2, "extractHostname");

// src/index.ts
var ALLOWED_ORIGIN = "https://terrafork.pages.dev";
var ALLOWED_METHODS = "GET, OPTIONS";
var ALLOWED_HEADERS = "Content-Type";
var EXTRACTOR_CONFIG = {
  maxExtractionTime: 5e3,
  maxIngredients: 100,
  maxInstructionLength: 5e4,
  enableHeuristics: true,
  enableMicrodata: true,
  confidenceThreshold: 25
};
async function scrapeRecipeUniversal(url, html) {
  if (!html) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TerraFork/1.0; +https://terrafork.pages.dev)"
        }
      });
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch: ${response.status} ${response.statusText}`
        };
      }
      html = await response.text();
    } catch (fetchError) {
      return {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : "Unknown fetch error"
      };
    }
  }
  const jsonLdAttempt = extractFromJsonLdUniversal(html, url);
  const htmlAttempt = extractFromHtmlUniversal(html, url);
  let microdataAttempt = null;
  if (EXTRACTOR_CONFIG.enableMicrodata) {
    microdataAttempt = null;
  }
  const attempts = [jsonLdAttempt];
  if (htmlAttempt.confidence.overall > 0) {
    attempts.push(htmlAttempt);
  }
  if (microdataAttempt) {
    attempts.push(microdataAttempt);
  }
  const bestAttempt = selectBestExtraction(attempts, {
    confidenceThreshold: EXTRACTOR_CONFIG.confidenceThreshold
  });
  if (!bestAttempt || !bestAttempt.data) {
    return {
      success: false,
      error: "Could not extract recipe data from page",
      warnings: attempts.flatMap((a) => a.warnings)
    };
  }
  const recipe = {
    title: bestAttempt.data.title || "Untitled Recipe",
    total_time: bestAttempt.data.total_time,
    yields: bestAttempt.data.yields,
    image: bestAttempt.data.image,
    ingredients: bestAttempt.data.ingredients || [],
    instructions: bestAttempt.data.instructions || "",
    nutrients: bestAttempt.data.nutrients,
    host: bestAttempt.data.host
  };
  const metadata = {
    confidence: bestAttempt.confidence,
    extractionMethod: bestAttempt.method,
    fieldsExtracted: getExtractedFields(bestAttempt.data),
    fieldsMissing: getMissingFields(bestAttempt.data),
    warnings: bestAttempt.warnings,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    url
  };
  return {
    success: true,
    data: {
      ...recipe,
      _metadata: metadata
    },
    warnings: bestAttempt.warnings,
    metadata
  };
}
__name(scrapeRecipeUniversal, "scrapeRecipeUniversal");
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
function getExtractedFields(data) {
  const fields = [];
  if (data.title) fields.push("title");
  if (data.total_time) fields.push("total_time");
  if (data.yields) fields.push("yields");
  if (data.image) fields.push("image");
  if (data.ingredients && data.ingredients.length > 0) fields.push("ingredients");
  if (data.instructions) fields.push("instructions");
  if (data.nutrients) fields.push("nutrients");
  if (data.host) fields.push("host");
  return fields;
}
__name(getExtractedFields, "getExtractedFields");
function getMissingFields(data) {
  const fields = [];
  if (!data.title) fields.push("title");
  if (!data.ingredients || data.ingredients.length === 0) fields.push("ingredients");
  if (!data.instructions) fields.push("instructions");
  return fields;
}
__name(getMissingFields, "getMissingFields");
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
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "terrafork-universal-scraper",
          version: "2.0.0",
          features: [
            "json-ld-extraction",
            "html-structure-extraction",
            "confidence-scoring",
            "24h-caching"
          ]
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders()
          }
        }
      );
    }
    if (url.pathname === "/scrape") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        return new Response(
          JSON.stringify({ error: "Missing url parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...getCorsHeaders()
            }
          }
        );
      }
      try {
        const validatedUrl = validateUrl(targetUrl);
        const result = await scrapeRecipeUniversal(validatedUrl);
        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: result.error,
              warnings: result.warnings
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...getCorsHeaders()
              }
            }
          );
        }
        return new Response(JSON.stringify(result.data), {
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(),
            "Cache-Control": "public, max-age=86400, s-maxage=86400"
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const statusCode = errorMessage.includes("Invalid") || errorMessage.includes("Cannot scrape") ? 400 : 500;
        return new Response(
          JSON.stringify({
            error: "Failed to scrape recipe",
            details: errorMessage
          }),
          {
            status: statusCode,
            headers: {
              "Content-Type": "application/json",
              ...getCorsHeaders()
            }
          }
        );
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

// .wrangler/tmp/bundle-CZY7jI/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-CZY7jI/middleware-loader.entry.ts
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
  middleware_loader_entry_default as default,
  scrapeRecipeUniversal,
  validateUrl
};
//# sourceMappingURL=index.js.map
