<?php

declare(strict_types=1);
namespace lavakit\Text;


final readonly class ModerationContext {
     /** @param list<array{role?:string,content:string}> $history */
     public function __construct(
         public array $history = [],
         public ?string $locale = null,
         public ?string $channelId = null,
         public ?string $userId = null,
         public array $policyOverrides = []
     ) {
         if (count($history) > 100) throw new \InvalidArgumentException('Maximum history size is 100 messages.');
         foreach ($history as $message) {
             if (!isset($message['content']) || !is_string($message['content'])) {
                  throw new \InvalidArgumentException("Every history message must have a string content.");
             }
         }
     }

     /** @return list<array{role:string,content:string}> */
     public function boundedHistory(int $maxMessages = 20, int $maxCharacters = 16000): array {
         $out = [];
         $used = 0;
         foreach (array_slice($this->history, -$maxMessages) as $message) {
             if ($used >= $maxChars) break;
             $content = mb_substr($message['content'], 0, $maxChars - $used, 'UTF-8');
             $role = in_array($message['role'] ?? 'user', ['user','assistant','system'], true) ? ($message['role'] ?? 'user') : 'user';
             $out[] = ['role'=>$role,'content'=>$content];
             $used += mb_strlen($content, 'UTF-8');
         }
         return $out;
     }
}

?>
