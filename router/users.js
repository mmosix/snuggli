const express = require('express');
const router = express.Router();
const { conn, db } = require('../database'); // Import database connections and functions

const jsonwebtoken = require('jsonwebtoken');

require('dotenv').config();
const privateKey = process.env.JWT_PRIVATE_KEY; // Your private key for JWT

// Middleware function to verify JWT token
const verifyToken = (req, res, next) => {
    const header = req.headers.authorization;

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        // If header is undefined, return Forbidden (403)
        return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
    }
};

// Retrieve all users
router.get('/', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send an error response
            return res.status(422).send({ error: true,data:null ,message: 'Please provide authorization token' });
        } else {
            // If the token is successfully verified, retrieve the list of users
            db.query('SELECT * , "" as password FROM users', function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'Users list.'
                });
            });
        }
    });
});

// Retrieve user with a specific ID
router.get('/user/:id', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, retrieve the user with the specified ID
            let user_id = req.params.id;

            if (!user_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide user_id' });
            }

            db.query('SELECT * , "" as password FROM users where id=?', user_id, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results[0],
                    message: 'User data.'
                });
            });
        }
    });
});

// Retrieve user with a specific ID
router.get('/profile', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, retrieve the user with the specified ID
            const userId = authorizedData.id;

            if (!user_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide user_id' });
            }

            db.query('SELECT * , "" as password FROM users where id=?', userId, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results[0],
                    message: 'User data.'
                });
            });
        }
    });
});


// Add a new user
router.post('/add', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, add a new user
            let user = req.body.user;

            if (!user) {
                return res.status(400).send({ error: true,data: null ,message: 'Please provide user' });
            }

            db.query("INSERT INTO users SET ? ", { user: user }, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'New user has been created successfully.'
                });
            });
        }
    });
});

// Update user with ID
router.put('/update', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, update the user
            let user_id = req.body.user_id;
            let user = req.body.user;

            if (!user_id || !user) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide user and user_id' });
            }

            db.query("UPDATE users SET user = ? WHERE id = ?", [user, user_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'User has been updated successfully.'
                });
            });
        }
    });
});

// Update user mood
router.put('/setMood', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, update the user's mood
            let user_id = authorizedData.id;
            let mood = req.body.mood_id;

            if (!user_id || !mood) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide user mood' });
            }

            db.query("UPDATE users SET mood = ? WHERE id = ?", [mood, user_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: {},
                    message: 'Mood has been updated successfully.'
                });
            });
        }
    });
});

// Update user avatar
router.put('/setAvatar', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, update the user's avatar
            let user_id = authorizedData.id;
            let avatar = req.body.avatar_id;

            if (!user_id || !avatar) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide user avatar' });
            }

            db.query("UPDATE users SET avatar = ? WHERE id = ?", [avatar, user_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(201).send({
                    error: false,
                    data: {},
                    message: 'Avatar has been updated successfully.'
                });
            });
        }
    });
});

// Delete user
router.delete('/delete', verifyToken, (req, res) => {
    // Verify the JWT token generated for the user
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If the token is successfully verified, delete the user
            let user_id = req.body.user_id;

            if (!user_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide user_id' });
            }

            db.query('DELETE FROM users WHERE id = ?', [user_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'User has been deleted successfully.'
                });
            });
        }
    });
});

module.exports = router;
