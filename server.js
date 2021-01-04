'use strict'

//Dependencies
require('dotenv').cofig();
const express = require('express');
const cors = require('cors');
const { response } = require('express');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Routes
app.get('/', homeHandler);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.use('*', notFoundHandler);

// Function Handlers
function locationHandler(request, response) {
  let city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
  superagent.get(url)
    .then( data => {
      // Objects Created Baised on Constructor
      const locationData = data.body[0];
      const location = new Location(city, locationData);
      response.status(200).send(location);
    });
}

function homeHandler(request, response) {
  response.status(200).send('hello world');
}

function notFoundHandler(request, response) {
  response.send('404, Sorry!');
}

function weatherHandler(request, response) {
  let key = process.env.WEATHER_API_KEY;
  let city = request.query.city;
  const url = `https://api.weatherbit.io/v2.0/current?city=${city}&key=${key}`;
  superagent.get(url)
    .then(data => {
      console.log(data.body);
      // Objects Created Baised on Constructor
      // console.log(data.body);
      const weatherData = data.body[0];
      const weather = new Weather(city, weatherData);
      response.status(200).send(weather);
    });
}

// Constructor
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}

function Weather(result) {
  this.time = result.ob_time;
  this.forecast = result.data.weather.description;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Now listening on port, ${PORT}`);
});