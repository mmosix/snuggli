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

// Retrieve all users 
router.get('/', verifyToken, (req, res) => {

    //verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 
            
    db.query('SELECT * , "" as password FROM users', function (error, results, fields) {
        if (error) throw error;
        return res.send({ 
            error: false, 
            data: results, 
            message: 'Users list.' });
    });
        }
    })

});
  
// Retrieve user with id 
router.get('/user/:id', verifyToken, (req, res) =>{

    //verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let user_id = req.params.id;
  
    if (!user_id) {
        return res.status(400).send({ error: true, message: 'Please provide user_id' });
    }
  
    db.query('SELECT * FROM users where id=?', user_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'users list.' });
    });

        }
    })
});
 
// Add a new user  
router.post('/add', verifyToken, (req, res) =>{

    //verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let user = req.body.user;
  
    if (!user) {
        return res.status(400).send({ error:true, message: 'Please provide user' });
    }
  
    db.query("INSERT INTO users SET ? ", { user: user }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New user has been created successfully.' });
    });

        }
    })
});
 
 
//  Update user with id
router.put('/update', verifyToken, (req, res) =>{

    //verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let user_id = req.body.user_id;
    let user = req.body.user;
  
    if (!user_id || !user) {
        return res.status(400).send({ error: user, message: 'Please provide user and user_id' });
    }
  
    db.query("UPDATE users SET user = ? WHERE id = ?", [user, user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'user has been updated successfully.' });
    });

        }
    })
});
 
//  Update user mode
router.put('/setMood', verifyToken, (req, res) =>{

    //verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let user_id = authorizedData.id;
    let mood = req.body.mood_id;
  
    if (!user_id || !mood) {
        return res.status(400).send({ error: mood, message: 'Please provide user mood' });
    }
  
    db.query("UPDATE users SET mood = ? WHERE id = ?", [mood, user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'mood has been updated successfully.' });
    });

        }
    })
});
 
 
//  Delete user
router.delete('/delete', verifyToken, (req, res) =>{

    //verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let user_id = req.body.user_id;
  
    if (!user_id) {
        return res.status(400).send({ error: true, message: 'Please provide user_id' });
    }
    db.query('DELETE FROM users WHERE id = ?', [user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'User has been updated successfully.' });
    });

        }
    })
});

module.exports = router;