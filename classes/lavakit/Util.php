<?php

declare(strict_types=1);

namespace lavakit;
use lavakit\Http\ClientIp;

class Util {
    private $initialized;

    function __construct() {
         $this->initialized = true;
    }

    public static function getVisitorTimezone(): ?string {
        if (isset($_COOKIE["RBX__TIMEZONE"])) {
            if (is_string($_COOKIE["RBX__TIMEZONE"]) && in_array($_COOKIE["RBX__TIMEZONE"], timezone_identifiers_list(), true)) return $_COOKIE["RBX__TIMEZONE"];
        }

        $ip = ClientIp->get();
        $url = "http://ip-api.com/json/" . urlencode($ip) . "?fields=status,timezone";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5
        ]);

        $response = curl_exec($ch);
        //curl_close($ch);
        if (!$response) return null;

        $data = json_decode($response, true);
        if (($data['status'] ?? '') !== 'success') return null;
        $timezone = $data['timezone'] ?? null;
        if (is_string($timezone) && in_array($timezone, timezone_identifiers_list(), true)) {
            setcookie("RBX__TIMEZONE", $timezone, time() + 8600, "/");
            return $timezone;
        } else {
            return null;
        }
    }
}
?>
