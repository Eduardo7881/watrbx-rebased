<?php

declare(strict_types=1);
namespace lavakit\Text;

final readonly class Config {
    public function __construct(
        public string $apiKey,
        public string $model = 'gpt-4o-mini',
        public string $endpoint = 'https://api.openai.com/v1/chat/completions',
        public int $timeoutSeconds = 12,
        public int $maxTextLength = 1000, // Text Chat Messages are smaller than that btw
        public int $maxHistoryMessages = 20, // Maximum messages to store in history
        public int $maxHistoryChars = 16000, // Maximum chat history characters to send in new prompt
        public int $blockThreshold = 70,
        public array $allowedPlatforms = ['discord'],
        public bool $blockPhoneNumbers = true,
        public bool $blockExternalContactAttempts = true,
        public bool $failClosed = true,
        public string $policy = '',
        public string $applicationName = "TextFilter"
    ) {
        if (trim($apiKey) === '') throw new \InvalidArgumentException("An AI provider API key is required.");
        if ($timeoutSeconds < 1) $timeoutSeconds = 10; // Not recommended to go above 20 secs.
        if ($maxTextLength < 1 || $maxTextLength > 50000) throw new \InvalidArgumentException("Maximum Text Length must be in the range of 1-50000.");
        if ($blockThreshold > 100) throw new \InvalidArgumentException("If you want to disable the filter just do it in the right way bro.");
    }
}

?>
