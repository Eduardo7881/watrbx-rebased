<?php 
use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;
use watrlabs\router\Routing;
global $db;
global $currentuser;
$pagebuilder = new pagebuilder();
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=main___7000c43d73500e63554d81258494fa21_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___91ce90e508d798217cc5452e978970d5_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___486ee4e2def9b96aeaf9ebb663ab510e_m.css');
$pagebuilder->addresource('jsfiles', '/js/35442da4b07e6a0ed6b085424d1a52cb.js');
$pagebuilder->addresource('jsfiles', '/js/c5827143734572fa7bd8fcc79c3c126b.js.gzip');

$router = new Routing();

$showDisabledPage = false;
$accountBanned = false;
$offensivechat = null;

$auth = new authentication();
$auth->requiresession();

if($currentuser->deactivated == true) {
    $showDisabledPage = true;
}

if(isset($_GET["ID"])){
    $banid = (int)$_GET["ID"];
    $baninfo = $db->table("moderation")->where("id", $banid)->first();
    $canreactivate = false;
    if($baninfo !== null){

        $accountBanned = true;
        $showDisabledPage = false;

        if($baninfo->userid !== $currentuser->id){
            header("Location: /home");
        }

        if($baninfo->canignore == "1"){
            header("Location: /home");
        }

        switch ($baninfo->type){
            case "reminder":
                $canreactivate = true;
                $header = ucfirst($baninfo->type);
                break;
            case "warning":
                $canreactivate = true;
                $header = ucfirst($baninfo->type);
                break;
            case "days":
                if($baninfo->days == 1){
                    $header = "Banned for " . $baninfo->days . " day.";
                } else {
                    $header = "Banned for " . $baninfo->days . " days.";
                }
                $canreactivate = $baninfo->banneduntil < time();
                break;
            case "deleted":
                $header = "Account Deleted";
                $canreactivate = false;
                break;
        }
    } else {
        $router->return_status(404);
        die();
    }

} else {
    if(!$showDisabledPage){
        $router->return_status(404);
        die();
    }
}




if(isset($baninfo)){
    if($baninfo->offensiveitem !== null){
        $offensivechat = $db->table("chatlogs")->where("id", $baninfo->offensiveitem)->first();
    }
}
$pagebuilder->setlegacy(true);
$pagebuilder->set_page_name("Disabled Account");

$pagebuilder->buildheader();


if($showDisabledPage){
    $pagebuilder->build_component("moderation/accountdisabled");
} else {
    $pagebuilder->build_component("moderation/accountbanned", ["offensivechat"=>$offensivechat, "baninfo"=>$baninfo, "canreactivate"=>$canreactivate, "header"=>$header, "banid"=>$banid]);
}


 $pagebuilder->build_footer(); ?>