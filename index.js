var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
const multer = require("multer");
var path = require('path');
const port = 3000;
var session = require('express-session');

// Variables
var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret:"secret"}));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));

// Functions
// Connection to MySQL
var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "motorush"
});

db.connect(function(err) {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images/"); // Directory to save images
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the exact name of the uploaded file
    },
  });
  const upload = multer({ storage: storage });

// Check if the Product is in the Cart
function isProductInCart(cart, id){
    for(let i = 0; i < cart.length; i++){
        if(cart[i].id == id){
            return true;
        }
    }
    return false;
};

// Middleware to capture the attempted URL before redirecting to login
app.use((req, res, next) => {
    if (!req.session.loggedIn && req.originalUrl !== '/login' && !req.originalUrl.startsWith('/public')) {
        req.session.returnTo = req.originalUrl; // Store the attempted URL
    }
    next();
});

// Calculate Function
function calculateTotal(cart, req) {
    let total = 0;
    cart.forEach(item => {
        const price = item.product_saleprice || item.product_price;
        total += price * item.product_quantity;
    });
    req.session.total = total; // Store total in session
    return total;
}

function ensureAuthenticated(req, res, next) {
    if (req.session.loggedIn) {
        return next(); // Proceed to the next route handler if logged in
    } else {
        res.redirect('/login'); // Redirect to login if not logged in
    }
}

// User Routes
// Home Route 
app.get('/', function(req, res) {
    // SQL query to fetch products
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Database error');
        return;
      }
      // Render the products.ejs template and pass the results to it
      res.render('pages/index', { products: results });
    });
});

// About Route
app.get('/about', function(req, res) {
    res.render('pages/about');
});

// Brand Route
app.get('/shop', function(req, res) {
        // SQL query to fetch products
        const query = 'SELECT * FROM products';
        db.query(query, (err, results) => {
          if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
          }
          // Render the products.ejs template and pass the results to it
          res.render('pages/shop', { products: results });
        });
});

// Contact Route
app.get('/contact', function(req, res) {
    res.render('pages/contact');
});

// Admin Auth Route
app.get('/login', function(req, res) {
    res.render('pages/login', { error: null });
});

app.post('/login', function(req, res) {
    const { username, password } = req.body;

    // Validate the user credentials (this is just an example, adapt it to your needs)
    if (username === 'admin' && password === '123') {
        req.session.loggedIn = true; // Set loggedIn session to true
        res.redirect('/productlist');
    } else {
        res.render('pages/login', { error: 'Invalid credentials' }); // Show error if login fails
    }
});

// User's Add-To-Cart Controller
app.post('/add-to-cart', function(req, res){ 

    var id = req.body.id;
    var name = req.body.name;
    var price = parseFloat(req.body.price) || 0;
    var saleprice = parseFloat(req.body.saleprice) || 0;
    var quantity = parseInt(req.body.quantity) || 1;
    var image = req.body.image;

    // Product object to add or update
    var product = {
        product_id: id,
        product_name: name,
        product_price: price,
        product_saleprice: saleprice,
        product_quantity: quantity,
        product_image: image
    };

    // Initialize the cart if it doesn't exist
    if (!req.session.cart) {
        req.session.cart = [];
    }

    var cart = req.session.cart;
    var existingProductIndex = cart.findIndex(item => item.product_id === id);

    if (existingProductIndex >= 0) {
        // Product exists in the cart: update the quantity
        cart[existingProductIndex].product_quantity += quantity;
    } else {
        // Product does not exist in the cart: add it
        cart.push(product);
    }

    // Recalculate Total Amount
    calculateTotal(cart, req);

    // Return to Cart Page
    res.redirect('/cart');
});

// Cart of the User Route
app.get('/cart', function(req, res){
    var cart = req.session.cart || [];  // If cart doesn't exist, use an empty array
    var total = req.session.total || 0; // If total doesn't exist, use 0 as a default

    res.render('pages/cart', {cart: cart, total: total});
});

