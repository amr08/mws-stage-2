/* eslint-disable */
/**
 * Common database helper functions.
 */

//Create DB

const dbPromise = idb.open("restaurant-data", 1, upgradeDB => {
  upgradeDB.createObjectStore("data", {
    keyPath: "id"
  });
  upgradeDB.createObjectStore("reviews", {
    keyPath: "id"
  });
});


class DBHelper {
  //Database URL
  static get DATABASE_URL() {
    const port = 1337; 
    return `http://localhost:${port}/`;
  }

  static fetchInit(path, callback, store){
     fetch(`${DBHelper.DATABASE_URL}${path}`)
     .then(res => res.json(),

      error => {
        console.log("An error has occured.", error)
        DBHelper.readDb(callback, store);
      }).then(data => {
        DBHelper.sendToDb(data, callback, store);
      }).catch(err => {
        // eslint-disable-next-line
        console.log("error", err);
        //If offline, go straight to IDB to pull data to user
        DBHelper.readDb(callback, store);
      });
  }

  static readDb(callback, store){
    dbPromise.then(db => {
      const getStoredData = db.transaction(store)
        .objectStore(store);
      return getStoredData.getAll().then((retrievedData) => {
        if(callback){
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
  }

  static fetchReviews(id, callback){
    DBHelper.fetchInit(`reviews/?restaurant_id=${id}`, callback, "reviews");
  }

  static postReviews(review, id){
    const randomNum = Math.floor(Math.random() * Math.floor(20))

    // review.id = id
    review.id = 30 + randomNum;

 
    //Send to IDB so user can read data while offline
     dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const keyValStore = tx.objectStore("reviews");
      keyValStore.put(review);
      return tx.complete;
     }).then(() => {
      console.log("Content added locally");
       DBHelper.fetchReviews(`reviews/?restaurant_id=${review.restaurant_id}`);
     })
  }

  static deleteReview(id){

     dbPromise.then(db => {
      const tx = db.transaction(["reviews"], "readwrite");
      const keyValStore = tx.objectStore("reviews").iterateCursor(cursor => {
        if (!cursor) return;
        if(cursor.value.id === id){
          console.log(cursor.value.id === id)
            cursor.delete();
        } else {
            cursor.continue();
        }
      });
      tx.complete.then(() => console.log("Review Deleted"));
    });

     dbPromise.then(function(db) {
      var tx = db.transaction('reviews', 'readwrite');
      var store = tx.objectStore('reviews');
      store.delete(id);
      return tx.complete;
    }).then(function() {
      console.log('Item deleted');
    });

    fetch(`http://localhost:1337/reviews/${id}`, {
        method: 'delete'
      }).then(response =>
        response.json().then(json => {
        return json;
      })
    );
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

  static fetchFavorites(callback){
    fetch(`${DBHelper.DATABASE_URL}restaurants/?is_favorite=true`)
      .then(res => res.json(),
      error => {
        console.log("An error has occured.", error)
      }).then(data => {
          callback(data);
      }).catch(err => {
      // eslint-disable-next-line
      console.log("error", err);
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



/* eslint-disable */
let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
var mykey = config.MY_API_KEY;
var url = `https://maps.googleapis.com/maps/api/js?&libraries=places&key=${mykey}&callback=initMap`;
document.getElementById("google-maps").src = url;



/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { 
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  addLikes();

}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute("role", "listitem");

  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';

  image.setAttribute("alt", `the restaurant pictured is ${restaurant.name}`);
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.jpg`;
  image.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-sm.jpg 1x`;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.class="restaurant-info";
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.class="restaurant-info"
  address.innerHTML = restaurant.address;
  li.append(address);

  const viewMoreButton = document.createElement('button');
  viewMoreButton.innerHTML = 'View Details';
  viewMoreButton.value ="View Details";
  viewMoreButton.type = "button";
  viewMoreButton.onclick = () => {
    location.href = DBHelper.urlForRestaurant(restaurant);
  }
  li.append(viewMoreButton);

  const favoriteHeart = document.createElement("p");
  const span = document.createElement("span");
  span.innerHTML = "♥"
  span.setAttribute("class", "favorite-heart");
  span.id=restaurant.id;

  favoriteHeart.append(span);
  li.append(favoriteHeart);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
}

addLikes = () => {
  DBHelper.fetchFavorites(data => {
    if(data){
      data.filter(function(result){
        const getHeart = document.getElementById(result.id);
        getHeart.classList.add("liked");    
      });
    }  
  });
}


/* eslint-disable */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../sw.js')
      .then(registration => {
      
        if("sync" in registration){
            const heart = document.getElementsByClassName("favorite-heart");
            for(var i = 0; i < heart.length; i++){
              heart[i].addEventListener("click", function(e){
                this.classList.toggle("liked")
                if(this.classList.contains("liked")){
                  registration.sync.register(`{"restaurant_id": ${e.target.id}, "is_favorite": true, "heart": true}`);
                } else {
                  registration.sync.register(`{"restaurant_id": ${e.target.id}, "is_favorite": false, "heart": true}`);
                }
              
              });
            }

          //Listen for changes to form in order to track submit button then send sync message to sw
          observer(registration);
        }
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                addToast(installingWorker);
              } else {
                console.log('Content is cached for offline use.');
              }
            }
            //If user selects update, reload
            if(installingWorker.state === 'activated'){
              window.location.reload();
            }     
          }
        }
      });
  });
}

