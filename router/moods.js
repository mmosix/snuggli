const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database');

// Retrieve all moods 
router.get('/all', function (req, res) {
    db.query('SELECT * FROM moods', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'moods list.' });
    });
});
 
 
// Retrieve school with id 
router.get('/single/:id', function (req, res) {
  
    let school_id = req.params.id;
  
    if (!school_id) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user_id' });
    }
  
    db.query('SELECT * FROM moods where mood_id=?', mood_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'single mood.' });
    });
  
});
 
// Add a new user  
router.post('/add', function (req, res) {
  
    let user = req.body.user;
  
    if (!user) {
        return res.status(400).send({ error:true, data: null, message: 'Please provide user' });
    }
  
    db.query("INSERT INTO moods SET ? ", { user: user }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New mood has been created successfully.' });
    });
});
 
 
//  Update user with id
router.put('/update', function (req, res) {
  
    let mood_id = req.body.mood_id;
    let mood = req.body.mood;
  
    if (!user_id || !user) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide mood and mood_id' });
    }
  
    db.query("UPDATE moods SET mood_id = ? WHERE mood_id = ?", [mood, mood_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'mood has been updated successfully.' });
    });
});
 
 
//  Delete user
router.delete('/delete', function (req, res) {
  
    let mood_id = req.body.mood_id;
  
    if (!mood_id) {
        return res.status(400).send({ error: true, data:null, message: 'Please provide mood_id' });
    }
    db.query('DELETE FROM moods WHERE id = ?', [mood_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'mood has been updated successfully.' });
    });
}); 
 
module.exports = router;