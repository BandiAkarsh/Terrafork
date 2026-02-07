<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { decompressFromEncodedURIComponent } from 'lz-string';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import BottomNav from '$lib/components/layout/BottomNav.svelte';
  import { saveRecipe, initDb } from '$lib/db';

  let error = $state<string | null>(null);
  let loading = $state(true);
  let recipe = $state<any>(null);
  let importStatus = $state<'idle' | 'importing' | 'imported' | 'error'>('idle');

  onMount(async () => {
    if (!browser) return;

    try {
      await initDb();
      const dataParam = $page.url.searchParams.get('data');

      if (!dataParam) {
        error = 'No recipe data found. Please scan a valid TerraFork recipe QR code.';
        loading = false;
        return;
      }

      const decompressed = decompressFromEncodedURIComponent(dataParam);

      if (!decompressed) {
        error = 'Failed to decode recipe data. The QR code may be corrupted.';
        loading = false;
        return;
      }

      recipe = JSON.parse(decompressed);
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to parse recipe data';
    } finally {
      loading = false;
    }
  });

  async function importRecipe() {
    if (!recipe) return;

    importStatus = 'importing';
    try {
      await saveRecipe(recipe);
      importStatus = 'imported';
    } catch (e) {
      importStatus = 'error';
    }
  }

  function goHome() {
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>{recipe?.title || 'Import Recipe'} - TerraFork</title>
</svelte:head>

<div class="app-container">
  <Sidebar />

  <main class="main-content">
    <div class="aurora-bg min-h-screen">
      <div class="container mx-auto px-4 py-8 max-w-2xl">
        {#if loading}
          <div class="glass-card p-8 text-center">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
            <p class="text-zinc-400">Decoding recipe...</p>
          </div>
        {:else if error}
          <div class="glass-card p-6">
            <div class="mt-4 p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl">
              <p class="font-medium">Error</p>
              <p class="text-sm mt-1">{error}</p>
            </div>
            <button onclick={goHome} class="btn-primary mt-6">
              ← Go to Home
            </button>
          </div>
        {:else if recipe}
          <div class="glass-card p-6 md:p-8">
            <h1 class="text-3xl font-bold text-white mb-6">📥 Import Recipe</h1>

            <div class="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 mb-6">
              <h2 class="text-2xl font-semibold text-white mb-4">{recipe.title}</h2>

              <div class="flex flex-wrap gap-4 text-sm text-zinc-400 mb-4">
                <span>⏱ {recipe.total_time || 'N/A'}</span>
                <span>🍽 {recipe.yields || 'N/A'}</span>
                <span>🥗 {recipe.ingredients.length} ingredients</span>
              </div>

              {#if recipe.host}
                <p class="text-sm text-zinc-500 mb-4">Source: {recipe.host}</p>
              {/if}

              {#if recipe.image}
                <img src={recipe.image} alt={recipe.title} class="w-full rounded-lg mb-4" />
              {/if}

              <div class="mb-4">
                <h3 class="text-lg font-semibold text-emerald-400 mb-2">Ingredients</h3>
                <ul class="list-disc list-inside text-zinc-300 space-y-1">
                  {#each recipe.ingredients.slice(0, 5) as ingredient}
                    <li>{ingredient}</li>
                  {/each}
                  {#if recipe.ingredients.length > 5}
                    <li class="text-zinc-500">...and {recipe.ingredients.length - 5} more</li>
                  {/if}
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-semibold text-emerald-400 mb-2">Instructions</h3>
                <p class="text-zinc-300 text-sm whitespace-pre-wrap line-clamp-6">
                  {recipe.instructions}
                </p>
              </div>
            </div>

            {#if importStatus === 'imported'}
              <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 text-emerald-200 rounded-xl mb-4">
                ✓ Recipe imported successfully!
              </div>
              <div class="flex flex-col gap-3">
                <a href="/saved" class="btn-primary text-center">
                  View My Recipes
                </a>
                <button onclick={goHome} class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                  ← Fork More Recipes
                </button>
              </div>
            {:else}
              <div class="flex flex-col gap-3">
                <button
                  onclick={importRecipe}
                  disabled={importStatus === 'importing'}
                  class="btn-primary disabled:opacity-50"
                >
                  {importStatus === 'importing' ? '📥 Importing...' : '📥 Import This Recipe'}
                </button>
                <button onclick={goHome} class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                  ← Cancel
                </button>
              </div>
            {/if}
          </div>

          <div class="mt-8 glass-card p-6">
            <h2 class="text-xl font-bold text-white mb-4">🌱 About TerraFork</h2>
            <div class="text-zinc-400 space-y-2 text-sm">
              <p>
                <strong class="text-emerald-400">Privacy First:</strong>
                This recipe is stored locally on your device. No cloud servers, no tracking.
              </p>
              <p>
                <strong class="text-emerald-400">Offline Access:</strong>
                Add TerraFork to your home screen to access recipes anytime, even without internet.
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </main>

  <BottomNav />
</div>

<style>
  .app-container {
    display: flex;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
    margin-left: 0;
  }

  @media (max-width: 767px) {
    .main-content {
      padding-bottom: 80px;
    }
  }
</style>
