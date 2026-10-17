<?php
use watrlabs\router\Routing;

global $router; // IMPORTANT: KEEP THIS HERE!

$router->get("/account/two-step-enabled", function () {
    return [
        "isEnabled"=>true,
        "authProviders"=> ["Email", "AuthenticatorApp"],
        "backupCodesRemaining"=> 8
    ];
});

$router->get("/notifications/v1/get-settings", function () {
    return [
        "settings" => [
            [
                "notificationType" => "FriendRequestReceived",
                "destinationTypes" => ["Web", "Push", "Email"],
                "enabled" => true
            ],
            [
                "notificationType" => "PrivateMessageReceived",
                "destinationTypes" => ["Web", "Push"],
                "enabled" => true
            ],
            [
                "notificationType" => "TradeCompleted",
                "destinationTypes" => ["Web"],
                "enabled" => false
            ]
        ],
        "optOutDestinationTypes" => ["Email"]
    ];
});

$router->get('/my/settings/json', function() {
    global $currentuser;

    if($currentuser){
        $data = [
            "Username"=>$currentuser->username,
            "UserEmail" => $currentuser->email,
            "IsEmailOnFile" => (bool) $currentuser->email,
            "IsEmailVerified" => (bool) $currentuser->email_verified,
            "BirthYear" => 2009,
            "BirthMonth" => 12,
            "BirthDay" => 28,
            "Gender" => "2",
            "CountryId" => 1,
            "PersonalBlurb" => $currentuser->about,
            "ReceiveNewsletter" => false,
            "Facebook" => "",
            "Twitter" => "",
            "GooglePlus" => "",
            "YouTube" => "",
            "Twitch" => "",
            "SocialNetworksVisibilityPrivacyValue" => "AllUsers",
            "ChatVisibilityPrivacy" => "All",
            "PrivateMessagePrivacy" => "All",
            "PartyInvitePrivacy" => "All",
            "PrivateServerInvitePrivacy" => "All",
            "FollowMePrivacy" => "All",
            "TradeAccessibility" => "All",
            "TradeValueId" => 2,
            "IsOBC" => true,
            "BcLevel" => "BuildersClub",
            "BcExpireDate" => "/Date(1735689600000)/",
            "HasCurrencyOperationError" => true,
            "CurrencyOperationErrorMessage" => "You're too broke to afford buildersclub, consider becoming employed.",
            "RobuxRemainingForUsernameChange" => 1000,
            "BlockedUsersModel" => [
                "Total" => 2,
                "BlockedUsers" => [
                    [
                        "uid" => 1251,
                        "Name" => "VMware"
                    ],
                    [
                        "uid" => 47,
                        "Name" => "SolidSoirb"
                    ]
                ]
            ],
            "AllowedNotificationSourceTypes" => [
                "FriendRequestReceived",
                "FriendRequestAccepted",
                "PartyInviteReceived",
                "PartyMemberJoined",
                "ChatNewMessage",
                "PrivateMessageReceived"
            ],
            "AllowedReceiverDestinationTypes" => [
                "NotificationStream",
                "DesktopPush",
                "MobilePush"
            ],
            "NotificationSettingsDomain" => "https://www.watrbx.wtf",
            "ApiProxyDomain" => "https://api.watrbx.wtf",
            "MinimumChromeVersionForPushNotifications" => "46",
            "PushNotificationsEnabledOnFirefox" => false,
            "BlacklistedNotificationSourceTypesForMobilePush" => []
        ];

        return $data;
    }
});