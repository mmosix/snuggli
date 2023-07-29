const express = require('express');
const router = express.Router();
const  { conn, db } = require('../database');

const jsonwebtoken = require('jsonwebtoken');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const cookieParser = require('cookie-parser');

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const privateKey = 'MIICXQIBAAKBgH1B4lvSKZkNElOfkhmAUTmFj+f5/N5d5gxF/DUJ/ZyAO8W6bBUNSj0RHnLYy0FpH3L4Erlt5IxG6rpGQm5cZiIfZ6pbpnY388uxvI4iTTIiVKDuKYnD4CgQ6et7vcwvMzQk56Cy+6wllAqQhnSjwbHV8lM1Yt3jVyYz6jz92y4xAgMBAAECgYBJiQNmGqTXOKhYtaalGAMXfQT2EHpW5dNnwzKExN/CIDp3I7HOTiYWYdV5YTM6rIeNDHyZph12CTBGuXbIqbA/XlCOqPPMjS7vm9DFyeNgvS1hAtcsM0cH/AR4o0rkH9Xu3+sw1vn0llhWJWddpDrS4fbkJvaLstmqPraT6dvBTQJBAPHksbbTaIBplSY6dezrkgf05Cuf7/j0FLWUAYUUJPia1s6Vr9To6Joa55ryOTe7n50YVzq2d4YHnvKz5w4dxX8CQQCEj+SSrvell3mn0Sf3d8O/7FW2iiqBy/n/0xrjuQwIEM+wK7rjJ2M5BPnXQa79ugeelSRMCot7W0M0NYfisRPAkEAv1LfrXexZEAelEoRE/+PVXPBNTAfoo2MA8K5IQU56Nivpl6G4KQHtjwpjEiiMQ7ZxGuIMww3pW9JrTXWPzgVCQJBAIKYD6LCZI7qL5u4Xhqh9b8jVsUQYnY5TyBRSR0ZEsKIEm135i7K8yDXcK70i7Ca630taiBc6zXY919VqBhoY2LdVe4f6xHRuRk4wpccEymnKx5ghmBwUk8SmAhlx84giedsLjehBatbFhkId0lSv+qe82El';

const {
    signupValidation,
    loginValidation
} = require('../validation');

const {
    validationResult
} = require('express-validator');
  
  router.post('/forgotPassword', async(req, res, next)=>{
     try{
     const email = req.body.email;
     console.log(email);
      
     const origin = req.header('Origin'); // we are  getting the request origin from  the HOST header
      
     const user = await conn.getUserByEmail(email);
      
      
     if(!user){
         // here we always return ok response to prevent email enumeration
        return res.json({status: 'ok'});
     }
     // Get all the tokens that were previously set for this user and set used to 1. This will prevent old and expired tokens  from being used. 
     await conn.expireOldTokens(email, 1);
 
     // create reset token that expires after 1 hours
    const resetToken = crypto.randomBytes(6).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60*60*1000);
    const createdAt = new Date(Date.now());
     
     
    const expiredAt = resetTokenExpires;
     
    //insert the new token into resetPasswordToken table
    await conn.insertResetToken(email, resetToken,createdAt, expiredAt, 0);
 
    // send email
    await sendPasswordResetEmail(email,resetToken, origin);
    res.json({ message: 'Please check your email for password reset process',
               token: resetToken
            });
      
 
     } catch(e){
         console.log(e);
     }
 });
 
    router.post('/resetPassword', validateResetToken, async(req, res, next)=>{
        try{
            
            const newPassword = req.body.password;
            const email = req.body.email;
            
 
            if  (!newPassword) {
              return res.sendStatus(400);
             }
         
 
           const user = await conn.getUserByEmail(email);
 
            
           const salt = genSaltSync(10);
           const  password = hashSync(newPassword, salt);
            
           await conn.updateUserPassword(password, user.id);
           
           // Get all the tokens that were previously set for this user and set used to 1. This will prevent old and expired tokens  from being used. 
           await conn.expireOldTokens(email, 1);
            
           res.json({ message: 'Password reset successful, you can now login with the new password' });
 
        } catch(e){
            console.log(e);
        }
       });
     
    
