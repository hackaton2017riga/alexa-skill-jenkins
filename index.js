'use strict';
//var unirest = require('unirest');

var http = require('http');
//var treeParams = '/api/json?pretty=true&tree=jobs[name,lastBuild[number,timestamp,result,changeSet[items[author[fullName]]]]]';
var jenkinsUrl = "bpukdkak:DevOpsRig01@52.56.148.0/jenkins/";
var username = "jenkins";
var apiKey = "prUzetHAb2yaPrb";
var jobName = "Reference_Application_Build";
var jenkinsPort = 80;

exports.handler = function (event, context) {
    
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    try {
        if(event.request.type === "IntentRequest") {
            onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
                context.succeed(buildResponse(sessionAttributes, speechletResponse));
            });
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to the DevOps Hackathon Jenkins skill set. ' +
        'Please tell me a Jenkins command to execute';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me a Jenkins command to execute';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the DevOps Hackathon Jenkins skill set.';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createCommandAttributes(jenkinsCommand) {
    return {
        jenkinsCommand,
    };
}

function startPipeline (intent, session, callback) {
    console.log("enter StartPipeline");
    
    //var url = "http://bpukdkak:DevOpsRig01@52.56.148.0/jenkins/job/ExampleWorkspace/job/ExampleProject/view/Java_Reference_Application/job/Reference_Application_Build/build?token=prUzetHAb2yaPrb";
    //var params = "lorem=ipsum&name=alpha";

    var post_data = JSON.stringify("");
    
    var post_options = {
        host: 'bpukdkak:DevOpsRig01@52.56.148.0',
        port: '80',
        path: '/jenkins/job/ExampleWorkspace/job/ExampleProject/view/Java_Reference_Application/job/Reference_Application_Build/build?token=prUzetHAb2yaPrb',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };
    
    console.log("10");
    
    var post_req = http.request(post_options, function(res) {
console.log("20");
        res.setEncoding('utf8');
        var file = "";
        //res.pipe(file);

        res.on('response', function(response)  {
            console.log(response); 
        });
console.log("30");
        res.on('error', function(e) {
            context.fail('error:' + e.message);
        })
console.log("40");
        res.on('end', function() {
            context.succeed('success, end request listener');
        });
    });
    
    ////Send the proper header information along with the request
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.send(params);

    var req = http.post("http://bpukdkak:DevOpsRig01@52.56.148.0/jenkins/job/ExampleWorkspace/job/ExampleProject/view/Java_Reference_Application/job/Reference_Application_Build/build?token=prUzetHAb2yaPrb"
    , function(res) {

        var jenkinsJson = '';
        var cardTitle = intent.name;
        var repromptText = "";
        var sessionAttributes = {};
        var shouldEndSession = true;
        var speechOutput = "";
        
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            jenkinsJson += chunk;
            console.log("chunk=" + chunk);
        });

        res.on('end', function() {
            
            jenkinsJson = JSON.parse(jenkinsJson);
            var desiredJob = getDesiredJob(jenkinsJson);

            if(desiredJob === null){
                speechOutput = "I wasn't able to find a job named " + jobName;
                return callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            }

            var lastBuild = desiredJob.lastBuild;
            
            if(lastBuild.result === 'FAILURE'){
                var author = getAuthorFromLastBuild(desiredJob.lastBuild);
                speechOutput = author + " broke the build";
            } else {
                speechOutput = "The build is not broken";
            }

            return callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

        });
    });

    req.on('error', function(){
        throw "Failed to contact jenkins";
    });

    req.end();
}

function getDesiredJob(jenkinsJson){
    var jobs = jenkinsJson['jobs'];
    var desiredJob = null;
    jobs.forEach(function(job){
        if(job.name === jobName){
            desiredJob = job;
            return;
        }
    });
    return desiredJob;
}

function getAuthorFromLastBuild(lastBuild){
    var changeSetItems = lastBuild.changeSet.items;
    if(changeSetItems.length > 0){
        var author = changeSetItems[0].author;
        return author.fullName;
    }
    return null;
}

/**
 * Sets the command in the session and prepares the speech to reply to the user.
 */
function triggerCommand(intent, session, callback) {
    const cardTitle = intent.name;
    const jenkinsCommandSlot = intent.slots.Command;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';

    if (jenkinsCommandSlot) {
        const jenkinsCommand = jenkinsCommandSlot.value;
        sessionAttributes = createCommandAttributes(jenkinsCommand);
        if (jenkinsCommand === 'start') {
            speechOutput = `Okay. Starting pipeline.`;
            startPipeline(intent, session, callback);
            const shouldEndSession = true;
        } else if (jenkinsCommand == 'stop') {
            speechOutput = `Oh, stopping right away your pipeline!`;
            const shouldEndSession = true;
        } else if (jenkinsCommand == 'provide status') {
            const commandResult = "Running!";
            speechOutput = `The status of pipeline is ${commandResult}`;
            const shouldEndSession = true;
        }
        const shouldEndSession = true;
        callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
    } else {
        speechOutput = "Sorry, I don't understand. Could you please repeat the command?";
        repromptText = "Are you deaf? Repeat command please. Alexa is waiting for command to start, stop or provide status.";
    }
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'JenkinsIntent') {
        triggerCommand(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);
        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
