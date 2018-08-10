const STATIC_CACHE_NAME = 'mws-static-v6';
const CACHE_IMGS_NAME = 'restaurant-imgs';
const allCaches = [
  STATIC_CACHE_NAME,
  CACHE_IMGS_NAME
];

const homeCacheUrls = [
  '/',
  '/index.html',
  '/js/main.js',
  '/css/styles.css',
  '/js/restaurant_info.js',
  '/js/dbhelper.js',
  '/404.html',
  'manifest.json'
];

const restaurantPageCache = [
  '/restaurant.html'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => (
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
           !allCaches.includes(cacheName)
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

    if (requestUrl.pathname.startsWith('/dist/images/')) {
      event.respondWith(servePhotos(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(response => (
      response || fetch(event.request)
    )).catch(error => {
      console.log("ERROR", error);
      return caches.match('/404.html');
    })
  );
});

self.addEventListener('sync', event => {
  console.log(event.tag)
  event.waitUntil(
    fetch("http://localhost:1337/reviews/", {
       method: 'POST',
       body: event.tag,
       headers: {
         'Content-Type': 'application/json',
       }
     }).then(function(response) {  
       return response;
     }).then(function(data) {
      console.log("Posted once online");
    }).catch(function(err) { console.error(err); })
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

function servePhotos(request) {
  const storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
 console.log(request.url)
  return caches.open(CACHE_IMGS_NAME).then(cache => {
    return cache.match(storageUrl).then(response => {
      if(response) return response; 
      
      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      })
    }).catch(error => {
      console.log("Error in servePhotos", error)
    })
  });
}


self.addEventListener('message', event => {
  if (event.data.update) {
    self.skipWaiting();
  }
});

