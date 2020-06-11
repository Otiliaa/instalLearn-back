const functions = require('firebase-functions');

var express = require('express');

var app = express();

var corsOptions = {
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept'],
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

var cors = require('cors');

app.use(cors(corsOptions));


const FBAuth = require('./util/fbAuth');

const { db } = require('./util/admin');

const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream, getScreamsByCategory} = require('./handlers/screams');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users');

//Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream); //the application will allow to see comments, likes even if they are not logged in

app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.get('/scream/getScreamsByCategory/:category', getScreamsByCategory);

//users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);



exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}') //create a notification whenever someone likes a scream(post)
  .onCreate((snapshot) => { //whenever a doc is created, this will have a handler that will take a snapshot and a context 
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            screamId: doc.id ////this returns  a promise that holds a right result
          }); //here we will create a notification, the reson why we FETCH the scream is because we need some data from it
        }
      })
      .catch((err) => console.error(err));
  });
exports.deleteNotificationOnUnLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}') //create a notification whenever someone likes a scream(post)
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`) //the id of the like is the same id of the notification
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });
exports.createNotificationOnComment = functions
  .region('europe-west1')
  .firestore.document('comments/{id}') //here we get a document
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get() //this is the liked dosucment so we have access to the screamId
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({ //we create a notification with the snapshotId which is the comment document id
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            screamId: doc.id //this returns  a promise that holds a right result
          }); //here we will create a notification, the reson why we FETCH the scream is because we need some data from it
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) { //will execute this only if the user document uRL has changed
      console.log('image has changed');
      const batch = db.batch();
      return db
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region('europe-west1')
  .firestore.document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('screamId', '==', screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });