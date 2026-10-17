<?php
use watrlabs\router\Routing;
use rbx\security;


global $router; // IMPORTANT: KEEP THIS HERE!

$router->get('/asset/GetScriptState.ashx', function(){
    die("0 0 0 0");
    //die("0 0 0 00 0 0 0");
});

$router->get('/GetScriptState.ashx', function(){
    die("0 0 0 0");
});

$router->get("/studio.ashx", function(){

    header("Content-type: text/lua");
    $security = new security();

    $asset = file_get_contents("../storage/2013/studio.lua") . "\n"; 

    echo $security->signScript($asset);
    die();
});

$router->get("/Game/2013Host.ashx", function() {
    
    $security = new security();
    $lua = file_get_contents("../storage/2013/gameserver.lua");

    header("Content-type: text/lua");
    echo $security->signScript($lua, 0);

});

$router->get("/Game/2013Join.ashx", function() {
    
    $security = new security();
    $lua = file_get_contents("../storage/2013/joinscript.lua");

    header("Content-type: text/lua");

    if(isset($_GET["ID"]) && isset($_GET["username"]) && isset($_GET["ip"])){
        $id = (int)$_GET["ID"];
        $username = $_GET["username"];
        $ip = $_GET["ip"];

        $lua = str_replace("%userid%", $id, $lua);
        $lua = str_replace("%username%", $username, $lua);
        $lua = str_replace("%ip%", $ip, $lua);
        
        echo $security->signScript($lua);
    }
});