const addToast = (installingWorker) => {
  const body = document.getElementsByTagName("body")[0];
  const toastDiv = document.createElement("div");
  toastDiv.classList.add("toast");
  toastDiv.innerHTML = "Content update available";
  toastDiv.setAttribute("id", "toast");
  toastDiv.setAttribute("aria-label", "service-worker-update")


  const acceptButton = document.createElement("button");
  const dismissButton = document.createElement("button");

  acceptButton.classList.add("button-toast");
  acceptButton.focus();
  acceptButton.setAttribute("tabindex", "0");
  acceptButton.innerHTML = "Accept";
  acceptButton.onclick = () => {
    installingWorker.postMessage({update: true});
  }

  dismissButton.classList.add("button-toast");
  dismissButton.innerHTML = "Dismiss";
  dismissButton.setAttribute("tabindex", "1");
  dismissButton.onclick = () => {
    const getToastDiv = document.getElementById("toast");
    getToastDiv.parentNode.removeChild(getToastDiv);
  }

  toastDiv.appendChild(acceptButton);
  toastDiv.appendChild(dismissButton);

  body.appendChild(toastDiv);
}

function observer(registration){

  if(window.location.pathname.startsWith("/restaurant")) {
    var targetNode = document.getElementById('reviews-container');

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, childList: true, subtree: true };

    var callback = function(mutationsList) {
      for(var mutation of mutationsList) {

          if (mutation.type == 'childList') {
            if(mutation.target.id === "reviews-form"){
              const submitIntercept = document.getElementById("submit-button");
                submitIntercept.addEventListener("click", e => { 
                  e.preventDefault();
                  const nameValue = document.getElementById("name");
                  const idValue = document.getElementById("id")
                  const commentsValue = document.getElementById("comments");
                  const ratingValue = document.getElementById("rating");
              
                  const postReview = 
                    {
                      "restaurant_id": parseInt(idValue.dataset.restaurant), 
                      "name": nameValue.value,  
                      "rating":  parseInt(ratingValue.options[ratingValue.selectedIndex].value),
                      "comments": commentsValue.value
                    }

                    DBHelper.postReviews(postReview, parseInt(idValue.value));
                    registration.sync.register(JSON.stringify(postReview));
                    const reviewsContainer = document.getElementById("reviews-container");
                    reviewsContainer.innerHTML = "";
                    return;
               });
            } 
          }
          else if (mutation.type == 'attributes') {
              // console.log('The ' + mutation.attributeName + ' attribute was modified.');
          }
      }
    };


 

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

  }
}


  function updateOnlineStatus(event) {
    if(event.type === "offline"){
      const body = document.getElementsByTagName("body")[0];
      const toastDiv = document.createElement("div");
      toastDiv.classList.add("toast");
      toastDiv.innerHTML = "You are operating offline";
      toastDiv.setAttribute("id", "toast");
      toastDiv.setAttribute("aria-label", "service-worker-update-offline")

      const dismissButton = document.createElement("button");
      toastDiv.appendChild(dismissButton);

      dismissButton.classList.add("button-toast");
      dismissButton.innerHTML = "Dismiss";
      dismissButton.setAttribute("tabindex", "1");
      dismissButton.onclick = () => {
        const getToastDiv = document.getElementById("toast"); 
        getToastDiv.parentNode.removeChild(getToastDiv);
      }

      body.appendChild(toastDiv);
    } else {
      if(document.getElementById("toast")){
        const getToastDiv = document.getElementById("toast"); 
        getToastDiv.parentNode.removeChild(getToastDiv);

      }
    }
  }

  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);



/* eslint-disable */
let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

