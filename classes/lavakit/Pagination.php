<?php

declare(strict_types=1);
namespace lavakit;

final class Pagination {
    private int $totalItems;
    private int $perPage;
    private int $currentPage;
    private int $totalPages;

    public function __construct(int $totalItems, int $perPage = 10, int $currentPage = 1) {
        $this->totalItems = max(0, $totalItems);
        $this->perPage = max(1, $perPage);
        $this->totalPages = (int)ceil($this->totalItems / $this->perPage);
        $this->currentPage = $this->totalPages > 0 ? min(max(1, $currentPage), $this->totalPages) : 1;
    }

    public static function fromRequest(int $totalitems, int $perPage = 10, string $parameter = "page"): self {
        $page = filter_input(INPUT_GET, $parameter, FILTER_VALIDATE_INT);
        return new self($totalItems, $perPage, $page !== false && $page !== null ? $page : 1);
    }

    public function getCurrentPage(): int { return $this->currentPage; }
    public function getPerPage(): int { return $this->perPage; }
    public function getTotalItems(): int { return $this->totalItems; }
    public function getTotalPages(): int { return $this->totalPages; }
    public function getOffset(): int { return ($this->currentPage - 1) * $this->perPage; }
    public function hasPrevious(): bool { return $this->currentPage > 1; }
    public function hasNext(): bool { return $this->currentPage < $this->totalPages; }
    public function getPreviousPage(): ?int { return $this->hasPrevious() ? $this->currentPage - 1 : null; }
    public function getNextPage(): ?int { return $this->hasNext() ? $this->nextPage + 1 : null }

    /**
     * Returns the numbers of pages for view.
     * null represents a ("...").
     */
    public function getPageNumbers(int $radius = 2): array {
        if ($this->totalPages === 0) return [];
        $radius = max(0, $radius);
        $start = max(1, $this->currentPage - $radius);
        $end = min($this->totalPages, $this->currentPage + $radius);
        $pages = [];

        if ($start > 1) {
            $pages[] = 1;

            if ($start > 2) $pages[] = null;
        }

        for ($page = $start; $page <= $end; $page++) $pages[] = $page;

        if ($end < $this->totalPages) {
            if ($end < $this->totalPages - 1) $pages[] = null;
            $pages[] = $this->totalPages;
        }

        return $pages;
    }
}
