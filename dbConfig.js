// const Pool = require("pg").Pool;
// const pool = new Pool({
//     user:'snuggli_user', // default postgres
//     host:'dpg-cg4i8bceoogtrlsp473g-a',
//     database:'snuggli', // `my_todos_db`
//     password:'Q19VrMvzoNkFGrmn3DESADt1OWVFyjYT', //added during PostgreSQL and pgAdmin installation
//     port:'5432' //default port
// });

var mysql = require('mysql');
var conn = mysql.createConnection({
  host: '173.231.198.58', // Replace with your host name
  user: 'inappshub_go',      // Replace with your database username
  password: 'CxVMW4DNHJMV',      // Replace with your database password
  database: 'inappshub_snuggli' // // Replace with your database Name
}); 
 
conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});

module.exports = conn;

 
 