fetchReviewsFromURL = (id = self.restaurant.id) => {

  DBHelper.fetchReviews(id, (error, reviews) => {
    let reviewsById = reviews.filter(review => {
      if(review.restaurant_id === id) {
        return review;
      } 
    });
    
    self.reviews = reviewsById;
    if (!reviewsById) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lazy';
  image.setAttribute("alt", `the restaurant pictured is ${restaurant.name}`);
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.jpg`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviewsFromURL();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}


/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews, id = self.restaurant.id) => {

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  const reviewsButton = document.createElement("button");
  const reviewsFormDiv = document.createElement("div");
  const reviewsList = document.createElement("ul");
  reviewsList.id = "reviews-list";

  container.appendChild(title);
  container.appendChild(reviewsButton);
  container.appendChild(reviewsFormDiv);
  container.appendChild(reviewsList);

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

  reviewsFormDiv.id = "reviews-form";
  title.innerHTML = 'Reviews';
  reviewsButton.innerHTML = "Add Review";
  reviewsButton.value ="Add Review";
  reviewsButton.id="review-button";
  reviewsButton.type = "button";
  reviewsButton.onclick = () => {
    reviewsFormDiv.appendChild(createReviewForm(reviews, id));
    reviewsButton.parentNode.removeChild(reviewsButton);
  }

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }



}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('h3');
  const deleteButton = document.createElement("button");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = moment(review.createdAt).format("LL");
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  deleteButton.innerHTML = "Delete";
  deleteButton.value = review.id;
  deleteButton.setAttribute("class","delete-button");
  deleteButton.type = "button";
  deleteButton.onclick = () => {
    DBHelper.deleteReview(review.id);
    const reviewsContainer = document.getElementById("reviews-container");
    reviewsContainer.innerHTML = "";
    fetchReviewsFromURL()
  }
  li.appendChild(deleteButton);

  return li;
}

//Create form
createReviewForm = (reviews, id) => {
  const form = document.createElement("form");
  form.id = "submit-review-form";
  const inputName = document.createElement('input');
  const labelName = document.createElement("label");
  labelName.innerHTML = "Name";
  labelName.classList.add("off-screen");
  inputName.placeholder = "Name";
  inputName.id = "name";
  inputName.setAttribute("required", "");
  inputName.name = "name";
  form.appendChild(labelName);
  form.appendChild(inputName);

  const inputID = document.createElement('input');
  const labelID = document.createElement("label");
  labelID.innerHTML = "Restaurant ID";
  labelID.classList.add("off-screen");
  inputID.setAttribute("value", reviews.length + 1);
  inputID.dataset.restaurant = id;
  inputID.placeholder = "Restaurant Id";
  inputID.type = "hidden";
  inputID.setAttribute("disabled", "true");
  inputID.name = "id";
  inputID.id ="id";
  form.appendChild(labelID);
  form.appendChild(inputID);

  const selectRating = document.createElement('select');
  selectRating.id = "rating";
  const labelRating = document.createElement("label");
  labelRating.innerHTML = "Rating";
  // labelRating.classList.add("off-screen");
  const placeholderOption = document.createElement('option');
  placeholderOption.value = "";
  placeholderOption.innerHTML = "Select Rating";
  placeholderOption.setAttribute("disabled", true);
  placeholderOption.setAttribute("selected", true);
  selectRating.appendChild(placeholderOption);

  for(var i = 1; i <= 5; i++){
    let ratingOption = document.createElement('option');
    ratingOption.value = i;
    ratingOption.innerHTML = i;
    selectRating.appendChild(ratingOption);
  }

  selectRating.appendChild(labelRating);
  form.appendChild(selectRating);

  const commentsInput = document.createElement('textarea');
  const commentsLabel = document.createElement("label");
  commentsLabel.innerHTML = "Comments";
  commentsLabel.classList.add("off-screen");
  commentsInput.placeholder = "Add your comments";
  commentsInput.name = "comments";
  commentsInput.setAttribute("required", "");
  commentsInput.id = "comments";
  commentsInput.maxlength = "500";
  commentsInput.rows = "3";
  form.appendChild(commentsLabel);
  form.appendChild(commentsInput);

  const submitReviewButton = document.createElement("button");
  submitReviewButton.innerHTML = "Submit Review";
  submitReviewButton.value ="Submit Review";
  submitReviewButton.id="submit-button";
  submitReviewButton.type = "submit";
  submitReviewButton.onclick = () => {
    fetchReviewsFromURL()
  }

  form.appendChild(submitReviewButton);
  return form;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
