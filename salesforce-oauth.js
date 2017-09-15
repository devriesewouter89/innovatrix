const express = require('express'),
    oauth2 = require('salesforce-oauth2'),
    axios = require('axios'),
    fs = require('fs')
chalk = require('chalk');


const wantedReport = 'iStart-2017-1 review answers';
const callbackUrl = "http://localhost:3000/oauth/callback",
    consumerKey = "3MVG9sSN_PMn8tjRbbCIah13NOUQh0FuVxv7you0LJt3TuRf9orUc9Z.A9YFVW9j_Of2kx2TaGwqWn0VUWTOg",
    consumerSecret = "2998375974546207857";

const urlResource = 'https://iminds.my.salesforce.com/services/data/v20.0/';
const urlObjects = 'https://iminds.my.salesforce.com/services/data/v20.0/sobjects/';
const urlReports = 'https://iminds.my.salesforce.com/services/data/v35.0/query?q=SELECT+name+from+Report';
const urlPreselection = 'https://iminds.my.salesforce.com/services/data/v35.0/analytics/reports/00Ob0000004JUf4?includeDetails=true';
const urlSelection = 'https://iminds.my.salesforce.com/services/data/v35.0/analytics/reports/00Ob0000004JUud?includeDetails=true';


const app = express();
axios.create({
    baseURL: 'https://iminds.my.salesforce.com',
    timeout: 1000,
    headers: {'X-Custom-Header': 'foobar'}
});

let optionsGET, optionsPOST;
let resources, objects, istart, reports;
//nextSearch is needed to get next batch of records (no more than 1999 allowed at once
let nextSearch;

app.get("/", function (request, response) {
    // console.log('> /');
    const uri = oauth2.getAuthorizationUrl({
        base_url: 'https://iminds.my.salesforce.com',
        redirect_uri: callbackUrl,
        client_id: consumerKey,
        scope: 'api'
    });
    return response.redirect(uri);
    // console.log("auth gedaan, cnt2 >0");
});

// async function callAll() {
//     "use strict";
//     console.log(chalk.bgRed('>> callAll'));
//     const {resources, objects, istart, accounts} = await Promise.all([
//         list(urlResource, optionsGET),
//         list(urlObjects, optionsGET),
//         list(urlPreselection, optionsGET),
//         list(urlReports, optionsGET)]);
//
//     console.log(chalk.bgRed('response?'), JSON.stringify(objects, null, '  '));
//     return {resources, objects, istart, accounts};
// }


