const express = require('express');
const port = 8080;
const apiBeercast = '/beercastapi/programas/';
const urlBeerCast = 'http://beercast.com.br/feed/';
const xml2js = require('xml2js');
const parseString = xml2js.parseString;
const http = require('http');
const util = require('util');

//init
const app = express();

function xmlToJson(url, callback) {
  var req = http.get(url, function(res) {
    var xml = '';

    res.on('data', function(chunk) {
      xml += chunk;
    });

    res.on('error', function(e) {
      callback(e, null);
    });

    res.on('timeout', function(e) {
      callback(e, null);
    });

    res.on('end', function() {
      parseString(xml, function(err, result) {
        callback(null, result);
      });
    });
  });
}

app.get(apiBeercast, function(req, res){
  xmlToJson(urlBeerCast, function(err, data) {
    if (err) {
      return console.err(err);
    } else {
      var channel = data.rss.channel;
      var rssNew = { items: [] };
      if (util.isArray(data.rss.channel)){
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
        channel.item.forEach(function (val) {
          var obj = {};
          obj.title = !util.isNullOrUndefined(val.title) ? val.title[0] : '';
          obj.description = !util.isNullOrUndefined(val.description) ? val.description[0] : '';
          obj.url = obj.link = !util.isNullOrUndefined(val.link) ? val.link[0] : '';

          if (val.pubDate) {
            obj.created = Date.parse(val.pubDate[0]);
          }
          if(val.postthumbnail){
            obj.postthumbnail = val.postthumbnail[0];
          }
          if (val.enclosure) {
            obj.enclosures = [];
            var enc = {};
            if(val.enclosure['0']['$']['url']){
              enc.audio = val.enclosure['0']['$']['url'];
            }
            if(val.enclosure['0']['$']['url']){
              enc.length = val.enclosure['0']['$']['length'];
            }
            if(val.enclosure['0']['$']['type']){
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
});

app.listen(port, function(){
    console.log('Server iniciado na porta: ' + port);
});
