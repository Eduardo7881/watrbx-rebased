<?php
use watrlabs\router\Routing;
use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;
use watrbx\Memberships;

global $router; // IMPORTANT: KEEP THIS HERE!

$router->get("/game/GetCurrentUser.ashx", function() {
    $auth = new authentication();

    if($auth->hasaccount()){
        global $currentuser;
        $userinfo = $currentuser;

        if($userinfo !== null){
            echo $userinfo->id;
            die();
        } else {
            setcookie(".ROBLOSECURITY", "", time() - 9999999, "/");
            die();
        }
    }

    die();
});

$router->post('/ide/publish/uploadnewasset', function(){ 
    die();
});

$router->get('/login/RequestAuth.ashx', function(){
    global $currentuser;

    if($currentuser !== null && isset($_COOKIE["_ROBLOSECURITY"])){
        http_response_code(200);
        setcookie(".ROBLOSECURITY", $_COOKIE["_ROBLOSECURITY"], time() + 8600, "/");
        echo $_ENV["BASE_URL"] . "/Login/Negotiate.ashx?suggest=" . $_COOKIE["_ROBLOSECURITY"];
        die();
    } else {
        http_response_code(401);
        setcookie(".ROBLOSECURITY", "", time() - 9999999, "/");
        die("User is not authorized.");
    }
});

$router->get('/Game/Edit.ashx', function(){
    header("Content-type: text/lua");
    http_response_code(200);
    die(require("../storage/edit.php"));
});

$router->get('/game/visit.ashx', function(){
    header("Content-type: text/lua");
    http_response_code(200);
    die(require("../storage/visit.php"));
});

$router->get('/game/gameserver.ashx', function(){
    header("Content-type: text/lua");
    http_response_code(200);
    die(require("../storage/studiogameserver.php"));
});

$router->get('/ide/welcome', function(){
    header("Location: /newlogin");
    die();
});

$router->get('/ide/update', function(){
    $pagebuilder = new pagebuilder;
    $pagebuilder::get_template("ide/update");
});

$router->get('/places/{placeid}/settings', function($Placeid){ // todo
    header("Content-type: application/json");
    die("{}");
});

$router->get('/developerproducts/list', function(){ //todo
    header("Content-type: application/json");
    die('{
  "data": [
    {
      "ProductId": 456789,
      "Name": "100 Coins",
      "PriceInRobux": 10
    }
  ],
  "FinalPage": true
}

');
});

$router->get('/universes/get-aliases', function(){
    header("Content-type: application/json");
    die('{}');
});

$router->get('/badges/list-badges-for-place/json', function(){
    header("Content-type: application/json");
    die('{}');
});

$router->get('/universes/get-info', function(){
    if(isset($_GET["universeId"])){
        $universeid = (int)$_GET["universeId"];

        global $db;

        $universeinfo = $db->table("universes")->where("id", $universeid)->first();

        if($universeinfo !== null){
            $data = [
                "Name" => $universeinfo->title,
                "Description" => $universeinfo->description,
                "RootPlace" => 1,
                "StudioAccessToApisAllowed" => true,
                "CurrentUserHasEditPermissions" => true,
                "UniverseAvatarType" => "MorphToR6"  //  todo
            ];
            header("Content-type: application/json");
            die(json_encode($data));
        }

    }

    die('');
});

$router->get('/IDE/ClientToolbox.aspx', function(){
    $pagebuilder = new pagebuilder;
    $pagebuilder::get_template("ide/clienttoolbox");
});

$router->get('/universes/get-universe-places', function(){
    http_response_code(200);

    global $db;

    if(isset($_GET["universeId"])){
        $universeid = (int)$_GET["universeId"];
        $universeinfo = $db->table("universes")->where("id", $universeid)->first();

        $return = [
            "FinalPage"=>true,
            "RootPlace"=>$universeinfo->assetid,
            "Places"=>[
                [
                    "PlaceId"=>$universeinfo->assetid,
                    "Name"=>$universeinfo->title
                ],
            ],
            "PageSize"=>50
        ];

        die(json_encode($return));
    }

    die('{"FinalPage":true,"RootPlace":1,"Places":[{"PlaceId":1,"Name":"Test"}],"PageSize":50}');
});

