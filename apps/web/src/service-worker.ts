/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Green Code: Offline-first architecture
const CACHE_NAME = `forkzero-${version}`;
const ASSETS = [...build, ...files];

// Install: Cache all static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			// Green Code: Cache assets for offline use
			return cache.addAll(ASSETS);
		})
	);
	self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
		})
	);
	self.clients.claim();
});

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') return;
	
	// Skip API calls (let them go to network)
	if (event.request.url.includes('/scrape')) return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			// Return cached version or fetch from network
			return cached || fetch(event.request).then((response) => {
				// Green Code: Cache successful responses
				if (response.status === 200) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, clone);
					});
				}
				return response;
			});
		})
	);
});
