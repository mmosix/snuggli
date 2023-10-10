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
        return res.status(403).send({ error: true, data: null, message: 'Forbidden' })
    }
 };

// default route
router.get('/', function (req, res) {
    return res.status(400).send({ error: true,data:null, message: 'Hello, this is Snuggli' })
});

router.get('/search/:search_term', async (req, res) => {
    const search_term = `%${req.params.search_term}%`; // Add wildcards to the search term

    try {

        // Execute the SQL query with placeholders
        const result = await conn.searchData(search_term);

        console.log(result); // Add this line to inspect the value of 'result'

        // Process the result and create a response object
        const response = result.map(row => {
            if (row.type === 'user') {
                const user = conn.getUserByID(row.id);
                return {
                    type: 'user',
                    id: row.id,
                    display: user
                    // You can add more user-related attributes here
                };
            } else if (row.type === 'community') {
                const community = conn.getCommunityByID(row.id);
                return {
                    type: 'community',
                    id: row.id,
                    display: community
                    // You can add more community-related attributes here
                };
            } else if (row.type === 'post') {
                const post = conn.getPostByID(row.id);
                return {
                    type: 'post',
                    id: row.id,
                    display: post
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
        res.status(500).send({error: true, data: null,  error: 'Internal Server Error' });
    }
});

module.exports = router;