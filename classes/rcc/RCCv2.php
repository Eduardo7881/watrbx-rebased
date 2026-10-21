<?php

namespace rcc;

use Roblox\Grid\Rcc\RCCServiceSoap;
use Roblox\Grid\Rcc\Job;
use Roblox\Grid\Rcc\ScriptExecution;

class RCCv2 {
    private RCCServiceSoap $RCC;
    private string $ip;
    private int $port;
    private string $baseUrl;

    public function __construct(string $ip = "127.0.0.1", int $port = 64989, string $url = "http://localhost:8080") {
        $this->RCC = new RCCServiceSoap($ip, $port);
        $this->ip = $ip;
        $this->port = $port;
        $this->baseUrl = $url;
    }

    /**
     * Executes a Luau script and returns its result.
     */
    public function ExecuteScript(string $script, string $scriptName = "ExecuteScript", ?string $jobId = null, int $expiration = 30) {
        $jobId ??= bin2hex(random_bytes(16));
        $job = new Job($jobId, $expiration);
        $execution = new ScriptExecution($scriptname, $script);

        try {
            return $this->RCC->OpenJobEx($job, $execution);
        } finally {
            $this->RCC->CloseJob($jobId);
        }
    }

    /**
     * Renders a user's avatar thumbnail.
     */
    public function GeneratePlayerThumbnail(int $userId = 1, int $width = 500, int $height = 500, string $type = "body") {
        $path = dirname(__DIR__, 2) . ($type == "body" ? "/storage/lua/user.lua" : "/storage/lua/user-headshot.lua");
        $script = file_get_contents($path);

        if ($script === false) { throw new \RuntimeException("Failed to load the renderer script!"); }
        $script = str_replace(["%userId%", "%baseurl%", "%width%", "%height%"], [(string)$userId, $this->baseUrl, $width, $height], $script);
        return $this->ExecuteScript($script, "RenderPlayerThumbnail");
    }

    /**
     * Renders an model thumbnail
     */
    public function GenerateAssetThumbnail(int $assetId = 1, int $width = 500, int $height = 500) {
        $path = dirname(__DIR__, 2) . "/storage/lua/asset.lua";
        $script = file_get_contents($path);

        if ($script === false) { throw new \RuntimeException("Failed to load the renderer script!"); }
        $script = str_replace(["%assetId%", "%baseurl%", "%width%", "%height%"], [(string)$assetId, $this->baseUrl, $width, $height], $script);
        return $this->ExecuteScript($script, "RenderAssetThumbnail");
    }

    public function getRCC(): RCCServiceSoap { return $this->RCC; }
    public function getURL(): string { return $this->baseUrl; }
    public function setURL(string $newUrl) { $this->baseUrl = $newUrl; }
}

?>
