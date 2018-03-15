const express = require('express');

const xml2js = require('xml2js');
const http = require('http');
const util = require('util');

const parseString = xml2js.parseString;

const PORT = 8080;
const API_BEERCAST = '/beercastapi/programas/';
const URL_BEERCAST = 'http://beercast.com.br/feed/';


const app = express();

app.get(API_BEERCAST+":pages?", nocache, sendContent);

function sendContent(req, res) {
  xmlToJson(URL_BEERCAST, function (err, data) {
    if (err) {
      console.err(err);
      res.status('Unable to process request');
    } else {
      let channel = data.rss.channel;
      let pages = (req.params.pages != null) ? (req.params.pages*10) : 0;
      
      const rssNew = { items: [] }; 

      if (util.isArray(data.rss.channel)) {
        channel = data.rss.channel[0];
      }

      if (channel.title) {
        rssNew.title = channel.title[0];
      }
      if (channel.description) {
        rssNew.description = channel.description[0];
      }

      if (channel.link) {
        rssNew.link = channel.link[0];
      }
      if (channel.image) {
        rssNew.image = channel.image[0].url
      }

      if (channel.item) {
        if (!util.isArray(channel.item)) {
          channel.item = [channel.item];
        }

        channel.item.some(function (val, i){
          if(pages > 0 && pages == i){
              return true;
          }

          const obj = {};
          obj.title = !util.isNullOrUndefined(val.title) ? val.title[0] : '';
          obj.description = !util.isNullOrUndefined(val.description) ? val.description[0] : '';
          obj.url = obj.link = !util.isNullOrUndefined(val.link) ? val.link[0] : '';

          if (val.pubDate) {
            obj.created = Date.parse(val.pubDate[0]);
          }
          if (val.postthumbnail) {
            obj.postthumbnail = val.postthumbnail[0];
          }
          if (val.fullimage) {
            obj.fullimage = val.fullimage[0];
          }

          if (val.enclosure) {
            obj.enclosures = [];
            var enc = {};
            if (val.enclosure['0']['$']['url']) {
              enc.audio = val.enclosure['0']['$']['url'];
            }
            if (val.enclosure['0']['$']['url']) {
              enc.length = val.enclosure['0']['$']['length'];
            }
            if (val.enclosure['0']['$']['type']) {
              enc.type = val.enclosure['0']['$']['type'];
            }
            obj.enclosures.push(enc);
          }

          rssNew.items.push(obj);
        });
      }

      res.json(rssNew);
    }
  });
}

function xmlToJson(url, callback) {
  http.get(url, function (res) {
    let xml = '';

    res.on('data', function (chunk) {
      xml += chunk;
    });

    res.on('error', function (e) {
      callback(e, null);
    });

    res.on('timeout', function (e) {
      callback(e, null);
    });

    res.on('end', function () {
      parseString(xml, function (err, result) {
        callback(null, result);
      });
    });
  });
}

function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

app.listen(PORT, function () {
  console.log(`Server iniciado na porta: ${PORT}. Please access ${API_BEERCAST}`);
});
