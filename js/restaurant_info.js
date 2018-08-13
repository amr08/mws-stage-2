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
