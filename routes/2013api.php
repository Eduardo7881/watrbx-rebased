<?php
use watrlabs\router\Routing;
use rbx\security;
use watrbx\Memberships;

global $router; // IMPORTANT: KEEP THIS HERE!

$router->get(['/asset/GetScriptState.ashx', '/GetScriptState.ashx'], function(){
    die("0 0 0 0");
    //die("0 0 0 00 0 0 0");
});

$router->get("/studio.ashx", function(){

    header("Content-type: text/lua");
    $security = new security();

    $asset = file_get_contents("../storage/2013/studio.lua") . "\n"; 
    $asset = str_replace("%baseurl%", $_ENV["BASE_URL"], $asset);

    echo $security->signScript($asset);
    die();
});

$router->get("/Game/2013Host.ashx", function() {
    $placeId = isset($_GET["placeId"]) ? (int)$_GET["placeId"] : 1; // I'm just guessing
    if ($placeId < 0) $placeId = 1;

    $security = new security();
    $lua = file_get_contents("../storage/2013/gameserver.lua");
    $lua = str_replace("%placeid%", (string)$placeId, $lua);

    header("Content-type: text/lua");
    echo $security->signScript($lua, 0);
});

$router->get("/Game/2013Join.ashx", function() {
    $security = new security();
    $lua = file_get_contents("../storage/2013/joinscript.lua");
    $lua = str_replace("%baseurl%", $_ENV["BASE_URL"], $lua);

    header("Content-type: text/lua");

    if(isset($_GET["ID"]) && isset($_GET["username"]) && isset($_GET["ip"])){
        $id = (int)$_GET["ID"];
        $username = $_GET["username"];
        $ip = $_GET["ip"];

        $userinfo = $db->table("users")->where("id", "=", $id)->first();
        if ($userinfo) {
            $lua = str_replace("%userid%", $id, $lua);
            $lua = str_replace("%username%", $username, $lua);
            $lua = str_replace("%ip%", $ip, $lua);
            $lua = str_replace("%accountage%", round((time() - $userinfo->regtime) / 86400), $lua);
            $lua = str_replace("%membership%", RBXMemberships::getIdFromName($userinfo->membership), $lua);

            echo $security->signScript($lua);
        }
    }
});

