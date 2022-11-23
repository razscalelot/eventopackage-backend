let admin = require('firebase-admin');
let serviceAccount = require('./../friendfield_firebase_config.json');
const constants = require('./constants');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function sendNotification(token, payload) {
    admin.messaging().sendToDevice(token, payload).then( response => {
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', token, error);
            } else{
                console.log('Sucessfully sent to '+ token);
            }
        });
    }).catch(err => console.log(err));
};
module.exports = { sendNotification };