// Route to update the cart item quantity
app.post('/update-cart', function(req, res) {
    const { product_id, quantity } = req.body;

    console.log('Received request to update cart:', product_id, quantity);

    const newQuantity = parseInt(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
        return res.status(400).send({ success: false, message: 'Invalid quantity' });
    }

    // Log the current cart to check if the product is present
    const cart = req.session.cart || [];
    console.log('Current Cart:', cart);

    const product = cart.find(item => parseInt(item.product_id) === parseInt(product_id));

    if (product) {
        console.log('Product found, updating quantity...');
        product.product_quantity = newQuantity;

        // Recalculate total
        calculateTotal(cart, req);

        // Save the updated cart back to the session
        req.session.cart = cart;

        res.send({ success: true });
    } else {
        console.log('Product not found in cart');
        res.status(404).send({ success: false, message: 'Product not found in cart' });
    }
});


// User's Checkout Controller
app.post('/place-order', function(req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;
    var cost = req.session.total;
    var status = "Not Paid";
    var date = new Date();
    var cart = req.session.cart;
    
    // Calculate the total quantity of items in the cart
    var totalQuantity = cart.reduce((acc, item) => acc + item.product_quantity, 0);

    if (!cart || cart.length === 0) {
        return res.status(400).send("Cart is empty. Please add items to the cart before checking out.");
    }

    // Step 1: Check if customer already exists in the 'customers' table
    db.query("SELECT * FROM customers WHERE customer_email = ?", [email], (err, result) => {
        if (err) {
            console.error("Error checking customer:", err);
            return res.status(500).send("Error checking customer.");
        }

        var customerId;
        if (result.length > 0) {
            // Customer exists, update their details
            customerId = result[0].customer_id;
            db.query("UPDATE customers SET customer_name = ?, customer_phone = ?, customer_address = ? WHERE customer_id = ?", [name, phone, address, customerId], (err, result) => {
                if (err) {
                    console.error("Error updating customer:", err);
                    return res.status(500).send("Error updating customer.");
                }
                placeOrder(customerId);
            });
        } else {
            // Customer does not exist, insert into the 'customers' table
            db.query("INSERT INTO customers (customer_name, customer_email, customer_phone, customer_address) VALUES (?, ?, ?, ?)", [name, email, phone, address], (err, result) => {
                if (err) {
                    console.error("Error inserting customer:", err);
                    return res.status(500).send("Error inserting customer.");
                }
                customerId = result.insertId;
                placeOrder(customerId);
            });
        }

        function placeOrder(customerId) {
            // Step 2: Insert order details into the 'orders' table with the customer_id and totalQuantity
            let productNames = cart.map(item => item.product_name).join(", ");
            let productIds = cart.map(item => item.product_id).join(", ");
            
            db.query(
                `INSERT INTO orders 
                 (order_total, order_quantity, customer_id, customer_name, customer_address, customer_phone, order_date, order_status, product_name, product_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [cost, totalQuantity, customerId, name, address, phone, date, status, productNames, productIds],
                (err, result) => {
                    if (err) {
                        console.error("Error inserting order:", err);
                        return res.status(500).send("Error placing order.");
                    }

                    const orderId = result.insertId; // Retrieve the ID of the newly inserted order

                    // Step 4: Update product quantities in the 'products' table
                    let updateErrors = [];
                    cart.forEach(item => {
                        db.query(
                            "UPDATE products SET product_quantity = product_quantity - ? WHERE product_id = ?",
                            [item.product_quantity, item.product_id],
                            (err, result) => {
                                if (err) {
                                    console.error(`Error updating product ID ${item.product_id}:`, err);
                                    updateErrors.push(item.product_id);
                                }
                            }
                        );
                    });

                    if (updateErrors.length > 0) {
                        console.error("Some products were not updated in the inventory:", updateErrors);
                    }

                    // Redirect to the payment page (or render a confirmation page)
                    res.redirect('/payment');
                }
            );
        }
    });
});

// User's checkout Route
app.get('/checkout', function(req,res){

  var cart = req.session.cart;
  var total = req.session.total;

  res.render('pages/checkout',{cart:cart, total:total});

});

// User's Confirme
app.get('/payment', function(req, res) {
  var cart = req.session.cart;
  var total = req.session.total;

  res.render('pages/payment');
});



// End User Routes

// Admin Routes
// Add Product Routes 
app.get("/product", ensureAuthenticated, (req, res) => {
    if (!req.session.loggedIn) {
        // Store the current URL so we can redirect the user back after login
        req.session.returnTo = req.originalUrl;
        res.redirect('/login');
    } else {
        res.render('admin/product'); // The page the user originally wanted to access
    }
  });
// Controllers
  
  // Route to handle adding product
  app.post("/product", upload.single("product_image"), (req, res) => {
    const {
      product_name,
      product_description,
      product_price,
      product_saleprice,
      product_quantity,
      product_category,
      product_type,
    } = req.body;
  
    const product_image = req.file ? req.file.filename : null;
  
    // Validate input
    if (!product_name || !product_description || !product_price || !product_quantity || !product_image) {
      return res.status(400).send("All required fields must be filled.");
    }
  
    // Insert product into the database
    const sql = `
      INSERT INTO products 
      (product_name, product_description, product_price, product_saleprice, product_quantity, product_image, product_category, product_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      product_name,
      product_description,
      product_price,
      product_saleprice || null,
      product_quantity,
      product_image,
      product_category || null,
      product_type || null,
    ];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting data:", err.message);
        return res.status(500).send("Error adding product to the database.");
      }
      res.send("Product added successfully!");
    });
  });



// Admin Routes and Controller to display products
app.get('/productlist', ensureAuthenticated, (req, res) => {
    // SQL query to fetch products
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Database error');
        return;
      }
  
      // Render the products.ejs template and pass the results to it
      res.render('admin/productlist', { products: results });
    });
  });

