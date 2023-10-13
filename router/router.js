const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database');

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

// default route
router.get('/', function (req, res) {
    return res.status(400).send({ error: true,data:null, message: 'Hello, this is Snuggli' })
});

router.get('/search/:search_term', verifyToken, (req, res) => {

    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, async (err, authorizedData) => {
        if (err) {
           return res.status(422).send({ error: true, data:null,message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const search_term = `%${req.params.search_term}%`; // Add wildcards to the search term

            try {

                // Execute the SQL query with placeholders
                const result = await conn.searchData(search_term, userId);
        
                console.log(result); // Add this line to inspect the value of 'result'
        
                // Process the result and create a response object
                const response = result.map(row => {
                    if (row.type === 'user') {
                        return {
                            type: 'user',
                            user_id: row.id,
                            username: row.username,
                            profile_photo: row.profile_photo
                            // You can add more user-related attributes here
                        };
                    } else if (row.type === 'community') {
                        return {
                            type: 'community',
                            community_id: row.id,
                            name: row.name,
                            followers: row.followers,
                            i_follow: row.i_follow
                            // You can add more community-related attributes here
                        };
                    } else if (row.type === 'post') {
                        return {
                            type: 'post',
                            post_id: row.id,
                            content: row.content,
                            post_image: row.post_image,
                            user_has_liked: row.user_has_liked,
                            num_comments: row.num_comments,
                            date_added: row.date_added,
                            username: row.username,
                            user_profile_photo: row.profile_photo
                            // You can add more post-related attributes here
                        };
                    }
                });
        
                // Send the response
                return res.status(200).send({ 
                    error: false, 
                    data: response, 
                    message: 'Search data' 
                });
            
            } catch (error) {
                console.error('Error searching:', error);
                res.status(500).send({error: true, data: null, message: 'Internal Server Error' });
            }
        }
    });
});

module.exports = router;