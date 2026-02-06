<script lang="ts">
    import { type Recipe } from '@forkzero/core-types';
    import { getAllRecipes, deleteRecipe, initDb } from '$lib/db';
    import { onMount } from 'svelte';
    
    // Svelte 5 Runes
    let recipes = $state<Recipe[]>([]);
    let loading = $state(true);
    let deletingId = $state<string | null>(null);

    onMount(async () => {
        await initDb();
        await loadRecipes();
    });

    async function loadRecipes() {
        loading = true;
        try {
            recipes = await getAllRecipes();
        } catch (e) {
            console.error("Failed to load recipes:", e);
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        deletingId = id;
        try {
            await deleteRecipe(id);
            await loadRecipes();
        } catch (e) {
            console.error("Failed to delete:", e);
        } finally {
            deletingId = null;
        }
    }
</script>

<main class="container mx-auto px-4 py-12 max-w-4xl">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-black tracking-tight text-white">
            My Saved Recipes
        </h1>
        <a 
            href="/" 
            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm transition-colors"
        >
            + Fork New
        </a>
    </div>

    {#if loading}
        <div class="text-center py-12">
            <div class="animate-pulse text-zinc-400">Loading your recipes...</div>
        </div>
    {:else if recipes.length === 0}
        <div class="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <p class="text-xl text-zinc-400 mb-4">No recipes saved yet</p>
            <a href="/" class="text-emerald-400 hover:text-emerald-300">
                Go fork your first recipe →
            </a>
        </div>
    {:else}
        <div class="grid gap-4">
            {#each recipes as recipe}
                <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h2 class="text-xl font-bold text-white mb-2">{recipe.title}</h2>
                            <div class="flex gap-4 text-sm text-zinc-400 mb-3">
                                <span>⏱ {recipe.total_time || 'N/A'}</span>
                                <span>🍽 {recipe.yields || 'N/A'}</span>
                                <span class="text-zinc-500">• {recipe.ingredients.length} ingredients</span>
                            </div>
                            <p class="text-sm text-zinc-500 truncate">
                                Source: {recipe.host || new URL(recipe.url).hostname}
                            </p>
                        </div>
                        <button
                            onclick={() => handleDelete(recipe.id)}
                            disabled={deletingId === recipe.id}
                            class="ml-4 px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded text-sm transition-colors disabled:opacity-50"
                        >
                            {deletingId === recipe.id ? '...' : '🗑'}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
        
        <div class="mt-8 text-center text-zinc-500 text-sm">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} stored locally (Green Code: Zero Server)
        </div>
    {/if}
</main>