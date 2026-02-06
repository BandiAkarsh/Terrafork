import { describe, it, expect } from "vitest";
import type { Recipe } from "@terrafork/core-types";

describe("Recipe Type", () => {
  describe("Recipe creation", () => {
    it("should create a valid recipe object", () => {
      const recipe: Recipe = {
        id: "test-id-123",
        title: "Test Recipe",
        total_time: "30 mins",
        yields: "4 servings",
        ingredients: ["1 cup flour", "2 eggs", "1/2 cup milk"],
        instructions: "Mix all ingredients and bake at 350F for 20 minutes.",
        url: "https://example.com/test-recipe",
      };

      expect(recipe.id).toBe("test-id-123");
      expect(recipe.title).toBe("Test Recipe");
      expect(recipe.ingredients).toHaveLength(3);
      expect(recipe.url).toBe("https://example.com/test-recipe");
    });

    it("should allow optional fields to be undefined", () => {
      const minimalRecipe: Recipe = {
        id: "minimal-id",
        title: "Minimal Recipe",
        ingredients: ["ingredient1"],
        instructions: "Do something",
        url: "https://example.com/minimal",
      };

      expect(minimalRecipe.total_time).toBeUndefined();
      expect(minimalRecipe.yields).toBeUndefined();
      expect(minimalRecipe.image).toBeUndefined();
      expect(minimalRecipe.nutrients).toBeUndefined();
      expect(minimalRecipe.host).toBeUndefined();
    });

    it("should handle nutrients as a record", () => {
      const recipeWithNutrients: Recipe = {
        id: "nutrients-id",
        title: "Nutritious Recipe",
        ingredients: ["item1"],
        instructions: "Prepare it",
        url: "https://example.com/nutritious",
        nutrients: {
          calories: "200",
          protein: "10g",
          carbs: "25g",
          fat: "8g",
        },
      };

      expect(recipeWithNutrients.nutrients).toBeDefined();
      expect(recipeWithNutrients.nutrients?.calories).toBe("200");
      expect(Object.keys(recipeWithNutrients.nutrients!)).toHaveLength(4);
    });
  });

  describe("Recipe validation", () => {
    it("should validate required fields", () => {
      const recipe: Recipe = {
        id: "validation-test",
        title: "Validation Test",
        ingredients: ["a", "b", "c"],
        instructions: "Test instructions",
        url: "https://test.com/recipe",
      };

      expect(recipe.id).toBeTruthy();
      expect(recipe.title).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.instructions).toBeTruthy();
      expect(recipe.url).toMatch(/^https?:\/\//);
    });

    it("should handle empty ingredients array", () => {
      const recipe: Recipe = {
        id: "empty-ingredients",
        title: "Empty Ingredients Recipe",
        ingredients: [],
        instructions: "No ingredients needed",
        url: "https://example.com/empty",
      };

      expect(recipe.ingredients).toEqual([]);
    });
  });
});
