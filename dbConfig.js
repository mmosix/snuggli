const mysql = require('mysql');

var conn = mysql.createConnection({
  host: '34.173.110.19', // Replace with your host name
  user: 'snuggli',      // Replace with your database username
  password: 'Jpagh&819jvAO1',      // Replace with your database password
  database: 'snuggliApi' // // Replace with your database Name
}); 
 
conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});

module.exports = conn;

 
 