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
            // Generate a JWT token
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
// Add the verifyToken middleware
function verifyToken(req, res, next) {
  
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  
  jwt.verify(token, 'this_is_my_token', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    
    req.user = decoded;
    next();
  });
}


app.get('/start', verifyToken, (req, res) => {
  res.render('start.ejs',{ user: req.user }); 
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
