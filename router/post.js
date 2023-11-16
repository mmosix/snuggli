const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2; // Cloudinary SDK
const  { conn, db } = require('../database');

const jsonwebtoken = require('jsonwebtoken');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'snuggli',
    api_key: '672171861559948',
    api_secret: 'p_k-kFQr4cGZ12TOfOBHeX2sOUA'
});

require('dotenv').config();
const privateKey = process.env.JWT_PRIVATE_KEY; // Your private key for JWT

// Set up multer for file uploads with Cloudinary
const storage = multer.memoryStorage(); // Store uploaded files in memory
const upload = multer({ storage: storage });
  
// Verify JWT Token Middleware
const verifyToken = (req, res, next) => {
    const header = req.headers.authorization;

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        return res.status(403).send({ error: true, data: null, message: 'Forbidden' }) // Forbidden if the header is missing
    }
};

// Create a new group
router.post('/create-group', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null ,message: 'Please provide authorization token' });
        }

        const { groupName, users } = req.body;
        const userId = authorizedData.id;

        // Insert group into the database
        const insertGroupQuery = 'INSERT INTO groups (name, created_by) VALUES (?, ?)';
        db.query(insertGroupQuery, [groupName, userId], (err, result) => {
            if (err) {
                console.error('Error creating group:', err);
                return res.status(500).json({ error: true, data:null, message:'An error occurred while creating the group' });
            }

            const groupId = result.insertId;

            if (users && users.length > 0) {
                const insertGroupMembersQuery = 'INSERT INTO group_users (group_id, user_id) VALUES ?';
                const values = users.map((user_id) => [groupId, user_id]);

                // Insert group members into the database
                db.query(insertGroupMembersQuery, [values], (err) => {
                    if (err) {
                        console.error('Error adding group members:', err);
                        return res.status(500).send({
                            error: true,
                            data:null,
                            message: 'An error occurred while adding group members'
                        });
                    }

                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Group created successfully'
                    });
                });
            } else {
                return res.status(200).send({
                    error: false,
                    data: null,
                    message: 'Group created successfully'
                });
            }
        });
    });
});

// Submit a new post with image upload to Cloudinary
router.post('/submit', upload.single('image'), verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true, data:null,message: 'Please provide authorization token' });
        }

        const { content, isPublic, groupId, communityId } = req.body;
        const userId = authorizedData.id;

        // Handle file upload to Cloudinary
        if (req.file) {
            cloudinary.uploader.upload_stream({ resource_type: 'auto', folder: 'app/post' }, (error, result) => {
                if (error) {
                    console.error('Error uploading image to Cloudinary:', error);
                    return res.status(500).send({ error:true,data:null ,message: 'An error occurred while uploading the image' });
                }

                const imageUrl = result.secure_url;

                const insertPostQuery = 'INSERT INTO posts (user_id, content, is_public, image_url, community_id) VALUES (?, ?, ?, ?, ?)';

                // Insert post with image URL into the database
                db.query(insertPostQuery, [userId, content, isPublic, imageUrl, communityId], (err, result) => {
                    if (err) {
                        console.error('Error submitting post:', err);
                        return res.status(500).send({ error: true,data:null,message:'An error occurred while submitting the post: ' + err });
                    }

                    const postId = result.insertId;

                    if (isPublic == 0) {
                        const insertGroupPostQuery = 'INSERT INTO group_posts (group_id, post_id) VALUES (?, ?)';

                        // Insert group post into the database for private posts
                        db.query(insertGroupPostQuery, [groupId, postId], (err) => {
                            if (err) {
                                console.error('Error submitting group post:', err);
                                return res.status(500).json({ error: true,data:null,message:'An error occurred while submitting the group post: ' + err });
                            } else {
                                console.log('Group post inserted successfully');
                                return res.status(200).send({
                                    error: false,
                                    data: null,
                                    message: 'Private Post submitted successfully'
                                });
                            }
                        });
                    } else {
                        console.log('Skipping group post insertion');
                        return res.status(200).send({
                            error: false,
                            data: null,
                            message: 'Public Post submitted successfully'
                        });
                    }
                });
            }).end(req.file.buffer);
        } else {
            const insertPostQuery = 'INSERT INTO posts (user_id, content, is_public, image_url, community_id) VALUES (?, ?, ?, ?, ?)';

            // Insert post without image URL into the database
            db.query(insertPostQuery, [userId, content, isPublic, communityId], (err, result) => {
                if (err) {
                    console.error('Error submitting post:', err);
                    return res.status(500).json({ error:true,data:null,message: 'An error occurred while submitting the post: ' + err });
                }

                const postId = result.insertId;

                if (isPublic == 0) {
                    const insertGroupPostQuery = 'INSERT INTO group_posts (group_id, post_id) VALUES (?, ?)';

                    // Insert group post into the database for private posts
                    db.query(insertGroupPostQuery, [groupId, postId], (err) => {
                        if (err) {
                            console.error('Error submitting group post:', err);
                            return res.status(500).send({ error: true,data:null,message:`An error occurred while submitting the group post: ${err}`});
                        } else {
                            console.log('Group post inserted successfully');
                            return res.status(200).send({
                                error: false,
                                data: null,
                                message: 'Private Post submitted successfully'
                            });
                        }
                    });
                } else {
                    console.log('Skipping group post insertion');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Public Post submitted successfully'
                    });
                }
            });
        }
    });
});

