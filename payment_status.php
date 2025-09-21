<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['transaction_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Transaction ID required']);
    exit;
}

$transaction_id = trim($input['transaction_id']);

try {
    $pdo = getDBConnection();
    
    // Get payment status
    $stmt = $pdo->prepare("
        SELECT p.*, u.username, u.phone 
        FROM payments p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.transaction_id = ?
    ");
    $stmt->execute([$transaction_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$payment) {
        http_response_code(404);
        echo json_encode(['error' => 'Transaction not found']);
        exit;
    }
    
    echo json_encode([
        'transaction_id' => $payment['transaction_id'],
        'status' => $payment['status'],
        'package_name' => $payment['package_name'],
        'amount' => $payment['amount'],
        'payment_method' => $payment['payment_method'],
        'phone_number' => $payment['phone_number'],
        'created_at' => $payment['created_at'],
        'processed_at' => $payment['processed_at'],
        'user' => [
            'username' => $payment['username'],
            'phone' => $payment['phone']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
