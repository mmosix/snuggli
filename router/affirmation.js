const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Retrieve all affirmations
router.get('/', function (req, res) {
    // Fetch all affirmations from the database
    db.query('SELECT * FROM affirmation', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Affirmations list.' });
    });
});

// Retrieve today's affirmation
router.get('/today', function (req, res) {
    // Fetch today's affirmation with id 1 from the database
    db.query('SELECT * FROM affirmation WHERE id = 1', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Today\'s affirmation.' });
    });
});

// Retrieve affirmation by id
router.get('/:id', function (req, res) {
    // Extract the user_id from the request parameters
    let user_id = req.params.id;

    if (!user_id) {
        return res.status(400).send({ error: true, message: 'Please provide user_id' });
    }

    // Fetch an affirmation by its ID from the database
    db.query('SELECT * FROM affirmation where id=?', user_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Affirmation by id.' });
    });
});

// Add a new affirmation
router.post('/add', function (req, res) {
    // Extract the user data from the request body
    let user = req.body.user;

    if (!user) {
        return res.status(400).send({ error: true, message: 'Please provide user' });
    }

    // Insert a new affirmation record into the database
    db.query("INSERT INTO affirmation SET ?", { user: user }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New affirmation has been created successfully.' });
    });
});

// Update affirmation by id
router.put('/update', function (req, res) {
    // Extract user_id and user from the request body
    let user_id = req.body.user_id;
    let user = req.body.user;

    if (!user_id || !user) {
        return res.status(400).send({ error: true, message: 'Please provide user and user_id' });
    }

    // Update the affirmation record in the database
    db.query("UPDATE affirmation SET user = ? WHERE id = ?", [user, user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Affirmation has been updated successfully.' });
    });
});

// Delete affirmation by id
router.delete('/delete', function (req, res) {
    // Extract user_id from the request body
    let user_id = req.body.user_id;

    if (!user_id) {
        return res.status(400).send({ error: true, message: 'Please provide user_id' });
    }

    // Delete the affirmation record from the database
    db.query('DELETE FROM affirmation WHERE id = ?', [user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Affirmation has been deleted successfully.' });
    });
});

module.exports = router;
