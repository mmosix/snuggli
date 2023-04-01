const express = require('express');
const router = express.Router();
const db = require('../database');

const jsonwebtoken = require('jsonwebtoken');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const cookieParser = require('cookie-parser');

const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
      
     const user = await db.getUserByEmail(email);
      
      
     if(!user){
         // here we always return ok response to prevent email enumeration
        return res.json({status: 'ok'});
     }
     // Get all the tokens that were previously set for this user and set used to 1. This will prevent old and expired tokens  from being used. 
     await db.expireOldTokens(email, 1);
 
     // create reset token that expires after 1 hours
    const resetToken = crypto.randomBytes(6).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60*60*1000);
    const createdAt = new Date(Date.now());
     
     
    const expiredAt = resetTokenExpires;
     
    //insert the new token into resetPasswordToken table
    await db.insertResetToken(email, resetToken,createdAt, expiredAt, 0);
 
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
         
 
           const user = await db.getUserByEmail(email);
 
            
           const salt = genSaltSync(10);
           const  password = hashSync(newPassword, salt);
            
           await db.updateUserPassword(password, user.id);
           
           // Get all the tokens that were previously set for this user and set used to 1. This will prevent old and expired tokens  from being used. 
           await db.expireOldTokens(email, 1);
            
           res.json({ message: 'Password reset successful, you can now login with the new password' });
 
        } catch(e){
            console.log(e);
        }
       });
     
    
router.post('/get-user', signupValidation, async(req, res, next) => {
    try{
        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            return res.status(422).json({
                message: "Please provide the token",
            });
        }
        const theToken = req.headers.authorization.split(' ')[1];
        const decoded = jsonwebtoken.verify(theToken, 'the-super-strong-secrect');
     

       const results = await db.getUserByID(decoded.id);

        
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
     user = await db.getUserByEmail(email);
      
     if(!user){
        return res.status(401).send({
            message: 'Email or password is incorrect!'
        });
     }
  
     const isValidPassword = compareSync(password, user.password);
     if(isValidPassword){
         user.password = undefined;
         const jsontoken = jsonwebtoken.sign({id: user.id}, 'the-super-strong-secrect', { expiresIn: '1h'} );
         res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.
  
        // res.json({token: jsontoken});
        //return res.redirect('/mainpage') ;
        
        await db.updateLastLogin(user.id);
        
        return res.status(200).send({
            message: 'Logged in!',
            token: jsontoken,
            user: user
        });
  
     }  else{
        return res.status(401).send({
            message: 'Username or password is incorrect!'
        });
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
  
        if (!name || !email || !password) {
            return res.sendStatus(400);
         }
         check = await db.getUserByEmail(email);
     
         if(check){
        return res.status(409).send({
            message: 'This user is already in use!'
        });
    } else {
        const salt = genSaltSync(10);
        password = hashSync(password, salt);
        const userID =  await db.insertUser(name, email, password, school_id);

        const jsontoken = jsonwebtoken.sign({id: userID}, 'the-super-strong-secrect', { expiresIn: '1h'} );
        res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.

       const user = await db.getUserByID(userID);
        
        return res.status(200).send({
            message: 'Registration Successful',
            token: jsontoken,
            user: user
        });

     }
  
    } catch(e){    
        console.log(e);
        res.sendStatus(400);
    }
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
            const resetUrl = `${origin}/router/resetPassword?token=${resetToken} email=${email}`;
            message = `<p>Please click the below link to reset your password, the link will be valid for 1 hour:</p>
                       <p><a href="${resetUrl}">${resetUrl}</a></p>`;
        } else {
            message = `<p>Please use the below token to reset your password with the <code>/router/reset-password</code> api route:</p>
                       <p><code>${resetToken}</code></p>`;
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
     
    const token = await db.findValidToken(resetToken, email, currentTime);
    
     
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