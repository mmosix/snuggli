const express = require('express');
const router = express.Router();
const { db } = require('../database');
const jsonwebtoken = require('jsonwebtoken');

require('dotenv').config();
const privateKey = process.env.JWT_PRIVATE_KEY; // Your private key for JWT

// Verify Token middleware
const verifyToken = (req, res, next) => {
    const header = req.headers.authorization;

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        // If the header is undefined, return Forbidden (403)
        return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
    }
};

// Retrieve all communities
router.get('/', verifyToken, (req, res) => {
    // Verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null ,message: 'Please provide authorization token' });
        } else {
            let user_id = authorizedData.id;
            db.query('SELECT C.*, COUNT(CF.user_id) AS followers, MAX(CF.user_id = ?) as i_follow FROM community C LEFT JOIN follow_community CF ON CF.community_id = C.id GROUP BY C.id', user_id, function (error, results, fields) {
                if (error) throw error;

                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'Community list.'
                });
            });
        }
    });
});

// Retrieve community with id
router.get('/single/:id', verifyToken, (req, res) => {
    // Verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            let community_id = req.params.id;

            if (!community_id) {
                return res.status(400).send({ error: true,data:null ,message: 'Please provide community_id' });
            }

            db.query('SELECT * FROM community where id=?', community_id, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results[0], message: 'Single community by id.' });
            });
        }
    });
});

// Retrieve communities for a user
router.get('/my', verifyToken, (req, res) => {
    // Verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            const user_id = authorizedData.id;

            const query =`SELECT C.*, COUNT(CF.user_id) AS followers, MAX(CF.user_id = ?) as i_follow FROM community C 
            LEFT JOIN follow_community CF ON CF.community_id = C.id 
            WHERE CF.user_id = ? GROUP BY C.id
            `;

            db.query(query, [user_id, user_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results, message: 'Community list.' });
            });
        }
    });
});

// Retrieve recommended communities based on user's mood
router.get('/recommend', verifyToken, async (req, res) => {
    try {
        // Verify the JWT token generated for the community
        jsonwebtoken.verify(req.token, privateKey, async (err, authorizedData) => {
            if (err) {
                return res.status(422).send({ error: true, data: null, message: 'Invalid or missing authorization token' });
            }

            const user_id = authorizedData.id;
            const user = await conn.getUserByID(user_id);
            const mood = user.mood;

            if (!mood) {
                return res.status(400).send({ error: true, data: null, message: 'Please provide mood' });
            }

            const query = `
                SELECT C.*, COUNT(CF.user_id) AS followers, MAX(CF.user_id = ?) as i_follow
                FROM community C
                LEFT JOIN follow_community CF ON CF.community_id = C.id
                WHERE C.moods = ?
                GROUP BY C.id
            `;

            db.query(query, [user_id, mood], function (error, results, fields) {
                if (error) {
                    return res.status(500).send({ error: true, data: null, message: 'Database error' });
                }

                if (!results.length) {
                    const query2 = `
                        SELECT C.*, COUNT(CF.user_id) AS followers, MAX(CF.user_id = ?) as i_follow
                        FROM community C
                        LEFT JOIN follow_community CF ON CF.community_id = C.id
                        GROUP BY C.id
                    `;

                    db.query(query2, user_id, function (err, results2, fields) {
                        if (err) {
                            return res.status(500).send({ error: true, data: null, message: 'Database error' });
                        }
                        return res.status(200).send({ error: false, data: results2, message: 'Recommended community list.' });
                    });
                } else {
                    return res.status(200).send({ error: false, data: results, message: 'Recommended community list.' });
                }
            });
        });
    } catch (err) {
        return res.status(500).send({ error: true, data: null, message: 'Internal server error' });
    }
});


// Add a new community
router.post('/add', verifyToken, (req, res) => {
    // Verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            let community = req.body.community;

            if (!community) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide community' });
            }

            db.query("INSERT INTO community SET ? ", { community: community }, function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results, message: 'New community has been created successfully.' });
            });
        }
    });
});

// Update community with id
router.put('/update', verifyToken, (req, res) => {
    // Verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            let community_id = req.body.community_id;
            let community = req.body.community;

            if (!community_id || !community) {
                return res.status(400).send({ error: community, data:null,message: 'Please provide community and community_id' });
            }

            db.query("UPDATE community SET community = ? WHERE id = ?", [community, community_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results, message: 'Community has been updated successfully.' });
            });
        }
    });
});

// Delete community
router.delete('/delete', verifyToken, (req, res) => {
    // Verify the JWT token generated for the community
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(403).send({ error: true, data: null, message: 'Forbidden' });
        } else {
            let community_id = req.body.community_id;

            if (!community_id) {
                return res.status(400).send({ error: true,data:null, message: 'Please provide community_id' });
            }
            db.query('DELETE FROM community WHERE id = ?', [community_id], function (error, results, fields) {
                if (error) throw error;
                return res.status(200).send({ error: false, data: results, message: 'Community has been deleted successfully.' });
            });
        }
    });
});

// Handle Follow community
router.post('/follow', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
           return res.status(422).send({ error: true, data:null,message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { community_id } = req.body;

            const query = 'INSERT INTO follow_community (user_id, community_id) VALUES (?, ?)';
            db.query(query, [userId, community_id], (err, result) => {
                if (err) {
                    console.error('Error following community:', err);
                    return res.status(500).send({error:true,data:null,message:'Error following community'});
                } else {
                    console.log('Community followed successfully');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Community followed'
                    });
                }
            });
        }
    });
});

// Handle unfollow community
router.post('/unfollow', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { community_id } = req.body;

            const query = 'DELETE FROM follow_community WHERE community_id = ? AND user_id = ?';
            db.query(query, [community_id, userId], (err, result) => {
                if (err) {
                    console.error('Unfollow error:', err);
                    res.status(500).send({error:true,data:null, message:'Unfollow error'});
                } else {
                    console.log('Community unfollowed successfully');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Community unfollowed successfully'
                    });
                }
            });
        }
    });
});


module.exports = router;
