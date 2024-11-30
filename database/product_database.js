const mysql = require('mysql');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'motorush' 
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');

    // SQL query to create the 'products' table
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            product_name VARCHAR(255) NOT NULL,
            product_description TEXT NOT NULL,
            product_price FLOAT(8,2) NOT NULL,
            product_saleprice FLOAT(8,2),
            product_quantity INT NOT NULL,
            product_image TEXT NOT NULL,
            product_category VARCHAR(255),
            product_type VARCHAR(255)
        );
    `;

    // Execute the query to create the table
    db.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating the table:', err);
        } else {
            console.log('Table "products" created successfully or already exists.');
        }

        // Close the database connection
        db.end((err) => {
            if (err) {
                console.error('Error closing the connection:', err);
            } else {
                console.log('Database connection closed.');
            }
        });
    });
});
