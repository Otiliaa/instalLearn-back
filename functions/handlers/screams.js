const { db } = require('../util/admin');

exports.getAllScreams = (req, res) => { //the first parameter of the function is the route, the 2nd one is the handle which takes a request and a response
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
        .then((data) => {
            let screams = []; //screams shout be popullated with the data of the screams that we have 
            data.forEach((doc) => {
                screams.push({ //whenever we return a scream we eant tu return its id as well
                    screamId: doc.id, //we will push an object
                    body: doc.data().body,
                    userHandle : doc.data().userHandle,
                    createdAt: doc.data().createdAt,
                    commentCount: doc.data().commentCount,
                    likeCount: doc.data().likeCount,
                    userImage: doc.data().userImage
                });
            });
            return res.json(screams); //DE CE RETURN RES??
        }) 
        .catch((err) => {
          console.error(err);
          res.status(500).json({ error: err.code });
    });
}


exports.postOneScream = (req, res) => { //a function for creating documents. PASS A SECOND ARGUMEN TO THIS POST. THIS ARGUMENT IS A FUNCTION THAT INTERCEPTS THE REQUEST AND DOES SOMETHING IN FUNCTION OF THE REQUEST AND THEN DECIDES WHETHER TO PROCEED TOWARD OUR HANDLE OR TO STOP THERE AND SEND THE RESPONSE
    if (req.body.body.trim() === ''){ //trim removes whitespaces from a string
        return res.status(400).json({body: 'Body must not be empty'});
    }
    
    const newScream = { //initialize our
        body: req.body.body, //the second body is a property in the body of the request
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    
    db.collection('screams')
        .add(newScream)
        .then((doc) => {
        const resScream = newScream;
        resScream.screamId = doc.id;
        res.json(resScream);
    })
    .catch((err) => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};   

//Fetch one scream
exports.getScream = (req, res) => {
    let screamData = {}; //empty object
    db.doc(`/screams/${req.params.screamId}`)
    .get()
        .then((doc) => { //returns a promise, will hold a document
            if(!doc.exists){
                return res.status(404).json({ error: 'Scream not found'});
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .where('screamId', '==', req.params.screamId)
            .get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data());
            });
        return res.json(screamData);
})
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
});
};

//Comment on a comment
exports.commentOnScream = (req, res) => {
    if (req.body.body.trim() === '')
      return res.status(400).json({ comment: 'Must not be empty' });
  
    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      screamId: req.params.screamId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };
    console.log(newComment);
  
    db.doc(`/screams/${req.params.screamId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({ error: 'Scream not found' });
        }
        return doc.ref.update({ commentCount: doc.data().commentCount + 1});
      })
      .then(() => {
          return db.collection('comments').add(newComment);
      })
      .then(() => {
        res.json(newComment);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: 'Something went wrong' });
      });
  };

  //Like a scream
exports.likeScream = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);
        
    let screamData;

    screamDocument.get()
        .then(doc => { //aici verifica daca comentariul exista
            if(doc.exists){
                screamData = doc.data();
                screamData.screamID = doc.id;
                return likeDocument.get(); //aici a dat like la comm
            }else{
                return res.status(404).json({ eroor: 'Scream not found'});
            }
        })
        .then(data => {
            if(data.empty){ 
                return db
                .collection('likes')
                .add({
                    screamId: req.params.screamId,
                    userHandle: req.user.handle
                })
                .then(() => {
                    screamData.likeCount++ //increment the likes, we added a like to our likes collection
                    return screamDocument.update({ likeCount: screamData.likeCount })
                })
                .then(() =>{
                    return res.json(screamData);
                })
            } else {
                return res.status(400).json({ error: 'Scream already liked'});
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code});
        })
};

exports.unlikeScream = (req, res) => {
    const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId)
    .limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);
        
    let screamData;

    screamDocument
        .get()
        .then((doc) => { //aici verifica daca comentariul exista
            if (doc.exists){
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get(); //aici a dat like la comm
            }else{
                return res.status(404).json({ eroor: 'Scream not found'});
            }
        })
        .then((data) => {
            if(data.empty){ 
                return res.status(400).json({ error: 'Scream not liked'});
            } else {
                return db
                .doc(`/likes/${data.docs[0].id}`)
                .delete() //the actual path for the doc
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({ likeCount: screamData.likeCount});
                    })
                    .then(() => {
                        res.json(screamData);
                    });
                }          
        })
        .catch(err => { 
            console.error(err)
            res.status(500).json({ error: err.code});
        })
};

//Delete a scream
 exports.deleteScream = (req, res) => {
     const document = db.doc(`/screams/${req.params.screamId}`);
     document.get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({ error: 'Scream not found'});
            }
            if(doc.data().userHandle !== req.user.handle){
                return res.status(403).json({ error: 'Unauthorized'});
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Scream deleted succesfully'});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
 }