let token, frontEndResponse;
app.get('/oauth/callback', function (request, frontEndResponse) {
    // console.log('> /oauth/callback', response.params);
    let authorizationCode = request.param('code');

    oauth2.authenticate({
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
            nextSearch = {};
            optionsGET = {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'X-PrettyPrint': '1'
                }
            };
            optionsPOST = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'X-PrettyPrint': '1'
                },
                data: {
                    "reportMetadata": {
                        "reportBooleanFilter": null,
                        "reportFilters": [
                            {
                                "column": "Project__c.Phase__c",
                                "isRunPageEditable": true,
                                "operator": "equals",
                                "value": "Pre-selection"
                            }
                        ],
                        "sortBy": [
                            {
                                "sortColumn": "Review_Report_Answer__c.Id",
                                "sortOrder": "Asc"
                            }
                        ]
                    }
                }
            };

            /* error in node/wouterDV-combo logic??*/
            // callAll().then(({resources, objects, istart, reports})=>{console.log(chalk.red(objects));});
            // // callAll();
            //     // .then(result =>{
            //     //     console.log(chalk.bgRed('result callAll'), JSON.stringify(resources, null, '  '));
            //     //     response.send(`<html><body><p>Resources:<pre >${JSON.stringify(resources, null, '  ')}</pre>  </p><p>Accounts:<pre> ${JSON.stringify(objects, null, '  ')}</pre>  </p></body></html>`)})
            //     // .catch(err => console.log(err));
            /* to retrieve link to wanted report if not given:
            callAllPromise().then(result => {
                console.log(chalk.bgGreen('to front-end'));
                // response.send(`<html><body><p>Resources:<pre > ${JSON.stringify(resources, null, '  ')}</pre>  </p><p>Query:<pre> ${JSON.stringify(reports, null, '  ')}</pre>  </p></body></html>`);//

                let myJSON = JSON.stringify(reports, null, '  ');
                let obj = JSON.parse(myJSON);
                let keys = Object.keys(obj);
                // for (let i = 0; i < keys.length; i++) {
                //     console.log("[",i,"] ",keys[i],": ", obj[keys[i]]);
                // }
                // console.log(obj[keys[2]]);
                let innerJSON = JSON.stringify(obj[keys[2]], null, ' ');
                // console.log(innerJSON);
                let innerObj = JSON.parse(innerJSON);
                let innerKeys = Object.keys(innerObj);
                for (let i = 0; i < innerKeys.length; i++) {
                    let inner2JSON = JSON.stringify(innerObj[innerKeys[i]], null, ' ');
                    // console.log("[",i,']',innerJSON, inner2JSON);
                    let inner2Obj = JSON.parse(inner2JSON);
                    if (inner2Obj.hasOwnProperty('Name')) {
                        if (inner2Obj['Name'] === wantedReport) {
                            // console.log('[', i, ']', ' name: ' + inner2Obj['Name']);
                            // console.log("[", i, "] ", innerObj[innerKeys[i]]);//, ": ", innerKeys[i]
                            let wantedUrl = 'https://iminds.my.salesforce.com' + innerObj[innerKeys[i]]['attributes']['url'];
                            console.log(wantedUrl);
                            let wantedJson;
                            list(wantedUrl, optionsGET).then(result => {
                                wantedJson = result;
                                response.send(`<html><body><p>file:<pre > ${JSON.stringify(result, null, '  ')}</pre>  </p></body></html>`);
                            });
                        }
                    } //else console.log('- geen token???:');
                    // let inner2Keys = Object.keys(inner2Obj);
                }
            }).catch(err => console.log(err));
*/
            filterReports("MasterReport_Innovatrix_Pre-Selection").then(result => {
                reportInfo(result, optionsPOST);
            })

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
//
// async function callKeys(myJSON) {
//     "use strict";
//     console.log("in callKeys");
//     let innerObj = JSON.parse(myJSON);
//     let innerKeys = Object.keys(innerObj);
//     console.log('- innerObj:', innerObj);
//     return [innerObj, innerKeys];
// }
//
// async function callAllPromise() {
//     "use strict";
//
//     return list(urlResource, optionsGET)
//         .then(result => {
//             resources = result;
//             // console.log(chalk.bgCyan('resources'), resources);
//             return list(urlObjects, optionsGET)
//                 .then(result => {
//                     objects = result;
//                     // console.log(chalk.bgCyan('objects'));
//                     return list(urlReports, optionsGET)
//                         .then(result => {
//                             reports = result;
//                             console.log(chalk.bgCyan('reports'));
//                             return list(urlPreselection, optionsGET)
//                                 .then(result => {
//                                     istart = result;
//                                     // console.log(chalk.bgCyan('istart'), istart);
//                                 })
//                         }).catch((err) => console.log(chalk.bgRed('error in callAllPromise'), err))
//                 })
//         })
// }


/*
* reportInfo uses the Url derived of filterReports and options (which defines GET/POST requests)
* the answer is logged to the console (2 rounds of this as only 2000 rows can be fetched each time)
* */
async function reportInfo(wantedUrl, options) {
    "use strict";

    console.log('- optionsPOST:', JSON.stringify(optionsPOST));
    console.log("url: ", wantedUrl);

    list(wantedUrl, optionsPOST).then(result => {
        console.log(chalk.bgGreen('Report content:'));

        let lastReviewReportAnswerId;
        // console.log('- result.allData:', result.allData);
        if (!result.allData) {
            lastReviewReportAnswerId = result.factMap['T!T'].rows[1999].dataCells[14];
            console.log('- lastReviewReportAnswerId:', lastReviewReportAnswerId);
            nextSearch = lastReviewReportAnswerId['value'];
            console.log('- nextSearch:', nextSearch);
        }

        let myJSON = JSON.stringify(result, null, '  ');

        let obj = JSON.parse(myJSON);

        let keys = Object.keys(obj);
        // console.log('- keys.length:', keys.length);
        // STRANGE: keys.length = [0..7] but 7 is empty json or malformed ==> typeConversion Error
        for (let i = 0; i < 7; i++) {//keys.length
            // console.log("[",i,"] ",keys[i],": ", obj[keys[i]]);
            // }
            // console.log(obj[keys[2]]);
            let innerJSON = JSON.stringify(obj[keys[i]], null, ' ');
            // callKeys(innerJSON).then(([innerObj, innerKeys])=>console.log("done"));
            // console.log(innerJSON);
            let innerObj = JSON.parse(innerJSON);
            let innerKeys = Object.keys(innerObj);
            console.log('[', i, ']', '- innerKeys.length:', innerKeys.length);
            for (let j = 0; j < innerKeys.length; j++) {
                //inner2JSON is the JSON containing JSON which needs to be unpacked 1 level lower to have all rows in new objects
                let inner2JSON = JSON.stringify(innerObj[innerKeys[j]], null, ' ');
                // console.log("[", i, ']', innerJSON, inner2JSON);
                // console.log('- inner2JSON:', inner2JSON);
                let inner2Obj = JSON.parse(inner2JSON);
                // console.log(inner2Obj);
                let inner2Keys = Object.keys(inner2Obj);
                // console.log('[', j, ']', '- inner2Keys.length:', inner2Keys.length);
                for (let k = 0; k < inner2Keys.length; k++) {
                    // console.log(chalk.bgCyan("[",i,']: '),inner2Keys[i]," object: ", inner2Obj[inner2Keys[i]]);
                    let inner3JSON = JSON.stringify(inner2Obj[inner2Keys[k]], null, ' ');
                    // console.log("[",i,']',chalk.red(inner2JSON), inner3JSON);
                    // console.log('- inner3JSON:', inner3JSON);
                    let inner3Obj = JSON.parse(inner3JSON);
                    let inner3Keys = Object.keys(inner3Obj);
                    // console.log('[', k, ']', '- inner3Keys.length:', inner3Keys.length);

                    for (let l = 0; l < inner3Keys.length; l++) {
                        console.log(chalk.bgCyan("[", i, " ", j, " ", k, ",", l, ']: '), inner3Obj[inner3Keys[l]]);


                    }

                }
            }
        }
        // console.log('- result.allData:', result.allData);
        if (!result.allData) {
            console.log("fetch new data");
            optionsPOST = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'X-PrettyPrint': '1'
                },
                data: {
                    "reportMetadata": {
                        "reportBooleanFilter": null,
                        "reportFilters": [
                            {
                                "column": "Review_Report_Answer__c.Id",
                                "operator": "greaterThan",
                                "value": nextSearch
                            },
                            {
                                "column": "Project__c.Phase__c",
                                "isRunPageEditable": true,
                                "operator": "equals",
                                "value": "Pre-selection"
                            }
                        ],
                        "sortBy": [
                            {
                                "sortColumn": "Review_Report_Answer__c.Id",
                                "sortOrder": "Asc"
                            }
                        ]
                    }
                }
            };
            reportInfo(wantedUrl, optionsPOST);
        }
    }).catch(err => console.log(err))

}


/*
* filterReports lists all Reports (via Query URL) and filters based on the name requested
* If we want a list of all reports possible, then we only have to run list(urlReports, optionGET) and capture the output
*
* */
async function filterReports(wantedReport) {
    "use strict";
    let response, wantedUrl;
    try {
        response = await list(urlReports, optionsGET);
        console.log(chalk.bgGreen('Filter report list'));
        // frontEndResponse.send(`<html><body><p>Resources:<pre > ${JSON.stringify(response, null, '  ')}</pre>  </p></body></html>`);//

        let myJSON = JSON.stringify(response, null, '  ');
        let obj = JSON.parse(myJSON);
        let keys = Object.keys(obj);
        // for (let i = 0; i < keys.length; i++) {
        //     console.log("[",i,"] ",keys[i],": ", obj[keys[i]]);
        // }
        // console.log(obj[keys[2]]);
        let innerJSON = JSON.stringify(obj[keys[2]], null, ' ');
        // console.log(innerJSON);
        let innerObj = JSON.parse(innerJSON);
        let innerKeys = Object.keys(innerObj);
        for (let i = 0; i < innerKeys.length; i++) {
            let inner2JSON = JSON.stringify(innerObj[innerKeys[i]], null, ' ');
            // console.log("[",i,']',innerJSON, inner2JSON);
            let inner2Obj = JSON.parse(inner2JSON);
            if (inner2Obj.hasOwnProperty('Name')) {
                if (inner2Obj['Name'] === wantedReport) {
                    // console.log('[', i, ']', ' name: ' + inner2Obj['Name']);
                    console.log("[", i, "] ", innerObj[innerKeys[i]]);//, ": ", innerKeys[i]
                    // IMPORTANT TO KNOW: the returned Url needs to be concatenated but ALSO 3 last characters removed (salesforce specs)
                    let str = String(innerObj[innerKeys[i]]['attributes']['url']);
                    str = str.substring(0, str.length - 3);
                    str = str.replace("sobjects/Report/", "analytics/reports/");
                    wantedUrl = 'https://iminds.my.salesforce.com' + str + "?includeDetails=true";
                    console.log(chalk.bgGreen("the wanted Url for report " + wantedReport + " is: ") + wantedUrl);
                    // let wantedJson;
                    // list(wantedUrl, optionsGET).then(result => {
                    //     wantedJson = result;
                    //     // frontEndResponse.send(`<html><body><p>file:<pre > ${JSON.stringify(result, null, '  ')}</pre>  </p></body></html>`);
                    // });
                }
            }
        }
        return wantedUrl;
    }
    catch (error) {
        console.log(chalk.bgRed("Error in list: "), error.response.data);
        console.log('headers: ', error.response.headers);
        return;
    }
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