router.post('/get-user', async(req, res, next) => {
    try{
        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            return res.status(422).json({ error: true, data: null, message: 'Please provide the token' });
        }
        const theToken = req.headers.authorization.split(' ')[1];
        const decoded = jsonwebtoken.verify(theToken, 'the-super-strong-secrect');
     

       const results = await conn.getUserByID(decoded.id);

        
      // res.json({ message: 'Password reset successful, you can now login with the new password' });

      return res.send({ error: false, data: results, message: 'Single user data' });

    } catch(e){
        console.log(e);
    }
});
     
    
router.post('/login', loginValidation, async(req, res, next) => {
    try{
        
     const email = req.body.email;
     const password = req.body.password;
     const user = await conn.getPassByEmail(email);
      
     if(!user){
        return res.status(401).send({
            message: 'Email or password is incorrect!'
        });
     }
  
      const isValidPassword = compareSync(password, user.password);
    if(isValidPassword){
         user.password = undefined;
         const jsontoken = jsonwebtoken.sign({id: user.id}, privateKey, { expiresIn: '72h'} );
         res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.
  
        // res.json({token: jsontoken});
        //return res.redirect('/mainpage') ;
        
        await conn.updateLastLogin(user.id);
        const data = await conn.getUserByEmail(email);

        data.token = jsontoken;
        
        return res.status(200).send({ 
            error: false, 
            data: data, 
            message: 'Logged in!'
        });
  
     }  else{
        return res.status(401).send({ error: true, data: null, message: 'Username or password is incorrect!' });
     }

    } catch(e){
        console.log(e);
    }
});

 
router.post('/register', signupValidation, async (req, res, next)=>{

    try{
        const name = req.body.name;
        const email = req.body.email;
        let password = req.body.password;
        let school_id = req.body.school_id;
        let username = req.body.username;
  
        if (!name || !email || !password) {
            return res.sendStatus(400);
         }
        

         check = await conn.getUserByEmail(email);
     
         if(check){
        return res.status(409).send({ error: true, data: null, message: 'This user is already in use!' });
        } else {
        const salt = genSaltSync(10);
        password = hashSync(password, salt);
        const userID =  await conn.insertUser(name, email, password, school_id, username);

        const jsontoken = jsonwebtoken.sign({id: userID}, privateKey, { expiresIn: '72h'} );
        res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.

       const user = await conn.getUserByID(userID);

       user.token = jsontoken;
        
        return res.status(200).send({ 
            error: false, 
            data: user, 
            message: 'Registration Successful'
        });

     }
  
    } catch(e){    
        console.log(e);
        res.sendStatus(400);
    }
});
 
// Retrieve schools with domain 
router.post('/usernameLookup', function (req, res, next) {
  
    const username = req.body.username;
  
    if (!username) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide a username' });
    }
  
    db.query('SELECT username FROM users WHERE username=?', username, function (error, results, fields) {
        if (error) throw error;
        if (results && results.length > 0) {
            return res.status(401).send({ error: true, data: null, message: 'Username already exists' });

        } else {
            return res.status(200).send({ 
                error: false, 
                data: true, 
                message: 'Username available'
            });
            
        }
    });
  
});
 
// Retrieve schools with domain 
router.post('/schoolLookup', function (req, res, next) {
  
    const domain = req.body.domain;
  
    if (!domain) {
        return res.status(400).send({ error: true, data: null, message: 'Please provide valid school email' });
    }
  
    db.query('SELECT * FROM schools WHERE school_domain=?', domain, function (error, results, fields) {
        if (error) throw error;
        if (results  && results.length > 0) {
            return res.status(200).send({ 
                error: false, 
                data: results[0], 
                message: 'School lookup successful'
            });

        } else {
            return res.status(401).send({ error: true, data: null, message: 'Please provide valid school email' });
            
        }
    });
  
});
 
  
 
async function sendEmail({ to, subject, html, from = 'hola@snuggli.co' }) {
    
    const transporter = nodemailer.createTransport({
            host: 'vps66392.inmotionhosting.com',
            port: 465,
            auth: {
              user: 'mailer@snuggli.co', // generated ethereal user
              pass: 'wF_$FMCWpsaH' // generated ethereal password
            }
    })
        
   
   await transporter.sendMail({ from, to, subject, html });
 
    console.log("email sent sucessfully");
        
    };
 
async function sendPasswordResetEmail(email, resetToken, origin) {
        let message;
         
        if (origin) {
            const resetUrl = `https://app.snuggli.com/reset-password?token=${resetToken}?email=${email}`;
            message = `<p>Please click the below link to reset your password, the link will be valid for 1 hour:</p>
                       <p><a href="${resetUrl}">${resetUrl}</a></p>`;
        } else {
            message = `<p>Please use the below token to reset your password with the <code>https://app.snuggli.com/reset-password?token=${resetToken}?email=${email}</code></p>`;
        }
     
        await sendEmail({
            from: 'hola@snuggli.co',
            to: email,
            subject: ' Reset your Password',
            html: `<h4>Reset Password </h4>
                   ${message}`
        });
    }
 
 //  Reset token validate
 async function  validateResetToken  (req, res, next){
 
    const email = req.body.email;
    const resetToken = req.body.token;
     
    
    if (!resetToken || !email) {
        return res.sendStatus(400);
       }
 
    // then we need to verify if the token exist in the resetPasswordToken and not expired.
    const currentTime =  new Date(Date.now());
     
    const token = await conn.findValidToken(resetToken, email, currentTime);
    
     
    if (!token) { 
      res.json ( 'Invalid token, please try again.');
    }
 
    next();
    }; 

    
//  Verify Token
async function  verifyToken  (req, res, next){
    
    const token=req.cookies.token;
     console.log(token);
      
     if(token === undefined  ){
          
             return res.json({
                 message: "Access Denied! Unauthorized User"
               });
     } else{
  
         jsonwebtoken.verify(token, process.env.SECRET_KEY, (err, authData)=>{
             if(err){
                 res.json({
                     message: "Invalid Token..."
                   });
  
             } else{
                 
                console.log(authData.user.role);
                const role = authData.user.role;
                if(role === "admin"){
  
                 next();
                } else{
                    return res.json({
                        message: "Access Denied! you are not an Admin"
                      });
  
                }
             }
         })
     } 
 }
   
  //  apiRouter.use('/user', verifyToken, userRouter);

module.exports = router;