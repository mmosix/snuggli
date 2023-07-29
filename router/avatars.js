const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database');

// Retrieve all avatars 
router.get('/all', function (req, res) {
    db.query('SELECT * FROM avatars', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'avatars list.' });
    });
});
 
 
// Retrieve school with id 
router.get('/single/:id', function (req, res) {
  
    let school_id = req.params.id;
  
    if (!school_id) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user_id' });
    }
  
    db.query('SELECT * FROM avatars where avatar_id=?', avatar_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'single avatar.' });
    });
  
});
 
// Add a new user  
router.post('/add', function (req, res) {
  
    let user = req.body.user;
  
    if (!user) {
        return res.status(400).send({ error:true, data: null, message: 'Please provide user' });
    }
  
    db.query("INSERT INTO avatars SET ? ", { user: user }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New avatar has been created successfully.' });
    });
});
 
 
//  Update user with id
router.put('/update', function (req, res) {
  
    let avatar_id = req.body.avatar_id;
    let avatar = req.body.avatar;
  
    if (!user_id || !user) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide avatar and avatar_id' });
    }
  
    db.query("UPDATE avatars SET avatar_id = ? WHERE avatar_id = ?", [avatar, avatar_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'avatar has been updated successfully.' });
    });
});
 
 
//  Delete user
router.delete('/delete', function (req, res) {
  
    let avatar_id = req.body.avatar_id;
  
    if (!avatar_id) {
        return res.status(400).send({ error: true, data:null, message: 'Please provide avatar_id' });
    }
    db.query('DELETE FROM avatars WHERE id = ?', [avatar_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'avatar has been updated successfully.' });
    });
}); 
 
module.exports = router;