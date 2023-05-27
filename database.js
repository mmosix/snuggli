const mysql = require('mysql');
const connectServer = {
    connectionLimit: 10,
    password: 'Jpagh&819jvAO1',
    user: 'snuggli',
    database: 'snuggliApi',
    host: '34.173.110.19',
    port: 3306
};
const connectLocal = {
    connectionLimit: 10,
    password: '',
    user: 'root',
    database: 'snuggli',
    host: 'localhost',
    port: 3307
};

// Remote server connection
   const pool = mysql.createPool(connectServer);
   const db = mysql.createConnection(connectServer); 

  db.connect(function(err) {
    if (err) throw err;
    console.log('Database is connected successfully !');
  });
       
       
   let conn = {};
    
   // ***Requests to the User table ***
    
   conn.allUser = () =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT * FROM users ', (error, users)=>{
               if(error){
                   return reject(error);
               }
               return resolve(users);
           });
       });
   };
     
   // ***Get single user data by Email ***
       
   conn.getUserByEmail = (email) =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT U.id, U.name, U.email, U.username, S.school_name FROM users U LEFT OUTER JOIN schools S ON U.school_id = S.school_id WHERE U.email = ?', [email], (error, users)=>{
               if(error){
                   return reject(error);
               }
               return resolve(users[0]);
                
           });
       });
   };
     
   // ***Get single user data by Email ***
       
   conn.getPassByEmail = (email) =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT id, password FROM users WHERE email = ?', [email], (error, users)=>{
               if(error){
                   return reject(error);
               }
               return resolve(users[0]);
                
           });
       });
   };
     
   // ***Get single user data by ID ***
       
   conn.getUserByID = (id) =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT U.id, U.name, U.email, U.username, S.school_name FROM users U LEFT OUTER JOIN schools S ON U.school_id = S.school_id WHERE U.id=?', [id], (error, result)=>{
               if(error){
                   return reject(error);
               }
               return resolve(result[0]);
                
           });
       });
   };
     
   // ***Create New User data ***
       
   conn.insertUser = (name, email, password, school_id, username) =>{
       return new Promise((resolve, reject)=>{
           pool.query('INSERT INTO users (name, email, password, school_id, username) VALUES (?,  ?, ?, ?, ?)', [name, email, password, school_id, username], (error, result)=>{
               if(error){
                   return reject(error);
               }
                
                 return resolve(result.insertId);
           });
       });
   };
     
   // ***Update User Data ***
       
   conn.updateUser = (name, school_id, email, password, id) =>{
       return new Promise((resolve, reject)=>{
           pool.query('UPDATE users SET name = ?, school_id= ?, email= ?, password=? WHERE id = ?', [name, school_id, email, password, id], (error)=>{
               if(error){
                   return reject(error);
               }
                
                 return resolve();
           });
       });
   };
    
   // ***Update user last login dateTime ***
        
   conn.updateLastLogin = (id) =>{
    return new Promise((resolve, reject)=>{
        pool.query('UPDATE users SET last_login = now() WHERE id = ?', [id], (error)=>{
            if(error){
                return reject(error);
            }
             
              return resolve();
        });
    });
};
     
   // ***Update user password ***
    
   conn.updateUserPassword = ( password, id) =>{
     return new Promise((resolve, reject)=>{
         pool.query('UPDATE users SET  password=? WHERE id = ?', [ password, id], (error)=>{
             if(error){
                 return reject(error);
             }
              
               return resolve();
         });
     });
 };
     
   // ***Delete single user ***
       
   conn.deleteUser = (id) =>{
       return new Promise((resolve, reject)=>{
           pool.query('DELETE FROM users WHERE id = ?', [id], (error)=>{
               if(error){
                   return reject(error);
               }
               return resolve(console.log("User deleted"));
           });
       });
   };
    
    
  // ***Requests to the  resetPasswordToken table ***
  
  conn.expireOldTokens = (email, used) =>{
     return new Promise((resolve, reject)=>{
         pool.query('UPDATE ResetPasswordToken SET used = ?  WHERE email = ?', [ used, email], (error)=>{
             if(error){
                 return reject(error);
             }
              
               return resolve();
         });
     });
 };
  
  
   conn.insertResetToken = (email,tokenValue, createdAt, expiredAt, used) =>{
     return new Promise((resolve, reject)=>{
         pool.query('INSERT INTO ResetPasswordToken ( email, Token_value,created_at, expired_at, used) VALUES (?, ?,?, ?, ?)', [email,tokenValue, createdAt, expiredAt, used], (error, result)=>{
             if(error){
                 return reject(error);
             }
              
               return resolve(result.insertId);
         });
     });
 };
  
   conn.findValidToken = (token, email, currentTime) =>{
     return new Promise((resolve, reject)=>{
         pool.query('SELECT * FROM ResetPasswordToken WHERE (email = ? AND Token_value = ? AND expired_at > ?)', [email,token,  currentTime  ], (error, tokens)=>{
             if(error){
                 return reject(error);
             }
             return resolve(tokens[0]);
              
         });
     });
 };
      

   module.exports = { conn, db };