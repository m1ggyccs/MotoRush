const mysql = require('mysql');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',  // Your MySQL host (e.g., 'localhost')
  user: 'root',       // Your MySQL username
  password: '',       // Your MySQL password
  database: 'motorush'  // Replace with your database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database with ID ' + connection.threadId);
});

// SQL query to create the orders table with customer details
const createOrdersTableQuery = `
  CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,          
    order_date DATETIME NOT NULL,                     
    order_total DECIMAL(10, 2) NOT NULL,              
    order_quantity INT NOT NULL,                      
    order_status VARCHAR(15) NOT NULL,
    customer_id INT,                                  
    customer_name VARCHAR(255) NOT NULL,              
    customer_address TEXT NOT NULL,                   
    customer_phone VARCHAR(15) NOT NULL,
    product_id INT,                                   -- Foreign key for the product
    product_name VARCHAR(255) NOT NULL,               -- Product name
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
  );
`;


// Execute the query to create the orders table
connection.query(createOrdersTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating orders table: ' + err.stack);
    return;
  }
  console.log('Table "orders" created successfully');
});

// Close the connection
connection.end();
