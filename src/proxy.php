<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

/**
 * ✅ Safe getallheaders (rebuild headers from $_SERVER)
 */
if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $key = str_replace('_', '-', substr($name, 5));
                $headers[$key] = $value;
            } elseif ($name == "CONTENT_TYPE") {
                $headers["Content-Type"] = $value;
            } elseif ($name == "CONTENT_LENGTH") {
                $headers["Content-Length"] = $value;
            }
        }
        return $headers;
    }
}

/**
 * 🎯 Target API
 */
$targetBaseUrl = "https://api.americankeysupply.com/V1/";
$path = isset($_GET['path']) ? ltrim($_GET['path'], '/') : '';
$targetUrl = $targetBaseUrl . $path;

/**
 * 🔗 Query params
 */
$queryString = $_SERVER['QUERY_STRING'] ?? '';
$queryString = preg_replace('/(^|&)path=[^&]*/', '', $queryString);
$queryString = ltrim($queryString, '&');

if (!empty($queryString)) {
    $targetUrl .= "?" . $queryString;
}

/**
 * 🚀 Init cURL
 */
$ch = curl_init($targetUrl);
$method = $_SERVER['REQUEST_METHOD'];

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_ENCODING, "");

/**
 * 🔐 Extract headers
 */
$allHeaders = getallheaders();
$normalized = array_change_key_case($allHeaders, CASE_LOWER);

$auth = $normalized['authorization'] ?? null;
$time = $normalized['time'] ?? null;
$key = $normalized['key'] ?? null;

/**
 * 🧾 Build headers (FORCE EXACT CASE)
 */
$headers = [];

if ($auth) {
    $headers[] = "Authorization: $auth";
}
if ($time) {
    $headers[] = "Time: $time";
}
if ($key) {
    $headers[] = "Key: $key";
}

/**
 * 🌐 Spoof origin (Cloudflare / API requirement)
 */
$headers[] = "Origin: https://api.americankeysupply.com";
$headers[] = "Referer: https://api.americankeysupply.com/";
$headers[] = "Accept: application/json";

/**
 * 🔁 Forward remaining headers (FIXED casing)
 */
foreach ($allHeaders as $name => $value) {
    $lowerName = strtolower($name);

    if (
        !in_array($lowerName, [
            'host',
            'content-length',
            'accept-encoding',
            'authorization',
            'time',
            'key',
            'origin',
            'referer'
        ])
    ) {
        // ✅ Normalize casing (VERY IMPORTANT)
        $formattedName = ucwords(strtolower($name), '-');
        $headers[] = "$formattedName: $value";
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if ($method !== 'GET' && $method !== 'HEAD') {
    $requestBody = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

/**
 * ❌ Error handling
 */
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode([
        "proxy_error" => true,
        "message" => "cURL Error: " . curl_error($ch)
    ]);
    exit;
}

/**
 * 📦 Split headers + body
 */
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

/**
 * 📊 Status code
 */
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
http_response_code($httpCode);

/**
 * 🔁 Forward response headers safely
 */
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

echo $responseBody;

curl_close($ch);
?>