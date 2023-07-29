const createError = require('http-errors');

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const indexRouter = require('./router/router.js');
const authRouter = require('./router/auth.js');
const userRouter = require('./router/users.js');
const schoolRouter = require('./router/schools.js');
const moodRouter = require('./router/moods.js');
const affirmationRouter = require('./router/affirmation.js');

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
 
app.use(cors());
authRouter.use(cookieParser());
 
app.use('/v1/', indexRouter);
app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);
app.use('/v1/schools', schoolRouter);
app.use('/v1/moods', moodRouter);
app.use('/v1/affirmation', affirmationRouter);
 
// Handling Errors
app.use((err, req, res, next) => {
    // console.log(err);
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
      message: err.message,
    });
});
  
// set port
app.listen(3000, function () {
    console.log('Server is running on port 3000');
});
 
module.exports = app;