const express = require('express');
const router = express.Router();
const db = require('../dbConfig');

// Retrieve all schools 
router.get('/all', function (req, res) {
    db.query('SELECT * FROM schools', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'users list.' });
    });
});
 
 
// Retrieve school with id 
router.get('/single/:id', function (req, res) {
  
    let school_id = req.params.id;
  
    if (!school_id) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user_id' });
    }
  
    db.query('SELECT * FROM schools where school_id=?', school_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'users list.' });
    });
  
});

 
 
// Retrieve schools with domain 
router.post('/single', function (req, res, next) {
  
    const domain = req.body.domain;
  
    if (!domain) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide valid school email' });
    }
  
    db.query('SELECT * FROM schools where domain=?', domain, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'users list.' });
    });
  
});
 
 
// Add a new user  
router.post('/add', function (req, res) {
  
    let user = req.body.user;
  
    if (!user) {
        return res.status(400).send({ error:true, data: null, message: 'Please provide user' });
    }
  
    db.query("INSERT INTO schools SET ? ", { user: user }, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'New user has been created successfully.' });
    });
});
 
 
//  Update user with id
router.put('/update', function (req, res) {
  
    let user_id = req.body.user_id;
    let user = req.body.user;
  
    if (!user_id || !user) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide user and user_id' });
    }
  
    db.query("UPDATE schools SET user = ? WHERE id = ?", [user, user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'user has been updated successfully.' });
    });
});
 
 
//  Delete user
router.delete('/delete', function (req, res) {
  
    let user_id = req.body.user_id;
  
    if (!user_id) {
        return res.status(400).send({ error: true, data:null, message: 'Please provide user_id' });
    }
    db.query('DELETE FROM schools WHERE id = ?', [user_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'User has been updated successfully.' });
    });
}); 
 
module.exports = router;