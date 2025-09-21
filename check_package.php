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

if (!isset($input['phone'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Phone number required']);
    exit;
}

$phone = trim($input['phone']);

try {
    $pdo = getDBConnection();
    
    // Find user
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE phone = ?");
    $stmt->execute([$phone]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'has_package' => false,
            'user' => null,
            'package' => null
        ]);
        exit;
    }
    
    // Check for active package
    $stmt = $pdo->prepare("
        SELECT package_name, amount_paid, started_at, expires_at 
        FROM user_packages 
        WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
        ORDER BY expires_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$user['id']]);
    $package = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($package) {
        echo json_encode([
            'has_package' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'phone' => $phone
            ],
            'package' => [
                'name' => $package['package_name'],
                'amount_paid' => $package['amount_paid'],
                'started_at' => $package['started_at'],
                'expires_at' => $package['expires_at']
            ]
        ]);
    } else {
        echo json_encode([
            'has_package' => false,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'phone' => $phone
            ],
            'package' => null
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
