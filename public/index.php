<?php

use watrlabs\router\routing;
use watrlabs\authentication;
use watrlabs\users\getuserinfo;
use watrlabs\logging\discord;
use watrbx\sitefunctions;
use watrbx\refers;

require_once '../init.php';

try {
    try {
        global $db;
        global $router;

        $func = new sitefunctions();
        $ip = $func->getip(true);

        $ipbanned = $db->table("ipbans")->where("ip", $ip)->first();
        if($ipbanned == true){
            echo "<h1>You have been banned.</h1>";
            echo '<iframe width="560" height="315" src="http://www.youtube.com/embed/0E9kzyAwC9Y?si=yKyOOMbofLEQyjJk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
            http_response_code(403);
            exit; // should I make this show the iis 403?
        }

        ob_start();

        $auth = new authentication();
        $router = new routing();

        if($_ENV["ACTUAL_MAINTENANCE"] == "true"){
            require("../views/maintenance.php");
            exit;
        }

        if($_ENV["MAINTENANCE"] == "true"){
            $canbypass = false;

            if(isset($_SERVER["HTTP_AUTHORIZATION"])){
                $authorization = $_SERVER["HTTP_AUTHORIZATION"];
                $discordbot = $_ENV["DISCORD_BOT_AUTH"]; // maybe move this to the database

                $canbypass = $discordbot == $authorization;
            }

            if(isset($_GET["validate"]) && !$canbypass){
                $maintcode = $_GET["validate"];
                $validmaintcode = $db->table("maintcodes")->where("code", $maintcode)->first();

                if($validmaintcode){
                    setcookie("maint_bypass", $maintcode, $validmaintcode->expires, "", "." . $_ENV["APP_DOMAIN"]);
                    $canbypass = true;
                }
            }

            if(isset($_COOKIE["maint_bypass"]) && !$canbypass){
                $maintcode = $_COOKIE["maint_bypass"];

                $validmaintcode = $db->table("maintcodes")->where("code", $maintcode)->first();

                if($validmaintcode){
                    $canbypass = true;
                }
            }

            // TODO: Check for gameservers and allow them

            if(!$canbypass){
                require("../views/maintenance.php");
                exit;
            }
        }
        
        $routers = [
            "webhandler",
            "apihandler",
            "studiohandler",
            "clienthandler",
            "gameserverhandler",
            "mobilehandler",
            "discordbothandler",
            "bootstraphandler",
            "forumhandler",
            "chathandler",
            "pbshandler",
            "datapershandler",
            "fingerprinthandler",
            "accounthandler",
            "2013api",
            "grouphandler",
            "robloxhandler"
        ];

        foreach ($routers as $r) {
            $router->addrouter($r);
        }

        
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uriraw = $_SERVER['REQUEST_URI'];
        if($uri){
            $uri = strtolower($uri);
        }
        $method = $_SERVER['REQUEST_METHOD'];

        $discord = new discord();
        $discord->set_webhook_url($_ENV["SUSSY_WEBHOOK"]);

        $dontlogthese = [
            "/api/v1/login",
            "/my/account/sendverifyemail",
            "/api/v1/verify-captcha",
            "/mobileapi/login/",
            "/api/v1/signup"
        ];

        $user = "Not Logged In";

        if($currentuser){
            $user = $currentuser->username;
        }

        $allalts1 = $db->table("users")->where("register_ip", $ip)->get();
        $allalts2 = $db->table("users")->where("last_login_ip", $ip)->get();

        $allalts = array_merge($allalts1, $allalts2);

        $unique = array_map(function($user) {
            $auth = new authentication();
            
            if($user->last_login_ip !== null || $user->register_ip !== null){
                $isBanned = $auth->is_banned($user->id);

                $altAppend = "";

                if($isBanned){
                    $altAppend = " (BANNED❌)";
                } else {
                    $altAppend = " (OK)"; 
                }
                return $user->username . $altAppend;
            }
        }, $allalts);

        $possiblealts = implode(", ", $unique);

        if (preg_match('/[<>"\'`]/', $uriraw)) {
            // suspicious input
            $discord->internal_log("Someone attempted xss. URL:\n$uriraw\nUser: $user\nPossible Accounts: $possiblealts", "XSS Attmpted!");
        }

        if (preg_match('/<\s*script|javascript:/i', $uriraw)) {
            // possible XSS attempt
            $discord->internal_log("Someone attempted xss. URL:\n$uriraw\nUser: $user\nPossible Accounts: $possiblealts", "XSS Attmpted!");
        }

        $score = 0;
        
        if (preg_match('/\bunion\b\s+\bselect\b/', $uriraw)) $score += 5;
        if (preg_match('/(--|#|\/\*)/', $uriraw)) $score += 3;
        if (preg_match('/\bor\b\s+1\s*=\s*1/', $uriraw)) $score += 5;

        if($score >= 3){
            global $currentuser;

            // suspicious behaviour
            if($currentuser){
                $user = $currentuser->username;
            }
            $discord->internal_log("Suspicious behaviour found. URL:\n$uriraw\nUser: $user\nPossible Accounts: $possiblealts", "Potential SQL Injection!");
        }

        $score = 0;

        foreach($_POST as $key => $value){
            $value = strtolower($value);

            if (preg_match('/[<>"\'`]/', $value)) {
                if(!in_array($uriraw, $dontlogthese)){
                    $discord->internal_log("XSS attempt in POST:\n$value\nUser: $user\nPossible Accounts: $possiblealts", "XSS Attempt!");
                }
            }

            if (preg_match('/<\s*script|javascript:/i', $value)) {
                if(!in_array($uriraw, $dontlogthese)){
                    $discord->internal_log("XSS attempt in POST:\n$value\nUser: $user\nPossible Accounts: $possiblealts", "XSS Attempt!");
                }
            }

            if (preg_match('/\bunion\b\s+\bselect\b/', $value)) $score += 5;
            if (preg_match('/(--|#|\/\*)/', $value)) $score += 3;
            if (preg_match('/\bor\b\s+1\s*=\s*1/', $value)) $score += 5;

            if($score >= 3){

                global $currentuser;

                // suspicious behaviour
                if($currentuser){
                    $user = $currentuser->username;
                }

                if(!in_array($uriraw, $dontlogthese)){
                    $discord->internal_log("Suspicious behaviour found. URL:\n$uriraw\n$value\nUser: $user\nPossible Accounts: $possiblealts", "Potential SQL Injection!");
                }

            }

            $score = 0;
        }

        $refers = new refers();
        $discord->set_webhook_url($_ENV["REFER_WEBHOOK"]);

        if(isset($_GET["refer"])){
            $referName = $_GET["refer"];
            $referInfo = $refers->getReferInfo($referName);

            if($referInfo && !$refers->hasReferCookie()){
                $refers->incrementRefer($referName);
                $refers->assignReferCookie($referName);
                $discord->internal_log("Someone has been reffered by: $referName.\n This refferal has had " . $referInfo->uses + 1 . " uses.", "New Refferal!");
            }
        }

        $response = $router->dispatch($uri, $method);
        ob_end_flush(); 
    } catch(PDOException $e){
        handle_error($e);
    }
} catch(ErrorException $e){
    handle_error($e);
}

function handle_error($e){
    $discord = new discord();
    $discord->set_webhook_url($_ENV["SITE_ERRWEBHOOK"]);

    try {
        $discord->internal_log($e, "Site Error!");
        
        ob_clean();
        file_put_contents("../storage/errorlog.log", $e . "\n\n", FILE_APPEND);
        http_response_code(500);
        
        require("../views/status_codes/500.php");
    } catch(ErrorException $e){
        $discord->internal_log($e, "Really Bad Site Error!");
        
        ob_clean();
        http_response_code(500);
        file_put_contents("../storage/errorlog.log", $e . "\n\n", FILE_APPEND);
        
        require("../views/really_bad_500.php");
        die();
    }
}

// aaaaaaaaaaaaaaaa my brain hurts
