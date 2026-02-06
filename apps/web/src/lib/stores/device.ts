import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Device type store
export const isMobile = writable(false);
export const batteryLevel = writable(100);
export const isLowPower = writable(false);

// Initialize on mount
export function initDeviceDetection() {
  if (!browser) return;
  
  // Check mobile
  const checkMobile = () => {
    isMobile.set(window.innerWidth < 768);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  // Battery API
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      const updateBattery = () => {
        const level = battery.level * 100;
        batteryLevel.set(level);
        isLowPower.set(level < 20);
      };
      
      updateBattery();
      battery.addEventListener('levelchange', updateBattery);
    });
  }
  
  return () => {
    window.removeEventListener('resize', checkMobile);
  };
}
