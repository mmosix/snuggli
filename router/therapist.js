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

// Retrieve all therapist
router.get('/', verifyToken, (req, res) => {

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 
            
    db.query('SELECT T.*, (SELECT SUM(R.ratings) / count(R.therapist_id) FROM therapistreview R WHERE R.therapist_id = T.id  ) AS average_reviews FROM therapist T', function (error, results, fields) {
        if (error) throw error;
        return res.send({ 
            error: false, 
            data: results, 
            message: 'Therapist list.' });
    });
        }
    })

});
  
// Retrieve therapist with id 
router.get('/reviews/:id', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let therapist_id = req.params.id;
  
    if (!therapist_id) {
        return res.status(400).send({ error: true, message: 'Please provide therapist_id' });
    }
  
    db.query('SELECT * FROM therapistreview where therapist_id=?', therapist_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'All reviews  by therapist id.' });
    });

        }
    })
});
  
// Retrieve therapist with id 
router.get('/single/:id', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let therapist_id = req.params.id;
  
    if (!therapist_id) {
        return res.status(400).send({ error: true, message: 'Please provide therapist_id' });
    }
  
    db.query('SELECT * FROM therapist where id=?', therapist_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Single therapist by id.' });
    });

        }
    })
});
  
// Retrieve therapist for user 
router.get('/my', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 

            const user_id = authorizedData.id;
  
    let therapist_id = req.params.id;
  
    if (!therapist_id) {
        return res.status(400).send({ error: true, message: 'Please provide therapist_id' });
    }
  
    db.query('SELECT * FROM therapist where id=?', therapist_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'therapist list.' });
    });

        }
    })
});

  
// Retrieve recomended therapist for user 
router.get('/recommend', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
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
        return res.status(400).send({ error: true, message: 'Please provide mood'+ mood });
    }
  
    db.query("SELECT * FROM therapist  WHERE moods LIKE '%?%'", mood, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Recommended therapist list.' });
    });

        }
    })
});

 
// Add a new therapist  
router.post('/add', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let therapist = req.body.therapist;
  
    if (!therapist) {
        return res.status(400).send({ error:true, message: 'Please provide therapist' });
    }
  
    db.query("INSERT INTO therapist SET ? ", { therapist: therapist }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New therapist has been created successfully.' });
    });

        }
    })
});
 
 
//  Update therapist with id
router.put('/update', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let therapist_id = req.body.therapist_id;
    let therapist = req.body.therapist;
  
    if (!therapist_id || !therapist) {
        return res.status(400).send({ error: therapist, message: 'Please provide therapist and therapist_id' });
    }
  
    db.query("UPDATE therapist SET therapist = ? WHERE id = ?", [therapist, therapist_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'therapist has been updated successfully.' });
    });

        }
    })
});
 
 
//  Delete therapist
router.delete('/delete', verifyToken, (req, res) =>{

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
  
    let therapist_id = req.body.therapist_id;
  
    if (!therapist_id) {
        return res.status(400).send({ error: true, message: 'Please provide therapist_id' });
    }
    db.query('DELETE FROM therapist WHERE id = ?', [therapist_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'therapist has been updated successfully.' });
    });

        }
    })
});

module.exports = router;