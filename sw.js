/**
 * With needed help from developers.google.com/web/fundamentals/primers/service-workers
 * Caching static files using service worker
 */
importScripts("/js/idb.js");
importScripts('/js/dbhelper.js');

var staticCacheName = 'restaurant-info';
var urlsToCache = [
  //cache all static files
  './',     
  './index.html',
  './restaurant.html',
  './js/dbhelper.js',
  './js/main.js',
  './js/idb.js',
  './js/restaurant_info.js',
  './manifest.json',
  './sw.js',
  './img/',
  './icon-192x192.png',
  './icon-512x512.png',
  './favicon.ico',
  './css/styles.css',
 // 'http://localhost:1337/restaurants'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName)
    .then(function(cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

//Delete old cache
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(cacheNames.map(function(thisCachName) {
        //If this was a previous cache
        if (thisCachName !== staticCacheName) {
          //Delete the cached file
          console.log('Deleting old cached files');
          return caches.delete(thisCachName);
        }
      }));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        return caches.open(staticCacheName).then(cache => {
          cache.put(event.request, res.clone());
          return res;
        })
      });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'firstSync') {
    event.waitUntil(
      DBHelper.offlineReviewsSubmission()
       .then(data => {
         for (const review of data) {
           fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json'
             },
             body: JSON.stringify(review)
           })
           .then(response => response.json())
           .then(() => {
            DBHelper.deleteReviewsOffline();
             })
             .catch(error => console.log('Review not synced to database', error));
           }
       })
       .catch(error => console.log('Unable to fetch reviews', error))
    )
  }
  
})
  
    
  
  