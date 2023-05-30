const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

const app = express();


const port = 4444; 

// Configure body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view-engine','ejs')

app.get('/identify', (req, res) => {
  res.render('identify.ejs'); 
});


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'lab4_users',
});


app.post('/identify', (req, res) => {
  const { userId, password } = req.body;

 
  pool.getConnection((err, connection) => {
    if (err) {
      res.status(500).json({ error: 'Database connection error' });
    } else {
      connection.query(
        `SELECT * FROM Users WHERE userID = ? AND password = ?`,
        [userId, password],
        (error, results) => {
          if (error) {
            res.status(500).json({ error: 'Database query error' });
          } else if (results.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
          } else {
            
            const user = results[0];
            const token = jwt.sign({ userId: user.userID, role: user.role }, 'your_secret_key');

            res.json({ token });
          }

          connection.release(); 
        }
      );
    }
  });
});

function verifyToken(req, res, next) {

  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

 
  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    
    req.user = decoded;
    next();
  });
}


/*app.get('/start', verifyToken, (req, res) => {
  res.render('start.ejs',{ user: req.user }); // Pass the decoded user object to the view
});*/


app.get('/start', verifyToken, (req, res) => {
  const { role } = req.user;

  if (role === 'admin') {
    
    const users = [
      { userID: 'id1', name: 'User1', role: 'student', password: 'password' },
      { userID: 'id2', name: 'User2', role: 'student', password: 'password2' },
      { userID: 'id3', name: 'User3', role: 'teacher', password: 'password3' },
      { userID: 'admin', name: 'Admin', role: 'admin', password: 'admin' }
    ];
    return res.render('admin.ejs', {users});
  }
    res.render('start.ejs', { user: req.user });
  
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
