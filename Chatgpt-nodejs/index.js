var request = require('request');
const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai");
const getToken = require('./getAccessToken');
const getMail = require('./getMailBox');
const updateS4Hana = require('./updateS4Hana');
const orderDetails = require('./app');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
//const client = new ImapFlow(READ_MAIL_CONFIG1.imap);
let username = "";
let index = 0;
let uid, emailid = [];
var mailbody = "";
let access_token = "";
let SOs = { SONo: "387262", SOItemNo: "10", DeliveryPriority: "4" };
const port = process.env.port || process.env.PORT || 9000
const getReplyFromCGPT = async (htmlBody) => {
    console.log("Extracted Mail Body from Nodejs:")
    console.log(htmlBody);
    console.log("")
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
        console.log("Converetd Json data from ChatGPT:")
        console.log(completion_text);
        console.log("")
        completion_text = JSON.parse(completion_text);
        //history.push(user_input, completion_text);
        if (completion_text !== "" && completion_text.hasOwnProperty("Salesordernumber")) {
            if (completion_text.Salesordernumber !== "") {

                orderDetails(completion_text.Salesordernumber).then((response) => {
                    var jsondata = JSON.parse(response).d;
                    console.log("Response from S4:")
                    console.log(jsondata);
                    console.log("")
                    SOs.SONo = jsondata.SalesOrder;
                    // SOs.SOItemNo = jsondata.to_Item[0].SalesOrderItem;
                    // SOs.DeliveryPriority = jsondata.to_Item[0].DeliveryPriority;
                    var date1 = (jsondata.RequestedDeliveryDate.split("/")[1]).split("Date")[1].split("(")[1].split(")")[0];
                    // console.log(date1);
                    var requesteddeliverydate = new Date(parseInt(date1));
                    var systemdate = (new Date()).toISOString();
                    delete jsondata.__metadata;
                    // delete jsondata.to_Item;
                    jsondata.currentDate = systemdate;
                    jsondata.RequestedDeliveryDate = requesteddeliverydate;
                    // console.log(jsondata);
                    if (jsondata) {
                        jsondata = JSON.stringify(jsondata);
                        mailbody = "using this data " + jsondata + ", write a email to customer, mention the diffrence between RequestedDeliveryDate and currentDate from the json data, and mention the diffrence in days and if the diffrence is greater than 3 days mention DeliveryPriority=" + parseInt(SOs.DeliveryPriority) + " in the mail body.";
                        // and if the diffrence is greater than 3 days then update OverallDeliveryStatus to C,
                        //"write an email, convert this json in to meaningful text, keeping in mind a customer asks for their purchase order status, if OverallDeliveryStatus returns A then none of the item is delivered. if the currentDate is greater than RequestedDeliveryDate date by 3 days then the OverallDeliveryStatus has to be changed to C" + jsondata
                        //"Write an email by extracting shipped date from the given json data and display all the values, best regards Customer Service Team" + response

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
        console.log("Mail with Delivery Status:")
        console.log(completion_text)
        console.log("")
        sendEmail(completion_text);
        console.log(completion_text.includes("greater than"))
        console.log(completion_text.includes("exceeds"))
        console.log(completion_text.includes("more than"))
        if (completion_text.includes("greater than") || completion_text.includes("exceeds") || completion_text.includes("more than")) {
            console.log("Updating Delivery Priority to S4")
            updateS4Hana(SOs).then((response) => {
            });
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

const sendEmail = function (message) {
    var email = emailid[index];

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
        // console.log(response);

    });

}

const extractMail = function (mails, accesstoken) {

    for (var i = 0; i < mails.value.length; i++) {

        const body = mails.value[i].body.content;
        emailid.push(mails.value[i].sender.emailAddress.address);
        console.log("From Mail Address:")
        console.log(emailid);
        console.log("")
        let htmlBody = "Could you please extract the data from this and Turned into json object with property Salesordernumber, if you think its about sales order only otherwise create json object with property request type value invalid." + body;
        setMailtoread(accesstoken, mails.value[i].id).then((response) => {


            getReplyFromCGPT(htmlBody);
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


app.get("/readmailbox", (req, res) => {
    updateS4Hana(SOs).then((csrfResponseHeader) => {
        console.log(csrfResponseHeader);
        var options = {
            'method': 'PATCH',
            'url': 'https://sdcplatformdbrs.launchpad.cfapps.eu10.hana.ondemand.com/113f8ce2-1b7e-4ee4-8d23-a2661edb6101.chatgptso.chatgptso-0.0.1/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder=\'387262\',SalesOrderItem=\'10\')',
            'headers': {
              'x-csrf-token': csrfResponseHeader['x-csrf-token'],
              'Content-Type': 'application/json',
              'Cookie': 'JSESSIONID=s%3A_GfltewOEX5ysFfbv6H7g7WxHinjFqQj.pXl5L%2FwJftBUFEWgsf4uUtgUz33PROpSL1A%2BiX1Q%2FuI; __VCAP_ID__=084a5ee9-8f5d-45ad-6d77-9172'
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
        })
    });
    // getToken().then((response) => {
    //     let accesstoken = JSON.parse(response).access_token;
    //     access_token = accesstoken;
    //     getMail(accesstoken).then((response) => {
    //         //console.log(JSON.parse(response));
    //         var mails = JSON.parse(response);
    //         if (mails.value.length > 0) {
    //             extractMail(mails, accesstoken);
    //             res.send("Enquiry for Sales order is processed");
    //         } else {
    //             // console.log("mails");
    //             res.send("No mail found");
    //         }
    //     })
    // }
    // )

//main().catch(err => console.error(err));



app.listen(port, function () {
    console.info("Listening on http://localhost:" + port);
    console.log("")
});


