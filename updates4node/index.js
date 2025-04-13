var request = require('request');
const express = require('express');
const app = express();
require("dotenv").config();
let SOs = { SONo: "387262", SOItemNo: "10", DeliveryPriority: "4" };
const port = process.env.port || process.env.PORT || 5000
app.get("/updateS4", (req, res) => {
  updateOrderItem(SOs)
});

const updateOrderItem = function (SOs) {
  return new Promise((resolve, reject) => {
    var url = process.env.SOItemApi + "$metadata"
    console.log(url);
    var options = {
      'method': 'GET',
      'url': url,
      'headers': {
        'x-csrf-token': 'fetch',
        'Cookie': 'JSESSIONID=s%3AQpTZFG2tyWtw48uJ21jqJQnifR2_ft8P.kPj7VvLDJsbXpA4S5SEUrUZ2tqzNuHatPPVjzSZwfaY; __VCAP_ID__=084a5ee9-8f5d-45ad-6d77-9172'
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.headers);
      var options = {
        'method': 'PATCH',
        'url': process.env.SOItemApi + "/A_SalesOrderItem(SalesOrder=\'" + SOs.SONo + "\',SalesOrderItem=\'10\')",
        'headers': {
          'x-csrf-token': response.headers['x-csrf-token'],
          'Content-Type': 'application/json',
          'Cookie': 'JSESSIONID=s%3AQpTZFG2tyWtw48uJ21jqJQnifR2_ft8P.kPj7VvLDJsbXpA4S5SEUrUZ2tqzNuHatPPVjzSZwfaY; __VCAP_ID__=084a5ee9-8f5d-45ad-6d77-9172'
        },
        body: JSON.stringify({
          "DeliveryPriority": "4"
        })
      };
      console.log(options);
      request(options, function (error, response) {
        if (error) throw new Error(error);
         console.log(response.body);
      });
    });
  });
}



app.listen(port, function () {
  console.info("Listening on http://localhost:" + port);
  console.log("")
});