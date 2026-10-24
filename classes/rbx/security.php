<?php

namespace rbx;
use lavakit\Guid\GuidGenerator as GUID;

class security {
    function sign($script, $key) {
        $signature = "";
        openssl_sign($script, $signature, $key, OPENSSL_ALGO_SHA1);
        return base64_encode($signature);
    }

    public function generateSessionId(string $gameId, int $placeId, string $ip): string {
        return implode("|", [
            GUID::generate(true),
            $gameId,
            $placeId,
            $ip,
            8, // unknown?
            gmdate("Y-m-d\TH:i:s\Z"),
            0,
            'null', // last 3 fields are unknown.
            'null'
        ]);
    }

    public function signScript($lua){
        $key = file_get_contents("../storage/PrivateNut.pem");

        openssl_sign($lua, $signature, $key, OPENSSL_ALGO_SHA1);
        return sprintf("%%%s%%%s", base64_encode($signature), $lua);
    }

    public function signScriptAlt($lua, $id){
        $key = file_get_contents("../storage/PrivateNut.pem");

        $lua = "%".$id."%\r\n" . $lua;
        openssl_sign($lua, $sig, $key, OPENSSL_ALGO_SHA1);
        return "" . sprintf("%%%s%%%s" , base64_encode($sig), $lua);
    }
}
