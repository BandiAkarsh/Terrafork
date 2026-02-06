<script lang="ts">
  import { page } from '$app/stores';
  
  const menuItems = [
    { href: '/', label: 'Fork Recipe', icon: '⚡' },
    { href: '/saved', label: 'My Recipes', icon: '📚' }
  ];
</script>

<aside class="hidden md:flex flex-col w-64 h-screen glass-sidebar">
  <div class="p-6">
    <h1 class="text-2xl font-bold text-emerald-400">TerraFork</h1>
    <p class="text-xs text-zinc-500 mt-1">Green Code Recipe Manager</p>
  </div>
  
  <nav class="flex-1 px-4">
    {#each menuItems as item}
      <a
        href={item.href}
        class="menu-item"
        class:active={$page.url.pathname === item.href}
      >
        <span class="icon">{item.icon}</span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
  
  <div class="p-4">
    <div class="glass-card p-4 text-center">
      <div class="text-emerald-400 text-2xl">🌱</div>
      <p class="text-xs text-zinc-400 mt-2">95% cleaner than average</p>
    </div>
  </div>
</aside>

<style>
  .glass-sidebar {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .menu-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
    transform: translateX(4px);
  }
  
  .menu-item.active {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  .icon {
    font-size: 1.25rem;
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
  }
</style>
