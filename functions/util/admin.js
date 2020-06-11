const admin = require ('firebase-admin');
const serviceAccount = require("../admin.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://elearning-d0823.firebaseio.com"
  });

  const db = admin.firestore(); 

  module.exports = {admin, db}; //import admin and db