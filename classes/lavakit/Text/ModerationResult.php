<?php

declare(strict_types=1);
namespace lavakit\Text;

final readonly class ModerationResult implements \JsonSerializable {
    /** @param list<string> $categories @param list<string> $signals */
    public function __construct(
        public Decision $decision,
        public int $score,
        public array $categories,
        public array $signals,
        public string $reason,
        public string $language,
        public bool $contactRisk,
        public bool $externalPlatformRisk,
        public string $provider,
        public ?string $requestId = null
    ) {}

    public function isAllowed(): bool { return $this->decision === Decision::ALLOW; }
    public function shouldBlock(): bool { return ($this->decision === Decision::BLOCK) ?? ($this->decision === Decision::UNAVAILABLE); }
    public function jsonSerialize(): array {
        return [
            'decision' => $this->decision->value, 'score' => $this->score,
            'categories' => $this->categories, 'signals' => $this->signals,
            'reason' => $this->reason, 'language' => $this->language,
            'contact_risk' => $this->contactRisk, 'external_platform_risk' => $this->externalPlatformRisk,
            'provider' => $this->provider, 'request_id' => $this->requestId
        ];
    }
}

?>
