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
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
      if (err) {
        return res.status(422).send({ error: true, message: 'Please provide authorization token' });
      }
  
      const { groupName, users } = req.body;
      const userId = authorizedData.id;
  
      const insertGroupQuery = 'INSERT INTO groups (name, created_by) VALUES (?, ?)';
      db.query(insertGroupQuery, [groupName, userId], (err, result) => {
        if (err) {
          console.error('Error creating group:', err);
          return res.status(500).json({ error: 'An error occurred while creating the group' });
        }
  
        const groupId = result.insertId;
  
        if (users && users.length > 0) {
          const insertGroupMembersQuery = 'INSERT INTO group_users (group_id, user_id) VALUES ?';
          const values = users.map((user_id) => [groupId, user_id]);
  
          db.query(insertGroupMembersQuery, [values], (err) => {
            if (err) {
              console.error('Error adding group members:', err);
              return res.status(500).send({
                error: true,
                message: 'An error occurred while adding group members'
              });
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
      });
    });
  });
  
  // Define a route to submit a new post with image upload to Cloudinary
  router.post('/submit', upload.single('image'), verifyToken, (req, res) => {
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
      if (err) {
        return res.status(422).send({ error: true, message: 'Please provide authorization token' });
      }
  
      const { content, isPublic, groupId } = req.body;
      const userId = authorizedData.id;
  
      if (req.file) {
        cloudinary.uploader.upload_stream({ resource_type: 'auto', folder: 'app/post'  }, (error, result) => {
          if (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return res.status(500).json({ error: 'An error occurred while uploading the image' });
          }
  
          const imageUrl = result.secure_url;
  
          const insertPostQuery =
            'INSERT INTO posts (user_id, content, is_public, image_url) VALUES (?, ?, ?, ?)';
  
          db.query(insertPostQuery, [userId, content, isPublic, imageUrl], (err, result) => {
            if (err) {
              console.error('Error submitting post:', err);
              return res.status(500).json({ error: 'An error occurred while submitting the post: '+ err });
            }
  
            const postId = result.insertId;

            console.log('isPublic:', isPublic);
            console.log('groupId:', groupId);
            console.log('postId:', postId);
  
            if (isPublic == 0) {
                const insertGroupPostQuery =
                  'INSERT INTO group_posts (group_id, post_id) VALUES (?, ?)';
    
                db.query(insertGroupPostQuery, [groupId, postId], (err) => {
                  if (err) {
                    console.error('Error submitting group post:', err);
                    return res.status(500).json({ error: 'An error occurred while submitting the group post: '+ err });
                  } else {
                      console.log('Group post inserted successfully');
                      return res.send({
                        error: false,
                        data: null,
                        message: 'Private Post submitted successfully'
                      });
                  }
    
                });
            } else {
                console.log('Skipping group post insertion');
              return res.send({
                error: false,
                data: null,
                message: 'Public Post submitted successfully'
              });
            }
          });
        }).end(req.file.buffer);
      } else {
        const insertPostQuery = 'INSERT INTO posts (user_id, content, is_public) VALUES (?, ?, ?)';
  
        db.query(insertPostQuery, [userId, content, isPublic], (err, result) => {
          if (err) {
            console.error('Error submitting post:', err);
            return res.status(500).json({ error: 'An error occurred while submitting the post: '+ err});
          }
  
          const postId = result.insertId;
  
          if (isPublic == 0) {
              const insertGroupPostQuery =
                'INSERT INTO group_posts (group_id, post_id) VALUES (?, ?)';
  
              db.query(insertGroupPostQuery, [groupId, postId], (err) => {
                if (err) {
                  console.error('Error submitting group post:', err);
                  return res.status(500).json({ error: 'An error occurred while submitting the group post: '+ err });
                } else {
                    console.log('Group post inserted successfully');
                    return res.send({
                      error: false,
                      data: null,
                      message: 'Private Post submitted successfully'
                    });
                }
  
              });
          } else {
              console.log('Skipping group post insertion');
            return res.send({
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

        //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 
    const userId = authorizedData.id;
    const { postId } = req.body;
  
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

        }
    })
  });
  
// Handle Submitting Comments
router.post('/comment', verifyToken, (req, res) => {

    //verify the JWT token generated for the therapist
jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
    if(err){
        //If error send 
    res.status(422).send({ error: true,  message: 'Please provide authorization token' });
    } else {
        //If token is successfully verified, we can send the autorized data 
const userId = authorizedData.id;
const { postId, content } = req.body;

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

    }
})
  });
  
  // Handle Comment Likes
  router.post('/like-comment', verifyToken, (req, res) => {

    //verify the JWT token generated for the therapist
jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
    if(err){
        //If error send 
    res.status(422).send({ error: true,  message: 'Please provide authorization token' });
    } else {
        //If token is successfully verified, we can send the autorized data 
const userId = authorizedData.id;
const { commentId } = req.body;

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

    }
})
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

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 

            const userId = authorizedData.id;

            
    const query = "SELECT p.id AS post_id, p.content AS post_content, p.image_url AS post_image, p.is_public, COUNT(pl.id) AS num_likes FROM posts p LEFT JOIN post_likes pl ON p.id = pl.post_id WHERE p.is_public = 0 GROUP BY p.id, p.content";
  
    db.query(query, function (error, results) {
        if (error) throw error;
        return res.send({ 
            error: false, 
            data: results, 
            message: 'public post data' 
        });
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

            const query = `SELECT
            p.id AS post_id,
            p.content AS post_content,
            p.image_url AS post_image,
            p.is_public,
            gp.group_id,
            COUNT(pl.id) AS num_likes
          FROM posts p
          LEFT JOIN group_posts gp ON p.id = gp.post_id
          LEFT JOIN post_likes pl ON p.id = pl.post_id
          WHERE p.is_public = 0
            AND (p.user_id = ? OR gp.group_id IN (SELECT group_id FROM group_users WHERE user_id = ?))
          GROUP BY p.id, p.content, p.is_public, gp.group_id
          `;
          
            db.query(query, [userId, userId], function (error, results) {
                if (error) throw error;
                return res.send({ 
                    error: false, 
                    data: results, 
                    message: 'private post data' 
                });
            });
            
            
//   const query = `
//   SELECT p.id AS post_id, p.content AS post_content, p.image_url AS post_image,
//     COUNT(pl.id) AS num_likes,
//     c.id AS comment_id, c.content AS comment_content, COUNT(cl.id) AS num_comment_likes
//   FROM posts p
//   INNER JOIN post_likes pl ON p.id = pl.post_id
//   LEFT JOIN comments c ON p.id = c.post_id
//   LEFT JOIN comment_likes cl ON c.id = cl.comment_id
//   WHERE p.is_public = 0 AND (p.id IN (
//     SELECT gp.post_id FROM group_posts gp
//     INNER JOIN user_groups ug ON gp.group_id = ug.group_id
//     WHERE ug.user_id = ?
//   ) OR p.id NOT IN (
//     SELECT gp.post_id FROM group_posts gp
//   ))
//   GROUP BY p.id, c.id
//   ORDER BY p.id, c.id
//     `;
    
//   db.query(query, [userId], (err, result) => {
//     if (err) {
//       console.error('Error retrieving private posts:', err);
//       res.status(500).send('Error retrieving private posts');
//     } else {
//       const postsWithComments = [];
//       let currentPost = null;

//       for (const row of result) {
//         if (!currentPost || currentPost.post_id !== row.post_id) {
//           currentPost = {
//             post_id: row.post_id,
//             post_content: row.post_content,
//             post_image: row.post_image,
//             num_likes: row.num_likes,
//             comments: []
//           };
//           postsWithComments.push(currentPost);
//         }

//         if (row.comment_id) {
//           const comment = {
//             comment_id: row.comment_id,
//             comment_content: row.comment_content,
//             num_comment_likes: row.num_comment_likes
//           };
//           currentPost.comments.push(comment);
//         }
//       }

//       return res.send({ 
//         error: false, 
//         data: postsWithComments, 
//         message: 'Private post data' 
//     });
//     }
//   });

        }
    })

  });
  
  // Retrieve comments for Post
  router.get('/comments/:id', verifyToken, (req, res) => {

    //verify the JWT token generated for the therapist
    jsonwebtoken.verify(req.token, privateKey, (err, authorizedData) => {
        if(err){
            //If error send 
        res.status(422).send({ error: true,  message: 'Please provide authorization token' });
        } else {
            //If token is successfully verified, we can send the autorized data 

            const userId = authorizedData.id;
            let post_id = req.params.id;

            const query = `SELECT
            c.id AS comment_id,
            c.content AS comment_content,
            c.user_id, u.username, u.profile_photo, 
            COUNT(cl.id) AS num_comment_likes,
            c.date_added, 
            c.date_modified
          FROM comments c
          LEFT JOIN comment_likes cl ON c.id = cl.comment_id
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ?
          GROUP BY c.id, c.content
          `;
          
            db.query(query, [post_id], function (error, results) {
                if (error) throw error;
                return res.send({ 
                    error: false, 
                    data: results, 
                    message: 'post comment data' 
                });
            });
            
        }
    })

  });

module.exports = router;