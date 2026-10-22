<?php

declare(strict_types=1);
namespace LavaKit\Guid;

use InvalidArgumentException;

/**
 * Generates and validates GUID/UUID identifiers.
 *
 * UUID v4 is generated from cryptographically secure random bytes.
 */
final class GuidGenerator
{
    /**
     * Generate a UUID v4, e.g. 8b7f3c2e-7d91-4a26-9a2f-1c6b8d0e4f55.
     */
    public static function generate(): string
    {
        $bytes = random_bytes(16);

        // Set the version to 4 and the RFC 4122 variant bits.
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        $hex = bin2hex($bytes);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12)
        );
    }

    /**
     * Validate the standard UUID textual format.
     * By default, accepts UUID versions 1 through 8 and the RFC variant.
     */
    public static function isValid(string $guid): bool
    {
        return (bool) preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $guid
        );
    }

    /**
     * Return the GUID in lowercase canonical form or throw if invalid.
     */
    public static function normalize(string $guid): string
    {
        $guid = trim($guid);

        if (!self::isValid($guid)) {
            throw new InvalidArgumentException('Invalid GUID/UUID format.');
        }

        return strtolower($guid);
    }
}
