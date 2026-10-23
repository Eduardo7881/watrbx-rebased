<?php

chdir(__DIR__ . '/public');

if (isset($_ENV["LOG_REQUESTS"]) && $_ENV['LOG_REQUESTS'] === "true") {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
    
    $query = $_GET;
    $body = $_POST;
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && stripos($contentType, "application/json") !== false) {
        $rawbody = file_get_contents("php://input");
        $json = json_decode($rawbody, true);
        if (is_array($json)) $body = $json;
    }

    $timestamp = date("H:i:s");
    error_log(sprintf("[%s] %s %s", $timestamp, $method, $path));

    if (!empty($query)) {
        error_log('   Query Parameters: ' . json_encode($query, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    if (!empty($body)) {
        error_log('   Body Parameters: ' . json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . '/public' . $uri;

if (
    $uri !== '/' &&
    strpos($uri, '..') === false &&
    is_file($file)
) {
    return false;
}

require __DIR__ . '/public/index.php';

?>
