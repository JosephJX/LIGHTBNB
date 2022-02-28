const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

// Get a single user from the database given their email.

const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.error(err.message);
    });
};

exports.getUserWithEmail = getUserWithEmail;

//Get a single user from the database 

const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message)
    })
}
exports.getUserWithId = getUserWithId;


// Add a new user to the database.

const addUser = function (user) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message)
    })
}
exports.addUser = addUser;

/// Reservations

const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`SELECT reservations.*, properties.title, properties.cost_per_night, (SELECT avg(rating) FROM property_reviews) as average_rating
  FROM reservations
  JOIN properties ON properties.id = property_id
  WHERE guest_id = $1
  ORDER BY start_date
  LIMIT $2;`, [guest_id, limit])
    .then((result) => result.rows)
    .catch((err) => {
      console.log(err.message)
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

const getAllProperties = function (options, limit = 10) {
  // 1 
  const queryParams = [];
  // 2 - info that comes before where clause
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3 - check if its passed
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length} \n`;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND (cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length})\n`;
  }

  queryString += `
  GROUP BY properties.id \n`;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(rating) >= $${queryParams.length} \n`;
  }

  // 4 - add any query that comes after where clause
  // queryParams.push(limit);
  // queryString += `
  // GROUP BY properties.id
  // ORDER BY cost_per_night
  // LIMIT $${queryParams.length};
  // `;

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5 - Just for checking
  console.log(queryString, queryParams);

  // 6 - Runs the query
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;


// Add a property to the database

const addProperty = function (property) {
  return pool
    .query(`INSERT INTO properties (owner_id, title, description,
      thumbnail_photo_url, cover_photo_url, cost_per_night, 
      street, city, province, post_code, country,
      parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, 
      $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14)
    RETURNING *;`, [property.owner_id, property.title, property.description,
    property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night,
    property.street, property.city, property.province, property.post_code, property.country,
    property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addProperty = addProperty;
