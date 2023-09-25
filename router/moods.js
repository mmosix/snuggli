const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Retrieve all moods
router.get('/all', (req, res) => {
    // Retrieve all moods from the database
    db.query('SELECT * FROM moods', (error, results) => {
        if (error) {
            // Handle any errors that occur during the database query
            return res.status(500).send({ error: true, data: null, message: 'Error fetching moods' });
        }
        // Return the list of moods as a response
        return res.send({ error: false, data: results, message: 'Moods list.' });
    });
});

// Retrieve mood by ID
router.get('/single/:id', (req, res) => {
    const moodId = req.params.id;

    if (!moodId) {
        // Check if mood_id parameter is provided
        return res.status(400).send({ error: true, data: null, message: 'Please provide mood_id' });
    }

    // Retrieve a mood by its ID from the database
    db.query('SELECT * FROM moods WHERE mood_id = ?', [moodId], (error, results) => {
        if (error) {
            // Handle any errors that occur during the database query
            return res.status(500).send({ error: true, data: null, message: 'Error fetching mood' });
        }
        if (results.length === 0) {
            // Handle the case where the mood is not found (HTTP status 404)
            return res.status(404).send({ error: true, data: null, message: 'Mood not found' });
        }
        // Return the single mood as a response
        return res.send({ error: false, data: results[0], message: 'Single mood.' });
    });
});

// Add a new mood
router.post('/add', (req, res) => {
    const mood = req.body.mood;

    if (!mood) {
        // Check if mood data is provided in the request body
        return res.status(400).send({ error: true, data: null, message: 'Please provide mood' });
    }

    // Insert a new mood into the database
    db.query('INSERT INTO moods SET ?', { mood: mood }, (error, results) => {
        if (error) {
            // Handle any errors that occur during the database insertion
            return res.status(500).send({ error: true, data: null, message: 'Error creating mood' });
        }
        // Return a success message as a response
        return res.send({ error: false, data: results, message: 'New mood has been created successfully.' });
    });
});

// Update mood by ID
router.put('/update/:id', (req, res) => {
    const moodId = req.params.id;
    const mood = req.body.mood;

    if (!moodId || !mood) {
        // Check if mood_id and mood data are provided in the request
        return res.status(400).send({ error: true, data: null, message: 'Please provide mood and mood_id' });
    }

    // Update a mood in the database based on its ID
    db.query('UPDATE moods SET mood = ? WHERE mood_id = ?', [mood, moodId], (error, results) => {
        if (error) {
            // Handle any errors that occur during the database update
            return res.status(500).send({ error: true, data: null, message: 'Error updating mood' });
        }
        // Return a success message as a response
        return res.send({ error: false, data: results, message: 'Mood has been updated successfully.' });
    });
});

// Delete mood by ID
router.delete('/delete/:id', (req, res) => {
    const moodId = req.params.id;

    if (!moodId) {
        // Check if mood_id is provided in the request
        return res.status(400).send({ error: true, data: null, message: 'Please provide mood_id' });
    }

    // Delete a mood from the database based on its ID
    db.query('DELETE FROM moods WHERE mood_id = ?', [moodId], (error, results) => {
        if (error) {
            // Handle any errors that occur during the database deletion
            return res.status(500).send({ error: true, data: null, message: 'Error deleting mood' });
        }
        // Return a success message as a response
        return res.send({ error: false, data: results, message: 'Mood has been deleted successfully.' });
    });
});

module.exports = router;
