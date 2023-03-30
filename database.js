const mysql = require('mysql');
   
   const pool = mysql.createPool({
       connectionLimit: 10,
       password: 'Jpagh&819jvAO1',
       user: 'snuggli',
       database: 'snuggliApi',
       host: '34.173.110.19',
       port: 3306

   });
       
       
   let db = {};
    
   // ***Requests to the User table ***
    
   db.allUser = () =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT * FROM User ', (error, users)=>{
               if(error){
                   return reject(error);
               }
               return resolve(users);
           });
       });
   };
     
   // ***Get single user data by Email ***
       
   db.getUserByEmail = (email) =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT id, name, email, password FROM users WHERE email = ?', [email], (error, users)=>{
               if(error){
                   return reject(error);
               }
               return resolve(users[0]);
                
           });
       });
   };
     
   // ***Get single user data by ID ***
       
   db.getUserByID = (id) =>{
       return new Promise((resolve, reject)=>{
           pool.query('SELECT id, name, email FROM users where id=?', [id], (error, result)=>{
               if(error){
                   return reject(error);
               }
               return resolve(result[0]);
                
           });
       });
   };
     
   // ***Create New User data ***
       
   db.insertUser = (name, email, password) =>{
       return new Promise((resolve, reject)=>{
           pool.query('INSERT INTO users (name, email, password) VALUES (?,  ?, ?)', [name, email, password], (error, result)=>{
               if(error){
                   return reject(error);
               }
                
                 return resolve(result.insertId);
           });
       });
   };
     
   // ***Update User Data ***
       
   db.updateUser = (userName, role, email, password, id) =>{
       return new Promise((resolve, reject)=>{
           pool.query('UPDATE User SET user_name = ?, role= ?, email= ?, password=? WHERE id = ?', [userName, role, email, password, id], (error)=>{
               if(error){
                   return reject(error);
               }
                
                 return resolve();
           });
       });
   };
    
   // ***Update user last login dateTime ***
        
   db.updateLastLogin = (id) =>{
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
    
   db.updateUserPassword = ( password, id) =>{
     return new Promise((resolve, reject)=>{
         pool.query('UPDATE User SET  password=? WHERE id = ?', [ password, id], (error)=>{
             if(error){
                 return reject(error);
             }
              
               return resolve();
         });
     });
 };
     
   // ***Delete single user ***
       
   db.deleteUser = (id) =>{
       return new Promise((resolve, reject)=>{
           pool.query('DELETE FROM User WHERE id = ?', [id], (error)=>{
               if(error){
                   return reject(error);
               }
               return resolve(console.log("User deleted"));
           });
       });
   };
    
    
    
       
  
  
  // ***Requests to the  resetPasswordToken table ***
  
  db.expireOldTokens = (email, used) =>{
     return new Promise((resolve, reject)=>{
         pool.query('UPDATE ResetPasswordToken SET used = ?  WHERE email = ?', [ used, email], (error)=>{
             if(error){
                 return reject(error);
             }
              
               return resolve();
         });
     });
 };
  
  
   db.insertResetToken = (email,tokenValue, createdAt, expiredAt, used) =>{
     return new Promise((resolve, reject)=>{
         pool.query('INSERT INTO ResetPasswordToken ( email, Token_value,created_at, expired_at, used) VALUES (?, ?,?, ?, ?)', [email,tokenValue, createdAt, expiredAt, used], (error, result)=>{
             if(error){
                 return reject(error);
             }
              
               return resolve(result.insertId);
         });
     });
 };
  
   db.findValidToken = (token, email, currentTime) =>{
     return new Promise((resolve, reject)=>{
         pool.query('SELECT * FROM ResetPasswordToken WHERE (email = ? AND Token_value = ? AND expired_at > ?)', [email,token,  currentTime  ], (error, tokens)=>{
             if(error){
                 return reject(error);
             }
             return resolve(tokens[0]);
              
         });
     });
 };
      
   module.exports = db