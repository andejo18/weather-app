const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const storage = require('node-persist');

const apiKey = '48febd2e7ae455a1b2e8ab15eef19f3b';

// TODO - I think I can now make this an async function if I want to use await down below.
function callWeather(city, callback) {
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`

  request(url, function (err, response, body) {
    // console.log(response.statusCode);
    if (!err && response.statusCode == 200) {
      // console.log('No Error and response 200');
      let weather = JSON.parse(body);

      if(weather.main == undefined){
        // console.log(weather.main);
        return callback(null, err);
      } else {
        // console.log(weather.main);
        return callback(weather, null);
      }
    } else {
      // TODO - Do this a bit better - look at the weather site's response codes and what they mean.
      err = 'There was an error';
      return callback(null, err);
    }
  }); 
};

(async () => {
  // We should set a default ttl. 
  await storage.init();
  await storage.clear();

  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');

  app.get('/', function (req, res) {
    res.render('index', {weather: null, error: null});
  });


  app.post('/', async function (req, res) {
    let city = req.body.city;
       
    console.log(`checking database for ${city}`);
    let storedItem = await storage.getItem(city);

    if (! storedItem) {
      console.log(`${city} not found. Setting value in database.`);

      let weatherText = `${city} not found. Setting value in database!`;

      callWeather(city, async function(weather, err) {
        if (err) {
          // console.log('Error Returned');
          /* End ************************************************************ */
          res.render('index', {weather: null, error: 'Error, please try again'});
        } else {
          // console.log('No Error Returned');
          let weatherText = `Cached value for ${city} not found. Call made to OpenWeather.\nIt's ${weather.main.temp}ºF in ${city}!`;

          await storage.setItem(city, weather.main.temp);

          res.render('index', {weather: weatherText, error: null});
        }
      });

      // res.render('index', {weather: weatherText, error: null});

      // await storage.setItem(city, 'YAYAYAY');
    } else {
      console.log(`${city} found!`);

      let weatherText = `Cached value for ${city} found.\nThe last time you called OpenWeather for ${city} it was ${storedItem}ºF.`;
      res.render('index', {weather: weatherText, error: null});

      console.log(storedItem);
    }
    
  });

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
})();
