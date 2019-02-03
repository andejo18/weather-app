const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const storage = require('node-persist');

const apiKey = '48febd2e7ae455a1b2e8ab15eef19f3b';
const constDefaultCityKey = 'defaultcity'

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
  // await storage.clear();

  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');

  let defaultCityValue = await storage.getItem(constDefaultCityKey);

  app.get('/', function (req, res) {
    res.render('index', {weather: null, error: null, defaultcitymessage: null, defaultcity: defaultCityValue});
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

          res.render('index', {weather: weatherText, error: null, defaultcitymessage: null, defaultcity: null});
        }
      });
    } else {
      console.log(`${city} found!`);

      let weatherText = `Cached value for ${city} found.\nThe last time you called OpenWeather for ${city} it was ${storedItem}ºF.`;
      res.render('index', {weather: weatherText, error: null, defaultcitymessage: null, defaultcity: null});

      console.log(storedItem);
    }
  });

  app.post('/defaultcity/', async function (req, res) {
    let defaultcity = req.body.defaultcity;
       
    console.log(`checking database for ${defaultcity}`);
    let existingDefaultCity = await storage.getItem(constDefaultCityKey);

    if (! existingDefaultCity) {
      console.log(`Default does not exist, setting value in database.`);

      await storage.setItem(constDefaultCityKey, defaultcity);

      let message = `${defaultcity} set as default city.`;

      res.render('index', {weather: null, error: null, defaultcitymessage: message, defaultcity: defaultcity});
    } else {
      console.log(`Default already set as ${existingDefaultCity}. Overwriting!`);
      
      await storage.setItem(constDefaultCityKey, defaultcity);
      
      let message = `Default of ${existingDefaultCity} overridden with ${defaultcity}`;

      res.render('index', {weather: null, error: null, defaultcitymessage: message, defaultcity: defaultcity});
    }
  });

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
})();









