const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2; // Cloudinary SDK
const  { conn, db } = require('../database');

const jsonwebtoken = require('jsonwebtoken');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'your_cloud_name',
    api_key: 'your_api_key',
    api_secret: 'your_api_secret'
  });

const privateKey = 'MIICXQIBAAKBgH1B4lvSKZkNElOfkhmAUTmFj+f5/N5d5gxF/DUJ/ZyAO8W6bBUNSj0RHnLYy0FpH3L4Erlt5IxG6rpGQm5cZiIfZ6pbpnY388uxvI4iTTIiVKDuKYnD4CgQ6et7vcwvMzQk56Cy+6wllAqQhnSjwbHV8lM1Yt3jVyYz6jz92y4xAgMBAAECgYBJiQNmGqTXOKhYtaalGAMXfQT2EHpW5dNnwzKExN/CIDp3I7HOTiYWYdV5YTM6rIeNDHyZph12CTBGuXbIqbA/XlCOqPPMjS7vm9DFyeNgvS1hAtcsM0cH/AR4o0rkH9Xu3+sw1vn0llhWJWddpDrS4fbkJvaLstmqPraT6dvBTQJBAPHksbbTaIBplSY6dezrkgf05Cuf7/j0FLWUAYUUJPia1s6Vr9To6Joa55ryOTe7n50YVzq2d4YHnvKz5w4dxX8CQQCEj+SSrvell3mn0Sf3d8O/7FW2iiqBy/n/0xrjuQwIEM+wK7rjJ2M5BPnXQa79ugeelSRMCot7W0M0NYfisRPAkEAv1LfrXexZEAelEoRE/+PVXPBNTAfoo2MA8K5IQU56Nivpl6G4KQHtjwpjEiiMQ7ZxGuIMww3pW9JrTXWPzgVCQJBAIKYD6LCZI7qL5u4Xhqh9b8jVsUQYnY5TyBRSR0ZEsKIEm135i7K8yDXcK70i7Ca630taiBc6zXY919VqBhoY2LdVe4f6xHRuRk4wpccEymnKx5ghmBwUk8SmAhlx84giedsLjehBatbFhkId0lSv+qe82El';


// Set up multer for file uploads with Cloudinary
const storage = multer.memoryStorage(); // Store uploaded files in memory
const upload = multer({ storage: storage });
  
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

    //verify the JWT token generated for the therapist
    // jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
    //     if(err){
    //         //If error send 
    //     res.status(422).send({ error: true,  message: 'Please provide authorization token' });
    //     } else {
    //         //If token is successfully verified, we can send the autorized data 

    //     }
    // })

// Define a route to create a new group
router.post('/create-group', verifyToken, (req, res) => {
 
    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 

    const { groupName, users } = req.body;
    const userId = authorizedData.id;
  
    // Insert group into groups table
    const insertGroupQuery = 'INSERT INTO groups (name, created_by) VALUES (?, ?)';
    db.query(insertGroupQuery, [groupName, userId], (err, result) => {
      if (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ error: 'An error occurred while creating the group' });
      } else {
        const groupId = result.insertId;
        if (users && users.length > 0) {
          // Insert group members into group_users table
          const insertGroupMembersQuery = 'INSERT INTO group_users (group_id, user_id) VALUES ?';
          const values = users.map(user_id => [groupId, user_id]);
          db.query(insertGroupMembersQuery, [values], (err) => {
            if (err) {
              console.error('Error adding group members:', err);
              res.status(500).send({ 
                error: true,  
                message: 'An error occurred while adding group members' 
            });
              return;
            }
            return res.send({ 
                error: false, 
                data: null, 
                message: 'Group created successfully' 
            });

          });
        } else {
            return res.send({ 
                error: false, 
                data: null, 
                message: 'Group created successfully' 
            });
        }
      }
    });

        }
    })
  }); 

// Define a route to submit a new post with image upload to Cloudinary
router.post('/submit', upload.single('image'), verifyToken, (req, res) => {
    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
    //If token is successfully verified, we can send the autorized data 

    const { content, isPublic, groupId } = req.body;
    const userId = authorizedData.id;
  
    if (req.file) {
      // Upload image to Cloudinary
      cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) {
          console.error('Error uploading image to Cloudinary:', error);
          res.status(500).json({ error: 'An error occurred while uploading the image' });
        } else {
          const imageUrl = result.secure_url;
  
          // Insert post into posts table with Cloudinary image URL
          const insertPostQuery = 'INSERT INTO posts (user_id, content, is_public, image_url) VALUES (?, ?, ?, ?)';
          db.query(insertPostQuery, [userId, content, isPublic, imageUrl], (err, result) => {
            if (err) {
              console.error('Error submitting post:', err);
              res.status(500).json({ error: 'An error occurred while submitting the post' });
            } else {
              const postId = result.insertId;
  
              if (!isPublic && groupId) {
                // Insert private post for a group
                const insertGroupPostQuery = 'INSERT INTO group_posts (group_id, post_id) VALUES (?, ?)';
                db.query(insertGroupPostQuery, [groupId, postId], (err) => {
                  if (err) {
                    console.error('Error submitting group post:', err);
                    res.status(500).json({ error: 'An error occurred while submitting the group post' });
                    return;
                  }
                  return res.send({ 
                      error: false, 
                      data: null, 
                      message: 'Post submitted successfully' 
                  });

                });
              } else {
                return res.send({ 
                    error: false, 
                    data: null, 
                    message: 'Post submitted successfully' 
                });

              }
            }
          });
        }
      }).end(req.file.buffer);
    } else {
      // No image uploaded
      // Insert post into posts table without image URL
      const insertPostQuery = 'INSERT INTO posts (user_id, content, is_public) VALUES (?, ?, ?)';
      db.query(insertPostQuery, [userId, content, isPublic], (err, result) => {
        if (err) {
          console.error('Error submitting post:', err);
          res.status(500).json({ error: 'An error occurred while submitting the post' });
        } else {
          const postId = result.insertId;
  
          if (!isPublic && groupId) {
            // Insert private post for a group
            const insertGroupPostQuery = 'INSERT INTO group_posts (group_id, post_id) VALUES (?, ?)';
            db.query(insertGroupPostQuery, [groupId, postId], (err) => {
              if (err) {
                console.error('Error submitting group post:', err);
                res.status(500).json({ error: 'An error occurred while submitting the group post' });
                return;
              }
              return res.send({ 
                  error: false, 
                  data: null, 
                  message: 'Post submitted successfully' 
              });

            });
          } else {
            return res.send({ 
                error: false, 
                data: null, 
                message: 'Post submitted successfully' 
            });

          }
        }
      });
    }

        }
    })
  });

  // Handle Post Likes
  router.post('/like', (req, res) => {
    const { userId, postId } = req.body;
  
    const query = 'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)';
    db.query(query, [userId, postId], (err, result) => {
      if (err) {
        console.error('Error liking post:', err);
        res.status(500).send('Error liking post');
      } else {
        console.log('Post liked successfully');
        return res.send({ 
            error: false, 
            data: null, 
            message: 'Post liked successfully' 
        });
      }
    });
  });
  
