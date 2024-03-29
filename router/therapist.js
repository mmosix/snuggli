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

// Retrieve all therapists
router.get('/', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send an error response
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            // If the token is successfully verified, retrieve the list of therapists
            db.query('SELECT T.*, (SELECT SUM(R.ratings) / COUNT(R.therapist_id) FROM therapistreview R WHERE R.therapist_id = T.id) AS average_reviews FROM therapist T', function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'Therapist list.'
                });
            });
        }
    });
});

// Post a new review
router.post('/review', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
           return res.status(422).send({ error: true, data:null,message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { reviewText, therapistId, ratings } = req.body;

            const query = 'INSERT INTO therapistreview (review_text, therapist_id, user_id, date_added, ratings) VALUES (?, ?, ?, NOW(), ?)';
            db.query(query, [reviewText, therapistId, userId, ratings], (err, result) => {
                if (err) {
                    return res.status(500).send({error:true,data:null,message:'Error posting review'});
                } else {
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Review posted successfully'
                    });
                }
            });
        }
    });
});

// Retrieve therapist reviews by therapist ID
router.get('/reviews/:id', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            // If the token is successfully verified, retrieve reviews by therapist ID
            let therapist_id = req.params.id;

            if (!therapist_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide therapist_id' });
            }

            const query =`
            SELECT TR.*, U.username, U.profile_photo 
            FROM therapistreview TR
            LEFT JOIN users U ON TR.user_id = U.id
            WHERE therapist_id=?
            `;

            db.query(query, therapist_id, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results, message: 'All reviews by therapist ID.' });
            });
        }
    });
});

// Retrieve therapist by ID
router.get('/single/:id', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            // If the token is successfully verified, retrieve therapist by ID
            let therapist_id = req.params.id;

            if (!therapist_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide therapist_id' });
            }

            db.query('SELECT * FROM therapist WHERE id=?', therapist_id, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results[0], message: 'Single therapist by ID.' });
            });
        }
    });
});

// Retrieve therapists for a user
router.get('/my', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            // If token is successfully verified, retrieve therapists for the user
            const user_id = authorizedData.id;

            let therapist_id = req.params.id;

            if (!therapist_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide therapist_id' });
            }

            db.query('SELECT * FROM therapist WHERE id=?', therapist_id, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results[0], message: 'Therapist list.' });
            });
        }
    });
});

// Retrieve recommended therapists based on user mood
router.get('/recommend', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, async (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If token is successfully verified, retrieve recommended therapists based on user mood
            const user_id = authorizedData.id;
            const user = await conn.getUserByID(user_id);
            const mood = user.mood;

            if (!mood) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide mood' + mood });
            }

            db.query("SELECT * FROM therapist WHERE moods LIKE ?", '%' + mood + '%', function (error, results, fields) {
                if (error) throw error;
                return res.send({ error: false, data: results, message: 'Recommended therapist list.' });
            });
        }
    });
});

// Add a new therapist
router.post('/add', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If token is successfully verified, add a new therapist
            let therapist = req.body.therapist;

            if (!therapist) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide therapist' });
            }

            db.query("INSERT INTO therapist SET ? ", { therapist: therapist }, function (error, results, fields) {
                if (error) throw error;
                return res.send({ error: false, data: results, message: 'New therapist has been created successfully.' });
            });
        }
    });
});

// Update therapist with ID
router.put('/update', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If token is successfully verified, update therapist with ID
            let therapist_id = req.body.therapist_id;
            let therapist = req.body.therapist;

            if (!therapist_id || !therapist) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide therapist and therapist_id' });
            }

            db.query("UPDATE therapist SET therapist = ? WHERE id = ?", [therapist, therapist_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(201).send({ error: false, data: results, message: 'Therapist has been updated successfully.' });
            });
        }
    });
});

// Delete therapist with ID
router.delete('/delete', verifyToken, (req, res) => {
    // Verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            // If error, send Forbidden (403)
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
        } else {
            // If token is successfully verified, delete therapist with ID
            let therapist_id = req.body.therapist_id;

            if (!therapist_id) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide therapist_id' });
            }

            db.query('DELETE FROM therapist WHERE id = ?', [therapist_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results, message: 'Therapist has been deleted successfully.' });
            });
        }
    });
});

module.exports = router;
