/**
 * With needed help from developers.google.com/web/fundamentals/primers/service-workers
 * Caching static files using service worker
 */
importScripts("/js/idb.js");
importScripts('/js/dbhelper.js');
importScripts('js/store.js');

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

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === './restaurant.html') {
      event.respondWith(caches.match(`./restaurant.html?id=${restaurant.id}`));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
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
      store.restaurantdb('readonly').then(function(restaurantdb) {
        return restaurantdb.getAll();
      }).then(reviews => {
        if (!reviews) {
          return;
        }
        DBHelper.offlineReviewsSubmission(reviews);
      }).then(() => {
        console.log('sync successful');
      }).catch(function(err) {
        console.error(err);
      })
    );
  }
  
});
  
    
  
  