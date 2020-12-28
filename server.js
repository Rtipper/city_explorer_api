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
app.get('/restaurants', restaurantHandler);
app.use('*', notFoundHandler);

// Function Handlers
function locationHandler(request, response) {
  const location = require('./data/location.json');
  const city = request.query.city;
  const locationData = new Location(city, location);

  response.send(locationData);
}

function homeHandler(request, response) {
  response.send('Hello World!');
}

function notFoundHandler(request, response) {
  response.send('404, Sorry!');
}

function restaurantHandler(request, response) {
  const data = require('./data/weather.json');
  const weatherArr = [];
  data.data.forEach(weather => {
    weatherArr.push(new Weather(weather));
  });
  response.send(weatherArr);
}

// Constructor
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function Weather(data) {
this.forecast = data.weather.description;
this.time = data.valid_date;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Now listening on port, ${PORT}`);
});