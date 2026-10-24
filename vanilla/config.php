<?php
// server side settings that nothing a visitor sends can change
$config = [
    'renderer' => '2016', // '2012' or experimental '2016'; request can override
    'assetBase' => $_ENV["BASE_URL"] . '/asset/?id=',
    'allowedHosts' => ["localhost", "localhost:8080", $_ENV["BASE_URL"], "." . $_ENV["APP_DOMAIN"], $_ENV["APP_DOMAIN"]],
    // only for testing against a server on your own machine or network
    'allowPrivateHosts' => $_ENV["APP_ENV"] === "local",
    'cacheDir' => __DIR__ . '/cache',
    'cacheSeconds' => 86400,
    'cacheMaxMB' => 200,
    'maxConcurrent' => 2,
];
if (is_file(__DIR__ . '/config.local.php')) {
    $config = array_merge($config, require __DIR__ . '/config.local.php');
}
return $config;