// Handle Post Likes
router.post('/like', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
           return res.status(422).send({ error: true, data:null,message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { postId } = req.body;

            const query = 'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)';
            db.query(query, [userId, postId], (err, result) => {
                if (err) {
                    console.error('Error liking post:', err);
                    return res.status(500).send({error:true,data:null,message:'Error liking post'});
                } else {
                    console.log('Post liked successfully');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Post liked successfully'
                    });
                }
            });
        }
    });
});

// Handle Post Unlikes
router.post('/unlike', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { postId } = req.body;

            const query = 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?';
            db.query(query, [postId, userId], (err, result) => {
                if (err) {
                    console.error('Error unliking post:', err);
                    res.status(500).send({error:true,data:null, message:'Error unliking post'});
                } else {
                    console.log('Post unliked successfully');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Post unliked successfully'
                    });
                }
            });
        }
    });
});

// Handle Submitting Comments
router.post('/comment', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const postId = req.body.postId;
            const content = encodeURIComponent(req.body.content);

            const query = 'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)';
            db.query(query, [userId, postId, content], (err, result) => {
                if (err) {
                    console.error('Error submitting comment:', err);
                    return res.status(500).send({error:true,data:null,message:'Error submitting comment'});
                } else {
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Comment submitted successfully'
                    });
                }
            });
        }
    });
});

// Handle Comment Likes
router.post('/like-comment', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { commentId } = req.body;

            const query = 'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)';
            db.query(query, [userId, commentId], (err, result) => {
                if (err) {
                    console.error('Error liking comment:', err);
                    return res.status(500).send({error:true,data:null,message:'Error liking comment'});
                } else {
                    console.log('Comment liked successfully');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Comment liked successfully'
                    });
                }
            });
        }
    });
});

// Handle Comment Unlikes
router.post('/unlike-comment', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null ,message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            const { commentId } = req.body;

            const query = 'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?';
            db.query(query, [commentId, userId], (err, result) => {
                if (err) {
                    console.error('Error unliking Comment:', err);
                    return res.status(500).send({error: false, data: null,message:'Error unliking Comment'});
                } else {
                    console.log('Comment unliked successfully');
                    return res.status(200).send({
                        error: false,
                        data: null,
                        message: 'Comment unliked successfully'
                    });
                }
            });
        }
    });
});

// Retrieve Post Details
router.get('/:postId/details', verifyToken, (req, res) => {
    const postId = req.params.postId;

    const query = 'SELECT p.*, u.username, COUNT(pl.id) AS num_likes ' +
                  'FROM posts p ' +
                  'INNER JOIN users u ON p.user_id = u.id ' +
                  'LEFT JOIN post_likes pl ON p.id = pl.post_id ' +
                  'WHERE p.id = ? ' +
                  'GROUP BY p.id';
    db.query(query, [postId], (err, result) => {
        if (err) {
            console.error('Error retrieving post details:', err);
            return res.status(500).send({ 
                error: true, 
                data: null, 
                message: 'Error retrieving post details'
            });
        } else {
            const post = result[0];
            if (!post) {
                return res.status(404).send({ 
                    error: true, 
                    data: null, 
                    message: 'Post not found' 
                });
            } else {
                return res.status(200).send({ 
                    error: false, 
                    data: post, 
                    message: 'Single post data' 
                });
            }
        }
    });
});  

// Retrieve public Posts
router.get('/public', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;

            const query = `SELECT 
                p.id AS post_id, 
                p.content AS post_content, 
                p.image_url AS post_image, 
                p.is_public, 
                COUNT(DISTINCT pl.id) AS num_likes,
                MAX(CASE WHEN pl.user_id = ? THEN 1 ELSE 0 END) AS user_has_liked,
                COUNT(DISTINCT c.id) AS num_comments, 
                p.user_id, 
                u.username, 
                u.profile_photo, 
                p.date_added, 
                p.date_modified 
            FROM posts p 
            LEFT JOIN post_likes pl ON p.id = pl.post_id 
            LEFT JOIN users u ON p.user_id = u.id 
            LEFT JOIN comments c ON p.id = c.post_id 
            WHERE p.is_public = 1 
            GROUP BY p.id, p.content, p.image_url, p.is_public, p.user_id, u.username, u.profile_photo, p.date_added, p.date_modified
            `;

            db.query(query, [userId], function (error, results) {
                if (error) throw error;
                return res.status(200).send({ 
                    error: false, 
                    data: results, 
                    message: 'public post data' 
                });
            });
        }
    });
});

