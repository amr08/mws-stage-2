const STATIC_CACHE = 'mws-static-v3';
const homeCacheUrls = [
  '/',
  '/index.html',
  '/js/main.js',
  '/img/',
  '/css/styles.css',
  '/js/restaurant_info.js',
  '/js/dbhelper.js',
  '/404.html'
];

const restaurantPageCache = [
  '/restaurant.html'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => (
      cache.addAll(homeCacheUrls)
    ))
  );
});


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => (
      Promise.all(
        cacheNames.filter(cacheName => (
          cacheName.startsWith("mws-") &&
           cacheName !== STATIC_CACHE
        )).map(cacheName => (
          caches.delete(cacheName)
        ))
      )
    ))
  );
});


self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    // if (requestUrl.pathname === '/') {
    //   event.respondWith(caches.match('/skeleton'));
    //   return;
    // }
    if (requestUrl.pathname.startsWith('/restaurant')) {
      event.respondWith(serveRestaurantHtml(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(response => (
      response || fetch(event.request)
    )).catch(error => {
      console.log("ERROR", error)
      return caches.match('/404.html');
    })
  );
});


function serveRestaurantHtml(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(restaurantPageCache).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('message', event => {
  if (event.data.update) {
    self.skipWaiting();
  }
});

