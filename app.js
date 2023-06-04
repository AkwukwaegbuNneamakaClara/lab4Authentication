const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

const app = express();
const port = 4444; 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view-engine','ejs')

app.get('/identify', (req, res) => {
  res.render('identify.ejs'); 
});

// Create a MySQL connection pool
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
      res.status(500).json({ error: 'Error connecting to database' });
    } else {
      connection.query(
        `SELECT * FROM Users WHERE userID = ? AND password = ?`,
        [userId, password],
        (error, results) => {
          if (error) {
            res.status(500).json({ error: 'Database query error' });
          } else if (results.length === 0) {
            res.status(401).json({ error: 'Invalid user id and password' });
          } else {
          // Generate a JWT token
            const user = results[0];
            const token = jwt.sign({ userId: user.userID, role: user.role }, 'this_is_my_token');
            
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
 
  if (req.path === '/identify') {
    return next();
  }
  if (!token) {
    console.log('No token provided');
   return res.redirect('/identify');
  }
  jwt.verify(token, 'this_is_my_token', (err, decoded) => {
    
    if (err) {
      console.log('Invalid token');
      return res.redirect('/identify'); 
    }
      console.log(decoded);  
    req.user = decoded;
    console.log('Role:', req.user.role);
    next();
  });
}

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
app.get('/student1', verifyToken, (req, res) => {
  
  const { role} = req.user;
  console.log(req.user);
  console.log(role);
  if (role === 'student1'){ 
  return res.render('student1.ejs', {users});
  }else{
    res.status(401).redirect('/identify');
  }
});
app.get('/student2', verifyToken, (req, res) => {
  const { role} = req.user;
  if (role === 'student2'){ 
  return res.render('student2');
  }else{
    res.status(401).redirect('/identify');
  }
});
app.get('/teacher', verifyToken, (req, res) => {
  const { role } = req.user;
  if (role === 'teacher') {
    return res.render('teacher');
  }else{
    res.status(401).redirect('/identify');
  }
});
app.get('/identify', (req, res) => {
  res.render('identify');
});
  
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
