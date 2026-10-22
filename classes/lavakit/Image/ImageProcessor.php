<?php

declare(strict_types=1);
namespace LavaKit\Image;

use InvalidArgumentException;
use RuntimeException;

/**
 * Image operations backed by PHP's GD extension.
 *
 * Supported formats depend on the GD build. PNG, JPEG and GIF are commonly
 * available; WebP/AVIF require corresponding GD support.
 */
final class ImageProcessor
{
    private const MIME_TO_FORMAT = [
        'image/jpeg' => 'jpeg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        'image/avif' => 'avif',
        'image/bmp'  => 'bmp',
    ];

    /**
     * Read image metadata and calculate aspect ratio.
     *
     * @return array{width:int,height:int,mime:string,format:string,ratio:float,ratio_text:string}
     */
    public static function dimensions(string $path): array
    {
        self::assertFile($path);

        $info = @getimagesize($path);
        if ($info === false || empty($info[0]) || empty($info[1])) {
            throw new RuntimeException('The file is not a supported or readable image.');
        }

        $width = (int) $info[0];
        $height = (int) $info[1];
        $mime = isset($info['mime']) ? (string) $info['mime'] : 'application/octet-stream';
        $divisor = self::gcd($width, $height);

        return [
            'width' => $width,
            'height' => $height,
            'mime' => $mime,
            'format' => self::MIME_TO_FORMAT[$mime] ?? 'unknown',
            'ratio' => $width / $height,
            'ratio_text' => (int) ($width / $divisor) . ':' . (int) ($height / $divisor),
        ];
    }

    /**
     * Return the numeric aspect ratio (width / height).
     */
    public static function aspectRatio(string $path): float
    {
        $info = self::dimensions($path);
        return $info['ratio'];
    }

    /**
     * Crop a rectangle from an image and save it to the destination.
     * The output format is inferred from the destination extension unless
     * $format is provided. Coordinates and dimensions are in source pixels.
     */
    public static function crop(
        string $source,
        string $destination,
        int $x,
        int $y,
        int $width,
        int $height,
        ?string $format = null,
        int $quality = 90
    ): void {
        if ($x < 0 || $y < 0 || $width < 1 || $height < 1) {
            throw new InvalidArgumentException('Crop coordinates must be non-negative and dimensions must be positive.');
        }

        $image = self::load($source);
        $sourceWidth = imagesx($image);
        $sourceHeight = imagesy($image);

        if ($x + $width > $sourceWidth || $y + $height > $sourceHeight) {
            imagedestroy($image);
            throw new InvalidArgumentException('Crop rectangle extends beyond the source image.');
        }

        $cropped = imagecreatetruecolor($width, $height);
        if ($cropped === false) {
            imagedestroy($image);
            throw new RuntimeException('Could not allocate the cropped image.');
        }

        self::preserveTransparency($cropped);
        $ok = imagecopy($cropped, $image, 0, 0, $x, $y, $width, $height);
        imagedestroy($image);

        if (!$ok) {
            imagedestroy($cropped);
            throw new RuntimeException('Could not crop the image.');
        }

        try {
            self::save($cropped, $destination, $format, $quality);
        } finally {
            imagedestroy($cropped);
        }
    }

    /**
     * Convert an image to the format inferred from $destination or $format.
     * Supported format names: jpeg/jpg, png, gif, webp, avif, bmp.
     */
    public static function convert(
        string $source,
        string $destination,
        ?string $format = null,
        int $quality = 90
    ): void {
        $image = self::load($source);

        try {
            self::save($image, $destination, $format, $quality);
        } finally {
            imagedestroy($image);
        }
    }

    private static function load(string $path)
    {
        self::assertFile($path);

        if (!function_exists('imagecreatefromstring')) {
            throw new RuntimeException('The PHP GD extension is required for image processing.');
        }

        $data = @file_get_contents($path);
        if ($data === false) {
            throw new RuntimeException('Could not read the source image.');
        }

        $image = @imagecreatefromstring($data);
        if ($image === false) {
            throw new RuntimeException('Unsupported or invalid image format.');
        }

        return $image;
    }

    private static function save($image, string $destination, ?string $format, int $quality): void
    {
        if ($quality < 0 || $quality > 100) {
            throw new InvalidArgumentException('Quality must be between 0 and 100.');
        }

        $format = strtolower(trim($format ?? pathinfo($destination, PATHINFO_EXTENSION)));
        if ($format === 'jpg') {
            $format = 'jpeg';
        }

        $directory = dirname($destination);
        if (!is_dir($directory) || !is_writable($directory)) {
            throw new RuntimeException('Destination directory does not exist or is not writable.');
        }

        switch ($format) {
            case 'jpeg':
                self::requireFunction('imagejpeg');
                $background = imagecreatetruecolor(imagesx($image), imagesy($image));
                $white = imagecolorallocate($background, 255, 255, 255);
                imagefilledrectangle($background, 0, 0, imagesx($image), imagesy($image), $white);
                imagecopy($background, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
                $ok = imagejpeg($background, $destination, $quality);
                imagedestroy($background);
                break;

            case 'png':
                self::requireFunction('imagepng');
                imagesavealpha($image, true);
                // Map the familiar quality scale (0-100) to PNG compression (0-9).
                $compression = (int) round((100 - $quality) * 9 / 100);
                $ok = imagepng($image, $destination, $compression);
                break;

            case 'gif':
                self::requireFunction('imagegif');
                $ok = imagegif($image, $destination);
                break;

            case 'webp':
                self::requireFunction('imagewebp');
                $ok = imagewebp($image, $destination, $quality);
                break;

            case 'avif':
                self::requireFunction('imageavif');
                $ok = imageavif($image, $destination, $quality);
                break;

            case 'bmp':
                self::requireFunction('imagebmp');
                $ok = imagebmp($image, $destination);
                break;

            default:
                throw new InvalidArgumentException('Unsupported output format: ' . $format);
        }

        if (!$ok) {
            throw new RuntimeException('Could not save the output image.');
        }
    }

    private static function assertFile(string $path): void
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new InvalidArgumentException('Image file does not exist or is not readable: ' . $path);
        }
    }

    private static function preserveTransparency($image): void
    {
        imagealphablending($image, false);
        imagesavealpha($image, true);
        $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
        imagefilledrectangle($image, 0, 0, imagesx($image), imagesy($image), $transparent);
    }

    private static function requireFunction(string $function): void
    {
        if (!function_exists($function)) {
            throw new RuntimeException('The installed GD build does not support this format (' . $function . ').');
        }
    }

    private static function gcd(int $a, int $b): int
    {
        while ($b !== 0) {
            $remainder = $a % $b;
            $a = $b;
            $b = $remainder;
        }

        return max(1, $a);
    }
}
