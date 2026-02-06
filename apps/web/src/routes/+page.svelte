<script lang="ts">
    import { type Recipe } from '@forkzero/core-types';
    import { saveRecipe, initDb } from '$lib/db';
    import { onMount } from 'svelte';
    
    // Svelte 5 Runes
    let url = $state("");
    let loading = $state(false);
    let error = $state<string | null>(null);
    let recipe = $state<Recipe | null>(null);
    let saving = $state(false);
    let saveSuccess = $state(false);
    let dbReady = $state(false);

    // Initialize DB on mount
    onMount(async () => {
        await initDb();
        dbReady = true;
    });

    // Green Code: Determine backend URL
    const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000' 
        : 'https://forkzero-scraper.yourname.workers.dev';

    async function handleFork() {
        if (!url) return;
        
        loading = true;
        error = null;
        recipe = null;
        saveSuccess = false;

        try {
            const res = await fetch(`${API_BASE}/scrape?url=${encodeURIComponent(url)}`);
            
            if (!res.ok) {
                throw new Error(await res.text() || 'Failed to fork recipe');
            }

            const data = await res.json();
            // Generate ID for the recipe
            recipe = {
                ...data,
                id: crypto.randomUUID(),
                url: url
            };
            
            console.log("Green Code: Recipe fetched with cached headers:", res.headers.get('Cache-Control'));

        } catch (e) {
            console.error(e);
            error = e instanceof Error ? e.message : "Unknown error";
        } finally {
            loading = false;
        }
    }

    async function handleSave() {
        if (!recipe) return;
        
        saving = true;
        saveSuccess = false;
        
        try {
            await saveRecipe(recipe);
            saveSuccess = true;
            console.log("Green Code: Recipe saved locally (Zero Server)");
        } catch (e) {
            console.error("Failed to save:", e);
            error = "Failed to save recipe";
        } finally {
            saving = false;
        }
    }
</script>

<main class="container mx-auto px-4 py-12 max-w-2xl">
    <div class="text-center space-y-6">
        <div class="flex justify-center items-center gap-4">
            <h1 class="text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                ForkZero
            </h1>
            <a 
                href="/saved" 
                class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
                📚 My Recipes
            </a>
        </div>
        
        <p class="text-xl text-zinc-400 font-medium">
            The Anti-Cloud Recipe Manager.
            <span class="block text-sm mt-2 opacity-70">Fork the web. Zero tracking. Zero ads.</span>
        </p>

        <div class="mt-8 flex gap-2">
            <input 
                bind:value={url}
                type="url" 
                placeholder="Paste recipe URL here..." 
                onkeydown={(e) => e.key === 'Enter' && handleFork()}
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
                disabled={loading}
            />
            <button 
                onclick={handleFork}
                disabled={loading}
                class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold rounded-lg transition-colors"
            >
                {loading ? 'Forking...' : 'Fork'}
            </button>
        </div>

        {#if error}
            <div class="p-4 bg-red-900/20 border border-red-900/50 text-red-200 rounded-lg">
                {error}
            </div>
        {/if}

        {#if recipe}
            <div class="mt-12 text-left bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-3xl font-bold text-white">{recipe.title}</h2>
                    <button
                        onclick={handleSave}
                        disabled={saving || !dbReady}
                        class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                        {#if saveSuccess}
                            ✅ Saved
                        {:else}
                            {saving ? 'Saving...' : '💾 Save'}
                        {/if}
                    </button>
                </div>
                
                <div class="flex gap-4 text-sm text-zinc-400 mb-8">
                    <span>⏱ {recipe.total_time || 'N/A'}</span>
                    <span>🍽 {recipe.yields || 'N/A'}</span>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-lg font-semibold text-emerald-400 mb-4">Ingredients</h3>
                        <ul class="space-y-2">
                            {#each recipe.ingredients as ingredient}
                                <li class="text-zinc-300 border-b border-zinc-800/50 pb-2">{ingredient}</li>
                            {/each}
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-emerald-400 mb-4">Instructions</h3>
                        <div class="text-zinc-300 space-y-4 whitespace-pre-wrap leading-relaxed">
                            {recipe.instructions}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>