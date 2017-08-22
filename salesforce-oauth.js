const express = require('express'),
    oauth2 = require('salesforce-oauth2'),
    // cookie = require('node-cookie'),
    axios = require('axios'),
    chalk = require('chalk');


const wantedReport = 'iStart-2017-1 review answers';
const callbackUrl = "http://localhost:3000/oauth/callback",
    consumerKey = "3MVG9sSN_PMn8tjRbbCIah13NOUQh0FuVxv7you0LJt3TuRf9orUc9Z.A9YFVW9j_Of2kx2TaGwqWn0VUWTOg",
    consumerSecret = "2998375974546207857";

// const urlResource = 'https://iminds--test.cs89.my.salesforce.com/services/data/v20.0/';
// const urlObjects = 'https://iminds--test.cs89.my.salesforce.com/services/data/v20.0/sobjects';
// const urlReports =  ' https://iminds.my.salesforce.com/services/data/v20.0/query?q=SELECT+name+from+Account';
const urlResource = 'https://iminds.my.salesforce.com/services/data/v20.0/';
const urlObjects = 'https://iminds.my.salesforce.com/services/data/v20.0/sobjects/';
const urlReports = 'https://iminds.my.salesforce.com/services/data/v20.0/query?q=SELECT+name+from+Report';
const csvQuery = 'https://iminds.my.salesforce.com/services/data/v20.0/query?q=SELECT+name+from+Report';
// Record Type equals iStart project
// AND Call: Call Name equals iStart-2017-1
// const urlObjects =  'https://iminds--test.cs89.my.salesforce.com/services/data/v20.0/sobjects';

const app = express();
axios.create({
    baseURL: 'https://iminds.my.salesforce.com',
    // baseURL: 'https://iminds--test.cs89.my.salesforce.com',
    timeout: 1000,
    headers: {'X-Custom-Header': 'foobar'}
});

let options;
let resources, objects, istart, reports;


app.get("/", function (request, response) {
    // console.log('> /');
    const uri = oauth2.getAuthorizationUrl({
        // base_url: 'https://iminds--test.cs89.my.salesforce.com',
        base_url: 'https://iminds.my.salesforce.com',
        redirect_uri: callbackUrl,
        client_id: consumerKey,
        scope: 'api'
    });
    return response.redirect(uri);
    // console.log("auth gedaan, cnt2 >0");
});

async function callAll() {
    "use strict";
    console.log(chalk.bgRed('>> callAll'));
    const [resources, objects, istart, accounts] = await Promise.all([
        // list(urlResource, options),
        list(urlResource, options),
        list(urlObjects, options),
        list(csvQuery, options),
        list(urlReports, options)]);

    // console.log(chalk.bgRed('response?'), JSON.stringify(istart, null, '  '));
    return [resources, objects, istart, accounts];
}


