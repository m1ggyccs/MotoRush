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

  // SQL query to create the 'customers' table
  const createCustomersTableQuery = `
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(15) NOT NULL,
      customer_address TEXT NOT NULL
    );
  `;

    // SQL query to create the 'products' table
    const createProductsTableQuery = `
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

    // SQL query to create the 'orders' table
    const createOrdersTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      order_date DATETIME NOT NULL,
      order_total DECIMAL(10, 2) NOT NULL,
      order_quantity INT NOT NULL,
      order_status VARCHAR(15) NOT NULL,
      customer_id INT,
      customer_name VARCHAR(255) NOT NULL,
      customer_address TEXT NOT NULL,
      customer_phone VARCHAR(15) NOT NULL,
      product_id INT,
      product_name VARCHAR(255) NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    );
  `;
  // Create 'customers' table
  connection.query(createCustomersTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating "customers" table:', err.stack);
    } else {
      console.log('Table "customers" created successfully or already exists.');
    }
  });

  // Create 'products' table
  connection.query(createProductsTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating "products" table:', err.stack);
    } else {
      console.log('Table "products" created successfully or already exists.');
    }
  });

  // Create 'orders' table
  connection.query(createOrdersTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating "orders" table:', err.stack);
    } else {
      console.log('Table "orders" created successfully or already exists.');
    }

    // Close the connection after all queries are executed
    connection.end((err) => {
      if (err) {
        console.error('Error closing the connection:', err.stack);
      } else {
        console.log('Database connection closed.');
      }
    });
});
    // Close the connection
    connection.end();
});