<?php
use rbx\security;
use watrlabs\router\Routing;
use watrlabs\authentication;
use watrbx\gameserver;
use watrbx\sitefunctions;
use watrlabs\api;
use watrlabs\logging\discord;


global $router; // IMPORTANT: KEEP THIS HERE!

$router->get('/place/{id}/fetch', function($id){

    global $db;
    $gameserver = new gameserver();

    if(isset($_GET["apikey"])){
        $apikey = $_GET["apikey"];


        if($gameserver->validate_api_key($apikey)){
            $asset = $db->table("assets")->where("id", $id)->first();

            if($asset){
                header("Location: http://cdn.watrbx.wtf/" . $asset->fileid);
                die();
            } else {
                http_response_code(403);
                die();
            }

        } else {
            http_response_code(403);
            die();
        }

        http_response_code(403);
        die();

    }

    http_response_code(403);
    die();

});

$router->post('/Game/Log.ashx', function(){

    global $db;

    if(isset($_GET["jobId"]) && isset($_GET["placeId"]) && isset($_GET["access"])){

        $jobId = $_GET["jobId"];
        $placeId = $_GET["placeId"];
        $access = $_GET["access"];

        $gameserver = new gameserver();
        if($gameserver->validate_api_key($access)){
            $json = file_get_contents('php://input'); 

            if(substr($json, 0, 2) === "\x1f\x8b") {
                $json = gzdecode($json);
                if($json === false){
                    throw ErrorException("Failed to decompress incoming data");
                }
            }


            $encoding = mb_detect_encoding($json, ['UTF-8', 'UTF-16', 'ASCII', 'ISO-8859-1'], true);

            if($encoding !== 'UTF-8'){
                $json = mb_convert_encoding($json, 'UTF-8', $encoding);
            }

            try{
                $db->table("replication_logs")->insert([
                    "jobid"=>$jobId,
                    "placeid"=>$placeId,
                    "logs"=>$json
                ]);

                $discord = new discord();
                $discord->send_file($_ENV["REPLICATION_WEBHOOK"], "replication_log_".time().".txt", $json);

                $alarmpings = [
                    "nazi",
                    "Amir Yanez",
                    "Tree Service",
                    "AmirYanez",
                    "ROXPLOITDECAL",
                    "KSkyBox",
                    "[[TUNG TUNG TUNG TEEMO AND DEEPAK HACKED WATRBX]]",
                    "Leaves",
                    "javas casino",
                    "Polybius",
                    "MrBean",
                    "ShitLayer",
                    "DecalSpam",
                    "asdfgh",
                    "the superbomb",
                    "thesuperbomb exploder bomb",
                    "Infection",
                    "cough",
                    "PrimaryPartPart",
                    "BreakTail",
                    "WTF",
                    "PissStorage",
                    "PissOrbDeluxe",
                    "TeslaStorage",
                    "Username Redacted",
                    "doomtheme",
                    "HACKED BY SOYJAK.PARTY",
                    "SOYJAK.PARTY",
                    "soyjak",
                    "TOBIAS",
                    "O'KEEFE",
                    "scamnapse.xyz",
                    "Xmv8sWMXn5",
                    "4trabnjXVp"
                ];

                foreach ($alarmpings as $alarmstring){
                    if (stripos($json, $alarmstring)) {
                        $decoded = json_decode($json, true);
                        $who = "unknown";

                        if (is_array($decoded)) {
                            if (count($decoded) === 1) {
                                $who = array_key_first($decoded);
                            } else {
                                $who = implode(", ", array_keys($decoded));
                            }
                        }

                        $discord->send_webhook(
                            $_ENV["REPLICATION_WEBHOOK"],
                            "Bad Replication Alert",
                            "<@&1400166306128461904> Someone Replicated **$alarmstring**\n\nSuspects: **$who**"
                        );
                    }
                }
                die();

            } catch (ErrorException $e){
                $discord->send_webhook($_ENV["REPLICATION_WEBHOOK"], "Error Occured", "$e");
                die();
            }

        }

    }
});

