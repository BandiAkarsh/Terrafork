<script lang="ts">
    import { type Recipe } from '@terrafork/core-types';
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
    
    // Green Code: Environment-guarded logging
    const isDev = import.meta.env.DEV;

    // Green Code: Initialize DB with cleanup
    onMount(() => {
        let cancelled = false;
        
        (async () => {
            await initDb();
            if (!cancelled) dbReady = true;
        })();
        
        return () => { cancelled = true; };
    });

    // Green Code: Determine backend URL
    const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000' 
        : 'https://terrafork-scraper.akarshbandi82.workers.dev';

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
            recipe = {
                ...data,
                id: crypto.randomUUID(),
                url: url
            };
            
            if (isDev) {
                console.log("Green Code: Recipe fetched with cached headers:", res.headers.get('Cache-Control'));
            }

        } catch (e) {
            if (isDev) console.error(e);
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
            if (isDev) console.log("Green Code: Recipe saved locally (Zero Server)");
        } catch (e) {
            if (isDev) console.error("Failed to save:", e);
            error = "Failed to save recipe";
        } finally {
            saving = false;
        }
    }
</script>

<!-- Mobile Header (hidden on desktop) -->
<div class="md:hidden pt-6 pb-4 px-4 text-center">
    <h1 class="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
        TerraFork
    </h1>
    <p class="text-sm text-zinc-500 mt-1">The Anti-Cloud Recipe Manager</p>
</div>

<main class="container mx-auto px-4 py-6 md:py-12 max-w-2xl">
    <div class="text-center space-y-6">
        <!-- Desktop Header (hidden on mobile) -->
        <div class="hidden md:block">
            <h1 class="text-6xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                TerraFork
            </h1>
            <p class="text-xl text-zinc-400 font-medium">
                The Anti-Cloud Recipe Manager
                <span class="block text-sm mt-2 opacity-70">🌱 Greener than 95% of sites • Zero tracking • Zero ads</span>
            </p>
        </div>

        <!-- Main Glass Card -->
        <div class="glass-card p-6 md:p-10 mt-8">
            <h2 class="text-lg font-semibold text-zinc-300 mb-4 md:hidden">Paste a recipe URL</h2>
            
            <div class="flex flex-col md:flex-row gap-3">
                <input 
                    bind:value={url}
                    type="url" 
                    placeholder="Paste recipe URL here..." 
                    onkeydown={(e) => e.key === 'Enter' && handleFork()}
                    class="glass-input flex-1"
                    disabled={loading}
                />
                <button 
                    onclick={handleFork}
                    disabled={loading}
                    class="btn-primary whitespace-nowrap"
                >
                    {loading ? '⚡ Forking...' : '⚡ Fork'}
                </button>
            </div>

            {#if error}
                <div class="mt-4 p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl">
                    {error}
                </div>
            {/if}
        </div>

        <!-- Recipe Result Card -->
        {#if recipe}
            <div class="glass-card p-6 md:p-8 text-left mt-8 animate-fade-in">
                <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h2 class="text-2xl md:text-3xl font-bold text-white">{recipe.title}</h2>
                        <p class="text-sm text-zinc-500 mt-1">Source: {recipe.host || 'Unknown'}</p>
                    </div>
                    <button
                        onclick={handleSave}
                        disabled={saving || !dbReady}
                        class="btn-primary text-sm py-2 px-4"
                    >
                        {#if saveSuccess}
                            ✅ Saved!
                        {:else}
                            {saving ? '💾 Saving...' : '💾 Save Recipe'}
                        {/if}
                    </button>
                </div>
                
                <div class="flex flex-wrap gap-4 text-sm text-zinc-400 mb-8">
                    {#if recipe.total_time}
                        <span class="glass-card px-3 py-1 text-xs">⏱ {recipe.total_time}</span>
                    {/if}
                    {#if recipe.yields}
                        <span class="glass-card px-3 py-1 text-xs">🍽 {recipe.yields}</span>
                    {/if}
                    <span class="glass-card px-3 py-1 text-xs">🥗 {recipe.ingredients.length} ingredients</span>
                </div>

                <div class="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div class="glass-card p-4 md:p-6">
                        <h3 class="text-lg font-semibold text-emerald-400 mb-4">Ingredients</h3>
                        <ul class="space-y-3">
                            {#each recipe.ingredients as ingredient}
                                <li class="text-zinc-300 text-sm flex items-start gap-2">
                                    <span class="text-emerald-500 mt-1">•</span>
                                    <span>{ingredient}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                    
                    <div class="glass-card p-4 md:p-6">
                        <h3 class="text-lg font-semibold text-emerald-400 mb-4">Instructions</h3>
                        <div class="text-zinc-300 text-sm space-y-3 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-2">
                            {recipe.instructions}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-fade-in {
        animation: fade-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    
    /* Scrollbar styling for instructions */
    .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.3);
        border-radius: 3px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: rgba(16, 185, 129, 0.5);
    }
</style>
