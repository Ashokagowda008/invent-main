var request = require('request');
require("dotenv").config();
const getAccesstoken = function () {
    return new Promise((resolve, reject) => {
    var options = {
        'method': 'POST',
        'url': 'https://login.microsoftonline.com/95fa8a19-a397-4783-8db9-0d8f7886f7a8/oauth2/v2.0/token',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'client_id':  process.env.client_id,
            'scope':  process.env.scope,
            'client_secret':  process.env.client_secret,
            'grant_type': 'password',
            'username':  process.env.formusername,
            'password':  process.env.password
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        resolve(response.body);
    });
    })
}

module.exports = getAccesstoken;