$router->get('/asset/', function() {

    global $db;

    $useragent = $_SERVER['HTTP_USER_AGENT'];

    $id = basename(isset($_GET['id']) ? $_GET['id'] : (isset($_GET['ID']) ? $_GET['ID'] : 0));
    $exploded = explode("=", $id);

    if(str_contains($useragent, "Retros3")){
        if($id <= 30){
            $security = new security();
            header("Content-type: text/lua");

            $asset = "\n" . file_get_contents("../storage/2013/corescripts/" . $id);

            $asset = str_replace("watrbx.wtf", $_ENV["APP_DOMAIN"], $asset);
            $asset = str_replace("watrbx.xyz", $_ENV["APP_DOMAIN"], $asset);
            $asset = str_replace("roblox.com", $_ENV["APP_DOMAIN"], $asset);

            echo $security->signScriptAlt($asset, $id);
            die();
        }
    }

    $id = basename(isset($_GET['id']) ? $_GET['id'] : (isset($_GET['ID']) ? $_GET['ID'] : 0));
    $exploded = explode("=", $id);

    $type = "";

    if(isset($_GET["type"])){
        $type = $_GET["type"];
    }

    if($type){
        if($type == "roblox"){
            try {
                $asset = @file_get_contents("http://assetdelivery.ttblox.mom/v1/asset/?id=$id");
                $decoded = gzdecode($asset);

                if($asset){
                    
                    try {
                        $decoded = gzdecode($asset);
                    } catch (ErrorException $e){
                        die($asset);
                    }

                    file_put_contents("../storage/asset_cache/$id", $decoded); # THIS IS INSECURE!!!!!! (except for the fact I cast id to int & basename it)

                    $decoded = str_replace("roblox.com", $_ENV["APP_DOMAIN"], $decoded);
                    header("Content-type: application/octet-stream");
                    die($decoded);
                    
                }

            } catch (ErrorException $e){
                http_response_code(500);
                die($e);
            }
        }
    }


    if($exploded){
        if(isset($exploded[0]) && isset($exploded[1])){
            (int)$id = $exploded[0];
            (string)$apikey = $exploded[1];

            $gameserver = new gameserver();
            if($gameserver->validate_api_key($apikey)){
                $asset = $db->table("assets")->where("id", $id)->first();

                if($asset){

                    if($exploded[0] == 2696){
                        if(file_exists("../storage/asset_cache/6700000000")){
                            die(file_get_contents("../storage/asset_cache/6700000000"));
                        }
                    }

                    header("Location: http://cdn.watrbx.wtf/" . $asset->fileid);
                    die();
                }

            }

        }
    }


        
    if($id){

        if(isset($_GET["version"])){
            $version = (int)$_GET["version"];
        } else {
            $version = 0;
        }

        global $db;
        global $currentuser;

        $asset = $db->table("assets")->where("id", $id)->first();

        if($asset !== null){

            if($asset->moderation_status == "Deleted"){
                http_response_code(401);
                return ["Error"=>"This asset is not accessible."];
            }
            
            if($asset->moderation_status == "Pending"){
                http_response_code(401);
                return ["Error"=>"This asset is not accessible."];
            }

            if($asset->prodcategory == 9){

                if($currentuser){

                    if($asset->owner == $currentuser->id){
                        try {
                            header("Content-type: application/octet-stream");
                            $asset = file_get_contents("http://cdn.watrbx.wtf/" . $asset->fileid);
                            $asset = str_replace("roblox.com", $_ENV["APP_DOMAIN"], $asset);
                            $asset = str_replace("watrbx.xyz", $_ENV["APP_DOMAIN"], $asset);
                            die($asset);
                        } catch (ErrorException){
                            http_response_code(500);
                            die();
                        }

                    } 
                }

                http_response_code("403");
                die("You do not own this asset.");
                

            } else {
                header("Content-type: application/octet-stream");
                try {
                    $asset = file_get_contents("http://cdn.watrbx.wtf/" . $asset->fileid);
                    $asset = str_replace("roblox.com", $_ENV["APP_DOMAIN"], $asset);
                    $asset = str_replace("watrbx.xyz", $_ENV["APP_DOMAIN"], $asset);
                    die($asset);
                } catch (ErrorException){
                    http_response_code(500);
                    die();
                }
            }
        } else {

            header("Content-type: application/octet-stream");

            if(file_exists("../storage/asset_cache/$id")){
                die(file_get_contents("../storage/asset_cache/$id"));
            }

            $queryparams = http_build_query($_GET);
            
            try {
                $asset = @file_get_contents("http://assetdelivery.ttblox.mom/v1/asset/?$queryparams");

                if($asset){
                    
                    try {
                        $decoded = gzdecode($asset);
                    } catch (ErrorException $e){
                        die($asset);
                    }

                    file_put_contents("../storage/asset_cache/$id", $decoded); # THIS IS INSECURE!!!!!! (except for the fact I cast id to int & basename it)

                    $decoded = str_replace("roblox.com", $_ENV["APP_DOMAIN"], $decoded);
                    header("Content-type: application/octet-stream");
                    die($decoded);
                    
                }

            } catch (ErrorException $e){
                http_response_code(500);
                die($e);
            }

            http_response_code(500);
            die();
        }
    }
});

$router->get('/universes/get-player-place-instance', function(){
    http_response_code(500);
    die('{}');
});

