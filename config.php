<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'tweve_tv');
define('DB_USER', 'root');
define('DB_PASS', '');

// Payment configuration
define('PAYMENT_SUCCESS_RATE', 0.85); // 85% success rate for simulation
define('PAYMENT_PROCESSING_TIME', 5); // 5 seconds processing time

// Package prices (in TZS)
$PACKAGE_PRICES = [
    'Kituro' => 1000,
    'Serengeti' => 1500,
    'Mikumi' => 3000,
    'Manyara' => 5000,
    'Saadan' => 10000,
    'Kigoma' => 20000
];

// Package durations (in days)
$PACKAGE_DURATIONS = [
    'Kituro' => 3,
    'Serengeti' => 7,
    'Mikumi' => 14,
    'Manyara' => 30,
    'Saadan' => 180,
    'Kigoma' => 365
];

// Database connection
function getDBConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch(PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
}

// Initialize database tables
function initializeDatabase() {
    $pdo = getDBConnection();
    
    // Create users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Create payments table
    $pdo->exec("CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        package_name VARCHAR(50) NOT NULL,
        amount INT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        status ENUM('pending', 'processing', 'success', 'failed') DEFAULT 'pending',
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");
    
    // Create packages table
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        package_name VARCHAR(50) NOT NULL,
        amount_paid INT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");
}

// Call initialization
initializeDatabase();
?>