// Route to show the product edit form with ID
app.get('/editproduct/:id', ensureAuthenticated, (req, res) => {
    const productId = req.params.id; // Get the product ID from the URL

    // SQL query to get the product details by ID
    const query = 'SELECT * FROM products WHERE product_id = ?';
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(404).send('Product not found');
        }

        // Pass product data to the EJS template
        res.render('admin/editproduct', { product: results[0] });
    });
});

// Route to handle product updates
app.post('/updateproduct/:id', ensureAuthenticated, (req, res) => {
    const productId = req.params.id;
    const { product_name, product_description, product_price, product_quantity, product_category, product_type } = req.body;

    // SQL query to update the product
    const query = 'UPDATE products SET product_name = ?, product_description = ?, product_price = ?, product_quantity = ?, product_category = ?, product_type = ? WHERE product_id = ?';
    db.query(query, [product_name, product_description, product_price, product_quantity, product_category, product_type, productId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // Redirect to the edit page after update
        res.redirect(`/productlist`);
    });
});

// Order List Route
app.get('/orderlist', ensureAuthenticated, (req, res) => {
    const query = `
        SELECT 
            orders.order_id, 
            orders.order_date, 
            orders.order_total, 
            orders.order_status, 
            customers.customer_name, 
            customers.customer_address,
            orders.product_name,  -- Assuming product_name is stored in orders
            orders.order_quantity  -- Assuming order_quantity is stored in orders
        FROM orders 
        JOIN customers ON orders.customer_id = customers.customer_id
        ORDER BY orders.order_id ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }


        // Render the orderlist.ejs page with the fetched data
        res.render('admin/orderlist', { orders: results });
    });
});

// Route to render the edit order form
app.get('/editorder/:id', ensureAuthenticated, (req, res) => {
    const orderId = req.params.id;

    const query = `
        SELECT 
            orders.*, 
            customers.customer_name 
        FROM orders 
        JOIN customers ON orders.customer_id = customers.customer_id
        WHERE orders.order_id = ?
    `;

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(404).send('Order not found');
        }

        // Render the edit order page with order details
        res.render('admin/editorder', { order: results[0] });
    });
});


// Route to handle order updates
app.post('/updateorder/:id', ensureAuthenticated, (req, res) => {
    const orderId = req.params.id;
    const { order_date, customer_name, total_cost, product_name, order_quantity, customer_address, status } = req.body;

    const query = `
        UPDATE orders 
        SET 
            order_date = ?, 
            customer_name = ?, 
            order_total = ?, 
            product_name = ?, 
            order_quantity = ?, 
            customer_address = ?, 
            \`order_status\` = ?
        WHERE order_id = ?
    `;

    db.query(query, [order_date, customer_name, total_cost, product_name, order_quantity, customer_address, status, orderId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        res.redirect('/orderlist'); // Redirect after successful update
    });
});

// Route to delete an order
app.post('/deleteorder/:id', ensureAuthenticated, (req, res) => {
    const orderId = req.params.id;

    // SQL query to delete an order
    const query = 'DELETE FROM orders WHERE order_id = ?';
    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        res.redirect('/orderlist');
    });
});
