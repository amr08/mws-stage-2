const STATIC_CACHE_NAME = 'mws-static-v5';
const CACHE_IMGS_NAME = 'restaurant-imgs';
const allCaches = [
  STATIC_CACHE_NAME,
  CACHE_IMGS_NAME
];

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

    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhotos(event.request));
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

function servePhotos(request) {
  const storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(CACHE_IMGS_NAME).then(cache => {
    return cache.match(storageUrl).then(response => {
      // if(response) return response; 
      
      //TODO: Works only if imgs cached first. 
      if(response.status === 404) {
        return fetch(`img/10.jpg`);
      } else if (response){
        return response;
      }
      
      // } return response;
      // console.log(response)
      // If an image doesn't show up, put in placeholder
      // if(response.status === 404) {
      //   console.log(response.status)
      //   return fetch(`img/10.jpg`);
      // } else {
      //   return response;
      // }
     

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

