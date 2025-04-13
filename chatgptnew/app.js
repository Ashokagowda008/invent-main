var request = require('request');
const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai");

const getToken = require('./getAccessToken');
const getMail = require('./getMailBox');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
//const client = new ImapFlow(READ_MAIL_CONFIG1.imap);
let username="";
let index=0;
let uid, emailid= [];
var mailbody = "";
let access_token = "";
const port = process.env.port || process.env.PORT || 4000

const getReplyFromCGPT = async (htmlBody) => {
    console.log(htmlBody);
    const history = [];
    const user_input = htmlBody;
    const messages = [];
    for (const [input_text, completion_text] of history) {
        messages.push({ role: "user", content: "Sender" });
        messages.push({ role: "assistant", content: completion_text });
    }
    messages.push({ role: "user", content: user_input });
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages
        });
        let completion_text = completion.data.choices[0].message.content;
        console.log(completion_text);
        completion_text = JSON.parse(completion_text);
        //history.push(user_input, completion_text);
        if (completion_text !== "" && completion_text.hasOwnProperty("Purchaseordernumber")) {
            if (completion_text.Purchaseordernumber !== "") {

                getOrderdetails(completion_text.Purchaseordernumber).then((response) => {

                    console.log(JSON.parse(response));
                    var jsondata = JSON.parse(response).value;

                    if (jsondata.length > 0) {
                        mailbody = "Write an email by extracting shipped date from the given json data and display all the values, best regards Customer Service Team" + response
                        replytoCGPTOnsuccess(mailbody);
                    }
                    else {
                        mailbody = "Please provide suffient information about purchase order. the mentioned order number is invalid";
                    }
                });
            }

        } else {
            mailbody = "Please provide suffient information about purchase order. the mentioned order number is invalid";
        }

    } catch (error) {
        if (error.response) {
            console.log(error.response.status)
            console.log(error.response.data)
        } else {
            console.log(error.message)
        }
    }
}

const replytoCGPTOnsuccess = async (htmlBody) => {

    const user_input = htmlBody;
    const messages = [];

    messages.push({ role: "user", content: user_input });
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages
        });
        let completion_text = completion.data.choices[0].message.content;
        sendEmail(completion_text);


    } catch (error) {
        if (error.response) {
            console.log(error.response.status)
            console.log(error.response.data)
        } else {
            console.log(error.message)
        }
    }
}

const getOrderdetails = function (purchaseorder) {
    return new Promise((resolve, reject) => {
        var url = "https://services.odata.org/v4/northwind/northwind.svc/Orders?$filter=OrderID%20eq%20" + purchaseorder;
        var options = {
            method: 'GET',
            url: url,
            qs: { '$top': '50' },
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

// const getAccessTokenEMail = (message) => {

//     var options = {
//         'method': 'POST',
//         'url': 'https://login.microsoftonline.com/95fa8a19-a397-4783-8db9-0d8f7886f7a8/oauth2/v2.0/token',
//         'headers': {
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         form: {
//             'client_id': process.env.client_id,
//             'scope': 'https://graph.microsoft.com/Mail.Send',
//             'client_secret': process.env.client_secret,
//             'grant_type': 'password',
//             'username': process.env.formusername,
//             'password': process.env.password
//         }
//     };
//     request(options, function (error, response) {
//         if (error) throw new Error(error);
//         // console.log(JSON.parse(response.body));
//         sendEmail(JSON.parse(response.body).access_token, message);
//     });


// }


const sendEmail = function (message) {
    var email= emailid[index];
    var request = require('request');
    var options = {
        'method': 'POST',
        'url': 'https://graph.microsoft.com/v1.0/me/sendMail',
        'headers': {
            'Authorization': 'bearer ' + access_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "message": {
                "subject": "Shipment details by ChatGPT",
                "body": {
                    "contentType": "Text",
                    "content": message
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": emailid[index]
                        }
                    }
                ]
            },
            "saveToSentItems": "true"
        })

    };
    index++;
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response);
        
    });

}

const extractMail = function (mails, accesstoken) {
   for (var i = 0; i < mails.value.length; i++) {
        const body = mails.value[i].body.content;
        emailid.push(mails.value[i].sender.emailAddress.address);
            console.log(emailid);
        let htmlBody = "Could you please extract the data from this and Turned into json object with property Purchaseordernumber, if you think its about purchase order only otherwise create json object with property request type value invalid." + body;
        setMailtoread(accesstoken, mails.value[i].id).then((response) => {
            //  getReplyFromCGPT(htmlBody);
            sendEmail("Reply from Bot");
        });
    }
}

const setMailtoread = function (accesstoken, mailID) {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'PATCH',
            'url': 'https://graph.microsoft.com/v1.0/me/messages/' + mailID,
            'headers': {
                'Authorization': 'Bearer ' + accesstoken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "isRead": true
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            resolve(response.body);
            //console.log(response.body);
        });
    })
}

getToken().then((response) => {
    let accesstoken = JSON.parse(response).access_token;
    access_token = accesstoken;
    getMail(accesstoken).then((response) => {
        //console.log(JSON.parse(response));
        let mails = JSON.parse(response);
        if (mails.value.length > 0) {
            extractMail(mails, accesstoken);
        } else {
            console.log("mails");
        }
    })
}
);
//main().catch(err => console.error(err));



// app.listen(port, function () {
//     console.info("Listening on http://localhost:" + port);
// });