$router->get('/universes/get-universe-containing-place', function(){
    if(isset($_GET["placeid"])){
        $placeid = $_GET["placeid"];

        global $db;

        $universeinfo = $db->table("universes")->where("assetid", $placeid)->first();

        if($universeinfo !== null){
            $returnarray = [
                "UniverseId"=>$universeinfo->id
            ];

            die(json_encode($returnarray));
        }

        http_response_code(404);
        die();

    } else {
        http_response_code(400);
        die();
    }
});

$router->get('/IDE/Upload.aspx', function() {
    $pagebuilder = new pagebuilder;
    $pagebuilder::get_template("ide/upload");
});

$router->get('/ide/publish/new', function() {
    $pagebuilder = new pagebuilder;
    $pagebuilder::get_template("ide/new");
});

$router->get('/my/settings/json', function() {
    header("Content-type: application/json");
    global $currentuser;
    global $db;

    $blocked = $db->table("blockedusers")->where("userId", "=", $currentuser->id)->get();
    $blockedIds = [];

    foreach ($blocked as $item) {
        $blockedIds[] = $item->blockedId;
    }

    if($currentuser !== null){
        $membershipId = RBXMemberships::getIdFromName($currentuser->membership);
        $usernameChanges = $db->table("usernamechanges")->where("userid", "=", $currentuser->id)->get();
        
        $changes = [];
        foreach ($usernameChanges as $item) { $changes[] = $item->oldusername; }

        $data = [
            "AccountAgeInDays" => round((time() - $currentuser->regtime) / 86400),
            "AccountSettingsApiDomain" => $_ENV["BASE_URL"],
            "AgeBracket" => 0,
            "AllowedNotificationSourceTypes" => [
                "Test", "FriendRequestReceived", "FriendRequestAccepted", "PartyInviteReceived",
                "PartyMemberJoined", "ChatNewMessage", "PrivateMessageReceived",
                "UserAddedToPrivateServerWhiteList", "ConversationUniverseChanged", "TeamCreateInvite",
                "GameUpdate", "DeveloperMetricsAvailable"
            ],
            "AllowedReceiverDestinationTypes" => ["DesktopPush", "NotificationStream"],
            "ApiProxyDomain" => $_ENV["BASE_URL"],
            "AuthDomain" => $_ENV["BASE_URL"],
            "BcExpireDate" => "/Date(-0)/",
            "BcLevel" => $currentuser->membership,
            "BcRenewalPeriod" => null,
            "BlacklistedNotificationSourceTypesForMobilePush" => [],
            "BlockedUsersModel" => [
                "BlockedUserIds" => $blockedIds,
                "BlockedUsers" => [],
                "MaxBlockedUsers" => 50,
                "Page" => 1,
                "Total" => 1
            ],
            "CanHideInventory" => false,
            "CanTrade" => true,
            "ChangeEmailRequiresTwoStepVerification" => false,
            "ChangePassword" => false,
            "ChangePasswordRequiresTwoStepVerification" => false,
            "ChangeUsernameEnabled" => true,
            "ClientIpAddress" => "127.0.0.1",
            "CurrencyOperationErrorMessage" => null,
            "DisplayName" => $currentuser->username,
            "Facebook" => null,
            "FastTrackMember" => null,
            "HasCurrencyOperationError" => false,
            "HasFreeNameChange" => false,
            "HasValidPasswordSet" => true,
            "InApp" => false,
            "IsAccountPinEnabled" => true,
            "IsAccountPrivacySettingsV2Enabled" => true,
            "IsAccountRestrictionsFeatureEnabled" => true,
            "IsAccountRestrictionsSettingEnabled" => false,
            "IsAccountSettingsSocialNetworksV2Enabled" => false,
            "IsAdmin" => $currentuser->is_admin == 1,
            "IsAgeDownEnabled" => false,
            "IsAnyBC" =>"None",
            "IsAppChatSettingEnabled" => true,
            "IsBcRenewalMembership" => false,
            "IsDisconnectFbSocialSignOnEnabled" => true,
            "IsDisconnectXboxEnabled" => true,
            "IsEmailOnFile" => true,
            "IsEmailVerified" => $currentuser->email_verified,
            "IsFastTrackAccessible" => false,
            "IsGameChatSettingEnabled" => true,
            "IsI18nBirthdayPickerInAccountSettingsEnabled" => true,
            "IsOBC" => $membershipId === 3, // 0 = none, 1 = bc, 2 = tbc, 3 = obc, 4 = premium
            "IsPhoneFeatureEnabled" => false,
            "IsPremium" => $membershipId === 4,
            "IsPromotionChannelsEndpointEnabled" => true,
            "IsSendVerifyEmailApiEndpointEnabled" => true,
            "IsSetPasswordNotificationEnabled" => false,
            "IsSuperSafeModeEnabledForPrivacySetting" => false,
            "IsTBC" => $membershipId === 2,
            "IsTwoStepToggleEnabled" => false,
            "IsUiBootstrapModalV2Enabled" => true,
            "IsUnder13UpdateEmailMessageSectionShown" => false,
            "IsUpdateEmailApiEndpointEnabled" => true,
            "IsUpdateEmailSectionShown" => true,
            "IsUserConnectedToFacebook" => false,
            "LocaleApiDomain" => $_ENV["BASE_URL"],
            "MinimumChromeVersionForPushNotifications" => 50,
            "MissingParentEmail" => false,
            "MyAccountSecurityModel" => [
                "IsEmailSet" => ($currentuser->email !== ''),
                "IsEmailVerified" => $currentuser->email_verified,
                "IsTwoStepEnabled" => false,
                "ShowSignOutFromAllSessions" => true,
                "TwoStepVerificationViewModel" => [
                    "CodeLength" => 6,
                    "IsEnabled" => false,
                    "UserId" => $currentuser->id,
                    "ValidCodeCharacters" => null
                ]
            ],
            "Name" => $currentuser->username,
            "NotificationSettingsDomain" => $_ENV["BASE_URL"],
            "PreviousUserNames" => implode("; ", $changes), // is this the separator or what?
            "PushNotificationsEnabledOnFirefox" => true,
            "ReceiveNewsletter" => false,
            "RobuxRemainingForUsernameChange" => 1000 - $currentuser->robux,
            "SocialNetworksVisibilityPrivacy" => $currentuser->social_networks_visibility ?? 6,
            "SocialNetworksVisibilityPrivacyValue" => "AllUsers", // TODO: Update ts too
            "Tab" => null,
            "Twitch" => null,
            "Twitter" => null,
            "UseSuperSafeChat" => false,
            "UseSuperSafePrivacyMode" => false,
            "UserAbove13" => true,
            "UserEmail" => $currentuser->email,
            "UserEmailMasked" => true,
            "UserEmailVerified" => $currentuser->email_verified,
            "UserId" => $currentuser->id,
            "YouTube" => $currentuser->youtube ?? null,
            "CountryId" => $currentuser->countrycode ?? 1 // le states
        ];

        echo json_encode($data);
        die();
    } else {
        http_response_code(401);
        die();
    }
});

$router->get("/account/settings/countries", function() {
    $errorresult = [
        "success" => false,
        "errorMessage" => null,
        "countryList" => []
    ];
    
    header("Content-Type: application/json");
    $auth = new authentication;
    if (!$auth->hasaccount()) {
        $errorresult["errorMessage"] = "Unauthenticated.";
        echo json_encode($errorresult, true);
        die();
    }
   
    $json = file_get_contents(__DIR__ . "/../storage/countries.json");
    if ($json == '' || $json == false || $json == null) {
        $errorresult["errorMessage"] = "Failed to parse JSON.";
        echo json_encode($errorresult, true);
        die();
    }

    echo $json;
    die();
});

$router->get('/game/logout.aspx', function() {
    setcookie(".ROBLOSECURITY", "ThisIsInvalid!!!!", time() - 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
    header("Location: /newlogin");
    die("[]");
});
