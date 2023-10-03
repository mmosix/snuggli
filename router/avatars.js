const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Retrieve all avatars
router.get('/all', function (req, res) {
    // Fetch all avatars from the database
    db.query('SELECT * FROM avatars', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Avatars list.' });
    });
});

// Retrieve avatar with id
router.get('/single/:id', function (req, res) {
    // Extract the avatar_id from the request parameters
    let avatar_id = req.params.id;

    if (!avatar_id) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide avatar_id' });
    }

    // Fetch a single avatar by its ID from the database
    db.query('SELECT * FROM avatars where avatar_id=?', avatar_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Single avatar.' });
    });
});

// Add a new avatar
router.post('/add', function (req, res) {
    // Extract the user data from the request body
    let user = req.body.user;

    if (!user) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user' });
    }

    // Insert a new avatar record into the database
    db.query("INSERT INTO avatars SET ?", { user: user }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New avatar has been created successfully.' });
    });
});

// Update avatar with id
router.put('/update', function (req, res) {
    // Extract avatar_id and avatar from the request body
    let avatar_id = req.body.avatar_id;
    let avatar = req.body.avatar;

    if (!avatar_id || !avatar) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide avatar and avatar_id' });
    }

    // Update the avatar record in the database
    db.query("UPDATE avatars SET avatar = ? WHERE avatar_id = ?", [avatar, avatar_id], function (error, results, fields) {
        if (error) throw error;
        return res.status(200).send({ error: false, data: results, message: 'Avatar has been updated successfully.' });
    });
});

// Delete avatar
router.delete('/delete', function (req, res) {
    // Extract avatar_id from the request body
    let avatar_id = req.body.avatar_id;

    if (!avatar_id) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide avatar_id' });
    }

    // Delete the avatar record from the database
    db.query('DELETE FROM avatars WHERE avatar_id = ?', [avatar_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Avatar has been deleted successfully.' });
    });
});

module.exports = router;
