const mysql = require('mysql');

// Database connection configurations for the server
const connectServer = {
    connectionLimit: 10,
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 3306
};

// Database connection configurations for the local environment
const connectLocal = {
    connectionLimit: 10,
    password: '',
    user: 'root',
    database: 'snuggli',
    host: 'localhost',
    port: 3307
};

// Remote server connection pool creation
const pool = mysql.createPool(connectServer);

// Database connection creation for the server
const db = mysql.createConnection(connectServer);

// Connect to the database
db.connect(function(err) {
    if (err) throw err;
    console.log('Database is connected successfully !');
});

// Object to store various database-related functions
let conn = {};

// Requests to the User table

// Retrieve all users from the 'users' table
conn.allUser = () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM users', (error, users) => {
            if (error) {
                return reject(error);
            }
            return resolve(users);
        });
    });
};

// Get a single user's data by their email address
conn.getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT U.id, U.name, U.email, U.username, S.school_name FROM users U LEFT OUTER JOIN schools S ON U.school_id = S.school_id WHERE U.email = ?', [email], (error, users) => {
            if (error) {
                return reject(error);
            }
            return resolve(users[0]);
        });
    });
};

// Get a single user's password by their email address
conn.getPassByEmail = (email) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id, password FROM users WHERE email = ?', [email], (error, users) => {
            if (error) {
                return reject(error);
            }
            return resolve(users[0]);
        });
    });
};

// Get a single user's data by their ID
conn.getUserByID = (id) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT U.id, U.name, U.email, U.username, U.mood, S.school_name FROM users U LEFT OUTER JOIN schools S ON U.school_id = S.school_id WHERE U.id=?', [id], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result[0]);
        });
    });
};

// Create a new user's data
conn.insertUser = (name, email, password, school_id, username) => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO users (name, email, password, school_id, username) VALUES (?,  ?, ?, ?, ?)', [name, email, password, school_id, username], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result.insertId);
        });
    });
};

// Update user data
conn.updateUser = (name, school_id, email, password, id) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE users SET name = ?, school_id= ?, email= ?, password=? WHERE id = ?', [name, school_id, email, password, id], (error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

// Update user's last login date and time
conn.updateLastLogin = (id) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE users SET last_login = now() WHERE id = ?', [id], (error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

// Update user password
conn.updateUserPassword = (password, id) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE users SET  password=? WHERE id = ?', [password, id], (error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

// Delete a single user
conn.deleteUser = (id) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM users WHERE id = ?', [id], (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(console.log("User deleted"));
        });
    });
};

// Requests to the resetPasswordToken table

// Expire old tokens by setting the 'used' flag
conn.expireOldTokens = (email, used) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE ResetPasswordToken SET used = ?  WHERE email = ?', [used, email], (error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

// Insert a new reset token into the ResetPasswordToken table
conn.insertResetToken = (email, tokenValue, createdAt, expiredAt, used) => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO ResetPasswordToken ( email, Token_value,created_at, expired_at, used) VALUES (?, ?,?, ?, ?)', [email, tokenValue, createdAt, expiredAt, used], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result.insertId);
        });
    });
};

// Find a valid token by token value, email, and current time
conn.findValidToken = (token, email, currentTime) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM ResetPasswordToken WHERE (email = ? AND Token_value = ? AND expired_at > ?)', [email, token, currentTime], (error, tokens) => {
            if (error) {
                return reject(error);
            }
            return resolve(tokens[0]);
        });
    });
};

// Search data across multiple tables
conn.searchData = (search_term, userId) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT 'user' AS type, 
        NULL AS content, 
        NULL AS num_likes, 
        s.school_name AS name, 
        NULL AS followers, 
        NULL AS i_follow, 
        u.username, 
        u.profile_photo,
        NULL AS user_has_liked,
        NULL AS num_comments, 
        NULL AS post_image, 
        NULL AS date_added, 
        u.id 
        FROM users u LEFT JOIN schools s ON u.school_id = s.school_id WHERE u.username LIKE ? GROUP BY u.id
        UNION 
        SELECT 'community' AS type, 
        C.about AS content, 
        NULL AS num_likes, 
        C.name, 
        COUNT(CF.user_id) 
        AS followers, 
        MAX(CF.user_id = ?) as i_follow, 
        NULL AS username, 
        NULL AS profile_photo,
        NULL AS user_has_liked,
        NULL AS num_comments, 
        NULL AS post_image, 
        NULL AS date_added, 
        C.id
        FROM community C LEFT JOIN follow_community CF ON CF.community_id = C.id WHERE C.name LIKE ? GROUP BY C.id 
        UNION 
        SELECT 'post' AS type, 
        p.content, 
        COUNT(pl.id) AS num_likes, 
        NULL AS name, 
        NULL AS followers, 
        NULL AS i_follow, 
        u.username, 
        u.profile_photo,
        MAX(CASE WHEN pl.user_id = ? THEN 1 ELSE 0 END) AS user_has_liked,
        COUNT(DISTINCT c.id) AS num_comments, 
        p.image_url AS post_image, 
        p.date_added, 
        p.id
        FROM posts p INNER JOIN users u ON p.user_id = u.id 
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN comments c ON p.id = c.post_id WHERE p.content LIKE ? AND  p.is_public = 1 GROUP BY p.id, p.content, p.image_url, p.user_id, u.username, u.profile_photo, p.date_added;
        `;
        pool.query(query, [search_term, userId, search_term, userId, search_term], (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
};

// Export the 'conn' object and 'db' for use in other parts of your application
module.exports = { conn, db };
