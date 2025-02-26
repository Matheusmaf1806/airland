<?php
header('Content-Type: application/json');

// Se preferir, use file_get_contents("php://input") e json_decode:
$inputJSON = file_get_contents('php://input');
$params = json_decode($inputJSON, true);

if (!$params) {
    echo json_encode(["error" => "Parâmetros inválidos."]);
    exit;
}

// Pegando parâmetros
$checkIn  = $params['checkIn']  ?? '2025-03-01';
$checkOut = $params['checkOut'] ?? '2025-03-02';
$adults   = (int)($params['adults']   ?? 1);
$children = (int)($params['children'] ?? 0);
$rooms    = (int)($params['rooms']    ?? 1);
$age      = (int)($params['age']      ?? 30);

// Exemplo de IDs fixos ou você pode receber do front
$hotelIDs = [234673, 897496, 89413, 13204, 52174, 989016];

// -------------- CREDENCIAIS / CONFIG --------------
// Em produção, mova para config.php ou .env
$API_KEY = "8c616e07073643d36f99afb65d584d98";
$SECRET  = "d014aa1283";
$endpoint = "https://api.test.hotelbeds.com/hotel-api/1.0/hotels"; // Exemplo

// Monta timestamp e X-Signature
$timestamp = time(); // em segundos
$stringToHash = $API_KEY . $SECRET . $timestamp;
$signatureHex = hash('sha256', $stringToHash); // sha256 em hex

// Montar body JSON p/ Hotelbeds
$body = [
    "stay" => [
        "checkIn" => $checkIn,
        "checkOut" => $checkOut,
        "allowOnlyShift" => true
    ],
    "occupancies" => [
        [
            "adults" => $adults,
            "children" => $children,
            "rooms" => $rooms,
            "paxes" => [
                [
                    "type" => "AD",
                    "age" => $age
                ]
                // Se houvesse mais adultos/criancas, repetiria
            ]
        ]
    ],
    "hotels" => [
        "hotel" => $hotelIDs,
        "included" => "true",
        "type" => "HOTELBEDS"
    ],
    "platform" => 80,
    "language" => "ENG"
];

// Faz cURL
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Api-Key: $API_KEY",
    "X-Signature: $signatureHex",
    "Accept: application/json",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode != 200) {
    // Se não for 200, retorne erro
    echo json_encode([
        "error" => "Erro ao chamar Hotelbeds",
        "httpCode" => $httpCode,
        "response" => $response
    ]);
    exit;
}

// Decodificar JSON da Hotelbeds
$dataFromHotelbeds = json_decode($response, true);

// Exemplo: extrair lista de hotéis
$hotels = [];
if (isset($dataFromHotelbeds['hotels']['hotels'])) {
    $hotelList = $dataFromHotelbeds['hotels']['hotels'];
    foreach ($hotelList as $h) {
        $hotelName = $h['name'] ?? 'Sem nome';
        $price     = 0;
        // Exemplo: Hotelbeds retorna net ou algo no 'price'
        if (isset($h['price']['amount'])) {
            $price = floatval($h['price']['amount']);
        }

        // -------------- CALCULAR MARGEM --------------
        // Exemplo:
        $operatorMargin = 0.10; // 10% 
        $agencyMargin   = 0.05; // 5%
        $priceOperator = $price + ($price * $operatorMargin);
        $finalPrice = $priceOperator + ($priceOperator * $agencyMargin);

        $hotels[] = [
            "name" => $hotelName,
            "originalPrice" => $price,
            "finalPrice" => $finalPrice
        ];
    }
}

// Retornar JSON final p/ front-end
echo json_encode($hotels);
