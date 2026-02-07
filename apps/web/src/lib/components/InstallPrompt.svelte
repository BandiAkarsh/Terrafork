<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let showPrompt = $state(false);
  let deferredPrompt: any = $state(null);
  let dismissed = $state(false);

  onMount(() => {
    if (!browser) return;

    // Check if already installed or dismissed
    const isInstalled = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';

    if (isInstalled || dismissed) return;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      showPrompt = true;
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      showPrompt = false;
      deferredPrompt = null;
    });
  });

  async function install() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      showPrompt = false;
    }

    deferredPrompt = null;
  }

  function dismiss() {
    showPrompt = false;
    dismissed = true;
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
</script>

{#if showPrompt}
  <div class="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom">
    <div class="glass-card p-4 mx-4 flex flex-col gap-3 shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
          <span class="text-2xl">🌱</span>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-white">Install TerraFork</h3>
          <p class="text-sm text-zinc-400">Add to home screen for offline access</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick={install} class="btn-primary flex-1">
          📱 Install
        </button>
        <button onclick={dismiss} class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
          Later
        </button>
      </div>
    </div>
  </div>
{/if}
