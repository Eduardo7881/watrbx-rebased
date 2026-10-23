<?php

use watrbx\thumbnails;
use watrlabs\router\Routing;
use watrlabs\watrkit\sanitize;
use watrlabs\authentication;
use watrbx\gameserver;
use watrbx\catalog;
use Cocur\Slugify\Slugify;
use watrbx\sitefunctions;
use watrbx\relationship\friends;
use Aws\S3\S3Client;
use Carbon\Carbon;
use watrlabs\logging\discord;
use watrlabs\fastflags;
use watrlabs\watrkit\pagebuilder;
use watrbx\email;
use watrlabs\pagination;
use rbx\roblox;
use watrbx\RBX;
use watrbx\Memberships;
use rbx\ItemInfo;

global $router; // IMPORTANT: KEEP THIS HERE!
global $db;
global $currentuser;

//$auth = new authentication();

/*
function create_error($error, $otherstuff = array(), $code = 400){
    http_response_code($code);
    header("Content-type: application/json");
    $array = array(
        "success"=>false,
        "error"=>$error,
        "data"=>$otherstuff
    );

    return json_encode($array);
}

function create_success($msg, $otherstuff = array(), $code = 200){
    http_response_code($code);
    header("Content-type: application/json");
    $array = array(
        "success"=>true,
        "msg"=>$msg,
        "data"=>$otherstuff
    );

    return json_encode($array);
}

function get_signature($script)
{
    $signature = "";
    openssl_sign($script, $signature, file_get_contents("../storage/PrivateNut.pem"), OPENSSL_ALGO_SHA1);
    return base64_encode($signature);
}
*/

function require_auth() {
    $gm = new gameserver();
    $isgameserver = $gm->is_gameserver_ip($ip);

    if (!$isgameserver) {
        global $currentuser;
        if (!$currentuser) { // unauthenticated
            http_response_code(403);
            header("Location: /");
            die("GET OUT!!!1");
        }
    }
}

/*$requireaccount = function() {
    global $currentuser;
    if (!$currentuser) {
        http_response_code(403);
        header("Location: /newlogin");
        die("GET OUT!!!!!!");
    }
};
*/

function requireaccount() {
    global $currentuser;
    if (!$currentuser) {
        http_response_code(403);
        header("Location: /newlogin");
        die("GET OUT!!!!!!");
    }
}

/* --------------- V1 --------------- */
$router->group("/v1", function($router) {
    $router->get("/asset", function() {
        $assetId = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
        if ($assetId === false || $assetId === null || $assetId <= 0) {
            //http_response_code(400);
            die(create_error("Invalid asset id!", [], 400));
        }

        header("Location: /Asset/?id=" . (string)$assetId);
        die();
    });

    $router->get("/authentication-ticket", function() {
        requireaccount();

        $ticket = "diddy";
        header("rbx-authentication-ticket: " . $ticket);
    });

    $router->get("/avatar", function() {
        requireaccount();
        global $db;

        /*
            Response:
            {
                'scales': { // r15
                    'height': int,
                    'width': int,
                    'head': int,
                    'depth': int,
                    'proportion': ???,
                    'bodyType': string
                },
                'playerAvatarType': string // R6/R15
                'bodyColors': [
                    'headColorId': int,
                    'torsoColorId': int,
                    'rightArmColorId': int,
                    'rightLegColorId': int,
                    'leftArmColorId': int,
                    'leftLegColorId': int,
                ],
                'assets': [
                    // array
                    $assets[] = [
                        id: int,
                        name: string,
                        assetType = [
                            id: int (type id)
                            name: string (type name)
                        ],
                        currentVersionId: int (assetid)
                    ]
                ],
                'defaultShirtApplied': bool,
                'defaultPantsApplied': bool,
                'emotes' = [
                    // array
		    $emotes[] = [
                        assetId: int,
                        assetName: string,
                        position: int // count($emotes) + 1
                    ]
                ],
            }
        */

        header("Content-Type: application/json");
        $auth = new authentication;
        $bodyColors = $auth->get_body_colors($currentuser->id);

        $response = [
            "scales" => [
                "height" => 0,
                "width" => 0,
                "head" => 0,
                "depth" => 0,
                "proportion" => 0,
                "bodyType" => "" // NOT r6 or r15
            ], // R15 shit
            "playerAvatarType" => "R6",
            "bodyColors" => [
                "headColorId" => $bodyColors["Head"],
                "torsoColorId" => $bodyColors["Torso"],
                "rightArmColorId" => $bodyColors["RightArm"],
                "rightLegColorId" => $bodyColors["RightLeg"],
                "leftArmColorId" => $bodyColors["LeftArm"],
                "leftLegColorId" => $bodyColors["LeftLeg"]
            ],
            "assets" => [],
            "defaultShirtApplied" => true,
            "defaultPantsApplied" => true,
            "emotes" => []
        ];

        $addEmote = function($name, $id) {
            $response["emotes"][] = [
                "assetId" => (int)$id,
                "assetName" => (string)$name,
                "position" => count($response["emotes"]) + 1
            ];
        };

        $addAsset = function($name, $id, $type, $typeName) {
            $response["assets"][] = [
                "id" => $id,
                "name" => $name,
                "assetType" => [
		    "id" => $type,
                    "name" => $typeName
                ],
                "currentVersionId" => 1
            ];
        };

        $wearing = $db->table("wearingitems")->where("userid", "=", $currentuser->id)->get();
        if (is_array($wearing)) {
            foreach ($wearing as $item) {
                $itemId = $item->itemid;
                $itemInfo = $db->table("assets")->where("id", "=", $itemId)->first();
                if ($itemInfo !== null) {
                    $itemType = $itemInfo->prodcategory;
                    $itemTypeName = RBX::get_friendly_asset_type_for_object($itemInfo);
                    $addAsset($itemInfo->name, $itemInfo->id, $itemType, $itemTypeName);
                }
            }
        }

        echo json_encode($response, true);
        die();
    });
}, 'require_auth');

/* --------------- V2 --------------- */
$router->group("/v2", function($router) {
    $router->post("/user/passwords/change", function() {
        requireaccount();
        global $db;
        global $currentuser;

        $oldHashedPassword = $currentuser->password;

        $newPassword = urldecode($_POST['newPassword']);
        $currentPassword = urldecode($_POST['currentPassword']);

        $newPassword = filter_var($newPassword, FILTER_SANITIZE_FULL_SPECIAL_CHARS, FILTER_FLAG_NO_ENCODE_QUOTES);
        $currentPassword = filter_var($currentPassword, FILTER_SANITIZE_FULL_SPECIAL_CHARS, FILTER_FLAG_NO_ENCODE_QUOTES);
        if (!password_verify($currentPassword, $oldHashedPassword)) die(create_error("Invalid password.", [], 400));
        if ($newPassword === $currentPassword) die(create_error("Cannot change the password to the current one.", [], 400));

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        $db->table("users")->where("id", "=", $currentuser->id)->update(['password'=>$hashedPassword]);
        setcookie(".ROBLOSECUITY", "ThisIsSuperInvalid!!!!", 67, "/");

        $auth = new authentication;
        $auth->login($currentuser->username, $hashedPassword);
    });
}, 'require_auth');
?>
