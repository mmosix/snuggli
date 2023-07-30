const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database');

const jsonwebtoken = require('jsonwebtoken');

const privateKey = 'MIICXQIBAAKBgH1B4lvSKZkNElOfkhmAUTmFj+f5/N5d5gxF/DUJ/ZyAO8W6bBUNSj0RHnLYy0FpH3L4Erlt5IxG6rpGQm5cZiIfZ6pbpnY388uxvI4iTTIiVKDuKYnD4CgQ6et7vcwvMzQk56Cy+6wllAqQhnSjwbHV8lM1Yt3jVyYz6jz92y4xAgMBAAECgYBJiQNmGqTXOKhYtaalGAMXfQT2EHpW5dNnwzKExN/CIDp3I7HOTiYWYdV5YTM6rIeNDHyZph12CTBGuXbIqbA/XlCOqPPMjS7vm9DFyeNgvS1hAtcsM0cH/AR4o0rkH9Xu3+sw1vn0llhWJWddpDrS4fbkJvaLstmqPraT6dvBTQJBAPHksbbTaIBplSY6dezrkgf05Cuf7/j0FLWUAYUUJPia1s6Vr9To6Joa55ryOTe7n50YVzq2d4YHnvKz5w4dxX8CQQCEj+SSrvell3mn0Sf3d8O/7FW2iiqBy/n/0xrjuQwIEM+wK7rjJ2M5BPnXQa79ugeelSRMCot7W0M0NYfisRPAkEAv1LfrXexZEAelEoRE/+PVXPBNTAfoo2MA8K5IQU56Nivpl6G4KQHtjwpjEiiMQ7ZxGuIMww3pW9JrTXWPzgVCQJBAIKYD6LCZI7qL5u4Xhqh9b8jVsUQYnY5TyBRSR0ZEsKIEm135i7K8yDXcK70i7Ca630taiBc6zXY919VqBhoY2LdVe4f6xHRuRk4wpccEymnKx5ghmBwUk8SmAhlx84giedsLjehBatbFhkId0lSv+qe82El';
  
//  Verify Token
const verifyToken = (req, res, next)=>{
    const header = req.headers.authorization;

    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        //If header is undefined return Forbidden (403)
        res.sendStatus(403)
    }
 };

// Retrieve all communities
router.get('/', verifyToken, (req, res) => {

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 
            
    db.query('SELECT * FROM community', function (error, results, fields) {
        if (error) throw error;
        return res.send({ 
            error: false, 
            data: results, 
            message: 'community list.' });
    });
        }
    })

});
  
// Retrieve community with id 
router.get('/single/:id', verifyToken, (req, res) =>{

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let community_id = req.params.id;
  
    if (!community_id) {
        return res.status(400).send({ error: true, message: 'Please provide community_id' });
    }
  
    db.query('SELECT * FROM community where id=?', community_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Single community by id.' });
    });

        }
    })
});
  
// Retrieve community for user 
router.get('/my', verifyToken, (req, res) =>{

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 

            const user_id = authorizedData.id;
  
    let community_id = req.params.id;
  
    if (!community_id) {
        return res.status(400).send({ error: true, message: 'Please provide community_id' });
    }
  
    db.query('SELECT * FROM community where id=?', community_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'community list.' });
    });

        }
    })
});

  
// Retrieve recomended community for user 
router.get('/recommend', verifyToken, (req, res) =>{

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, async(err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 

    const user_id = authorizedData.id;
    const user = await conn.getUserByID(user_id);
    const mood = user.mood;
  
    if (!mood) {
        return res.status(400).send({ error: true, message: 'Please provide mood' });
    }
  
    db.query("SELECT * FROM community  WHERE moods LIKE '%?%'", mood, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Recommended community list.' });
    });

        }
    })
});

 
// Add a new community  
router.post('/add', verifyToken, (req, res) =>{

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let community = req.body.community;
  
    if (!community) {
        return res.status(400).send({ error:true, message: 'Please provide community' });
    }
  
    db.query("INSERT INTO community SET ? ", { community: community }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New community has been created successfully.' });
    });

        }
    })
});
 
 
//  Update community with id
router.put('/update', verifyToken, (req, res) =>{

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let community_id = req.body.community_id;
    let community = req.body.community;
  
    if (!community_id || !community) {
        return res.status(400).send({ error: community, message: 'Please provide community and community_id' });
    }
  
    db.query("UPDATE community SET community = ? WHERE id = ?", [community, community_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'community has been updated successfully.' });
    });

        }
    })
});
 
 
//  Delete community
router.delete('/delete', verifyToken, (req, res) =>{

    //verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let community_id = req.body.community_id;
  
    if (!community_id) {
        return res.status(400).send({ error: true, message: 'Please provide community_id' });
    }
    db.query('DELETE FROM community WHERE id = ?', [community_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'community has been updated successfully.' });
    });

        }
    })
});

module.exports = router;