const { admin, db } = require('./admin'); //we need to acces our database

module.exports =  (req, res, next) => { //a function that takes 3 things
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1]; //we need to split the array in 2 string and take the 2nd string, which is the token
    }else{  //if this doesn't start with 'bearer'
        console.error('No token found')
        return res.status(403).json({error: 'Unauthorized'});
    }
    //if we pass through here it means we have a token
    admin
    .auth()
    .verifyIdToken(idToken)
        .then(decodedToken => { //decodedTooken holds the data insie the token(user data)
             req.user = decodedToken;
             console.log(decodedToken);
            return db
            .collection('users')
            .where('userId', '==', req.user.uid)
            .limit(1) //limits our resulut to just one document
            .get();
        })
        .then((data) => {
            req.user.handle = data.docs[0].data().handle; //docs[0 -> we take the 1st elemnt of the array], the function data() extracts the data from this documents
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next(); //the function next() will allow the req to proceed towards here
        })
        .catch(err =>{ //if the token fails(ut is expired, etc) it will come here
            console.error('Error while verifying token ', err);
            return res.status(403).json(err);        
        });
};