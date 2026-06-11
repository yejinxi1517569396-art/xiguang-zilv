const CACHE_NAME = 'xiguang-zilv-app-v4';
const APP_ASSETS = [
  './',
  './index.html',
  './checkin.html',
  './review.html',
  './ai.html',
  './me.html',
  './auth.html',
  './community.html',
  './coach.html',
  './report.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/ui.js',
  './assets/icons/icon.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // /api 接口和 OpenAI 跨域请求绝不走缓存, 必须实时
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || /openai|chat\/completions/i.test(url.href)) {
    return; // 让浏览器自己处理
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
