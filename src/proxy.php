<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Fallback for getallheaders
if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } else if ($name == "CONTENT_TYPE") {
                $headers["Content-Type"] = $value;
            } else if ($name == "CONTENT_LENGTH") {
                $headers["Content-Length"] = $value;
            }
        }
        return $headers;
    }
}

$targetBaseUrl = "https://api.americankeysupply.com/V1/";
$path = isset($_GET['path']) ? ltrim($_GET['path'], '/') : '';
$targetUrl = $targetBaseUrl . $path;

// Handle query params
$queryString = $_SERVER['QUERY_STRING'];
$queryString = preg_replace('/(^|&)path=[^&]*/', '', $queryString);
$queryString = ltrim($queryString, '&');

if (!empty($queryString)) {
    $targetUrl .= "?" . $queryString;
}

$ch = curl_init($targetUrl);
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Forward the headers exactly as the Angular frontend sent them
$headers = [];

// Explicitly enforce exact casing for required authentication headers
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers[] = "Authorization: " . $_SERVER['HTTP_AUTHORIZATION'];
}
if (isset($_SERVER['HTTP_TIME'])) {
    $headers[] = "Time: " . $_SERVER['HTTP_TIME'];
}
if (isset($_SERVER['HTTP_KEY'])) {
    $headers[] = "Key: " . $_SERVER['HTTP_KEY'];
}

// The API might block the request if the Origin or Referer come from your sandbox domain.
// We must spoof them to look like they are coming from the API itself, just like your local proxy does.
$headers[] = "Origin: https://api.americankeysupply.com";
$headers[] = "Referer: https://api.americankeysupply.com/";

foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    // Ignore the ones we explicitly handled or cURL automatically manages
    if ($lowerName != "host" && 
        $lowerName != "content-length" && 
        $lowerName != "accept-encoding" &&
        $lowerName != "authorization" &&
        $lowerName != "time" &&
        $lowerName != "key" &&
        $lowerName != "origin" &&
        $lowerName != "referer") {
        $headers[] = "$name: $value";
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward body if needed
if ($method != 'GET' && $method != 'HEAD') {
    $requestBody = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

// ✅ IMPORTANT: auto-decode gzip/deflate
curl_setopt($ch, CURLOPT_ENCODING, "");

// Response settings
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

// SSL (keep for now)
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

// Error handling
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode([
        "proxy_error" => true,
        "message" => "cURL Error: " . curl_error($ch)
    ]);
    exit;
}

// Split headers + body
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

// Status code
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
http_response_code($httpCode);

// Forward response headers (safe ones only)
$headersArray = explode("\r\n", $responseHeaders);
foreach ($headersArray as $header) {
    if (
        !empty($header) &&
        stripos($header, 'Transfer-Encoding:') === false &&
        stripos($header, 'Content-Encoding:') === false &&
        stripos($header, 'Content-Length:') === false &&
        stripos($header, 'Connection:') === false &&
        stripos($header, 'HTTP/') !== 0
    ) {
        header($header);
    }
}

// Output decoded response
echo $responseBody;

curl_close($ch);
?>