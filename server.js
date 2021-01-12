'use strict'

//Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { response } = require('express');
const pg = require('pg');

let flagTrigger = false;

// Application Setup
const app = express();
const PORT = process.env.PORT;
const client = new pg.Client(process.env.DATABASE_URL);

// Routes
app.use(cors());
app.get('/', requestMain);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/movies', moviesHandler);
app.get('/yelp', yelpHandler);
app.use('*', notFoundRequest);

// Function Handlers
// REQUESTS / ERROR CATCH
function requestMain(request, response) {
  response.send('hello world');
}
function notFoundRequest(request, response) {
  response.status(404).send('404, Sorry!')
}

// LOCATION
function locationHandler(request, response) {
  const city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
  if (city === '' || city === ' ') {
    inputInval(response);
  } else {
    checkLocationData(city, response, url);
    flagTrigger = false;
  }
}

function checkLocationData(city, response, url) {
  const firstSQL = `SELECT * FROM location WHERE search_query LIKE '${city}'`;
  const secondSQL = 'INSERT INTO location (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4)';

  client.query(firstSQL)
    .then(data => {
      if (data.rowCount === 0) {
        superagent.get(url)
          .then(data => {
            const newLocationInstance = new Location(city, data.body[0])
            const safeQuery = [newLocationInstance.search_query, newLocationInstance.formatted_query, newLocationInstance.latitude, newLocationInstance.longitude];
            client.query(secondSQL, safeQuery);
            return response.status(200).json(newLocationInstance);
          }).catch(error => {
            console.log(error);
          });
      } else if (data.rowCount === 1) {
        return response.status(200).json(data.rows[0]);
      }
    }).catch(error => {
      console.log(error);
    });

}

// WEATHER
function weatherHandler(request, response) {
  const key = process.env.WEATHER_API_KEY;
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const url = `http://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${key}`;

  if (flagTrigger) {
    inputInval(response);
  } else {
    superagent.get(url)
      .then(promise => {
        // Objects Created Baised on Constructor
        const testData = promise.body.data.map(val => {
          return new Weather(val);
        });
        response.send(testData);
      }).catch(error => {
        console.log(error);
      });
  }
}

// MOVIES
function moviesHandler(request, response) {
  const key = process.env.MOVIES_API_KEY;

  const queryObj = {
    api_key: key,
    query: request.query.search_query,
    include_adult: false
  };
  const url = 'https://api.themoviedb.org/3/search/movie';

  if (flagTrigger) {
    inputInval(response);
  } else {
    superagent.get(url)
      .query(queryObj)
      .then(data => {
        const dataHolder = data.body.results;
        if (dataHolder > 20) {
          dataHolder.length = 20;
        }
        const movieHolder = dataHolder.map(val => {
          return new Movies(val);
        });

        response.status(200),json(movieHolder);
      }).catch(error => {
        console.log(error);
      });
  }
}

// YELP

// Helper Functions
function inputInval(send) {
  flagTrigger = true;
  return send.status(500).send('Sorry, something went wrong');
}

// Constructors
function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.time = new Date(data.valid_date).toDateString();
  this.forecast = data.weather.description;
}

function Movies(data) {
  this.title = data.original_title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.release_date;
}

// Start Server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`now listening on port,${PORT}`);
      console.log(`Connected to database ${client.connectionParameters.database}`);
    });
  })
  .catch(error => {
    console.log(error);
  });