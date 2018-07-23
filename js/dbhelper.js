
/**
 * Common database helper functions.
 */

//Create DB
// eslint-disable-next-line
const dbPromise = idb.open("restaurant-data", 3, upgradeDB => {
  upgradeDB.createObjectStore("data", {
    keyPath: "id"
  });
  upgradeDB.createObjectStore("reviews", {
    keyPath: "id"
  });
});

// eslint-disable-next-line
class DBHelper {
  //Database URL
  static get DATABASE_URL() {
    const port = 1337; 
    return `http://localhost:${port}/`;
  }

  static fetchInit(path, callback, store){
     fetch(`${DBHelper.DATABASE_URL}${path}`)
     .then(res => res.json(),

      error => console.log("An error has occured.", error)
      ).then(data => {
        DBHelper.sendToDb(data, callback, store);
      }).catch(err => {
        // eslint-disable-next-line
        console.log("error", err);
        //If offline, go straight to IDB to pull data to user
        DBHelper.readDb(callback, store);
      });
  }

  static readDb(callback, store){
    console.log("CALLED")
    dbPromise.then(db => {
      const getStoredData = db.transaction(store)
        .objectStore(store);
      return getStoredData.getAll().then((retrievedData) => {
        if(callback){
          console.log(retrievedData)
          callback(null, retrievedData);
        }
      });
    });
  }

  static sendToDb(data, callback, store){
      // //send data to IDB
      if(store === "data"){
        dbPromise.then(db => {
          const tx = db.transaction(store, "readwrite");
          const keyValStore = tx.objectStore(store);
          data.map(restaurant => {
            keyValStore.put(restaurant);
          });
          return tx.complete;
        }).then(() => {
          DBHelper.readDb(callback, store);
        });
      }
      if(store === "reviews"){
         dbPromise.then(db => {
          const tx = db.transaction(store, "readwrite");
          const keyValStore = tx.objectStore(store);
          data.map(review => {
            keyValStore.put(review);
          });
          return tx.complete;
        }).then(() => {
          DBHelper.readDb(callback, store);
        });

      }
    };

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
   DBHelper.fetchInit("restaurants", callback, "data");


    //   .then(res => res.json(),
    //     // eslint-disable-next-line
    //     error => console.log("An error has occured.", error)
    //   ).then(data => {
    //     let restaurants = data;
    //     sendToDb(restaurants);
    //     console.log(restaurants);
    //   }).catch(err => {
    //     // eslint-disable-next-line
    //     console.log("error", err);
    //     callback(err, null);
    //     readDb();
    //   });

    // const sendToDb = (restaurants) => {
    //   //send data to IDB
    //   dbPromise.then(db => {
    //     const tx = db.transaction("data", "readwrite");
    //     const keyValStore = tx.objectStore("data");
    //     restaurants.map(restaurant => {
    //       keyValStore.put(restaurant);
    //     });
    //     return tx.complete;
    //   }).then(() => {
    //     readDb();
    //   });
    // };

    // const readDb = () => {
    //   dbPromise.then(db => {
    //     const getStoredData = db.transaction("data")
    //       .objectStore("data");
    //     return getStoredData.getAll().then((retrievedRestaurants) => {
    //       callback(null, retrievedRestaurants);
    //     });
    //   });
    // };
  }

  static fetchReviews(id, callback){
    console.log(id);
    DBHelper.fetchInit(`reviews/?restaurant_id=${id}`, callback, "reviews");
  }

  static postReviews(review){
    //Send to IDB so user can read data while offline
    console.log(review);
     dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      console.log(tx)
      const keyValStore = tx.objectStore("reviews");
      console.log(keyValStore)
      keyValStore.put(review);
      return tx.complete;
     }).then(() => {
      console.log("added!");
     })
    //TODO: Then get data from IDB and post to server once back online
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== "all") { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== "all") { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph 
      ? (`/dist/images/${restaurant.photograph}`)
      : (`/dist/images/${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  /* eslint-disable */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }


}
