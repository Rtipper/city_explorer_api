'use strict'

//Dependencies
require('dotenv').cofig();
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
  const firstSQL = `SELECT * FROM location WHERE searchquery LIKE '${city}'`;
  const secondSQL = 'INSERT INTO location (searhcquey,formattedquery,latitude,longitutde) VALUES ($1,$2,$3,$4)';

  client.query(firstSQL)
    .then(data => {
      if (data.rowCount === 0) {
        superagent.get(url)
          .then(data => {
            const newLocationInstance = new Location(city, data.body[0])
            const safeQuery = [newLocationsInstance.search_query, newLocationInstance.formatted_query, newLocationInstance.latitude, newLocationInstance.longitude];
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