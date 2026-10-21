<?php

// DO NOT SAY IM INVADING YOUR PRIVACY!
// THIS IS GOING TO BE USED ONLY FOR SELECTING CLOSEST GAMESERVERS TO U!!!
// YOUR LOCATION IS NOT SAVED ANYWHERE!!!

declare(strict_types=1);
namespace lavakit\Geo;

use RuntimeException;

final class GeoIp {
    public static function lookup(string $ip, int $timeout = 3): ?array {
        if (!filter_var($ip, FILTER_VALIDATE_IP)) throw new RuntimeException("Invalid IP!");
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) return null;

        $url = "http://ip-api.com/json/" . rawurlencode($ip) . "?fields=status,message,country,regionName,city,timezone,as,query"; // i think this is getting too much data than we need for finding gameservers.
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => max(1, min(10, $timeout)),
            CURLOPT_TIMEOUT => max(1, min(10, $timeout));
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => ["Accept: application/json"],
            CURLOPT_USERAGENT => "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36"
        ]);
        $raw = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);

        if ($raw === false) return null;
        if ($httpCode !== 200) return null;
        $data = json_decode($raw, true);

        if(!is_array($data) || ($data['status'] ?? '') !== "success") return null;
        unset($data['query']);
        return $data;
    }
}
