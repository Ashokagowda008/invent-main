var request = require('request');
require("dotenv").config();

const getMail = function (accessToken) {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'GET',
            'url': 'https://graph.microsoft.com/v1.0/me/messages?$filter=subject eq \'Sales Order Status\' and isRead eq false',
            'headers': {
                'Authorization': 'Bearer ' + accessToken
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            resolve(response.body);

        });
    })
}

module.exports = getMail;