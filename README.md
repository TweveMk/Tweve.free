# TWEVE LIVE TV - Payment System Integration

## Setup Instructions

### 1. Database Setup
1. Create a MySQL database named `tweve_tv`
2. Import the `setup_database.sql` file to create tables
3. Update database credentials in `config.php`

### 2. PHP Configuration
- Ensure PHP 7.4+ is installed
- Enable PDO MySQL extension
- Set proper file permissions for PHP files

### 3. File Structure
```
Tweve.free-main/
├── index.html          # Main frontend
├── styles.css          # Styling
├── script.js           # Frontend JavaScript
├── config.php          # Database configuration
├── process_payment.php # Payment processing API
├── check_package.php   # Package status checking API
├── payment_status.php  # Payment status API
├── setup_database.sql  # Database setup script
└── README.md           # This file
```

### 4. Features
- **User Authentication**: Login with username and phone
- **Package System**: 6 different packages (Kituro to Kigoma)
- **Payment Processing**: M-Pesa, Tigo Pesa, Airtel Money simulation
- **Package Gating**: Movies and 18+ content require active package
- **Real-time Status**: Package status synced with server
- **Persistent Storage**: User data stored in database and localStorage

### 5. Package Details
| Package | Duration | Price (TZS) |
|---------|----------|-------------|
| Kituro | 3 days | 1,000 |
| Serengeti | 7 days | 1,500 |
| Mikumi | 2 weeks | 3,000 |
| Manyara | 1 month | 5,000 |
| Saadan | 6 months | 10,000 |
| Kigoma | 1 year | 20,000 |

### 6. API Endpoints
- `POST process_payment.php` - Process payment and activate package
- `POST check_package.php` - Check user's active package
- `POST payment_status.php` - Get payment transaction status

### 7. Testing
1. Open `index.html` in browser
2. Login with username and phone
3. Try accessing Movies or 18+ (should prompt for payment)
4. Select a package and complete payment flow
5. Verify package activation and access

### 8. Security Notes
- Payment simulation uses 85% success rate
- All user data is validated server-side
- Database uses prepared statements to prevent SQL injection
- CORS headers configured for cross-origin requests

### 9. Troubleshooting
- Check PHP error logs for server issues
- Verify database connection in `config.php`
- Ensure all PHP files have proper permissions
- Check browser console for JavaScript errors
