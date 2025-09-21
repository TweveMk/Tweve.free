# TWEVE LIVE TV - Simple Payment System

## Setup Instructions

### 1. Simple Setup (No Database Required)
1. Just open `index.html` in your browser
2. No server setup needed - works with file:// protocol
3. All data stored in browser localStorage and cookies

### 2. File Structure
```
Tweve.free-main/
├── index.html          # Main frontend
├── styles.css          # Styling
├── script.js           # Frontend JavaScript with payment logic
└── README.md           # This file
```

### 3. Features
- **User Authentication**: Login with username and phone (stored locally)
- **Package System**: 6 different packages (Kituro to Kigoma)
- **Payment Processing**: M-Pesa, Tigo Pesa, Airtel Money simulation
- **Package Gating**: Movies and 18+ content require active package
- **Persistent Storage**: User data stored in localStorage and cookies
- **No Server Required**: Works completely offline

### 4. Package Details
| Package | Duration | Price (TZS) |
|---------|----------|-------------|
| Kituro | 3 days | 1,000 |
| Serengeti | 7 days | 1,500 |
| Mikumi | 2 weeks | 3,000 |
| Manyara | 1 month | 5,000 |
| Saadan | 6 months | 10,000 |
| Kigoma | 1 year | 20,000 |

### 5. How It Works
1. User logs in once (stored in localStorage)
2. Accessing Movies/18+ prompts payment modal
3. User selects package and payment method
4. System simulates payment (85% success rate)
5. If successful, package activated and stored locally
6. Package status shown in top bar

### 6. Testing
1. Open `index.html` in browser
2. Login with username and phone
3. Try accessing Movies or 18+ (should prompt for payment)
4. Select a package and complete payment flow
5. Verify package activation and access

### 7. Data Storage
- **localStorage**: User login and package info
- **Cookies**: Package info backup
- **No Database**: Everything stored in browser

### 8. Payment Simulation
- 85% success rate for realistic testing
- Transaction IDs generated for each payment
- Payment method validation required
- Phone number validation required

### 9. Troubleshooting
- Clear browser localStorage to reset all data
- Check browser console for JavaScript errors
- Ensure JavaScript is enabled
- Works on all modern browsers
