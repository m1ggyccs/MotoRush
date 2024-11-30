const mysql = require('mysql');

// Create a connection to the MySQL server
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

// Connect to the MySQL server
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL server.');

    // Create the database
    const createDbQuery = `CREATE DATABASE IF NOT EXISTS motorush`;
    connection.query(createDbQuery, (err, result) => {
        if (err) {
            console.error('Error creating database:', err.message);
            return;
        }
        console.log('Database "motorush" created or already exists.');
    });

    // Close the connection
    connection.end();
});