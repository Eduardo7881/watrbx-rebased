<?php
use Cocur\Slugify\Slugify;
use watrlabs\router\Routing;
use watrbx\sitefunctions;
use watrlabs\api;
use watrlabs\authentication;
use watrbx\thumbnails;
use watrbx\gameserver;
use watrbx\relationship\friends;
use Carbon\Carbon;


function is_bot_authenticated() {
    header("Content-type: application/json");

    if(isset($_SERVER['HTTP_AUTHORIZATION'])){

        $auth = $_SERVER['HTTP_AUTHORIZATION'];

        if($auth !== $_ENV["DISCORD_BOT_AUTH"]){
            die(createerror("Discord Bot is not authorized!", '', 401));
        }

    } else {
        die(createerror("Discord Bot is not authorized!", '', 401));
    }
}


global $router; // IMPORTANT: KEEP THIS HERE!

$router->group('/api/v1/discord-bot', function($router) {

    $router->get('/item-info', function(){

        global $db;

        $auth = new authentication();
        $thumbs = new thumbnails();
        $slugify = new Slugify();
        $api = new api();
        $Carbon = new Carbon();

        if(isset($_GET["id"])){
            $id = (int)$_GET["id"];

            $assetInfo = $db->table('assets')->where("id", $id)->first();

            if($assetInfo){

                $boughtamount = $db->table("ownedassets")->where("assetid", $assetInfo->id)->count();
                $creator = $auth->getuserbyid($assetInfo->owner);
                $thumbnailurl = "https:" . $thumbs->get_asset_thumb($assetInfo->id);
                $assetUrl = "https://www.watrbx.wtf/" . $slugify->slugify($assetInfo->name) . "-item?id=" . $assetInfo->id;

                $name = htmlspecialchars_decode($assetInfo->name);
                $description = htmlspecialchars_decode($assetInfo->description);

                $assetResponse = [
                    "id"=>$assetInfo->id,
                    "name"=>"$name",
                    "description"=>"$description",
                    "amountSold"=>"$boughtamount",
                    "thumbnailurl"=>$thumbnailurl,
                    "creator"=>$creator->username,
                    "url"=>$assetUrl,
                    "created"=>$Carbon::createFromTimestamp($assetInfo->created)->diffForHumans(),
                    "lastUpdated"=>$Carbon::createFromTimestamp($assetInfo->updated)->diffForHumans(),
                ];

                die($api::create_success("Found asset info!", $assetResponse));

            } else {
                die($api::create_error("Couldn't find asset.", [], 404));
            }

        } else {

        }
    });

    $router->get('/get-userinfo', function(){
        if(isset($_GET["username"])){
            $username = (string)$_GET["username"];

            $api = new api();
            $thumbs = new thumbnails();
            $auth = new authentication();
            $friends = new friends();
            $gameserver = new gameserver();
            $slugify = new Slugify();


            global $db;
            $userinfo = $db->table("users")->where("username", $username)->first();

            if($userinfo !== null){
                $online = null;
                
                $online = $auth->is_online($userinfo->id);
                $ingame = $auth->is_ingame($userinfo->id);
                $friendCount = $friends->get_friend_count($userinfo->id);
                $lastVisitedVisits = $gameserver->get_visits($userinfo->id, 1);
                $lastVisited = $db->table("universes")->where("id", $lastVisitedVisits[0]->universeid)->first();
                $visited = [];

                if($lastVisited){
                    $visited["id"] = $lastVisited->id;
                    $visited["title"] = $lastVisited->title;
                    $visited["url"] = "https://www.watrbx.wtf/games/".$lastVisited->id."/" . $slugify->slugify($lastVisited->title);
                }

                $activity = "Offline";

                if($online){
                    $activity = "Online (Website)";
                }

                if($ingame){
                    $activity = "In-Game";
                }

                $render = "https:" . $thumbs->get_user_thumb($userinfo->id, "1024x1024", "full"); // have to do this so discord embeds dont complain (https:)
                $userdata = array(
                    "render"=>$render,
                    "id"=>$userinfo->id,
                    "username"=>$userinfo->username,
                    "regtime"=>$userinfo->regtime,
                    "membership"=>$userinfo->membership,
                    "blurb"=>$userinfo->blurb,
                    "activity"=>$activity,
                    "friendcount"=>"$friendCount",
                    "lastPlayed"=>$visited
                );
    
                $successjson = $api::create_success("Found userinfo!", $userdata, 200);
                die($successjson);
            } else {
                die($api::create_error("Couldn't find user!", '', 404));
            }
        }
    });
    
    $router->post("/gen-maint-link", function () {
        header("Content-type: application/json");

        $api = new watrlabs\api;
        $func = new sitefunctions();
        $userid = $_POST["userid"];
        $expires = time() + 5000000;
        $code = $func->genstring(25);
        $data = array(
            "url"=>"https://www.watrbx.wtf/?validate=$code",
            "expires"=>$expires
        );

        global $db;

        $insert = array(
            "code"=>$code,
            "discord_user"=>$userid,
            "expires"=>$expires
        );
        
        $db->table("maintcodes")->insert($insert);
        $successjson = $api::create_success("Maintenance code generated successfully!", $data, 200);

        die($successjson);
    });
    
}, 'is_bot_authenticated');