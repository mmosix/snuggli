const express = require('express');
const router = express.Router();
const { conn, db } = require('../database'); // Importing database connections

const jsonwebtoken = require('jsonwebtoken'); // For JWT authentication
const { hashSync, genSaltSync, compareSync } = require("bcrypt"); // For password hashing
const cookieParser = require('cookie-parser'); // For working with cookies

const nodemailer = require('nodemailer'); // For sending email notifications
const crypto = require('crypto'); // For generating random tokens

require('dotenv').config();
const privateKey = process.env.JWT_PRIVATE_KEY; // Your private key for JWT

const {
    signupValidation,
    loginValidation
} = require('../validation'); // Import validation functions

const {
    validationResult
} = require('express-validator'); // For handling validation results

// Route for sending a password reset email
router.post('/forgotPassword', async (req, res, next) => {
    try {
        const email = req.body.email;
        console.log(email);

        const origin = req.header('Origin'); // Get the request origin from the HOST header

        const user = await conn.getUserByEmail(email);

        if (!user) {
            // Return an OK response to prevent email enumeration
            return res.json({ status: 'ok' });
        }

        // Expire old and expired tokens for this user
        await conn.expireOldTokens(email, 1);

        // Generate a reset token that expires after 1 hour
        const resetToken = crypto.randomBytes(6).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
        const createdAt = new Date(Date.now());
        const expiredAt = resetTokenExpires;

        // Insert the new token into the resetPasswordToken table
        await conn.insertResetToken(email, resetToken, createdAt, expiredAt, 0);

        // Send an email with the reset token
        await sendPasswordResetEmail(email, resetToken, origin);

        res.json({
            message: 'Please check your email for the password reset process',
            token: resetToken
        });
    } catch (e) {
        console.log(e);
    }
});

// Route for resetting the user's password
router.post('/resetPassword', validateResetToken, async (req, res, next) => {
    try {
        const newPassword = req.body.password;
        const email = req.body.email;

        if (!newPassword) {
            return res.sendStatus(400);
        }

        const user = await conn.getUserByEmail(email);

        const salt = genSaltSync(10);
        const password = hashSync(newPassword, salt);

        // Update the user's password in the database
        await conn.updateUserPassword(password, user.id);

        // Expire old and expired tokens for this user
        await conn.expireOldTokens(email, 1);

        res.json({ message: 'Password reset successful, you can now login with the new password' });
    } catch (e) {
        console.log(e);
    }
});

// Route for getting user data based on a valid JWT token
router.post('/get-user', async (req, res, next) => {
    try {
        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            return res.status(422).json({ error: true, data: null, message: 'Please provide the token' });
        }
        const theToken = req.headers.authorization.split(' ')[1];
        const decoded = jsonwebtoken.verify(theToken, privateKey);

        const results = await conn.getUserByID(decoded.id);

        return res.send({ error: false, data: results, message: 'Single user data' });
    } catch (e) {
        console.log(e);
    }
});

// Route for user login
router.post('/login', loginValidation, async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).send({
                message: 'Email and password are required!'
            });
        }

        const user = await conn.getPassByEmail(email);

        if (!user) {
            return res.status(401).send({
                message: 'Email or password is incorrect!'
            });
        }

        const isValidPassword = compareSync(password, user.password);

        if (isValidPassword) {
            user.password = undefined;
            const jsontoken = jsonwebtoken.sign({ id: user.id }, privateKey, { expiresIn: '72h' });
            res.cookie('token', jsontoken, { httpOnly: true, secure: true, sameSite: 'strict', expires: new Date(Number(new Date()) + 30 * 60 * 1000) });

            await conn.updateLastLogin(user.id);
            const data = await conn.getUserByEmail(email);

            data.token = jsontoken;

            return res.status(200).send({
                error: false,
                data: data,
                message: 'Logged in!'
            });

        } else {
            return res.status(401).send({ error: true, data: null, message: 'Email or password is incorrect!' });
        }
    } catch (e) {
        console.log(e);
    }
});

// Route for registering a new user
router.post('/register', signupValidation, async (req, res, next) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        let password = req.body.password;
        let school_id = req.body.school_id;
        let username = req.body.username;

        if (!name || !email || !password) {
            return res.sendStatus(400);
        }

        const check = await conn.getUserByEmail(email);

        if (check) {
            return res.status(409).send({ error: true, data: null, message: 'This user is already in use!' });
        } else {
            const salt = genSaltSync(10);
            password = hashSync(password, salt);
            const userID = await conn.insertUser(name, email, password, school_id, username);

            const jsontoken = jsonwebtoken.sign({ id: userID }, privateKey, { expiresIn: '72h' });
            res.cookie('token', jsontoken, { httpOnly: true, secure: true, sameSite: 'strict', expires: new Date(Number(new Date()) + 30 * 60 * 1000) });

            const user = await conn.getUserByID(userID);

            user.token = jsontoken;

            return res.status(200).send({
                error: false,
                data: user,
                message: 'Registration Successful'
            });
        }
    } catch (e) {
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
        if (results && results.length > 0) {
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

// Middleware to send an email
async function sendEmail({ to, subject, html, from = 'hola@snuggli.co' }) {
    const transporter = nodemailer.createTransport({
        host: 'vps66392.inmotionhosting.com',
        port: 465,
        auth: {
            user: 'mailer@snuggli.co', // generated ethereal user
            pass: 'wF_$FMCWpsaH' // generated ethereal password
        }
    });

    await transporter.sendMail({ from, to, subject, html });

    console.log("Email sent successfully");
}

// Middleware to send a password reset email
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
        subject: 'Reset your Password',
        html: `<h4>Reset Password </h4>
               ${message}`
    });
}

// Middleware to validate the reset token
async function validateResetToken(req, res, next) {
    const email = req.body.email;
    const resetToken = req.body.token;

    if (!resetToken || !email) {
        return res.sendStatus(400);
    }

    // Verify if the token exists in the resetPasswordToken table and is not expired
    const currentTime = new Date(Date.now());

    const token = await conn.findValidToken(resetToken, email, currentTime);

    if (!token) {
        res.json('Invalid token, please try again.');
    }

    next();
}

// Middleware to verify JWT token
async function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (token === undefined) {
        return res.json({
            message: "Access Denied! Unauthorized User"
        });
    } else {
        jsonwebtoken.verify(token, privateKey, (err, authData) => {
            if (err) {
                res.json({
                    message: "Invalid Token..."
                });
            } else {
                console.log(authData.user.role);
                const role = authData.user.role;
                if (role === "admin") {
                    next();
                } else {
                    return res.json({
                        message: "Access Denied! You are not an Admin"
                    });
                }
            }
        });
    }
}

// Export the router
module.exports = router;
