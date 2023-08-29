const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database');

  
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

// default route
router.get('/', function (req, res) {
    return res.send({ error: true, message: 'Hello, this is Snuggli' })
});

router.get('/search/:search_term', async (req, res) => {
    const search_term = `%${req.params.search_term}%`; // Add wildcards to the search term

    try {
        const query = `
            SELECT 'user' AS type, id, username FROM users WHERE username LIKE ?
            UNION
            SELECT 'community' AS type, id, name FROM community WHERE name LIKE ?
            UNION
            SELECT 'post' AS type, id, content FROM posts WHERE content LIKE ?
        `;

        // Execute the SQL query with placeholders
        const result = await db.query(query, [search_term, search_term, search_term]);

        // Process the result and create a response object
        const response = result.map(row => {
            if (row.type === 'user') {
                return {
                    type: 'user',
                    id: row.id,
                    username: row.username
                    // You can add more user-related attributes here
                };
            } else if (row.type === 'community') {
                return {
                    type: 'community',
                    id: row.id,
                    name: row.name
                    // You can add more community-related attributes here
                };
            } else if (row.type === 'post') {
                return {
                    type: 'post',
                    id: row.id,
                    content: row.content
                    // You can add more post-related attributes here
                };
            }
        });

        // Send the response
        return res.send({ 
            error: false, 
            data: response, 
            message: 'Search data' 
        });
    
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;