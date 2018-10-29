/**
 * With needed help from developers.google.com/web/fundamentals/primers/service-workers
 * Caching static files using service worker
 */
//importScripts('/js/idb.js');
//importScripts('/js/dbhelper.js');

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
  if (event.tag == 'myFirstSync') {
    var dbPromise = indexedDB.open('restaurant-db', 2);
    dbPromise.onsuccess = function(e) {
      db = dbPromise.result;
      var tx = db.transaction('reviewsOffline', 'readwrite');
      var store = tx.objectStore('reviewsOffline');

      var request = store.getAll();
      request.onsuccess = function() {
        for ( let i = 0; i < request.length; i++) {
          fetch(`http://localhost:1337/reviews/`, {
            body: JSON.stringify(request[i]),
            headers: {
                'content-type': 'application.json'
            },
            method: 'POST',
          })
          .then(response => {
            return response.json();
          })
          .then(data => {
            var tx = db.transaction('reviews', 'readwrite');
            var store = tx.objectStore('reviews');
            var request = store.add(data);
            request.onsuccess = function() {
              var tx = db.transaction('reviewsOffline', 'readwrite');
              var store = tx.objectStore('reviewsOffline');
              var request = store.clear();
              request.onsuccess = function() {};
              request.onerror = function (error) {
                console.log('Offline reviews could not be cleared', error);
                }
            };
            request.onerror = function (error) {
              console.log('Objectstore could not be added to IndexedDb', error);
            }
          })
          .catch(error => {
            console.log('Error making a POST', error);
          })
        }
      }
      request.onerror = function(e) {
        console.log(e);
      }
    }
  }
});