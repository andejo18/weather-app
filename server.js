const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const storage = require('node-persist');


const apiKey = '48febd2e7ae455a1b2e8ab15eef19f3b';



(async () => {
  await storage.init();

  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');

  app.get('/', function (req, res) {
    res.render('index', {weather: null, error: null});
  });


  app.post('/', async function (req, res) {
    let city = req.body.city;
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`

    console.log(`checking database for ${city}`);
    let storedItem = await storage.getItem(city);

    if (! storedItem) {
      console.log(`${city} not found. Setting value in database.`);
      await storage.setItem(city, 'YAYAYAY');
    } else {
      console.log(`${city} found!`);
      console.log(storedItem);
    }

    /*
    request(url, function (err, response, body) {
      if(err){
        res.render('index', {weather: null, error: 'Error, please try again'});
      } else {
        let weather = JSON.parse(body);
        console.log(weather.main);

        if(weather.main == undefined){
          res.render('index', {weather: null, error: 'Error, please try again'});
        } else {
          let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
          res.render('index', {weather: weatherText, error: null});
        }
      }
    }); */
  });

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
})();

