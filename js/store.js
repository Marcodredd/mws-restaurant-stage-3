//guidance and code excerpts taken from www.twilio.com
//Send messages when you're back online with service
//Workers and background sync

var store = {
    db: null,

    init: function() {
        if (store.db) {return Promise.resolve(store.db);}
        return idb.open('restaurantdb', 3, function(upgradeDb) {
            upgradeDb.createObjectStore('reviewsOffline', {autoIncrement : true, keypath: 'id'});

        }).then(function(db) {
            return store.db = db;
        })
    },

    reviewsOffline: function(mode) {
        return store.init().then(function(db) {
            return db.transaction('reviewsOffline', mode).objectStore('reviewsOffline');
        })
    }
}