import { writable } from "svelte/store";
import { browser } from "$app/environment";

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
  window.addEventListener("resize", checkMobile);

  // Battery API
  if ("getBattery" in navigator) {
    interface BatteryManager extends EventTarget {
      charging: boolean;
      chargingTime: number;
      dischargingTime: number;
      level: number;
      onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
      onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
    }

    interface NavigatorWithBattery extends Navigator {
      getBattery?: () => Promise<BatteryManager>;
    }

    const batteryPromise = (navigator as NavigatorWithBattery).getBattery?.();
    if (batteryPromise) {
      batteryPromise.then((battery: BatteryManager) => {
        const updateBattery = () => {
          const level = battery.level * 100;
          batteryLevel.set(level);
          isLowPower.set(level < 20);
        };

        updateBattery();
        if (battery.addEventListener) {
          battery.addEventListener("levelchange", updateBattery);
        }
      });
    }
  }

  return () => {
    window.removeEventListener("resize", checkMobile);
  };
}
