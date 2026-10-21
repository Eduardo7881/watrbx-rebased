<?php

declare(strict_types=1);
namespace lavakit\Http;

final class ClientIp {
    public static function get(array $trustedProxies = []): ?string {
        $remote = isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? (string)$_SERVER["HTTP_CF_CONNECTING_IP"] : (isset($_SERVER["REMOTE_ADDR"]) ? (string)$_SERVER["REMOTE_ADDR"] : "")
        //$remote = trim((string)($_SERVER["REMOTE_ADDR"] ?? ''));
        $remote = trim($remote);

        if (!filter_var($remote, FILTER_VALIDATE_IP)) return null;
        if (!in_array($remote, $trustedProxies, true)) return $remote;

        $forwarded = (string)($_SERVER["HTTP_X_FORWARDED_FOR"] ?? '');
        foreach (array_map('trim', explode(',', $forwarded)) as $candidate) {
            if (filter_var($candidate, FILTER_VALIDATE_IP)) return $candidate;
        }
        return $remote;
    }
}
?>
