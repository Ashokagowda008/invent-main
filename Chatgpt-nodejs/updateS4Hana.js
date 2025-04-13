require("dotenv").config();
var request = require('request');
const updateOrderItem = function (SOs) {
    return new Promise((resolve, reject) => {
        var url = process.env.SOItemApi + "$metadata"
        // console.log(url);
        var options = {
            'method': 'GET',
            'url': 'https://sdcplatformdbrs.launchpad.cfapps.eu10.hana.ondemand.com/113f8ce2-1b7e-4ee4-8d23-a2661edb6101.chatgptso.chatgptso-0.0.1/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder=\'387262\',SalesOrderItem=\'10\')?$select=SalesOrder,SalesOrderItem,DeliveryPriority',
            'headers': {
              'Cookie': 'JSESSIONID=s%3A_GfltewOEX5ysFfbv6H7g7WxHinjFqQj.pXl5L%2FwJftBUFEWgsf4uUtgUz33PROpSL1A%2BiX1Q%2FuI; __VCAP_ID__=084a5ee9-8f5d-45ad-6d77-9172',
              'x-csrf-token': 'fetch',
              'Content-Type': 'application/json'
              
            }
          };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            //   console.log(response);
            resolve(response.headers)
        });
    })
}

module.exports = updateOrderItem;