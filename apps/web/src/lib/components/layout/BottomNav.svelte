<script lang="ts">
  import { page } from '$app/stores';
  
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/', label: 'Fork', icon: '⚡', isAction: true },
    { href: '/saved', label: 'Recipes', icon: '📚' }
  ];
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden">
  <div class="glass-nav-mobile">
    <div class="flex justify-around items-center h-16">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-item"
          class:active={$page.url.pathname === item.href}
          class:action={item.isAction}
          aria-label={item.label}
        >
          <span class="icon" aria-hidden="true">{item.icon}</span>
          {#if !item.isAction}
            <span class="label">{item.label}</span>
          {/if}
        </a>
      {/each}
    </div>
  </div>
</nav>

<style>
  .glass-nav-mobile {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: all 0.2s ease;
  }
  
  .nav-item.active {
    color: #10b981;
  }
  
  .nav-item.action {
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    margin-top: -20px;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    color: white;
  }
  
  .icon {
    font-size: 1.25rem;
    line-height: 1;
  }
  
  .label {
    font-size: 0.625rem;
    margin-top: 0.25rem;
  }
</style>