let token;
app.get('/oauth/callback', function (request, response) {
    // console.log('> /oauth/callback', response.params);
    let authorizationCode = request.param('code');

    oauth2.authenticate({
        // base_url: 'https://iminds--test.cs89.my.salesforce.com',
        base_url: 'https://iminds.my.salesforce.com',
        redirect_uri: callbackUrl,
        client_id: consumerKey,
        client_secret: consumerSecret,
        code: authorizationCode
    }, function (error, payload) {
        if (error) console.log(chalk.red('- error:', error));
        console.log('- payload:', payload);
        // response.send(`<html><body><p>payload:<pre> ${JSON.stringify(payload, null, '  ')}</pre>  </p></body></html>`);
        try {
            let myJSON = JSON.stringify(payload, null, '  ');
            let obj = JSON.parse(myJSON);
            // let keys = Object.keys(obj);
            // for(let i = 0;i<keys.length;i++){
            //     console.log(keys[i],": ", obj[keys[i]]);
            // }
            if (obj.hasOwnProperty('access_token')) {
                token = obj['access_token'];
                // console.log('- token:', token);
            } else console.log('- geen token???:');
        }
        catch (error) {
            // console.log("bad JSON received ", error);
        }
        if (token) {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'X-PrettyPrint': '1'
                }
            };
            [resources, objects, istart, reports] = callAll();
            // callAll();
                // .then(result =>{
                //     console.log(chalk.bgRed('result callAll'), JSON.stringify(resources, null, '  '));
                //     response.send(`<html><body><p>Resources:<pre >${JSON.stringify(resources, null, '  ')}</pre>  </p><p>Accounts:<pre> ${JSON.stringify(objects, null, '  ')}</pre>  </p></body></html>`)})
                // .catch(err => console.log(err));

            // callAllPromise().then(result => {
            //     console.log(chalk.bgGreen('to front-end'));
            //     // response.send(`<html><body><p>Resources:<pre > ${JSON.stringify(resources, null, '  ')}</pre>  </p><p>Query:<pre> ${JSON.stringify(reports, null, '  ')}</pre>  </p></body></html>`);//
            //
            //     let myJSON = JSON.stringify(reports, null, '  ');
            //     let obj = JSON.parse(myJSON);
            //     let keys = Object.keys(obj);
            //     // for (let i = 0; i < keys.length; i++) {
            //     //     // console.log("[",i,"] ",keys[i],": ", obj[keys[i]]);
            //     // }
            //     console.log(obj[keys[2]]);
            //     let innerJSON = JSON.stringify(obj[keys[2]], null, ' ');
            //     // console.log(innerJSON);
            //     let innerObj = JSON.parse(innerJSON);
            //     let innerKeys = Object.keys(innerObj);
            //     for (let i = 0; i < innerKeys.length; i++) {
            //         let inner2JSON = JSON.stringify(innerObj[innerKeys[i]], null, ' ');
            //         // console.log("[",i,']',innerJSON, inner2JSON);
            //         let inner2Obj = JSON.parse(inner2JSON);
            //         if (inner2Obj.hasOwnProperty('Name')) {
            //             if (inner2Obj['Name'] === wantedReport) {
            //                 // console.log('[', i, ']', ' name: ' + inner2Obj['Name']);
            //                 // console.log("[", i, "] ", innerObj[innerKeys[i]]);//, ": ", innerKeys[i]
            //                 let wantedUrl = 'https://iminds.my.salesforce.com' + innerObj[innerKeys[i]]['attributes']['url'];
            //                 console.log(wantedUrl);
            //                 let wantedJson;
            //                 list(wantedUrl, options).then(result => {
            //                     wantedJson = result;
            //                     response.send(`<html><body><p>file:<pre > ${JSON.stringify(result, null, '  ')}</pre>  </p></body></html>`);
            //
            //                 });
            //             }
            //         } //else console.log('- geen token???:');
            //         // let inner2Keys = Object.keys(inner2Obj);
            //     }
            // }).catch(err => console.log(err))
        }
        /*

        The payload should contain the following fields:

        id 				A URL, representing the authenticated user,
                        which can be used to access the Identity Service.

        issued_at		The time of token issue, represented as the
                        number of seconds since the Unix epoch
                        (00:00:00 UTC on 1 January 1970).

        refresh_token	A long-lived token that may be used to obtain
                        a fresh access token on expiry of the access
                        token in this response.

        instance_url	Identifies the Salesforce instance to which API
                        calls should be sent.

        access_token	The short-lived access token.


        The signature field will be verified automatically and can be ignored.

        At this point, the client application can use the access token to authorize requests
        against the resource server (the Force.com instance specified by the instance URL)
        via the REST APIs, providing the access token as an HTTP header in
        each request:

        Authorization: OAuth 00D50000000IZ3Z!AQ0AQDpEDKYsn7ioKug2aSmgCjgrPjG...
        */
    });
});


async function callAllPromise() {
    "use strict";

    return list(urlResource, options)
        .then(result => {
            resources = result;
            // console.log(chalk.bgCyan('resources'), resources);
            return list(urlObjects, options)
                .then(result => {
                    objects = result;
                    // console.log(chalk.bgCyan('objects'));
                    return list(urlReports, options)
                        .then(result => {
                            reports = result;
                            // console.log(chalk.bgCyan('reports'));
                            return list(csvQuery, options)
                                .then(result => {
                                    istart = result;
                                    console.log(chalk.bgCyan('istart'), istart);
                                })
                        }).catch((err) => console.log(chalk.bgRed('error in callAllPromise'), err))
                })
        })
}


//
async function list(url, options) {
    let response;
    try {
        // console.log(token);
        response = await axios(url, options);
        // console.log('headers: ', response.headers);
        // console.log(chalk.red('statuscode: '), response.status);
        // console.log('body:', response.data);
    } catch (error) {
        console.log(chalk.bgRed("Error in list: "), error.response.data);
        console.log('headers: ', error.response.headers);
    }
    // send(`<html><body><p>Resources:<pre> ${JSON.stringify(response.data, null, '  ')}</pre>  </p></body></html>`);
    return response.data;
}

app.listen(3000, function () {
    console.log("Listening on 3000");
});

