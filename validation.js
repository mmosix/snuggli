const { check } = require('express-validator');

// Export an array of validation middleware for user signup
exports.signupValidation = [
    // Check if 'name' field is not empty
    check('name', 'Name is required').not().isEmpty(),

    // Check if 'email' field is a valid email address and normalize it
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),

    // Check if 'password' field has a minimum length of 6 characters
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

// Export an array of validation middleware for user login
exports.loginValidation = [
    // Check if 'email' field is a valid email address and normalize it
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),

    // Check if 'password' field has a minimum length of 6 characters
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];
