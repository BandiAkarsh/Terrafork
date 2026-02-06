<script lang="ts">
    import { type Recipe } from '@forkzero/core-types';
    import { getAllRecipes, deleteRecipe, initDb, exportAllRecipes } from '$lib/db';
    import { onMount } from 'svelte';
    import QRCode from 'qrcode';
    import { compressToEncodedURIComponent } from 'lz-string';
    
    // Svelte 5 Runes
    let recipes = $state<Recipe[]>([]);
    let loading = $state(true);
    let deletingId = $state<string | null>(null);
    let showQR = $state(false);
    let qrDataUrl = $state('');
    let isExporting = $state(false);
    
    const isDev = import.meta.env.DEV;

    onMount(() => {
        let cancelled = false;
        
        (async () => {
            await initDb();
            if (!cancelled) {
                await loadRecipes();
            }
        })();
        
        // Green Code: Cleanup prevents state updates on unmounted component
        return () => { cancelled = true; };
    });

    async function loadRecipes() {
        loading = true;
        try {
            recipes = await getAllRecipes();
        } catch (e) {
            if (isDev) console.error("Failed to load recipes:", e);
        } finally {
            loading = false;
        }
    }

    // Green Code: Local state update instead of full reload (O(1) vs O(n))
    async function handleDelete(id: string) {
        deletingId = id;
        try {
            await deleteRecipe(id);
            // Green Code: Local state update - no DB re-fetch
            recipes = recipes.filter(r => r.id !== id);
        } catch (e) {
            if (isDev) console.error("Failed to delete:", e);
        } finally {
            deletingId = null;
        }
    }
    
    // 2026 Feature: QR Code Sync (Zero-server device communication)
    async function generateQR() {
        isExporting = true;
        try {
            const allRecipes = await exportAllRecipes();
            // Green Code: Compress data to minimize QR size (less scanning energy)
            const compressed = compressToEncodedURIComponent(JSON.stringify(allRecipes));
            // Generate QR code with medium error correction
            qrDataUrl = await QRCode.toDataURL(compressed, {
                width: 400,
                margin: 2,
                errorCorrectionLevel: 'M' // Medium (good balance of density/reliability)
            });
            showQR = true;
        } catch (e) {
            if (isDev) console.error("Failed to generate QR:", e);
        } finally {
            isExporting = false;
        }
    }
</script>

<main class="container mx-auto px-4 py-12 max-w-4xl">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-black tracking-tight text-white">
            My Saved Recipes
        </h1>
        <div class="flex gap-2">
            <button
                onclick={generateQR}
                disabled={isExporting || recipes.length === 0}
                class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
                {isExporting ? 'Generating...' : '📱 Sync to Phone'}
            </button>
            <a 
                href="/" 
                class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm transition-colors"
            >
                + Fork New
            </a>
        </div>
    </div>

    {#if showQR}
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onclick={() => showQR = false}>
            <div class="bg-zinc-900 p-8 rounded-2xl max-w-md w-full" onclick={(e) => e.stopPropagation()}>
                <h2 class="text-xl font-bold text-white mb-4 text-center">Scan with Your Phone</h2>
                <img src={qrDataUrl} alt="QR Code" class="w-full rounded-lg" />
                <p class="text-zinc-400 text-sm mt-4 text-center">
                    This QR code contains all your recipes compressed.<br>
                    Zero server communication - completely private.
                </p>
                <button 
                    onclick={() => showQR = false}
                    class="w-full mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    {/if}

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
            {#each recipes as recipe (recipe.id)}
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
                                Source: {recipe.host || 'Unknown'}
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
