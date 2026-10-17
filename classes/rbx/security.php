<?php

namespace rbx;

class security {

    function sign($script, $key) {
        $signature = "";
        openssl_sign($script, $signature, $key, OPENSSL_ALGO_SHA1);
        return base64_encode($signature);
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