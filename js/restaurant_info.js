let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoibGV0ZSIsImEiOiJjamtmZmdlbmYwNml0M2tvNmRuNjAxb2ZwIn0.hS92_IFDLZxJJAuo6V8G3Q',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
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
  /* DBHelper.fetchRestaurantsReview(self.restaurant, (error, reviews) => {
          self.restaurant.reviews = reviews;
          if (reviews) {
            console.error(error);
            return;
          } */
      fillRestaurantHTML();
      callback(null, restaurant)
        // });
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favoriteRest = document.getElementById('favRest');
  favoriteRest.checked = restaurant.is_favorite;
  favoriteRest.addEventListener('change', event => {
    DBHelper.checkFavoriteRestaurant(restaurant, event.target.checked);
  });

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.createElement('picture');
  const section = document.getElementById('restaurant-container');
  section.appendChild(picture);

  const srcOfImage = DBHelper.imageUrlForRestaurant(restaurant);
  const largeImage = srcOfImage.replace('.jpg', '-800_large_2x.jpg');
  const mediumImage = srcOfImage.replace('.jpg', '-400_medium_1x.jpg');
  const smallImage = srcOfImage.replace('.jpg', '-300_small.jpg');

  const source = document.createElement('source');
  source.setAttribute('srcset', largeImage + ' 2x,' + mediumImage + ' 1x');
  picture.appendChild(source);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = smallImage;
  image.setAttribute('alt', 'Image of ' + restaurant.name + ' Restaurant');
  picture.appendChild(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
  DBHelper.fetchReviewsById(restaurant.id);
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
    day.setAttribute('tabindex', 0);
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.setAttribute('tabindex', 0);
    row.appendChild(time);

    hours.appendChild(row);
  }
}
/**
 * Create the review input form
 */
var reviewsForm = document.getElementById("reviewForm");
reviewsForm.addEventListener("submit", function(event) {
  event.preventDefault();
  var review = {"restaurant_id": self.restaurant.id};
  const formdata = new FormData(reviewsForm);
  for (var [key, value] of formdata.entries()) {
    review[key] = value;
  }
  DBHelper.reviewSubmission(review)
    .then(review => {
        const ul = document.getElementById('reviews-list');
        ul.appendChild(createReviewHTML(review));
        reviewsForm.reset();
    })
    .catch(error => console.error(error))
});

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
  createReviewHTML = (review) => {
  const header = document.createElement('header');
  header.className = 'review-header';
  const li = document.createElement('li');
  li.appendChild(header);

  const name = document.createElement('p');
  name.className = 'name';
  name.innerHTML = review.name;
  name.tabIndex = 0;
  header.appendChild(name);

 /* const date = document.createElement('p');
  date.className = 'date';
  date.innerHTML = new Date(review.updatedAt).toDateString();
  date.tabIndex = 0;
  header.appendChild(date);*/

  const rating = document.createElement('p');
  rating.className = 'rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex = 0;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'comments';
  comments.innerHTML = review.comments;
  comments.tabIndex = 0;
  li.appendChild(comments);

  return li;
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