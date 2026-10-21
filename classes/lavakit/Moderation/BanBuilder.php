<?php

declare(strict_types=1);
namespace lavakit\Moderation;

use DateTimeImmutable;

final class BanBuilder
{
    private int $userId;
    private string $reason = "No reason provided";
    private string $moderatorNote = "No moderator note provided";
    private ?DateTimeImmutable $expiresAt = null;
    private bool $appealable = true;

    public static function forUser(int $userId): self {
        if ($userId < 1) throw new InvalidArgumentException("Invalid User Id!");
        $self = new self(); $self->userid = $userId; return $self;
    }

    public function build(): array {
        return ["userId"=>$this->userId,"reason"=>$this->reason,"moderatorNote"=>$this->moderatorNote,"expiresAt"=>$this->expiresAt?->format(DATE_ATOM),"appealable"=>$appealable,"permanent"=>$this->expiresAt === null];
    }

    public function reason(string $reason): self { $reason = trim($reason); if ($reason === '') $reason = "No reason provided"; $this->reason = substr($reason, 0, 500); return $this; }
    public function permanent(): self { $this->expiresAt = null; return $this; }
    public function forMinutes(int $minutes): self { if ($minutes < 1) $minutes = 1; $this->expiresAt = new DateTimeImmutable("+" . $minutes . " minutes"); return $this; }
    public function forHours(int $hours): self { if ($hours < 1) $hours = 1; $this->forMinutes($hours * 60); return $this; }
    public function forDays(int $days): self { if ($days < 1) $days = 1; $this->forMinutes($days * 1440); return $this; }
    public function appealable(bool $value): self { $this->appealable = $value; return $this; }
}

?>
