<script lang="ts">
  import "../app.css";
  import { onMount } from 'svelte';
  import { initDeviceDetection, isMobile } from '$lib/stores/device';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import BottomNav from '$lib/components/layout/BottomNav.svelte';
  
  onMount(() => {
    return initDeviceDetection();
  });
</script>

<div class="app-container">
  <!-- Desktop Sidebar -->
  <Sidebar />
  
  <!-- Main Content -->
  <main class="main-content">
    <div class="aurora-bg min-h-screen">
      <slot />
    </div>
  </main>
  
  <!-- Mobile Bottom Navigation -->
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
    transition: margin-left 0.3s ease;
  }
  
  /* Desktop: Account for sidebar */
  @media (min-width: 768px) {
    .main-content {
      margin-left: 0;
    }
  }
  
  /* Mobile: Account for bottom nav */
  @media (max-width: 767px) {
    .main-content {
      padding-bottom: 80px; /* Space for bottom nav */
    }
  }
</style>
