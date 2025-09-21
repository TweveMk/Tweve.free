-- TWEVE TV Database Setup
-- Run this SQL script to create the database and tables

CREATE DATABASE IF NOT EXISTS tweve_tv;
USE tweve_tv;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User packages table
CREATE TABLE IF NOT EXISTS user_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    package_name VARCHAR(50) NOT NULL,
    amount_paid INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_user_packages_user ON user_packages(user_id);
CREATE INDEX idx_user_packages_active ON user_packages(is_active, expires_at);

-- Sample data (optional)
INSERT INTO users (username, phone) VALUES 
('admin', '+255123456789'),
('test_user', '+255987654321');

-- Sample packages (optional)
INSERT INTO user_packages (user_id, package_name, amount_paid, expires_at) VALUES 
(1, 'Kigoma', 20000, DATE_ADD(NOW(), INTERVAL 365 DAY)),
(2, 'Manyara', 5000, DATE_ADD(NOW(), INTERVAL 30 DAY));
