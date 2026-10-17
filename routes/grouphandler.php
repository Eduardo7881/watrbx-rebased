<?php

use watrlabs\api;
use watrlabs\logging\discord;
global $router;

$router->post('/api/v1/group-join', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);

    if (!$currentuser) { http_response_code(401); die($api::create_error("Not logged in.")); }

    $groupId = (int)$_POST["groupId"];

    $alreadyIn = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->first();

    if ($alreadyIn) {
        die($api::create_error("You are already in this group."));
    }

    // always get the member role (priority 1) specifically
    $memberRole = $db->table("group_roles")
        ->where("groupid", $groupId)
        ->where("priority", 1)
        ->first();

    if (!$memberRole) {
        // fallback to lowest role if no priority 1 exists
        $memberRole = $db->table("group_roles")
            ->where("groupid", $groupId)
            ->where("priority", "<", 255)
            ->orderBy("priority", "ASC")
            ->first();
    }

    if (!$memberRole) {
        die($api::create_error("Group has no roles to join."));
    }

    $db->table("hasrole")->insert([
        "userid" => $currentuser->id,
        "roleid" => $memberRole->id
    ]);

    $discord->internal_log($currentuser->username . " joined group id $groupId", "Groups");
    die($api::create_success("Joined group!"));
});

$router->post('/api/v1/group-shout', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die($api::create_error("Not logged in.")); }

    $groupId = (int)$_POST["groupId"];
    $shout   = htmlspecialchars(trim($_POST["shout"] ?? ""));

    if ($shout === "") {
        die($api::create_error("Shout cannot be empty."));
    }

    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    if (!$myRole || $myRole->priority < 100) {
        die($api::create_error("You don't have permission to shout."));
    }

    $db->table("groups")->where("id", $groupId)->update(["shout" => $shout]);

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);
    $discord->internal_log($currentuser->username . " posted a group shout \"$shout\" at group $groupId", "Groups");

    die($api::create_success("Shout updated!"));
});

$router->post('/api/v1/group-wall-post', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die($api::create_error("Not logged in.")); }

    $groupId = (int)$_POST["groupId"];
    $content = htmlspecialchars(trim($_POST["post"] ?? ""));
    $content = trim($_POST["post"] ?? "");

    if ($content === "") {
        die($api::create_error("Post cannot be empty."));
    }

    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->first();

    if (!$myRole) {
        die(create_error("You are not in this group."));
    }

    $db->table("group_wall")->insert([
        "groupid" => $groupId,
        "userid"  => $currentuser->id,
        "content" => $content,
        "date"    => time()
    ]);

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);
    $discord->internal_log($currentuser->username . " posted a group wall post \"$content\" at group $groupId", "Groups");

    die($api::create_success("Posted!"));
});

$router->get('/api/v1/group-kick', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die(); }

    $groupId = (int)$_GET["groupId"];
    $userId  = (int)$_GET["userId"];

    // make sure current user has a higher role than the target
    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    $theirRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $userId)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    if (!$myRole || !$theirRole || $myRole->priority <= $theirRole->priority) {
        http_response_code(403);
        die("You can't kick this user.");
    }

    $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $userId)
        ->where("group_roles.groupid", $groupId)
        ->delete();

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);
    $discord->internal_log($currentuser->username . " was kicked from group id $groupId", "Groups");

    header("Location: /My/GroupAdmin.aspx?gid=" . $groupId);
    exit;
});

$router->post('/api/v1/group-change-role', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die(); }

    $groupId = (int)$_POST["groupId"];
    $userId  = (int)$_POST["userId"];
    $roleId  = (int)$_POST["roleId"];

    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    $targetRole = $db->table("group_roles")->where("id", $roleId)->where("groupid", $groupId)->first();

    if (!$myRole || !$targetRole || $myRole->priority <= $targetRole->priority) {
        http_response_code(403);
        die("You can't assign this role.");
    }

    $hasrole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $userId)
        ->where("group_roles.groupid", $groupId)
        ->select("hasrole.id")
        ->first();

    if ($hasrole) {
        $db->table("hasrole")->where("id", $hasrole->id)->update(["roleid" => $roleId]);
    }

    header("Location: /My/GroupAdmin.aspx?gid=" . $groupId);
    exit;
});

$router->post('/api/v1/group-update', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die(); }

    $groupId = (int)$_GET["groupId"];

    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    if (!$myRole || $myRole->priority < 255) {
        http_response_code(403);
        die("Only the owner can do this.");
    }

    $desc = htmlspecialchars(trim($_POST["description"] ?? ""));

    $db->table("groups")->where("id", $groupId)->update(["description" => $desc]);

    header("Location: /My/GroupAdmin.aspx?gid=" . $groupId);
    exit;
});

$router->post('/api/v1/group-create-role', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die(); }

    $groupId  = (int)$_GET["groupId"];
    $name     = htmlspecialchars(trim($_POST["name"] ?? ""));
    $priority = (int)$_POST["priority"];

    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    if (!$myRole || $myRole->priority < 255) {
        http_response_code(403);
        die("Only the owner can do this.");
    }

    if ($priority < 1 || $priority > 254 || $name === "") {
        http_response_code(400);
        die("Invalid input.");
    }

    $db->table("group_roles")->insert([
        "name"    => $name,
        "priority" => $priority,
        "groupid" => $groupId
    ]);

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);
    $discord->internal_log($currentuser->username . " created a group role \"$name\", at group $groupId", "Groups");

    header("Location: /My/GroupAdmin.aspx?gid=" . $groupId);
    exit;
});

$router->get('/api/v1/group-delete-role', function(){
    global $currentuser;
    global $db;

    $api = new watrlabs\api();

    if (!$currentuser) { http_response_code(401); die(); }

    $groupId = (int)$_GET["groupId"];
    $roleId  = (int)$_GET["roleId"];

    $myRole = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->where("hasrole.userid", $currentuser->id)
        ->where("group_roles.groupid", $groupId)
        ->select("group_roles.priority")
        ->first();

    if (!$myRole || $myRole->priority < 255) {
        http_response_code(403);
        die("Only the owner can do this.");
    }

    // make sure no one is using this role before deleting
    $inUse = $db->table("hasrole")->where("roleid", $roleId)->count();
    if ($inUse > 0) {
        die("Can't delete a role that still has members in it.");
    }

    $db->table("group_roles")->where("id", $roleId)->where("groupid", $groupId)->delete();

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);
    $discord->internal_log($currentuser->username . " deleted a group role ID: $roleId, at group $groupId", "Groups");

    header("Location: /My/GroupAdmin.aspx?gid=" . $groupId);
    exit;
});
