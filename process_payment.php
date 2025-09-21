<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['username']) || !isset($input['phone']) || !isset($input['package']) || 
    !isset($input['payment_method']) || !isset($input['phone_number'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$username = trim($input['username']);
$phone = trim($input['phone']);
$package = trim($input['package']);
$payment_method = trim($input['payment_method']);
$phone_number = trim($input['phone_number']);

// Validate package
global $PACKAGE_PRICES, $PACKAGE_DURATIONS;
if (!isset($PACKAGE_PRICES[$package])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid package']);
    exit;
}

$amount = $PACKAGE_PRICES[$package];
$duration = $PACKAGE_DURATIONS[$package];

try {
    $pdo = getDBConnection();
    
    // Find or create user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$phone]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        $stmt = $pdo->prepare("INSERT INTO users (username, phone) VALUES (?, ?)");
        $stmt->execute([$username, $phone]);
        $user_id = $pdo->lastInsertId();
    } else {
        $user_id = $user['id'];
    }
    
    // Generate transaction ID
    $transaction_id = 'TWEVE_' . time() . '_' . rand(1000, 9999);
    
    // Create payment record
    $stmt = $pdo->prepare("INSERT INTO payments (user_id, package_name, amount, phone_number, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->execute([$user_id, $package, $amount, $phone_number, $payment_method, $transaction_id]);
    
    // Simulate payment processing
    $success = (rand(1, 100) / 100) <= PAYMENT_SUCCESS_RATE;
    
    if ($success) {
        // Update payment status to success
        $stmt = $pdo->prepare("UPDATE payments SET status = 'success', processed_at = NOW() WHERE transaction_id = ?");
        $stmt->execute([$transaction_id]);
        
        // Deactivate old packages
        $stmt = $pdo->prepare("UPDATE user_packages SET is_active = FALSE WHERE user_id = ?");
        $stmt->execute([$user_id]);
        
        // Create new package
        $expires_at = date('Y-m-d H:i:s', strtotime("+{$duration} days"));
        $stmt = $pdo->prepare("INSERT INTO user_packages (user_id, package_name, amount_paid, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $package, $amount, $expires_at]);
        
        echo json_encode([
            'success' => true,
            'transaction_id' => $transaction_id,
            'package' => $package,
            'amount' => $amount,
            'expires_at' => $expires_at,
            'message' => 'Payment successful! Package activated.'
        ]);
    } else {
        // Update payment status to failed
        $stmt = $pdo->prepare("UPDATE payments SET status = 'failed', processed_at = NOW() WHERE transaction_id = ?");
        $stmt->execute([$transaction_id]);
        
        echo json_encode([
            'success' => false,
            'transaction_id' => $transaction_id,
            'message' => 'Payment failed. Please try again.'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
