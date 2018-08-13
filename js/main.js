/* eslint-disable */
let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
// var mykey = config.MY_API_KEY;
// var url = `https://maps.googleapis.com/maps/api/js?&libraries=places&key=${mykey}&callback=initMap`;
// document.getElementById("google-maps").src = url;



/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
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
// window.initMap = () => {
//   let loc = {
//     lat: 40.722216,
//     lng: -73.987501
//   };
//   self.map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 12,
//     center: loc,
//     scrollwheel: false
//   });
//   updateRestaurants();
// }

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYW1yMDgiLCJhIjoiY2prc2sxdGRjMmc5bDNxdGh6dnRxbmVwNiJ9.6IBnsWy9TJ4L67noMYn0OQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

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
// resetRestaurants = (restaurants) => {
//   // Remove all restaurants
//   self.restaurants = [];
//   const ul = document.getElementById('restaurants-list');
//   ul.innerHTML = '';

//   // Remove all map markers
//   self.markers.forEach(m => m.setMap(null));
//   self.markers = [];
//   self.restaurants = restaurants;
// }

resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
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
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}.webp`;
  image.classList.add("lazyload");
  image.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}.webp 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-sm.webp 1x`;
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

// /**
//  * Add markers for current restaurants to the map.
//  */
// addMarkersToMap = (restaurants = self.restaurants) => {
//   restaurants.forEach(restaurant => {
//     // Add marker to the map
//     const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
//     google.maps.event.addListener(marker, 'click', () => {
//       window.location.href = marker.url;
//     });
//     self.markers.push(marker);
//   });
// }

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
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

