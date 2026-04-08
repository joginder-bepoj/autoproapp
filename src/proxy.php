<?php
// Prevent PHP from displaying errors inside our API JSON responses
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Fallback for getallheaders if PHP is running as FastCGI instead of an Apache module
if (!function_exists('getallheaders')) {
    function getallheaders() {
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

// Append any additional query parameters perfectly
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
$headers = array();
foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    // Do not forward Host or Content-Length, cURL handles those automatically
    if ($lowerName != "host" && $lowerName != "content-length") {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward the JSON body for POST/PUT requests
if ($method != 'GET' && $method != 'HEAD') {
    $requestBody = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

// Return the transfer as a string and include Headers
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
// Essential for dealing with Cloudflare/SSL issues on the backend
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

if(curl_errno($ch)){
    http_response_code(500);
    echo json_encode(["proxy_error" => true, "message" => "cURL Error: " . curl_error($ch)]);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
http_response_code($httpCode);

// Send the exact backend response headers back to Angular
$headersArray = explode("\r\n", $responseHeaders);
foreach ($headersArray as $header) {
    if (!empty($header) && 
        stripos($header, 'Transfer-Encoding:') === false &&
        stripos($header, 'Content-Encoding:') === false &&
        stripos($header, 'Connection:') === false &&
        stripos($header, 'HTTP/') !== 0) {
        header($header);
    }
}

echo $responseBody;
curl_close($ch);
?>
