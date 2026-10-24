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

    $router->post("/login", function() {
        $func = new sitefunctions();
        $canlogin = $func->get_setting("CAN_LOGIN");

        if($canlogin == "false"){
            create_error("Login is currently disabled.");
            die();
        }

        $makeResponse = function($user, $type) {
            if ($type == "legacy") {
                return [
                    'membershipType' => RBXMemberships::getIdFromName($user->membership),
                    'username'       => $user->username,
                    'isUnder13'      => false,
                    'countryCode'    => 0,
                    'userId'         => $user->id,
                    //'displayName'   => $user->username
                ];
            } else {
                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->username,
                        //'displayName' => $user->username
                    ],
                    'isBanned' => false
                ];
            }
        };

        $sendJson = function(array $data, int $status = 200) {
            http_response_code($status);
            echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            exit;
        };

        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Robots-Tag: noindex');

        $longLifetime = time() + (30 * 24 * 60 * 60); // 1 month
        $shortLifetime = time() + (24 * 60 * 60);     // 1 day
        $isMobileClient = false;

        if (strpos($userAgent, 'Roblox') !== false || strpos($userAgent, 'GooglePlayStore') !== false) {
            $isMobileClient = true;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $isJsonRequest = stripos($contentType, 'application/json') !== false;
        $jsonData = [];

        if ($isJsonRequest) {
            $rawBody = file_get_contents('php://input');
            $decodedData = json_decode($rawBody, true);

            if (is_array($decodedData)) {
                $jsonData = $decodedData;
            }
        }

        /* Post Form */
    	if (isset($_POST['username'], $_POST['password']) && $_POST['username'] !== '' && $_POST['password'] !== '') {
            $username = (string)$_POST['username'];
            $password = (string)$_POST['password'];
            $responseType = "legacy";
    	} elseif (isset($jsonData['cvalue'], $jsonData['password']) && $jsonData['cvalue'] !== '' && $jsonData['password'] !== '') {
            $username = (string)$jsonData['cvalue'];
            $password = (string)$jsonData['password'];
            $responseType = "legacy";
    	} else {
            $sendJson(['message'=>'Username and password are required.'], 400);
    	}

    	$auth = new authentication();
   	$result = $auth->login($username, $password);

    	if(isset($result["code"])){
            if($result["code"] == 200){
                if ($auth->hasaccount() === false) $sendJson("You should go to the lottery. Something bad happened while logging in.", 500);
                $user = $auth->getuserinfo($_COOKIE[".ROBLOSECURITY"]);
                $sendJson($makeResponse($user, $responseType));
            } else {
                if(isset($result["message"])){
                    //$func->set_message($result["message"]);
                    //header("Location: /newlogin");
                    //die(create_error($result["message"], [], 200));
                    $sendJson(['message'=>$result->message], 500);
                } else {
                    //$func->set_message("Something went wrong. Please try again later.");
                    //header("Location: /newlogin");
                    //die(create_error("Something went wrong. Please try again later.", [], 200));
                    $sendJson(['message'=>"Something went wrong. Please try again later."], 500);
                }
            }
        } else {
            if(isset($result["message"])){
                //$func->set_message($result["message"]);
                //header("Location: /newlogin");
                //die(create_error($result["message"], [], 200));
                $sendJson(['message'=>$result->message], 500);
            } else {
                //$func->set_message("Something went wrong. Please try again later.");
                //header("Location: /newlogin");
                //die(create_error("Something went wrong. Please try again later.", [], 200));
                $sendJson(['message'=>"Something went wrong. Please try again later."], 500);
            }
        }
    });
}, 'require_auth');
?>
