<script>
    // Svelte 5 Runes
    let url = $state("");
</script>

<main class="container mx-auto px-4 py-12 max-w-2xl">
    <div class="text-center space-y-6">
        <h1 class="text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            ForkZero
        </h1>
        <p class="text-xl text-zinc-400 font-medium">
            The Anti-Cloud Recipe Manager.
            <span class="block text-sm mt-2 opacity-70">Fork the web. Zero tracking. Zero ads.</span>
        </p>

        <div class="mt-8 flex gap-2">
            <input 
                bind:value={url}
                type="url" 
                placeholder="Paste recipe URL here..." 
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-colors">
                Fork
            </button>
        </div>
    </div>
</main>