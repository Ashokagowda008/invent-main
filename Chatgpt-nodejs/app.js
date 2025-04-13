require("dotenv").config();
var request = require('request');
const express = require('express');
const app = express()
const getOrderdetails = function (purchaseorder) {
    return new Promise((resolve, reject) => {
        var url = process.env.PurchaseOrderApi + "('" + purchaseorder + "')?$select=SalesOrder,CreationDate,RequestedDeliveryDate,OverallDeliveryStatus,OverallSDDocReferenceStatus,OverallSDProcessStatus,OverallTotalDeliveryStatus"
        var options = {
            method: 'GET',
            url: url,
            qs: { '$format': 'json' },
            headers:
            {
                'content-type': 'application/json',
            }
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            resolve(body);
        });
    })
}
module.exports = getOrderdetails;