$router->get('/Game/Tools/InsertAsset.ashx', function(){

    $queryparams = http_build_query($_GET);

    header("Location: http://sets.pizzaboxer.xyz/Game/Tools/InsertAsset.ashx?$queryparams"); // * Pizzaboxer makes api * W Pizzaboxer
    die();
});

$router->get('/Game/Tools/ThumbnailAsset.ashx', function(){

    //http://roblox.com/Game/Tools/ThumbnailAsset.ashx?fmt=png&wd=420&ht=420&aid=67572213

    $queryparams = http_build_query($_GET);

    
    if(isset($_GET['aid'])){

        // veri clean code trust

        $assetid = $_GET['aid'];

        try {
            $jsonstuff = @json_decode(file_get_contents('http://thumbnails.ttblox.mom/v1/assets?assetids='.$assetid.'&size=420x420&format=Png&isCircular=false'));
        } catch (ErrorException $e){
            sleep(10);
            try {
                $jsonstuff = @json_decode(file_get_contents('http://thumbnails.ttblox.mom/v1/assets?assetids='.$assetid.'&size=420x420&format=Png&isCircular=false'));
            } catch (ErrorException $e){
                http_response_code(429); // im just gonna assume we're getting rate limited
                die();
            }
        }
        if($jsonstuff){
            foreach ($jsonstuff->data as $jsonsthing) {
                header("Location: $jsonsthing->imageUrl");
            }
        } else {
            http_response_code(404);
            die();
        }
}

});

