<?php

namespace rcc;
use watrbx\RCCServiceSoap;

class RCC {
    private $RCC;
    private $ip;
    private $port;
    private $baseUrl;

    function __construct($ip = "127.0.0.1", $port = 64989, $url = "http://localhost:8080") {
        $this->RCC = new RCCServiceSoap($ip, $port, "roblox.com");
        $this->ip = $ip;
        $this->port = $port;
        $this->baseUrl = $url;
    }

    public function ExecuteScript($script, $jobId, $expiration) { return $this->RCC->execScript($script, $jobId, $expiration); }
    public function RequestURL($url, $xml) { return $this->RCC->requestUrl($url, $xml); }

    /* Renders a player's avatar and returns a PNG thumbnail */
    public function GeneratePlayerThumbnail($userId = 1, $width = 500, $height = 500, $type = "body") {
        $jobId = rand(1, getrandmax());

        $path = dirname(__DIR__, 2) . ($type == "body" ? "/storage/lua/user.lua" : "/storage/lua/user-headshot.lua");
        error_log($path);
        $script = file_get_contents($path);
        $script = str_replace("%userId%", $userId, $script);
        $script = str_replace("%baseurl%", $this->baseUrl, $script);
        $script = str_replace("%width%", $width, $script);
        $script = str_replace("%height%", $height, $script);

        $render = $this->ExecuteScript($script, $jobId, 120);
        $render = base64_decode((string)$render, true);
        if ($render === false) $render = null;
        if (substr($render, 0, 8) !== "\x89PNG\r\n\x1a\n") $render = null;
        return $render;
    }

    /* Renders a model and returns a PNG thumbnail */
    public function GenerateAssetThumbnail($assetId = 1, $width = 500, $height = 500) {
        $jobId = rand(1, getrandmax());

        $path = dirname(__DIR__, 2) . "/storage/lua/assetRenderer.lua";
        $script = file_get_contents($path);
        $script = str_replace("%assetId%", $assetId, $script);
        $script = str_replace("%baseurl%", $this->baseUrl, $script);
        $script = str_replace("%width%", $width, $script);
        $script = str_replace("%height%", $height, $script);

        $render = $this->ExecuteScript($script, $jobId, 120);
        $render = base64_decode((string)$render, true);
        if ($render === false) $render = null;
        if (substr($render, 0, 8) !== "\x89PNG\r\n\x1a\n") $render = null;
        return $render;
    }

}
?>
