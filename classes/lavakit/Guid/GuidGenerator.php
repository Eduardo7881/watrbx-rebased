<?php

declare(strict_types=1);
namespace lavakit\Guid;

use InvalidArgumentException;

/**
 * Generates and validates GUID/UUID identifiers
 *
 * UUID v4 is generated from cryptographically secure random bytes.
 */
final class GuidGenerator {
    public static function generate(?bool $keepDashes): string {
        if ($keepDashes === null) $keepDashes = true;

        $bytes = random_bytes(16);
        $format = $keepDashes === true ? "%s-%s-%s-%s-%s" : "%s%s%s%s%s";
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        $hex = bin2hex($bytes);
        return sprintf($format, substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr(hex, 20, 12));
    }

    public static function isValid(string $guid): bool {
        return (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $guid);
    }

    public static function normalize(string $guid): ?string {
        $guid = trim($guid);
        if (!self::isValid($guid)) throw new InvalidArgumentException("Invalid GUID/UUID format.");
        return strtolower($guid);
    }
}

?>
