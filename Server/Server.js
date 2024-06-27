const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL database connection setup
const db = mysql.createConnection({
  host: 'localhost', // e.g., 'localhost'
  user: 'root',
  password: '09March2003!',
  port:3306,
  database: 'agritech'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the MySQL database.');
  
  // Create table if it does not exist
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS hardwares (
     id INT AUTO_INCREMENT PRIMARY KEY,
     lat FLOAT(2,8),
     lng FLOAT(2,8),
     Moisture INT,
     N VARCHAR(255),
     P VARCHAR(255),
     K VARCHAR(255),
     Temperature INT,
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating table:', err.message);
      return;
    }
    console.log('Sensor data table created or already exists.');
  });
});

// Endpoint to get data from Arduino
app.get('/hardware', async (req, res) => {
  try {
    const response = await axios.get('http://192.168.57.123/');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching data from Arduino:', error);
    res.status(500).send('Error fetching data');
  }
});

//  This link gets the table from the SQL Server 
app.get('/map', async (req, res) => {
  try {

    db.query('select * from hardwares', function (err, result, fields) {
      if (err) throw err;
      // console.log(result);
      res.send(result);
    })
    
  } catch (error) {
    console.error('Error fetching data from Arduino:', error);
    res.status(500).send('Error fetching data');
  }
});

// Endpoint to store data from Arduino - OM
app.post('/update', (req, res) => {
  console.log(req.body)
  const {lat,lngMoisture,N,P,K,Temperature}  = req.body 
  
    // console.log(typeof(Moisture))
    console.log(Moisture,' ',N,' ',P,' ',K,' ',Temperature)
    
// *--------------------------
  // if (npk == null || temperature == null || moisture == null) {
  //   console.log("There was connection but data is missing")
  //   return res.status(400).send('Missing data');
  // }

  // Insert data into the database
  const insertQuery = 'INSERT INTO hardwares (lat,lng,Moisture, N, P, K, Temperature) VALUES (?,?,?, ?, ?, ?, ?)';
  db.query(insertQuery, [Moisture,N,P,K,Temperature], (err, result) => {
    if (err) {
      console.error('Error inserting data into database:', err.message);
      return res.status(500).send('Error inserting data');
    }
    res.send('Data inserted successfully');
  });
 // ---------------------------------
});

// // // Socket.IO connection for sending data to the ML server
// io.on('connection', (socket) => {
//   console.log('New client connected');

//   socket.on('sendData', async (data) => {
//     try {
//       const response = await fetch('http://localhost:3020/map');
//       const data = await response.text();
//       // const response = await axios.post('http://192.168.29.87:3012', { data: JSON.parse(data) });
//       // socket.emit('response', response.data);
//       socket.emit('response', data);
//     } catch (error) {
//       console.error('Error sending data to ML server:', error);
//       socket.emit('response', 'Error sending data');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

const PORT = process.env.PORT || 3020;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
