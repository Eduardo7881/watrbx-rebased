<?php

declare(strict_types=1);

namespace lavakit;
use lavakit\Http\ClientIp;

class Util {
    private $initialized;

    function __construct() {
         $this->initialized = true;
    }

/**
 * Example: clamp(150, 0, 100) = 100
 *
 * @param int|float $value
 * @param int|float $min
 * @param int|float $max
 * @return int|float
 */
public static function clamp($value, $min, $max)
{
    if (!is_numeric($value) || !is_numeric($min) || !is_numeric($max)) {
        throw new \InvalidArgumentException('Values must be numeric.');
    }

    if ($min > $max) {
        throw new \InvalidArgumentException('Minimum cannot exceed maximum.');
    }

    return max($min, min($value, $max));
}

public static function sum(array $values)
{
    $total = 0;

    foreach ($values as $value) {
        if (!is_numeric($value)) {
            throw new \InvalidArgumentException('All values must be numeric.');
        }

        $total += $value;
    }

    return $total;
}

public static function average(array $values)
{
    if (count($values) === 0) {
        return null;
    }

    return self::sum($values) / count($values);
}

public static function percentage($value, $total)
{
    if (!is_numeric($value) || !is_numeric($total)) {
        throw new \InvalidArgumentException('Values must be numeric.');
    }

    if ((float) $total == 0.0) {
        throw new \InvalidArgumentException('Total cannot be zero.');
    }

    return ($value / $total) * 100;
}

public static function lerp($start, $end, $amount)
{
    if (!is_numeric($start) || !is_numeric($end) || !is_numeric($amount)) {
        throw new \InvalidArgumentException('Values must be numeric.');
    }

    return $start + (($end - $start) * $amount);
}

public static function isBetween($value, $min, $max, $inclusive = true)
{
    if ($min > $max) {
        throw new \InvalidArgumentException('Minimum cannot exceed maximum.');
    }

    if ($inclusive) {
        return $value >= $min && $value <= $max;
    }

    return $value > $min && $value < $max;
}

public static function startsWith($text, $prefix)
{
    if ($prefix === '') {
        return true;
    }

    return substr($text, 0, strlen($prefix)) === $prefix;
}

public static function endsWith($text, $suffix)
{
    if ($suffix === '') {
        return true;
    }

    return substr($text, -strlen($suffix)) === $suffix;
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