// Retrieve Posts by community
router.get('/byCommunity/:id', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            let community_id = req.params.id;

            const query = `SELECT 
                p.id AS post_id, 
                p.content AS post_content, 
                p.image_url AS post_image, 
                p.is_public, 
                COUNT(DISTINCT pl.id) AS num_likes,
                MAX(CASE WHEN pl.user_id = ? THEN 1 ELSE 0 END) AS user_has_liked,
                COUNT(DISTINCT c.id) AS num_comments, 
                p.user_id, 
                u.username, 
                u.profile_photo, 
                p.date_added, 
                p.date_modified 
            FROM posts p 
            LEFT JOIN post_likes pl ON p.id = pl.post_id 
            LEFT JOIN users u ON p.user_id = u.id 
            LEFT JOIN comments c ON p.id = c.post_id 
            WHERE p.community_id = ?
            GROUP BY p.id, p.content, p.image_url, p.is_public, p.user_id, u.username, u.profile_photo, p.date_added, p.date_modified
            `;

            db.query(query, [userId, community_id]
                , function (error, results) {
                if (error) throw error;
                return res.status(200).send({ 
                    error: false, 
                    data: results, 
                    message: 'public post data' 
                });
            });
        }
    });
});

// Retrieve post made by user
router.get('/byUser/:id', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = req.params.id;

            const query = `SELECT 
                p.id AS post_id, 
                p.content AS post_content, 
                p.image_url AS post_image, 
                p.is_public, 
                COUNT(DISTINCT pl.id) AS num_likes,
                MAX(CASE WHEN pl.user_id = ? THEN 1 ELSE 0 END) AS user_has_liked,
                COUNT(DISTINCT c.id) AS num_comments, 
                p.user_id, 
                u.username, 
                u.profile_photo, 
                p.date_added, 
                p.date_modified 
            FROM posts p 
            LEFT JOIN post_likes pl ON p.id = pl.post_id 
            LEFT JOIN users u ON p.user_id = u.id 
            LEFT JOIN comments c ON p.id = c.post_id 
            WHERE p.user_id = ?
            GROUP BY p.id, p.content, p.image_url, p.is_public, p.user_id, u.username, u.profile_photo, p.date_added, p.date_modified
            `;

            db.query(query, [userId, userId]
                , function (error, results) {
                if (error) throw error;
                return res.status(200).send({ 
                    error: false, 
                    data: results, 
                    message: 'all post data by user' 
                });
            });
        }
    });
});

// Retrieve private Posts
router.get('/private', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true,data:null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;

            const query = `SELECT
                p.id AS post_id,
                p.content AS post_content,
                p.image_url AS post_image,
                p.is_public,
                gp.group_id,
                COUNT(DISTINCT pl.id) AS num_likes,
                MAX(CASE WHEN pl.user_id = ? THEN 1 ELSE 0 END) AS user_has_liked,
                COUNT(DISTINCT c.id) AS num_comments,
                p.user_id,
                u.username,
                u.profile_photo,
                MAX(p.date_added) AS max_date_added,
                MAX(p.date_modified) AS max_date_modified
            FROM posts p
            LEFT JOIN group_posts gp ON p.id = gp.post_id
            LEFT JOIN post_likes pl ON p.id = pl.post_id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN comments c ON p.id = c.post_id
            WHERE p.is_public = 0
                AND (p.user_id = ? OR gp.group_id IN (SELECT group_id FROM group_users WHERE user_id = ?))
            GROUP BY
                p.id,
                p.content,
                p.image_url,
                p.is_public,
                gp.group_id,
                p.user_id,
                u.username,
                u.profile_photo;
            `;

            db.query(query, [userId, userId, userId], function (error, results) {
                if (error) throw error;
                return res.status(200).send({ 
                    error: false, 
                    data: results, 
                    message: 'private post data' 
                });
            });
        }
    });
});

// Retrieve comments for Post
router.get('/comments/:id', verifyToken, (req, res) => {
    // Verify JWT token and extract user ID
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if (err) {
            return res.status(422).send({ error: true, data: null, message: 'Please provide authorization token' });
        } else {
            const userId = authorizedData.id;
            let post_id = req.params.id;

            const query = `
            SELECT
                c.id AS comment_id,
                c.content AS comment_content,
                c.user_id, u.username, u.profile_photo, 
                COUNT(cl.id) AS num_comment_likes,
                MAX(CASE WHEN cl.user_id = ? THEN 1 ELSE 0 END) AS user_has_liked,
                c.date_added, 
                c.date_modified
            FROM comments c
            LEFT JOIN comment_likes cl ON c.id = cl.comment_id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            GROUP BY c.id, c.content
            `;

            db.query(query, [userId, post_id], function (error, results) {
                if (error) throw error;

                // Decode comment_content for each result
                results.forEach(result => {
                    result.comment_content = decodeURIComponent(result.comment_content);
                });

                return res.status(200).send({
                    error: false,
                    data: results,
                    message: 'post comment data'
                });
            });
        }
    });
});


module.exports = router;
