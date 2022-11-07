const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const delay = require('delay')
const axios = require('axios');

// sample for send otp to email
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: '0056015cb6e82a1798a31fca5fada59b-10eedde5-4d887bfa'});

const randNumber = (length) =>
    new Promise((resolve, reject) => {
        var text = "";
        var possible =
            "0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        resolve(text);
    });

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const TOKEN_PATH = "token.json";

fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), main);
});

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error("Error retrieving access token", err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log("Token stored to", TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

const getLatestMessageId = async (gmail, email) => {
    return new Promise((resolve, reject) => {
        gmail.users.messages.list(
            {
                userId: "me",
                q: email,
                maxResults: 1,
            },
            (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!res.data.messages) {
                    resolve([]);
                    return;
                }

                resolve(res.data.messages[0].id);
            }
        );
    });
};


const getMessageById = async (gmail, messageId) => {
    return new Promise((resolve, reject) => {
        gmail.users.messages.get(
            {
                userId: "me",
                id: messageId,
            },
            (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                var buff;
                try {
                    buff = Buffer.from(res.data.payload.body.data, "base64");
                    const str = buff.toString("utf-8");
                    resolve(str);
                } catch (err) {
                    resolve('error')
                }
            }
        );
    });
};


function* generate(email) {
    if (email.length <= 1) {
        yield email;
    } else {
        let head = email[0];
        let tail = email.slice(1);
        for (let item of generate(tail)) {
            yield head + item;
            yield head + "." + item;
        }
    }
}

const updateEmails = uname =>
    new Promise((resolve, reject) => {
        let username = uname;
        let email = [];
        //   document.getElementById("emails").value = "";
        count = 0;
        let startTime = new Date();
        for (let message of generate(username)) {
            email.push(message + "@gmail.com");
            count += 1;
        }

        resolve(email);
    });

const sentOTP = async(email) => {
    const headers = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,id;q=0.7',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
        }
    }
    return await axios.get(`https://api.vagoweb3.com/api/v1.1/send/email/code?email=${email}`, headers)
    .then(res => res.data.message)
    .catch(err => 'fail');
}

const verifyOTP = async(email, emailCode, inviteCode) => {
    const data = {
        email,
        emailCode,
        inviteCode,
        password: email,
    }
    const headers = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,id;q=0.7',
            'content-length': data.length,
            'content-type': 'application/json;charset=UTF-8',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
        }
    }
    return await axios.post('https://api.vagoweb3.com/api/v1/register', data, headers)
    .then(res => res.data);
}


async function main(auth) {

    try{

        const emailListDotTrick = await updateEmails('akmalgaming74');
        
        for (let index = 0; index < emailListDotTrick.length; index++) {
            const element = emailListDotTrick[index];
            console.log('Mengirim OTP ke email', element);
            const sent = await sentOTP(element)
            if (sent === 'success') {
                console.log(`OTP berhasil terkirim`)
                console.log('Menunggu OTP')
    
                await delay(3000)
                const gmail = google.gmail({ version: "v1", auth });
                try {
                    const messageId = await getLatestMessageId(gmail, element);
                    var message = await getMessageById(gmail, messageId);
                    if (message === 'error') {
                        console.log('error');
                    } else {
                        message = message.split('<strong> ')[1];
                        message = message.split('</strong>')[0];
                        const verify = await verifyOTP(element, message, '9d27fe45');
                        if (verify.message === 'success') {
                            console.log('Success');
                        } else {
                            console.log('Fail');
                        }
                    }
                } catch (err) {
                    console.log('Error');
                }
            } else {
                console.log('error');
            }
        }

        

       
    }catch(e){
        console.log(e)
    }


   
}