$router->get("/Asset/BodyColors.ashx", function(){
    header("Content-type: application/xml");

    $userid = 1;

    if(isset($_GET["Id"])){
        $userid = $_GET["Id"];
        
    }



    $auth = new authentication();
    $bodycolors = $auth->get_body_colors($userid);

    die('<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="' . $_ENV["BASE_URL"] . '/roblox.xsd" version="4">
<External>null</External>
<External>nil</External>
<Item class="BodyColors" referent="RBX2DC0258909A9441E8A72097F024F5FC7">
    <Properties>
        <string name="Name">Body Colors</string>
        <int name="HeadColor">'.$bodycolors["Head"].'</int>
        <int name="LeftArmColor">'.$bodycolors["LeftArm"].'</int>
        <int name="LeftLegColor">'.$bodycolors["LeftLeg"].'</int>
        <int name="RightArmColor">'.$bodycolors["RightArm"].'</int>
        <int name="RightLegColor">'.$bodycolors["RightLeg"].'</int>
        <int name="TorsoColor">'.$bodycolors["Torso"].'</int>
    </Properties>
</Item>
</roblox>');
});

$router->post('/game/validate-machine', function(){ // TODO: Implement this if we even do want to
    header("Content-type: application/json");
    echo json_encode(array("success"=>true));
    die();
});

$router->post('/marketplace/purchase', function() { // TODO: Implement this
    $data = array('success' => 'true', 'status' => 'Bought', 'receipt' => "ye");
    header('Content-type: application/json');
    echo json_encode($data); 
});

$router->get('/Error/Grid.ashx', function(){
    die();
});

$router->post('/Error/Grid.ashx', function(){
    die();
});

$router->get('/Game/ReportSystats.ashx', function() {

    $systats = [
        "tochigi"   => "Scorn Replication (11:0)",
        "baseball"  => "MD5 Hash wasn't correct",
        "impala"    => "Impossible Error (31) OR Scorn Impossible Error (31:12)",
        "robert"    => "WriteCopy changed (30)",
        "moded"     => "Stealth Edit Revival (29)",
        "booing"    => "Tried to modify hash function (28)",
        "bobby"     => "Function Return Check Failed (27)",
        "vera"      => "Tried to get build tools (26)",
        "vegah"     => "VEH used (25)",
        "fisher"    => "HumanoidState::computeEvent changed (24)",
        "dallas"    => "DLL Injection (23)",
        "tomy"      => "Sandbox or VM detected (22)",
        "usain"     => "Speedhack. (21)",
        "carol"     => "Lua vm hooked (20)",
        "steven"    => "OSX hash changed (19)",
        "larry"     => "Our VEH hook removed (18)",
        "mal"       => "Any New CE Method (17)",
        "ebx"       => "HumanoidState::computeEvent changed ebx (16)",
        "terrance"  => "Early null weak pointer (15)",
        "ursula"    => "Lua hash changed (14)",
        "bruger"    => "Speculative Call Check (13)",
        "seth"      => "SEH chain into dll (12)",
        "curly"     => "Hooked API function (11)",
        "olivia"    => "Debugger found (10)",
        "norman"    => "Lua script hash changed (9)",
        "mallory"   => "Catch executable acccess violation (8)",
        "lance"     => "Const Changed (7)",
        "jack"      => "Invalid bytecode (6)",
        "imogen"    => "Memory hash changed (5)",
        "ivan"      => "Illegal scripts (4)",
        "omar"      => "Bad signature (3)",
        "moe"       => "detected HWBP (2)",
        "lafayette" => "xxhash broken (1)",
        "murdle"    => "Cheat Engine Stable/Citeful Methods (0)",
    ];

    $important = [
        "tochigi",
        "impala",
        "hector",
        "booing",
        "bobby",
        "vera",
        "vegah",
        "fisher",
        "dallas",
        "tomy",
        "usain",
        "carol",
        "steven",
        "larry",
        "mal",
        "ebx",
        "terrance",
        "ursula",
        "bruger",
        "seth",
        "curly",
        "olivia",
        "norman",
        "mallory",
        "lance",
        "jack",
        "imogen",
        "ivan",
        "omar",
        "moe",
        "lafayette",
        "murdle",
        "hector",
    ];

    $gameserver = new gameserver();
    $auth = new authentication();
    $sitefunc = new sitefunctions();

    $ip = $sitefunc->getip();
    $isgameserver = $gameserver->is_gameserver_ip($ip);
    $isgameserver = true;

    if(isset($_GET["UserID"]) && isset($_GET["Message"]) && $ip){
        
        $message = $_GET["Message"];
        $userid = $_GET["UserID"];

        $prepend = "";

        $cheater = $auth->getuserbyid($userid);
        
        if($cheater){
            $discord = new discord();
            $info = "Impossible Flag.";
            if(isset($systats[$message])){
                $info = $systats[$message];


                if(in_array($message, $important)){
                    $prepend = "<@&1400166306128461904> ";
                }

            }

            
            $discord->send_webhook($_ENV["SYSTATS_WEBHOOK"], "Systats Reporter", $prepend . $cheater->username . " - Code " . $message . "\nInfo: " . $info);
            http_response_code(200);
        } 
        
    } else {
        $api = new api;
        http_response_code(400);
        die(create_error("I don't think you're a gameserver.", [], 400));
    }
    
});

// TODO: Check api key
$router->get('/GetAllowedSecurityVersions/', function(){
    header("Content-type: application/json");
    die('{"data":["0.5.0pcplayer","INTERNALiosapp", "2.238.0x uwpapp"]}');
});

$router->get('/GetAllowedMD5Hashes/', function(){
    //die("True");
    header("Content-type: application/json");
    die('{"data":["36aa5c84aedcb3910efccbda2709515f"]}');
});

$router->get('/game/LoadPlaceInfo.ashx', function() {
    header("Content-Type: text/plain; X-Robots-Tag: noindex");
    $lua = '
local baseUrl = "%baseurl%"

-- Loaded by StartGameSharedScript --
pcall(function() game:GetService("SocialService"):SetFriendUrl(baseUrl .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetBestFriendUrl(baseUrl .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupUrl(baseUrl .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupRankUrl(baseUrl .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupRoleUrl(baseUrl .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=%d&userid=%d") end)
pcall(function() game:GetService("GamePassService"):SetPlayerHasPassUrl(baseUrl .. "/Game/GamePass/GamePassHandler.ashx?Action=HasPass&UserID=%d&PassID=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetProductInfoUrl(baseUrl .. "/marketplace/productinfo?assetId=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetDevProductInfoUrl(baseUrl .. "/marketplace/productDetails?productId=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetPlayerOwnsAssetUrl(baseUrl .. "/ownership/hasasset?userId=%d&assetId=%d") end)
pcall(function() game:SetPlaceVersion(1) end)
';

    $lua = str_replace("%baseurl%", $_ENV["BASE_URL"], $lua);
    //$key = file_get_contents("../storage/PrivateNut.pem");
    //openssl_sign($lua, $sig, $key, )
    echo $lua;
    die();
});

$router->get('/Error/Dmp.ashx', function(){
    die("True");
});

$router->post('/Error/Dmp.ashx', function(){
    die("True");
});

$router->get('/gen-hash', function(){ // cool
    $prefix = "version-";
    $basething = time() . bin2hex(random_bytes(8));
    $hash = sha1($basething);
    $shortthing = substr($hash, 0, 16);
    $alltogether = $prefix . $shortthing;
    echo $alltogether;
});

$router->get('/Setting/QuietGet/ClientAppSettings/', function(){
    header("Content-type: application/json");
    $json = file_get_contents("../storage/clientappsettings.json");
    die($json);
});

$router->get('/game/players/{userid}/', function($userid){
    header("Content-type: application/json");
    http_response_code(200);
    die('{"ChatFilter":"whitelist"}');
});

$router->get('/Setting/QuietGet/ClientSharedSettings/', function(){
    header("Content-type: application/json");
    $json = file_get_contents("../storage/clientappsettings.json");
    die($json);
});
