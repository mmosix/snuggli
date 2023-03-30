const createError = require('http-errors');

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const indexRouter = require('./router/router.js');
const authRouter = require('./router/auth.js');
const userRouter = require('./router/users.js');
const schoolRouter = require('./router/schools.js');

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
 
app.use(cors());
 
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/schools', schoolRouter);
 
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