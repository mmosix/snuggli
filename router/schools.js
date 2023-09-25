const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database'); // Import necessary modules and database connections

// Retrieve all schools
router.get('/all', function (req, res) {
    db.query('SELECT * FROM schools', function (error, results, fields) {
        if (error) throw error; // Handle any database query errors
        return res.send({ error: false, data: results, message: 'users list.' }); // Send the retrieved data as a JSON response
    });
});

// Retrieve a single school by ID
router.get('/single/:id', function (req, res) {

    let school_id = req.params.id; // Get the school ID from the URL parameter

    if (!school_id) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user_id' }); // Handle missing school ID
    }

    db.query('SELECT * FROM schools where school_id=?', school_id, function (error, results, fields) {
        if (error) throw error; // Handle any database query errors
        return res.send({ error: false, data: results[0], message: 'users list.' }); // Send the retrieved data as a JSON response
    });
});

// Add a new school
router.post('/add', function (req, res) {

    let user = req.body.user; // Get the user data from the request body

    if (!user) {
        return res.status(400).send({ error:true, data: null, message: 'Please provide user' }); // Handle missing user data
    }

    db.query("INSERT INTO schools SET ? ", { user: user }, function (error, results, fields) {
        if (error) throw error; // Handle any database query errors
        return res.send({ error: false, data: results, message: 'New user has been created successfully.' }); // Send a success message as a JSON response
    });
});

// Update a school by ID
router.put('/update', function (req, res) {

    let user_id = req.body.user_id; // Get the user ID from the request body
    let user = req.body.user; // Get the updated user data from the request body

    if (!user_id || !user) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user and user_id' }); // Handle missing user ID or user data
    }

    db.query("UPDATE schools SET user = ? WHERE id = ?", [user, user_id], function (error, results, fields) {
        if (error) throw error; // Handle any database query errors
        return res.send({ error: false, data: results, message: 'user has been updated successfully.' }); // Send a success message as a JSON response
    });
});

// Delete a school by ID
router.delete('/delete', function (req, res) {

    let user_id = req.body.user_id; // Get the user ID from the request body

    if (!user_id) {
        return res.status(400).send({ error: true, data:null, message: 'Please provide user_id' }); // Handle missing user ID
    }
    
    db.query('DELETE FROM schools WHERE id = ?', [user_id], function (error, results, fields) {
        if (error) throw error; // Handle any database query errors
        return res.send({ error: false, data: results, message: 'User has been updated successfully.' }); // Send a success message as a JSON response
    });
});

module.exports = router;
