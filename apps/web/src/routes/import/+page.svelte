<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { decompressFromEncodedURIComponent } from 'lz-string';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import BottomNav from '$lib/components/layout/BottomNav.svelte';
  import { saveRecipe, getAllRecipes, deleteRecipe, initDb, exportAllRecipes } from '$lib/db';

  let error = $state<string | null>(null);
  let loading = $state(true);
  let importedRecipes = $state<any[]>([]);
  let importStatus = $state<{ [key: string]: string }>({});

  onMount(async () => {
    if (!browser) return;

    try {
      const dataParam = $page.url.searchParams.get('data');

      if (!dataParam) {
        error = 'No recipe data found in URL. Please scan a valid TerraFork QR code.';
        loading = false;
        return;
      }

      const decompressed = decompressFromEncodedURIComponent(dataParam);

      if (!decompressed) {
        error = 'Failed to decode recipe data. The QR code may be corrupted.';
        loading = false;
        return;
      }

      const recipes = JSON.parse(decompressed);

      if (!Array.isArray(recipes) || recipes.length === 0) {
        error = 'No recipes found in the QR code data.';
        loading = false;
        return;
      }

      importedRecipes = recipes;
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to parse recipe data';
    } finally {
      loading = false;
    }
  });

  async function importRecipe(recipe: any) {
    try {
      await saveRecipe(recipe);
      importStatus[recipe.id] = 'imported';
    } catch (e) {
      importStatus[recipe.id] = 'error';
    }
  }

  async function importAll() {
    for (const recipe of importedRecipes) {
      await importRecipe(recipe);
    }
  }

  function goHome() {
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>Import Recipes - TerraFork</title>
</svelte:head>

<div class="app-container">
  <Sidebar />

  <main class="main-content">
    <div class="aurora-bg min-h-screen">
      <div class="container mx-auto px-4 py-8 max-w-2xl">
        <div class="glass-card p-6 md:p-8">
          <h1 class="text-3xl font-bold text-white mb-6">📥 Import Recipes</h1>

          {#if loading}
            <div class="text-center py-12">
              <div class="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
              <p class="text-zinc-400">Decoding recipes from QR code...</p>
            </div>
          {:else if error}
            <div class="mt-4 p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl">
              <p class="font-medium">Error</p>
              <p class="text-sm mt-1">{error}</p>
            </div>
            <button onclick={goHome} class="btn-primary mt-6">
              ← Go to Home
            </button>
          {:else}
            <p class="text-zinc-400 mb-6">
              Found {importedRecipes.length} recipe{importedRecipes.length !== 1 ? 's' : ''} in the QR code.
              {' '}
              <span class="text-emerald-400">Green Code: Data stored locally, zero server communication.</span>
            </p>

            <div class="space-y-4 mb-6">
              {#each importedRecipes as recipe}
                <div class="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-white">{recipe.title}</h3>
                    {#if importStatus[recipe.id] === 'imported'}
                      <span class="text-emerald-400 text-sm">✓ Imported</span>
                    {:else if importStatus[recipe.id] === 'error'}
                      <span class="text-red-400 text-sm">✗ Error</span>
                    {/if}
                  </div>
                  <div class="text-sm text-zinc-400 mb-2">
                    <span>⏱ {recipe.total_time || 'N/A'}</span>
                    <span class="mx-2">•</span>
                    <span>🍽 {recipe.yields || 'N/A'}</span>
                    <span class="mx-2">•</span>
                    <span>🥗 {recipe.ingredients.length} ingredients</span>
                  </div>
                  {#if recipe.host}
                    <p class="text-xs text-zinc-500">Source: {recipe.host}</p>
                  {/if}
                </div>
              {/each}
            </div>

            <div class="flex flex-col gap-3">
              <button onclick={importAll} class="btn-primary">
                📥 Import All Recipes
              </button>
              <button onclick={goHome} class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                ← Back to Home
              </button>
            </div>
          {/if}
        </div>

        <div class="mt-8 glass-card p-6 md:p-8">
          <h2 class="text-xl font-bold text-white mb-4">🌱 About TerraFork Import</h2>
          <div class="text-zinc-400 space-y-3 text-sm">
            <p>
              <strong class="text-emerald-400">How it works:</strong>
              TerraFork uses QR codes to transfer recipes between devices without any server storage.
              All your recipes stay on your device, respecting your privacy.
            </p>
            <p>
              <strong class="text-emerald-400">Privacy First:</strong>
              The data in this QR code is compressed locally and can only be decoded by TerraFork.
              No cloud servers, no tracking, no accounts - just recipes.
            </p>
          </div>
        </div>
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
