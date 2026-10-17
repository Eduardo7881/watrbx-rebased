<?php

chdir(__DIR__ . '/public');

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
