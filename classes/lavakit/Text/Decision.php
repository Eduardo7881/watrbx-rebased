<?php

declare(strict_types=1);
namespace lavakit\Text;

enum Decision: string { case ALLOW = 'allow'; case BLOCK = 'block'; case UNAVAILABLE = 'unavailable'; }

?>