// Handle Submitting Comments
router.post('/comment', (req, res) => {
    const { userId, postId, content } = req.body;
  
    const query = 'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)';
    db.query(query, [userId, postId, content], (err, result) => {
      if (err) {
        console.error('Error submitting comment:', err);
        res.status(500).send('Error submitting comment');
      } else {
        return res.send({ 
            error: false, 
            data: null, 
            message: 'Comment submitted successfully' 
        });
      }
    });
  });
  
  // Handle Comment Likes
  router.post('/like-comment', (req, res) => {
    const { userId, commentId } = req.body;
  
    const query = 'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)';
    db.query(query, [userId, commentId], (err, result) => {
      if (err) {
        console.error('Error liking comment:', err);
        res.status(500).send('Error liking comment');
      } else {
        console.log('Comment liked successfully');
        return res.send({ 
            error: false, 
            data: null, 
            message: 'Comment liked successfully' 
        });
      }
    });
  });
  
  // Retrieve Post Details
  router.get('/:postId/details', (req, res) => {
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
        res.status(500).send('Error retrieving post details');
      } else {
        const post = result[0];
        if (!post) {
          res.status(404).send('Post not found');
        } else {
            return res.send({ 
                error: false, 
                data: post, 
                message: 'Single post data' 
            });
        }
      }
    });
  });  

  // Retrieve public Post
  router.get('/public', verifyToken, (req, res) => {
    
    // verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 
            
    const query = 'SELECT p.*, COUNT(pl.id) AS num_likes FROM posts p LEFT JOIN post_likes pl ON p.id = pl.post_id WHERE p.is_public = true GROUP BY p.id';

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error retrieving post details:', err);
        res.status(500).send('Error retrieving post details');
      } else {
        
        if (!result) {
          res.status(404).json({dd: 'Post not found', mm: result});
        } else {
            return res.send({ 
                error: false, 
                data: result, 
                message: 'Post data' 
            });
        }
      }
    });

        }
    })
  });

  // Retrieve private Post
  router.get('/private', verifyToken, (req, res) => {

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 

            const userId = authorizedData.id;

            const query = `
            SELECT p.id AS post_id, p.content AS post_content, p.image_url AS post_image,
            COUNT(pl.id) AS num_likes,
            c.id AS comment_id, c.content AS comment_content, COUNT(cl.id) AS num_comment_likes
          FROM posts p
          INNER JOIN post_likes pl ON p.id = pl.post_id
          LEFT JOIN comments c ON p.id = c.post_id
          LEFT JOIN comment_likes cl ON c.id = cl.comment_id
          WHERE p.is_public = 0 AND p.user_id IN (
            SELECT user_id FROM user_groups WHERE group_id IN (
              SELECT group_id FROM user_groups WHERE user_id = ?
            )
          )
          GROUP BY p.id, c.id
            `;
          
            db.query(query, [userId], (err, result) => {
              if (err) {
                console.error('Error retrieving private posts:', err);
                res.status(500).send('Error retrieving private posts');
              } else {
                const postsWithComments = result.reduce((acc, post) => {
                  const existingPost = acc.find(p => p.id === post.id);
                  if (!existingPost) {
                    const { comments, ...rest } = post;
                    const commentsArray = post.comments ? JSON.parse(post.comments) : [];
                    acc.push({
                      ...rest,
                      comments: commentsArray.map(comment => ({
                        id: comment.id,
                        content: comment.content,
                        num_likes: comment.num_likes
                      }))
                    });
                  } else if (post.comments) {
                    const commentsArray = JSON.parse(post.comments);
                    existingPost.comments.push(
                      ...commentsArray.map(comment => ({
                        id: comment.id,
                        content: comment.content,
                        num_likes: comment.num_likes
                      }))
                    );
                  }
                  return acc;
                }, []);
          
                res.json(postsWithComments);
              }
            });

        }
    })

  });
  

module.exports = router;