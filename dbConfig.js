const Pool = require("pg").Pool;
const conn = new Pool({
    user:'postgres', // default postgres
    host:'localhost',
    database:'name_of_your_database', // `my_todos_db`
    password:'your_password', //added during PostgreSQL and pgAdmin installation
    port:'5432' //default port
});

// var mysql = require('mysql');
// var conn = mysql.createConnection({
//   host: 'localhost', // Replace with your host name
//   user: 'root',      // Replace with your database username
//   password: '!@#0809Jabyte',      // Replace with your database password
//   database: 'snuggli' // // Replace with your database Name
// }); 
 
// conn.connect(function(err) {
//   if (err) throw err;
//   console.log('Database is connected successfully !');
// });

module.exports = conn;

 
 