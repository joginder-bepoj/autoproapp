<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

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
$api = $_GET['api'] ?? 'v1';

switch ($api) {

    case 'autoApi':
        $targetBaseUrl = "https://autoproapp.com/autoApi";
        break;

    case 'v1':
    default:
        $targetBaseUrl = "https://api.americankeysupply.com/V1";
        break;
}

$path = isset($_GET['path']) ? ltrim($_GET['path'], '/') : '';
$targetUrl = rtrim($targetBaseUrl, '/') . '/' . $path;

/**
 * 🔗 Query params
 */
$queryString = $_SERVER['QUERY_STRING'] ?? '';

$queryString = preg_replace('/(^|&)api=[^&]*/', '', $queryString);
$queryString = preg_replace('/(^|&)path=[^&]*/', '', $queryString);

$queryString = trim($queryString, '&');

if (!empty($queryString)) {
    $targetUrl .= "?" . $queryString;
}

/**
 * 🚀 cURL initialization
 */
$ch = curl_init($targetUrl);
$method = $_SERVER['REQUEST_METHOD'];

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_ENCODING, "");

/**
 * 🔐 Extract incoming headers
 */
$allHeaders = getallheaders();
$normalized = array_change_key_case($allHeaders, CASE_LOWER);

$auth = $normalized['authorization'] ?? null;
$time = $normalized['time'] ?? null;
$key = $normalized['key'] ?? null;

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
 * 🌐 Spoof origin and modern browser headers (Cloudflare / API requirement)
 * Sync'd from proxy.conf.js
 */
$headers[] = "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
$headers[] = "Accept: application/json, text/plain, */*";
$headers[] = 'sec-ch-ua: "Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"';
$headers[] = "sec-ch-ua-mobile: ?0";
$headers[] = 'sec-ch-ua-platform: "Windows"';
$headers[] = "sec-fetch-dest: empty";
$headers[] = "sec-fetch-mode: cors";
$headers[] = "sec-fetch-site: same-origin";
$headers[] = "Origin: https://api.americankeysupply.com";
$headers[] = "Referer: https://api.americankeysupply.com/";
$headers[] = "Accept-Language: en-GB,en-US;q=0.9,en;q=0.8";
$headers[] = "cache-control: no-cache";
$headers[] = "pragma: no-cache";

// Cloudflare clearance and sessions (Sync'd from proxy.conf.js)
$userCookies = [
    'cf_clearance=YxIpfctrBdXe80vp_E30qJdS02GGLKMt98Khb7GhEA8-1775457601-1.2.1.1-Gs98cbw3EDPm9YKcIRwsKo89q1eogCs1gZEA23n.JqlJNILWQNieuT.EgEZuE048RYKa8_OnaGiAfXWqOIFvpSczIi.aOQO1uKxvX9oDy5J8JceFK5vddq0_j7_3MP5j78xCiYDtV1uIeEjC8Zjpf1Ng7r2vbsgQ4YFtBjdqkaCjJgI16g5Fz59eL2E7fLeXVrkTaREYk3TqGmDQ6SRXT.7ogC1pwLfIrMWqe_YSbOyEta.MG9hg9p942.2w.8Ud6.DBWZi9xmUAcqA4VJIQF61zb95JMlk_zyLl2LUzT_OlS5ukWrVAXsVq_ljbnN2OAmOPHTO6i66Ps6unL4p6lA',
    '_ga=GA1.1.1601079453.1767932870',
    'ezdfasgefdevsdfggdgsf=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoieWlkZWxicmF2ZXJAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiI0MSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InlpZGVsYnJhdmVyQGdtYWlsLmNvbSIsImV4cCI6MTc3Mzg1MjA5NywiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIn0.xHS4XhrJpgzEzZ2k6z4h68musuPZ3jCt2QKMEUz6MiQ',
    '_ga_MJDCJZTP2T=GS2.1.s1773807963$o38$g1$t1773809212$j60$l0$h0',
    '_clck=foe802%5E2%5Eg4u%5E0%5E2199'
];
$headers[] = "Cookie: " . implode('; ', $userCookies);

/**
 * 🔁 Forward remaining headers (excluding user-agent/cookies to avoid overwriting our bypasses)
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
            'referer',
            'cookie',
            'user-agent',
            'accept',
            'accept-language'
        ])
    ) {
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
$httpCode = ($httpCode == 0) ? 500 : $httpCode;
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