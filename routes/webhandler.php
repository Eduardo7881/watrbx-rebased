\<?php
use watrlabs\logging\discord;
use watrlabs\router\Routing;
use watrlabs\authentication;
use watrlabs\watrkit\pagebuilder;
use watrbx\thumbnails;
use watrlabs\watrkit\sanitize;
use watrbx\sitefunctions;
use watrbx\RBX;
use watrbx\Grid\Grid;
use watrbx\email;

global $router; // IMPORTANT: KEEP THIS HERE!

$router->get('/stats', function(){
    $page = new pagebuilder;
    $page::get_template("stats");
});

$router->get('/wasm/UniversalClient.html', function() {
    if (!isset($_GET['placeId'])) { http_response_code(400); die("Malformed place id param"); }
    if ($_GET['placeId'] < 1) { http_response_code(400); die("Invalid place id"); }

    $page = new pagebuilder;
    $page::get_template("UniversalClient", ["placeId"=>(int)$_GET['placeId']]);
});

$router->get('/game/GetAllowedExperimentalFeatures', function(){
    die("{}");
});

$router->get('/inbox', function() {
    header("Location: /my/messages");
});

// TODO: Make this less messier
$router->get('/marketplace/productinfo', function(){
    header("Content-type: application/json");

    ob_clean();

    if(isset($_GET["assetId"])){
        $auth = new authentication();
        $assetid = (int)$_GET["assetId"];
        /* 2025
        {"TargetId":1818,"ProductType":"User Product","AssetId":1818,"ProductId":1305046,"Name":"Classic: Crossroads","Description":"The classic ROBLOX level is back!","AssetTypeId":9,"Creator":{"Id":1,"Name":"Roblox","CreatorType":"User","CreatorTargetId":1,"HasVerifiedBadge":true},"IconImageAssetId":607948062,"Created":"2007-05-01T01:07:04.78Z","Updated":"2024-01-29T22:05:10.417Z","PriceInRobux":null,"PriceInTickets":null,"Sales":0,"IsNew":false,"IsForSale":false,"IsPublicDomain":false,"IsLimited":false,"IsLimitedUnique":false,"Remaining":null,"MinimumMembershipLevel":0,"ContentRatingTypeId":0,"SaleAvailabilityLocations":null,"SaleLocation":null,"CollectibleItemId":null,"CollectibleProductId":null,"CollectiblesItemDetails":null}
        */
        $productinfo = array(
            "Name" => "Unknown",
            "Description" => "[\r\n[52, 57, 57, 52, 56, 49, 57, 51],\r\n[50, 52, 57, 53, 55, 50, 55, 58],\r\n[56, 56, 52, 51, 52, 58, 57, 53],\r\n[52, 56, 54, 55, 53, 50, 52, 51],\r\n[52, 53, 58, 53, 55, 53, 54, 57],\r\n[55, 49, 51, 53, 51, 53, 57, 57],\r\n[54, 58, 57, 51, 58, 55, 54, 56],\r\n[53, 52, 51, 57, 51, 49, 50, 58]\r\n]",
            "Created" => "0",
            "Updated" => "0",
            "PriceInRobux" => 0,
            "PriceInTickets" => 0,
            "AssetId" => $assetid,
            "ProductId" => $assetid,
            "AssetTypeId" => 0,
            "Creator" => [
                "Id" => "0",
                "Name" => "Unknown",
                "CreatorType" => "User",
            ],
            "MinimumMembershipLevel" => 0,
            "IsForSale" => True,
        );

        global $db;
        $assetinfo = $db->table("assets")->where("id", $assetid)->first();

        if($assetinfo !== null){
            $creatorinfo = $auth->getuserbyid($assetinfo->owner);

            $productinfo["Name"] = htmlspecialchars_decode($assetinfo->name);
            $productinfo["Description"] = htmlspecialchars_decode($assetinfo->description);
            $productinfo["AssetTypeId"] = $assetinfo->prodcategory;
            $productinfo["Created"] = date('c', $assetinfo->created);
            $productinfo["Updated"] = date('c', $assetinfo->updated);
            $productinfo["PriceInRobux"] = $assetinfo->robux;
            $productinfo["PriceInTickets"] = $assetinfo->tix;

            $productinfo["Creator"]["Id"] = $creatorinfo->id;
            $productinfo["Creator"]["Name"] = $creatorinfo->username;
            $productinfo["Creator"]["CreatorType"] = "User";
        } else {
            try {
                die(file_get_contents("https://economy.ttblox.mom/v2/assets/$assetid/details"));
            } catch (ErrorException $e){
                die(json_encode($productinfo, JSON_UNESCAPED_SLASHES));
            }
        }

        http_response_code(200);
        die(json_encode($productinfo, JSON_UNESCAPED_SLASHES));

    } else {
        
        http_response_code(200);
        die(json_encode($productinfo, JSON_UNESCAPED_SLASHES));
        
    }
});

$router->get("/", function() {
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("index");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/account/signupredir", function() {
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("index");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get('/agree', function(){
    setcookie('has_read', 1, time() + 999999999, '', '.' . $_ENV["APP_DOMAIN"]);
    header("Location: /");
});

$router->get("/temp/decal-creator", function(){
    $page = new pagebuilder;
    $page::get_template("temp/decal-creator");
});

$router->get("/temp/audio-creator", function(){
    $page = new pagebuilder;
    $page::get_template("temp/audio-creator");
});

$router->get('/messages/compose', function(){
    $page = new pagebuilder;
    $auth = new authentication;
    $auth->createcsrf("compose");
    $page::get_template("compose");
    
});

$router->get('/download/thankyou', function(){
    $page = new pagebuilder;
    $page::get_template("download/thankyou");
});

$router->get('/Thumbs/Asset.ashx', function(){

    $sitefunc = new sitefunctions();
    
    if(isset($_GET["AssetID"]) && isset($_GET["dimensions"])){

        $dimensions = $_GET["dimensions"];
        $assetid = (int)$_GET["AssetID"];

        $dimensions = explode("x", $dimensions);
        global $db;

        $thumb = $db->table("thumbnails")->where("assetid", $assetid)->first();

        if($thumb !== null && isset($dimensions[0]) && isset($dimensions[1])){
            $thumbs = new thumbnails();

            $x = (int)$dimensions[0];
            $y = (int)$dimensions[1];

            $thumb = $thumbs->get_asset_thumb($assetid, "1024x1024");

            $image = file_get_contents("https:" . $thumb);
            $tempDir = sys_get_temp_dir();
            $tempName = $sitefunc->genstring(5);

            $File = $tempDir . "/" . $tempName;
            
            file_put_contents($tempDir . "/" . $tempName, $image);

            header("Content-type: image/png");
            die($sitefunc->resize_image($File, $x, $y, true));
        } else {
            $url = "https://thumbnails.roblox.com/v1/assets?assetIds=$assetid&format=PNG&size=512x512";
            $robloxapi = file_get_contents($url);

            if($robloxapi){
                $decoded = json_decode($robloxapi, true);
                $robloxthumb = $decoded["data"][0]["imageUrl"];
                header("Location: $robloxthumb");
                die();
            } else {
                die($robloxapi);
            }
        }
    }

    echo "hi";
});


$router->post('/messages/compose', function(){
    if(isset($_POST["subject"]) && isset($_POST["body"]) && isset($_POST["__EVENTTARGET"])){
        $subject = $_POST["subject"];
        $body = $_POST["body"];
        $userid = $_POST["__EVENTTARGET"];

        $auth = new authentication();
        $func = new sitefunctions();
        $page = new pagebuilder;
        global $currentuser;


        if(isset($_COOKIE["csrftoken"])){
            if(!$auth->verifycsrf($_COOKIE["csrftoken"], "compose")){
                $page::get_template("compose", ["error"=>"An unexpected error occured!"]);
                die();
            }
        } else {
            $page::get_template("compose", ["error"=>"An unexpected error occured!"]);
            die();
        }

        $recipient = $auth->getuserbyid($userid);

        if($auth->hasaccount()){
            if($recipient !== null){

                global $db;

                

                $msgcount = $db->table("messages")->where("userfrom", $currentuser->id)->where("date", ">", time() - 60)->count();

                if($msgcount >= 3){
                    $page = new pagebuilder;
                    $page::get_template("compose", ["error"=>"You're sending messages too fast!"]);
                } else {
                    $subject = htmlspecialchars($subject, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    $body = htmlspecialchars($body, ENT_QUOTES | ENT_HTML5, 'UTF-8');

                    $subject = $func::filter_text($subject);
                    $body = $func::filter_text($body);

                    $insert = array(
                        "userfrom"=>$currentuser->id,
                        "userto"=>$recipient->id,
                        "subject"=>$subject,
                        "body"=>$body,
                        "date"=>time()
                    );
                    $db->table("messages")->insert($insert);
                    $page = new pagebuilder;
                    $page::get_template("compose", ["success"=>"Message sent to " . $recipient->username . "!"]);
                }
                
            } else {
                $page = new pagebuilder;
                $page::get_template("compose", ["error"=>"Failed to send message."]);
            }
        } else {
            header("Location: /");
            die();
        }

    } else {
        $page = new pagebuilder;
        $page::get_template("compose", ["error"=>"Failed to send message. Are you sure you filled in everything?"]);
    }
});

$router->get("/users/{userid}/friends", function($userid) {
    $page = new pagebuilder;
    $page::get_template("user/friends", ["userid"=>$userid]);
});

$router->get("/Games.aspx", function(){
    header("Location: /games");
    die();
});

$router->get("/temp/create-asset", function(){
    $page = new pagebuilder;
    $page::get_template("temp/uploadasset");
});

$router->get("/temp/upload-thumbnail", function(){
    $page = new pagebuilder;
    $page::get_template("temp/upload-thumbnail");
});

$router->get("/temp/universe-creator", function(){
    $page = new pagebuilder;
    $page::get_template("temp/universe-creator");
});

$router->get("/users/{userid}/profile", function($userid) {
    $page = new pagebuilder;
    $page::get_template("user/profile", array("userid"=>$userid));
});

$router->get("/users/{userid}/inventory", function($userid) {
    $page = new pagebuilder;
    $page::get_template("user/inventory", ["userid"=>$userid]);
});

$router->get("/my/messages", function() {
    $page = new pagebuilder;
    $page::get_template("my/messages");
});

$router->get('/MEMBERSHIP/CREATIONDISABLED.aspx', function(){
    $page = new pagebuilder;
    $page::get_template("membership/creationdisabled");
});

$router->get('/Membership/NotApproved.aspx', function(){
    $page = new pagebuilder;
    $page::get_template("membership/notapproved");
});

$router->get('/admin', function() {
    $auth = new authentication();
    $auth->requiresession();
    $admin = $auth->getuserinfo();
    if (!$admin || (int)$admin->is_admin !== 1) {
        http_response_code(403);
        die('403 - Admin access required.');
    }
    $page = new pagebuilder;
    $page::get_template('admin');
});

$adminGuard = function() {
    $auth = new authentication();
    $auth->requiresession();
    $admin = $auth->getuserinfo();
    if (!$admin || (int)$admin->is_admin !== 1) { http_response_code(403); die("403 - Admin access required."); }
    return $admin;
};

$adminRedirect = function($message = null, $error = null) {
    $params = [];
    if ($message !== null) $params['message'] = $message;
    if ($error !== null) $params['error'] = $error;
    header('Location: /admin' . ($params ? '?' . http_build_query($params) : ''));
    die();
};


/* =====================================================================
 * ADMIN COMMAND TOOLKIT
 * Extra backend commands for the existing Admin Panel.
 * These are intentionally added to the current panel code instead of
 * replacing/rebuilding the panel.
 * ===================================================================== */

$adminJson = function($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    die();
};

$adminPositiveInt = function($value, $default = 0) {
    $value = filter_var($value, FILTER_VALIDATE_INT);
    return ($value !== false && $value >= 0) ? $value : $default;
};

// Search users without loading the whole user table. Useful for future
// AJAX/admin tools and safe to call only from an authenticated admin.
$router->get('/admin/command/search-users', function() use ($adminGuard, $adminJson) {
    global $db;
    $adminGuard();
    $q = trim($_GET['q'] ?? '');
    if ($q === '') return $adminJson(['users'=>[]]);
    $query = $db->table('users')->where('username', 'LIKE', '%'.$q.'%')->orderBy('id', 'DESC')->limit(25)->get();
    $users = [];
    foreach ($query as $u) {
        $users[] = ['id'=>(int)$u->id, 'username'=>$u->username, 'robux'=>(int)$u->robux, 'tix'=>(int)$u->tix, 'membership'=>$u->membership, 'is_admin'=>(int)$u->is_admin];
    }
    $adminJson(['users'=>$users]);
});

// Reset a user's password using the same password hashing mechanism used by
// the normal account system.
$router->post('/admin/command/reset-password', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $userid = (int)($_POST['userid'] ?? 0);
    $password = (string)($_POST['password'] ?? '');
    $user = $db->table('users')->where('id', $userid)->first();
    if (!$user) $adminRedirect(null, 'User not found.');
    if (strlen($password) < 6) $adminRedirect(null, 'Password must be at least 6 characters.');
    $db->table('users')->where('id', $userid)->update(['password'=>password_hash($password, PASSWORD_DEFAULT)]);
    $adminRedirect('Password reset for '.$user->username.'.');
});

// Force a user to log out from all current sessions.
$router->post('/admin/command/force-logout', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $admin = $adminGuard();
    $userid = (int)($_POST['userid'] ?? 0);
    $user = $db->table('users')->where('id', $userid)->first();
    if (!$user) $adminRedirect(null, 'User not found.');
    $db->table('sessions')->where('author', $userid)->delete();
    $adminRedirect('All sessions revoked for '.$user->username.'.');
});

// Completely remove a user's inventory without deleting the account.
$router->post('/admin/command/clear-inventory', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $userid = (int)($_POST['userid'] ?? 0);
    $user = $db->table('users')->where('id', $userid)->first();
    if (!$user) $adminRedirect(null, 'User not found.');
    $db->table('ownedassets')->where('userid', $userid)->delete();
    $adminRedirect('Inventory cleared for '.$user->username.'.');
});

// Remove one friendship/pending request in either direction.
$router->post('/admin/command/remove-friendship', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $userid = (int)($_POST['userid'] ?? 0);
    $friendid = (int)($_POST['friendid'] ?? 0);
    if ($userid <= 0 || $friendid <= 0 || $userid === $friendid) $adminRedirect(null, 'Invalid user IDs.');
    $db->table('friends')->where('userid', $userid)->where('friendid', $friendid)->delete();
    $db->table('friends')->where('userid', $friendid)->where('friendid', $userid)->delete();
    $adminRedirect('Friendship/request removed.');
});

// Broadcast a private message to every account.
$router->post('/admin/command/broadcast-message', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $admin = $adminGuard();
    $subject = trim($_POST['subject'] ?? '');
    $body = trim($_POST['body'] ?? '');
    if ($subject === '' || $body === '') $adminRedirect(null, 'Subject and body are required.');
    $subject = htmlspecialchars(substr($subject, 0, 255), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $body = htmlspecialchars($body, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $count = 0;
    foreach ($db->table('users')->get() as $user) {
        $db->table('messages')->insert(['userfrom'=>(int)$admin->id,'userto'=>(int)$user->id,'subject'=>$subject,'body'=>$body,'date'=>time(),'hasread'=>0]);
        $count++;
    }
    $adminRedirect('Broadcast sent to '.$count.' users.');
});

// Create a site-wide feed announcement using the existing feed table.
$router->post('/admin/command/create-announcement', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $admin = $adminGuard();
    $content = trim($_POST['content'] ?? '');
    if ($content === '') $adminRedirect(null, 'Announcement text is required.');
    $db->table('feed')->insert(['content'=>htmlspecialchars(substr($content, 0, 2000), ENT_QUOTES | ENT_HTML5, 'UTF-8'),'owner'=>(int)$admin->id,'date'=>time()]);
    $adminRedirect('Announcement published.');
});

// Remove old feed entries. Keeps the newest N posts.
$router->post('/admin/command/prune-feed', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $keep = max(1, min(5000, (int)($_POST['keep'] ?? 100)));
    $rows = $db->table('feed')->orderBy('id', 'DESC')->get();
    $deleted = 0;
    $index = 0;
    foreach ($rows as $row) {
        if ($index++ < $keep) continue;
        $db->table('feed')->where('id', (int)$row->id)->delete();
        $deleted++;
    }
    $adminRedirect('Pruned '.$deleted.' old feed entries.');
});

// Clear expired login/captcha/session records.
$router->post('/admin/command/cleanup', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $now = time();
    $sessions = $db->table('sessions')->where('expiration', '<=', $now)->delete();
    $captcha = $db->table('captchaverified')->where('time', '<=', $now)->delete();
    $adminRedirect('Cleanup complete. Expired sessions/captcha records removed.');
});

// Remove old request/page logs. Keeps the newest N rows.
$router->post('/admin/command/prune-logs', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $keep = max(1, min(100000, (int)($_POST['keep'] ?? 5000)));
    $rows = $db->table('logs')->orderBy('id', 'DESC')->get();
    $deleted = 0;
    $index = 0;
    foreach ($rows as $row) {
        if ($index++ < $keep) continue;
        $db->table('logs')->where('id', (int)$row->id)->delete();
        $deleted++;
    }
    $adminRedirect('Pruned '.$deleted.' old logs.');
});

// Change several catalog properties at once.
$router->post('/admin/command/update-asset', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $assetid = (int)($_POST['assetid'] ?? 0);
    $asset = $db->table('assets')->where('id', $assetid)->first();
    if (!$asset) $adminRedirect(null, 'Asset not found.');
    $allowed = ['robux','tix','status','publicdomain','rating','remaining'];
    $update = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $_POST) && $_POST[$field] !== '') {
            $value = (int)$_POST[$field];
            if (in_array($field, ['robux','tix','rating','remaining'], true)) $value = max(0, $value);
            $update[$field] = $value;
        }
    }
    if (!$update) $adminRedirect(null, 'No asset fields were supplied.');
    $update['updated'] = time();
    $db->table('assets')->where('id', $assetid)->update($update);
    $adminRedirect('Asset #'.$assetid.' updated.');
});

// Reset sales counter without deleting the item.
$router->post('/admin/command/reset-sales', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $assetid = (int)($_POST['assetid'] ?? 0);
    $asset = $db->table('assets')->where('id', $assetid)->first();
    if (!$asset) $adminRedirect(null, 'Asset not found.');
    $db->table('assets')->where('id', $assetid)->update(['sales'=>0,'updated'=>time()]);
    $adminRedirect('Sales counter reset for asset #'.$assetid.'.');
});

// Clear all ratings/votes for an asset.
$router->post('/admin/command/clear-likes', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $assetid = (int)($_POST['assetid'] ?? 0);
    $asset = $db->table('assets')->where('id', $assetid)->first();
    if (!$asset) $adminRedirect(null, 'Asset not found.');
    $db->table('likes')->where('assetid', $assetid)->delete();
    $adminRedirect('Votes cleared for asset #'.$assetid.'.');
});

// Update a game's public settings without touching its place asset.
$router->post('/admin/command/update-universe', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $id = (int)($_POST['id'] ?? 0);
    $game = $db->table('universes')->where('id', $id)->first();
    if (!$game) $adminRedirect(null, 'Universe not found.');
    $update = [];
    if (isset($_POST['title'])) $update['title'] = htmlspecialchars(substr(trim($_POST['title']), 0, 255), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    if (isset($_POST['description'])) $update['description'] = htmlspecialchars(substr(trim($_POST['description']), 0, 5000), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    if (isset($_POST['maxplayers'])) $update['maxplayers'] = max(1, min(200, (int)$_POST['maxplayers']));
    if (isset($_POST['public'])) $update['public'] = (int)((bool)$_POST['public']);
    if (isset($_POST['privateserverenabled'])) $update['privateserverenabled'] = (int)((bool)$_POST['privateserverenabled']);
    if (isset($_POST['privateserverprice'])) $update['privateserverprice'] = max(0, (int)$_POST['privateserverprice']);
    if (!$update) $adminRedirect(null, 'No universe fields were supplied.');
    $db->table('universes')->where('id', $id)->update($update);
    $adminRedirect('Universe #'.$id.' updated.');
});

// Delete a universe and its visit records.
$router->post('/admin/command/delete-universe', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $id = (int)($_POST['id'] ?? 0);
    if (!$db->table('universes')->where('id', $id)->first()) $adminRedirect(null, 'Universe not found.');
    $db->table('visits')->where('universeid', $id)->delete();
    $db->table('badges')->where('universeid', $id)->delete();
    $db->table('universes')->where('id', $id)->delete();
    $adminRedirect('Universe #'.$id.' deleted.');
});

// Job/server maintenance commands.
$router->post('/admin/command/job-action', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $jobid = (int)($_POST['id'] ?? 0);
    $action = $_POST['action'] ?? '';
    $job = $db->table('jobs')->where('id', $jobid)->first();
    if (!$job) $adminRedirect(null, 'Job not found.');
    if ($action === 'delete') {
        $db->table('jobs')->where('id', $jobid)->delete();
        $adminRedirect('Job #'.$jobid.' deleted.');
    }
    if ($action === 'stop') {
        $db->table('jobs')->where('id', $jobid)->update(['status'=>'0']);
        $adminRedirect('Job #'.$jobid.' stopped.');
    }
    if ($action === 'reset') {
        $db->table('jobs')->where('id', $jobid)->update(['status'=>'0','rccinstance'=>null]);
        $adminRedirect('Job #'.$jobid.' reset.');
    }
    $adminRedirect(null, 'Unknown job action.');
});

// Revoke an API key immediately.
$router->post('/admin/command/revoke-apikey', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $id = (int)($_POST['id'] ?? 0);
    if (!$db->table('apikeys')->where('id', $id)->first()) $adminRedirect(null, 'API key not found.');
    $db->table('apikeys')->where('id', $id)->delete();
    $adminRedirect('API key #'.$id.' revoked.');
});

// Remove a server registration from the local server registry.
$router->post('/admin/command/delete-server', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $adminGuard();
    $id = (int)($_POST['id'] ?? 0);
    if (!$db->table('servers')->where('id', $id)->first()) $adminRedirect(null, 'Server not found.');
    $db->table('servers')->where('id', $id)->delete();
    $adminRedirect('Server #'.$id.' removed from the registry.');
});

// Remove a user's sessions, inventory, friend links and moderation records
// while keeping the account itself.
$router->post('/admin/command/reset-account-state', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $admin = $adminGuard();
    $userid = (int)($_POST['userid'] ?? 0);
    if ($userid === (int)$admin->id) $adminRedirect(null, 'You cannot reset your own account state.');
    $user = $db->table('users')->where('id', $userid)->first();
    if (!$user) $adminRedirect(null, 'User not found.');
    $db->table('sessions')->where('author', $userid)->delete();
    $db->table('ownedassets')->where('userid', $userid)->delete();
    $db->table('friends')->where('userid', $userid)->delete();
    $db->table('friends')->where('friendid', $userid)->delete();
    $db->table('moderation')->where('userid', $userid)->delete();
    $adminRedirect('Account state reset for '.$user->username.'.');
});



/* =====================================================================
 * ADMIN CONTROL PANEL COMMANDS
 * These are real panel operations. They do not navigate the administrator
 * away from /admin and operate directly on the existing database tables.
 * ===================================================================== */

$router->post('/admin/command/set-currency', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0);
    $user=$db->table('users')->where('id',$userid)->first();
    if(!$user) $adminRedirect(null,'User not found.');
    $robux=max(0,(int)($_POST['robux']??0)); $tix=max(0,(int)($_POST['tix']??0));
    $db->table('users')->where('id',$userid)->update(['robux'=>$robux,'tix'=>$tix]);
    $adminRedirect('Currency set for '.$user->username.'.');
});

$router->post('/admin/command/update-user-full', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0); $user=$db->table('users')->where('id',$userid)->first();
    if(!$user) $adminRedirect(null,'User not found.');
    $update=[];
    if(isset($_POST['username']) && trim($_POST['username'])!=='') $update['username']=substr(trim($_POST['username']),0,255);
    if(array_key_exists('gender',$_POST)) $update['gender']=($_POST['gender']===''?null:(int)$_POST['gender']);
    if(array_key_exists('membership',$_POST) && in_array($_POST['membership'],['None','BuildersClub','TurboBuildersClub','OutrageousBuildersClub'],true)) $update['membership']=$_POST['membership'];
    if(isset($_POST['blurb'])) $update['blurb']=substr(trim($_POST['blurb']),0,1000);
    if(!$update) $adminRedirect(null,'No user fields supplied.');
    $db->table('users')->where('id',$userid)->update($update);
    $adminRedirect('User profile updated.');
});

$router->post('/admin/command/delete-user-messages', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0); $user=$db->table('users')->where('id',$userid)->first();
    if(!$user) $adminRedirect(null,'User not found.');
    $db->table('messages')->where('userfrom',$userid)->delete();
    $db->table('messages')->where('userto',$userid)->delete();
    $adminRedirect('All messages involving '.$user->username.' were deleted.');
});

$router->post('/admin/command/clear-friends', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0); $user=$db->table('users')->where('id',$userid)->first();
    if(!$user) $adminRedirect(null,'User not found.');
    $db->table('friends')->where('userid',$userid)->delete(); $db->table('friends')->where('friendid',$userid)->delete();
    $adminRedirect('All friendships removed for '.$user->username.'.');
});

$router->post('/admin/command/revoke-owned-asset', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0); $assetid=(int)($_POST['assetid']??0);
    if(!$db->table('users')->where('id',$userid)->first()) $adminRedirect(null,'User not found.');
    if(!$db->table('assets')->where('id',$assetid)->first()) $adminRedirect(null,'Asset not found.');
    $db->table('ownedassets')->where('userid',$userid)->where('assetid',$assetid)->delete();
    $adminRedirect('Asset ownership revoked.');
});

$router->post('/admin/command/transfer-asset', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $from=(int)($_POST['from_userid']??0); $to=(int)($_POST['to_userid']??0); $assetid=(int)($_POST['assetid']??0);
    if($from===$to || $from<=0 || $to<=0) $adminRedirect(null,'Invalid source/destination user.');
    if(!$db->table('users')->where('id',$from)->first() || !$db->table('users')->where('id',$to)->first()) $adminRedirect(null,'User not found.');
    if(!$db->table('assets')->where('id',$assetid)->first()) $adminRedirect(null,'Asset not found.');
    $owned=$db->table('ownedassets')->where('userid',$from)->where('assetid',$assetid)->first();
    if(!$owned) $adminRedirect(null,'Source user does not own that asset.');
    $already=$db->table('ownedassets')->where('userid',$to)->where('assetid',$assetid)->first();
    if($already) $adminRedirect(null,'Destination user already owns that asset.');
    $db->table('ownedassets')->where('id',$owned->id)->update(['userid'=>$to,'time'=>time()]);
    $adminRedirect('Asset ownership transferred.');
});

$router->post('/admin/command/delete-thumbnail', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $id=(int)($_POST['id']??0); $thumb=$db->table('thumbnails')->where('id',$id)->first();
    if(!$thumb) $adminRedirect(null,'Thumbnail not found.');
    $path=dirname(__DIR__).'/storage/thumbnails/'.basename($thumb->file);
    if(is_file($path)) @unlink($path);
    $db->table('thumbnails')->where('id',$id)->delete();
    $adminRedirect('Thumbnail #'.$id.' deleted.');
});

$router->post('/admin/command/create-badge', function() use ($adminGuard, $adminRedirect) {
    global $db; $admin=$adminGuard();
    $title=trim($_POST['title']??''); $description=trim($_POST['description']??''); $universeid=(int)($_POST['universeid']??0);
    if($title==='') $adminRedirect(null,'Badge title is required.');
    if(!$db->table('universes')->where('id',$universeid)->first()) $adminRedirect(null,'Universe not found.');
    $db->table('badges')->insert(['title'=>substr($title,0,255),'description'=>substr($description,0,2000),'universeid'=>$universeid,'owner'=>(int)$admin->id]);
    $adminRedirect('Badge created.');
});

$router->post('/admin/command/delete-badge', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $id=(int)($_POST['id']??0);
    if(!$db->table('badges')->where('id',$id)->first()) $adminRedirect(null,'Badge not found.');
    $db->table('badges')->where('id',$id)->delete(); $adminRedirect('Badge #'.$id.' deleted.');
});

$router->post('/admin/command/update-group', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $id=(int)($_POST['id']??0); $group=$db->table('groups')->where('id',$id)->first();
    if(!$group) $adminRedirect(null,'Group not found.');
    $update=[];
    if(isset($_POST['title'])) $update['title']=substr(trim($_POST['title']),0,255);
    if(isset($_POST['description'])) $update['description']=substr(trim($_POST['description']),0,5000);
    if(isset($_POST['robux'])) $update['robux']=max(0,(int)$_POST['robux']);
    if(isset($_POST['tix'])) $update['tix']=max(0,(int)$_POST['tix']);
    $db->table('groups')->where('id',$id)->update($update); $adminRedirect('Group #'.$id.' updated.');
});

$router->post('/admin/command/delete-group', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $id=(int)($_POST['id']??0);
    if(!$db->table('groups')->where('id',$id)->first()) $adminRedirect(null,'Group not found.');
    $db->table('groups')->where('id',$id)->delete(); $adminRedirect('Group #'.$id.' deleted.');
});

$router->post('/admin/command/reset-universe-visits', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $id=(int)($_POST['id']??0);
    if(!$db->table('universes')->where('id',$id)->first()) $adminRedirect(null,'Universe not found.');
    $db->table('visits')->where('universeid',$id)->delete(); $adminRedirect('Visit history reset for universe #'.$id.'.');
});

$router->post('/admin/command/clear-place-servers', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $placeid=(int)($_POST['placeid']??0);
    $db->table('activeplayers')->where('placeid',$placeid)->delete();
    $db->table('game_instances')->where('placeid',$placeid)->delete();
    $db->table('join_codes')->where('placeid',$placeid)->delete();
    $adminRedirect('Runtime instances cleared for place #'.$placeid.'.');
});

$router->post('/admin/command/delete-rcc-instance', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $id=(int)($_POST['id']??0);
    if(!$db->table('rccinstances')->where('id',$id)->first()) $adminRedirect(null,'RCC instance not found.');
    $db->table('rccinstances')->where('id',$id)->delete(); $adminRedirect('RCC instance #'.$id.' removed.');
});

$router->post('/admin/command/clear-join-codes', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $db->table('join_codes')->delete(); $adminRedirect('All temporary join codes cleared.');
});

$router->post('/admin/command/clear-expired-apikeys', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $now=time();
    $db->table('apikeys')->where('expiration','<=',$now)->delete(); $adminRedirect('Expired API keys removed.');
});

$router->post('/admin/command/clear-maintcodes', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $db->table('maintcodes')->delete(); $adminRedirect('All maintenance codes cleared.');
});

$router->post('/admin/command/create-maintcode', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $code=trim($_POST['code']??''); $discord=(int)($_POST['discord_user']??0); $expires=max(time()+60,(int)($_POST['expires']??0));
    if($code==='') $adminRedirect(null,'Maintenance code is required.');
    $db->table('maintcodes')->insert(['code'=>substr($code,0,255),'discord_user'=>$discord,'expires'=>$expires]);
    $adminRedirect('Maintenance code created.');
});

$router->post('/admin/command/clear-user-moderation', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $userid=(int)($_POST['userid']??0);
    if(!$db->table('users')->where('id',$userid)->first()) $adminRedirect(null,'User not found.');
    $db->table('moderation')->where('userid',$userid)->delete(); $adminRedirect('Moderation history cleared.');
});

$router->post('/admin/grant-currency', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0); $robux=(int)($_POST['robux']??0); $tix=(int)($_POST['tix']??0);
    $user=$db->table('users')->where('id',$userid)->first();
    if(!$user || $robux<0 || $tix<0 || ($robux===0 && $tix===0)) $adminRedirect(null,'Invalid user or amount.');
    $db->table('users')->where('id',$userid)->update(['robux'=>(int)$user->robux+$robux,'tix'=>(int)$user->tix+$tix]);
    $adminRedirect('Currency granted to '.$user->username.'.');
});

$router->post('/admin/set-membership', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $userid=(int)($_POST['userid']??0); $membership=$_POST['membership']??'None';
    $allowed=['None','BuildersClub','TurboBuildersClub','OutrageousBuildersClub'];
    if(!in_array($membership,$allowed,true)) $adminRedirect(null,'Invalid membership.');
    $user=$db->table('users')->where('id',$userid)->first(); if(!$user) $adminRedirect(null,'User not found.');
    $db->table('users')->where('id',$userid)->update(['membership'=>$membership]); $adminRedirect('Membership updated for '.$user->username.'.');
});

$router->post('/admin/set-admin', function() use ($adminGuard, $adminRedirect) {
    global $db; $admin=$adminGuard(); $userid=(int)($_POST['userid']??0); $isAdmin=(int)($_POST['is_admin']??0);
    if($userid===(int)$admin->id && $isAdmin===0) $adminRedirect(null,'You cannot remove your own admin permission from this panel.');
    $user=$db->table('users')->where('id',$userid)->first(); if(!$user) $adminRedirect(null,'User not found.');
    $db->table('users')->where('id',$userid)->update(['is_admin'=>$isAdmin?1:0]); $adminRedirect('Admin permission updated.');
});

$router->post('/admin/grant-asset', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $userid=(int)($_POST['userid']??0); $assetid=(int)($_POST['assetid']??0);
    $user=$db->table('users')->where('id',$userid)->first(); $asset=$db->table('assets')->where('id',$assetid)->first();
    if(!$user || !$asset) $adminRedirect(null,'User or asset not found.');
    $owned=$db->table('ownedassets')->where('userid',$userid)->where('assetid',$assetid)->first();
    if($owned) $adminRedirect(null,'User already owns this asset.');
    $db->table('ownedassets')->insert(['userid'=>$userid,'assetid'=>$assetid,'time'=>time()]); $adminRedirect('Granted asset #'.$assetid.' to '.$user->username.'.');
});

$router->post('/admin/moderate', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $userid=(int)($_POST['userid']??0); $action=$_POST['action']??'warning'; $days=max(1,min(3650,(int)($_POST['days']??1))); $note=trim($_POST['note']??'');
    $user=$db->table('users')->where('id',$userid)->first(); if(!$user || $note==='') $adminRedirect(null,'User and moderation note are required.');
    $isBan=$action==='ban';
    $db->table('moderation')->insert(['userid'=>$userid,'type'=>$isBan?'days':'warning','reviewed'=>0,'banneduntil'=>$isBan?time()+($days*86400):time(),'moderatornote'=>substr($note,0,255),'offensiveitem'=>null,'days'=>$isBan?$days:null,'canignore'=>$isBan?0:1]);
    $adminRedirect($isBan?'User banned for '.$days.' day(s).':'Warning added to '.$user->username.'.');
});

$router->post('/admin/send-message', function() use ($adminGuard, $adminRedirect) {
    global $db; $admin=$adminGuard(); $userid=(int)($_POST['userid']??0); $subject=trim($_POST['subject']??''); $body=trim($_POST['body']??'');
    $user=$db->table('users')->where('id',$userid)->first(); if(!$user || $subject==='' || $body==='') $adminRedirect(null,'Recipient, subject and body are required.');
    $db->table('messages')->insert(['userfrom'=>(int)$admin->id,'userto'=>$userid,'subject'=>htmlspecialchars($subject,ENT_QUOTES|ENT_HTML5,'UTF-8'),'body'=>htmlspecialchars($body,ENT_QUOTES|ENT_HTML5,'UTF-8'),'date'=>time(),'hasread'=>0]);
    $adminRedirect('Message sent to '.$user->username.'.');
});

$router->post('/admin/delete-user', function() use ($adminGuard, $adminRedirect) {
    global $db; $admin=$adminGuard(); $userid=(int)($_POST['userid']??0); if($userid===(int)$admin->id) $adminRedirect(null,'You cannot delete yourself.');
    $user=$db->table('users')->where('id',$userid)->first(); if(!$user) $adminRedirect(null,'User not found.');
    $db->table('ownedassets')->where('userid',$userid)->delete(); $db->table('messages')->where('userfrom',$userid)->delete(); $db->table('messages')->where('userto',$userid)->delete(); $db->table('moderation')->where('userid',$userid)->delete(); $db->table('users')->where('id',$userid)->delete();
    $adminRedirect('Deleted user '.$user->username.'.');
});

$router->post('/admin/delete-asset', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard(); $assetid=(int)($_POST['assetid']??0); $asset=$db->table('assets')->where('id',$assetid)->first(); if(!$asset) $adminRedirect(null,'Asset not found.');
    $db->table('ownedassets')->where('assetid',$assetid)->delete(); $db->table('thumbnails')->where('assetid',$assetid)->delete(); $path=dirname(__DIR__).'/storage/assets/'.basename($asset->fileid); if(is_file($path)) @unlink($path); $db->table('assets')->where('id',$assetid)->delete();
    $adminRedirect('Deleted asset #'.$assetid.'.');
});



$router->post('/admin/update-user', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $userid=(int)($_POST['userid']??0);
    $user=$db->table('users')->where('id',$userid)->first();
    if(!$user) $adminRedirect(null,'User not found.');
    $email=trim($_POST['email']??''); $blurb=trim($_POST['blurb']??'');
    $db->table('users')->where('id',$userid)->update([
        'email'=>$email === '' ? null : substr($email,0,255),
        'blurb'=>substr($blurb,0,1000)
    ]);
    $adminRedirect('Profile updated for '.$user->username.'.');
});

$router->post('/admin/toggle-asset', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $assetid=(int)($_POST['assetid']??0); $field=$_POST['field']??'';
    if(!in_array($field,['featured','limited','limitedu'],true)) $adminRedirect(null,'Invalid catalog flag.');
    $asset=$db->table('assets')->where('id',$assetid)->first();
    if(!$asset) $adminRedirect(null,'Asset not found.');
    $value=(int)!((int)$asset->{$field});
    $db->table('assets')->where('id',$assetid)->update([$field=>$value,'updated'=>time()]);
    $adminRedirect('Catalog flag updated for asset #'.$assetid.'.');
});

$router->post('/admin/clear-moderation', function() use ($adminGuard, $adminRedirect) {
    global $db; $adminGuard();
    $id=(int)($_POST['id']??0);
    if(!$db->table('moderation')->where('id',$id)->first()) $adminRedirect(null,'Moderation record not found.');
    $db->table('moderation')->where('id',$id)->delete();
    $adminRedirect('Moderation record cleared.');
});

$router->post('/admin/create-asset', function() use ($adminGuard, $adminRedirect) {
    global $db;
    $admin=$adminGuard();
    $name=trim($_POST['name']??'');
    $description=trim($_POST['description']??'');
    $category=(int)($_POST['prodcategory']??2);
    $robux=max(0,(int)($_POST['robux']??0));
    $tix=max(0,(int)($_POST['tix']??0));
    $remaining=max(0,(int)($_POST['remaining']??0));
    $memlevel=max(0,(int)($_POST['memlevel']??0));
    if($name==='') $adminRedirect(null,'Asset name is required.');
    $dir=dirname(__DIR__).'/storage/assets';
    $thumbdir=dirname(__DIR__).'/storage/thumbnails';
    if(!is_dir($dir)) @mkdir($dir,0775,true);
    if(!is_dir($thumbdir)) @mkdir($thumbdir,0775,true);
    if(!is_dir($dir) || !is_writable($dir)) $adminRedirect(null,'storage/assets is not writable.');
    $fileid=md5($name.'|'.microtime(true).'|'.random_int(1,PHP_INT_MAX));
    $stored=false;
    if(isset($_FILES['asset']) && isset($_FILES['asset']['error']) && $_FILES['asset']['error']===UPLOAD_ERR_OK){
        $tmp=$_FILES['asset']['tmp_name'];
        $fileid=md5_file($tmp) ?: $fileid;
        $destination=$dir.'/'.$fileid;
        if(!move_uploaded_file($tmp,$destination)) $adminRedirect(null,'Could not store the uploaded asset.');
        $stored=true;
    }
    $assetFile='local:'.$fileid;
    $now=time();
    $insertid=$db->table('assets')->insert([
        'prodtype'=>'User Product','prodcategory'=>$category,'name'=>htmlspecialchars($name,ENT_QUOTES|ENT_HTML5,'UTF-8'),
        'description'=>htmlspecialchars($description,ENT_QUOTES|ENT_HTML5,'UTF-8'),'asseticon'=>null,'created'=>$now,'updated'=>$now,
        'robux'=>$robux,'tix'=>$tix,'sales'=>0,'publicdomain'=>0,'featured'=>isset($_POST['featured'])?1:0,
        'limited'=>isset($_POST['limited'])?1:0,'limitedu'=>isset($_POST['limitedu'])?1:0,'remaining'=>$remaining>0?$remaining:null,
        'memlevel'=>$memlevel,'rating'=>null,'status'=>0,'owner'=>(int)$admin->id,'fileid'=>$assetFile
    ]);
    if(!$insertid){ if($stored && is_file($dir.'/'.$fileid)) @unlink($dir.'/'.$fileid); $adminRedirect(null,'Could not create catalog asset.'); }
    if(isset($_FILES['thumbnail']) && isset($_FILES['thumbnail']['error']) && $_FILES['thumbnail']['error']===UPLOAD_ERR_OK){
        $tmp=$_FILES['thumbnail']['tmp_name'];
        $info=@getimagesize($tmp);
        $mime=$info['mime']??'';
        $allowed=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];
        if(isset($allowed[$mime])){
            $thumbFile=$insertid.'-300x300.'.$allowed[$mime];
            if(move_uploaded_file($tmp,$thumbdir.'/'.$thumbFile)){
                $db->table('thumbnails')->insert(['dimensions'=>'300x300','assetid'=>(int)$insertid,'userid'=>null,'mode'=>'local','file'=>'local:'.$thumbFile]);
            }
        }
    }
    $adminRedirect('Created catalog asset #'.$insertid.($stored?' with local asset data.':' without an asset file.'));
});

$router->get('/{slug}-item', function($thing){
    $router = new Routing();
    $page = new pagebuilder;
    
    if(isset($_COOKIE["has_read"]) || str_contains($_SERVER['HTTP_USER_AGENT'], "discord")){
        if(isset($_GET["id"])){
            $id = (int)$_GET["id"];
            global $db;
    
            $asset = $db->table("assets")->where("id", $id)->first();
    
            if($asset !== null){
                
                $page::get_template("item", array("asset"=>$asset));
            } else {
                $router->return_status(404);
                die();
            }
    
        } else {
            $router->return_status(404);
            die();
        }
    } else {
        $page::get_template("notrobloxindex");
    }

    
});

$router->get('/Upgrades/BuildersClubMemberships.aspx', function() {
    $page = new pagebuilder;
    $page::get_template("bc");
});

$router->get("/games", function() {
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("games");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get('/newlogin', function() {
   $page = new pagebuilder;
   $page::get_template("login/newlogin");
});

$router->get('/login123', function() {
   $page = new pagebuilder;
   $page::get_template("login/newlogin");
});


$router->get("/catalog", function() {
   $page = new pagebuilder;
   if(isset($_COOKIE["has_read"])){
        $page::get_template("catalog");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/catalogbrowse.aspx", function() {
   $page = new pagebuilder;
   if(isset($_COOKIE["has_read"])){
        $page::get_template("catalogbrowse");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/catalog/browse.aspx", function() {
   $page = new pagebuilder;
   if(isset($_COOKIE["has_read"])){
        $page::get_template("catalogbrowse");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/Login/iFrameLogin.aspx", function() {
    $page = new pagebuilder;
    $page::get_template("login/iframelogin");
});

$router->get('/games/{id}/{urlfriendly}', function($id, $urlfriendly){
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("universe", ["id"=>$id]);
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/upgrades/robux", function() {
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("upgrades/robux");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/develop", function() {
    $page = new pagebuilder;
    $page::get_template("develop");
});

$router->get("/games/moreresultscached", function() {
    $page = new pagebuilder;
    $page::get_template("results");
});

$router->get("/logout", function() {
    setcookie(".ROBLOSECURITY", "", time() - 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
    header("Location: /newlogin");
});

$router->post("/logout", function() {
    setcookie(".ROBLOSECURITY", "", time() - 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
    header("Location: /newlogin");
});

$router->get("/home", function() {
    $page = new pagebuilder;
    $page::get_template("new_home");
});

$router->get("/UploadMedia/UploadVideo.aspx", function() {
    $page = new pagebuilder;
    $page::get_template("UploadMedia/uploadvideo");
});

$router->get('/thumbnail/user-avatar', function(){ 
    return ['Url' => 'https://cdn.watrbx.wtf/503b295fa0d2216558136b355422b9f9', 'Final' => true];
});

$router->get('/my/groupadmin.aspx', function(){
    global $currentuser;
    if (!$currentuser) {
        header("Location: /newlogin");
        exit;
    }
    $page = new pagebuilder;
    $page::get_template("groups/groupadmin");
});

$router->get('/ResetPassword.aspx', function(){
    $page = new pagebuilder;
    $page::get_template("temp/reset-pass");
});

$router->get('/Login/ResetPasswordRequest.aspx', function(){
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("requestpassreset");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->post('/Login/ResetPasswordRequest.aspx', function(){

    global $db;
    $page = new pagebuilder;
    $emailClass = new email();
    $sitefunc = new sitefunctions();
    

    if(isset($_POST['ctl00$cphRoblox$UserName'])){
        $username = $_POST['ctl00$cphRoblox$UserName'];

        $userinfo = $db->table("users")->where("username", $username)->first();

        if($userinfo){
            if($userinfo->email){

                $apireqcount = $db->table("password_tickets")->where("userid", $userinfo->id)->where("date", ">", time() - 60)->count();

                if($apireqcount >= 5){
                    $page::get_template("requestpassreset", ["message"=>"You have sent too many password resets. Please wait a moment and try again."]);
                    die();
                }

                $ticket = $sitefunc->genstring(15);

                $insert = [
                    "userid"=>$userinfo->id,
                    "ticket"=>$ticket,
                    "date"=>time()
                ];

                $template = $emailClass->get_template("newpass", ["%username%"=>$userinfo->username, "%emailTicket%"=>$ticket]);
                $emailClass->send_email($userinfo->email, "watrbx password reset", $template);

                $db->table("password_tickets")->insert($insert);

                $page::get_template("requestpassreset", ["message"=>"If this account exists and has a username, an email has been sent. Please check your spam inbox if you can't find it."]);
                die();
            } else {
                $page::get_template("requestpassreset", ["message"=>"If this account exists and has a username, an email has been sent. Please check your spam inbox if you can't find it."]);
                die();
            }
        } else {
                $page::get_template("requestpassreset", ["message"=>"If this account exists and has a username, an email has been sent. Please check your spam inbox if you can't find it."]);
                die();
        }

    }

    $page::get_template("requestpassreset");

});


$router->get('/EmailVerify.aspx', function(){

    $page = new pagebuilder;
    $discord = new discord();
    $discord->set_webhook_url($_ENV["SIGNUP_WEBHOOK"]);


    global $db;
    global $currentuser;
    
    if(isset($_GET["Ticket"])){
        $token = $_GET["Ticket"];

        $codeinfo = $db->table("email_codes")->where("code", $token)->first();

        if($codeinfo){
            if($codeinfo->userid == $currentuser->id){
                $update = [
                    "email_verified"=>1,
                ];

                $db->table("users")->where("id", $currentuser->id)->update($update);
                
                $hasitem = $db->table("ownedassets")->where("userid", $currentuser->id)->where("assetid", 554)->first();

                if($hasitem == null){
                    $insert = [
                        "userid"=>$currentuser->id,
                        "assetid"=>554,
                        "time"=>time()
                    ];

                    $db->table("ownedassets")->insert($insert);
                    
                }
                
                $discord->internal_log("$currentuser->username has verified their email.", "Email Verification Success");
                $page::get_template("verifiedemail");
                die();
            }
        }

    }

    http_response_code(404);
    $page::get_template("status_codes/404");
});

$router->post("/my/account", function() {

    global $currentuser;
    global $db;
    $func = new sitefunctions();
    $page = new pagebuilder;
    $auth = new authentication();

    if(isset($_COOKIE["csrftoken"])){
        if(!$auth->verifycsrf($_COOKIE["csrftoken"], "account")){
            $page::get_template("my/account");
            die();
        }
    } else {
        $page::get_template("my/account");
        die();
    }

    if(isset($_POST["PersonalBlurb"]) && $currentuser){

        $blurb = $_POST["PersonalBlurb"];
        $blurb =  $func::filter_text($blurb);
        $blurb = htmlspecialchars($blurb);

        $update = [
            "about"=>$blurb
        ];

        $db->table("users")->where("id", $currentuser->id)->update($update);
        $currentuser = $auth->getuserbyid($currentuser->id);

        
    }

    if(isset($_POST["currenttheme"]) && $currentuser){

        $newtheme = (int)$_POST["currenttheme"];

        $themes = new \watrbx\themes();
        $themeinfo = $themes->getThemeInfo($newtheme);

        $update = [
            "currenttheme"=>$newtheme
        ];

        if($themeinfo){
            $db->table("users")->where("id", $currentuser->id)->update($update);
        } else {
            $db->table("users")->where("id", $currentuser->id)->update(["currenttheme"=>NULL]);
        }

        $currentuser = $auth->getuserbyid($currentuser->id);
    }

    if(isset($_POST["selectedserver"]) && $currentuser){

        $selectedserver = $_POST["selectedserver"];

        $gameserver = new \watrbx\gameserver();
        $serverinfo = $gameserver->get_server_info($selectedserver);

        $update = [
            "gs_preference"=>$selectedserver
        ];

        if($serverinfo){
            $db->table("users")->where("id", $currentuser->id)->update($update);
        } else {
            $db->table("users")->where("id", $currentuser->id)->update(["gs_preference"=>NULL]);
        }

        $currentuser = $auth->getuserbyid($currentuser->id);
    }


    if(isset($blurb)){
        $page::get_template("my/account", ["newblurb"=>$blurb]);
    } else {
        $page::get_template("my/account");
    }

});

$router->get('/Help/Builderman.aspx', function(){
    
    $page = new pagebuilder;

    $fastflags = new \watrlabs\fastflags();
    
    if($fastflags::get("RedirectHelpToSubdomain")){
        header('Location: https://help.watrbx.wtf');
        die();
    }
    
    http_response_code(404);
    $page::get_template("status_codes/404");
});

$router->get("/download", function() {
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("download");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/my/newaccount", function() {
    $page = new pagebuilder;
    $page::get_template("my/newaccount");
});


$router->get("/my/account", function() {
    $page = new pagebuilder;
    $page::get_template("my/account");
});

$router->get('/places/{id}/update', function($id){
    $page = new pagebuilder;
    $page::get_template("places/update", ["placeId"=>$id]);
});

$router->get('/temp/shirt-uploader', function(){
    $page = new pagebuilder;
    $page::get_template("temp/shirt-creator");
});

$router->get('/temp/pants-uploader', function(){
    $page = new pagebuilder;
    $page::get_template("temp/pants-uploader");
});

$router->get('/places/create', function(){
    $page = new pagebuilder;
    $page::get_template("places/create");
});

$router->get('/login/Default.aspx', function(){
    header("Location: /newlogin");
    die();
});

function aspnet_updatepanel_response(array $panels, string $form_action = '/My/Character.aspx', string $page_title = 'Avatar'): string
{
    $out = '';

    foreach ($panels as $panelId => $html) {
        $len = strlen($html);
        $out .= "{$len}|updatePanel|{$panelId}|{$html}|";
    }

    $vs = $_POST['__VIEWSTATE'] ?? '';
    $vsg = $_POST['__VIEWSTATEGENERATOR'] ?? '';
    $ev = $_POST['__EVENTVALIDATION'] ?? '';

    $out .= strlen($vs) . "|hiddenField|__VIEWSTATE|{$vs}|";
    $out .= strlen($vsg) . "|hiddenField|__VIEWSTATEGENERATOR|{$vsg}|";
    $out .= strlen($ev) . "|hiddenField|__EVENTVALIDATION|{$ev}|";
    $out .= "0|postBackControlIDs|||";
    $out .= "0|asyncPostBackControlIDs|||";

    $panelIds = implode(',', array_keys($panels));
    $len = strlen($panelIds);
    $out .= "{$len}|panelsToRefreshIDs||{$panelIds}|";

    $out .= "0|childUpdatePanelIDs|||";
    $out .= "0|updatePanelIDs|||";
    
    $out .= "2|asyncPostBackTimeout|90|";

    $faLen = strlen($form_action);
    $out .= "{$faLen}|formAction|{$form_action}|";

    $ptLen = strlen($page_title);
    $out .= "{$ptLen}|pageTitle|{$page_title}|";

    return $out;
}

$router->get("/my/character2.aspx", function() {

    // TODO: Improve this. A LOT.

    $page = new pagebuilder;

    $page::get_template("improved_avatar");
});

$router->post("/my/character2.aspx", function() {

    while (ob_get_level()) ob_end_clean();
    
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Encoding: identity');
    header('X-AspNet-Version: 2.0.50727');
    header('X-Powered-By: ASP.NET');

    // Process the action first (wear/remove/color change)
    // ... your action handling code ...


    $pagebuilder = new pagebuilder();

    // Then re-render the page and extract panels from DOM
    ob_start();
    
    echo $pagebuilder->build_component("wardrobe", ["status"=>"confirm", "msg"=>"A new and improved avatar page is currently in the works. Expect it soon!"]);

    $pageHtml = ob_get_clean();
    
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML($pageHtml);
    libxml_clear_errors();

    $panelIds = [
        'ctl00_ctl00_cphRoblox_cphMyRobloxContent_UpdatePanelAccoutrements',
        'ctl00_ctl00_cphRoblox_cphMyRobloxContent_UpdatePanelWardrobe',
        'ctl00_ctl00_cphRoblox_cphMyRobloxContent_CustomizeCharacterUpdatePanelAvatar',
    ];

    $out = '';
    foreach ($panelIds as $panelId) {
        $el = $dom->getElementById($panelId);
        if ($el) {
            $html = $dom->saveHTML($el);
            // strip the outer div wrapper tag
            $html = preg_replace('/^<div[^>]*>/', '', $html);
            $html = preg_replace('/<\/div>$/', '', trim($html));
            $out .= strlen($html) . '|updatePanel|' . $panelId . '|' . $html . '|';
        }
    }

    echo $out;
    exit;
});

$router->get("/my/character.aspx", function() {

    // TODO: Improve this. A LOT.

    $page = new pagebuilder;

    $lastcategory = "7";

    $allowedevents = [
        "17",
        "18",
        "8",
        "2",
        "11",
        "12",
        "19",
        "32"
    ];
    

    if(isset($_COOKIE["lastcategory"])){
        $lastcategory = $_COOKIE["lastcategory"];

        if(!in_array($lastcategory, $allowedevents)){
            $lastcategory = "7";
        } 

    }

    $page::get_template("avatar", ["currentcategory"=>$lastcategory]);
});

$router->post('/my/character.aspx', function() {
    $page = new pagebuilder;
    $auth = new authentication;

    $lastcategory = "7";

    $allowedevents = [
        "17",
        "18",
        "8",
        "2",
        "11",
        "12",
        "19",
        "32"
    ];
    

    if(isset($_COOKIE["lastcategory"])){
        $lastcategory = $_COOKIE["lastcategory"];

        if(!in_array($lastcategory, $allowedevents)){
            $lastcategory = "7";
        } 

    }

    global $db;
    global $currentuser;

    if(isset($_COOKIE["csrftoken"])){
        if(!$auth->verifycsrf($_COOKIE["csrftoken"], "avatar")){
            $page::get_template("avatar", ["currentcategory"=>$lastcategory]);
            die();
        }
    } else {
        $page::get_template("avatar", ["currentcategory"=>$lastcategory]);
        die();
    }

    if(isset($_POST["__EVENTTARGET"])){
        $event = $_POST["__EVENTTARGET"];

        if(str_contains($event, "page")){
            $exploded = explode("-", $event);

            if(isset($exploded[1])){

                if($exploded[1] == "+1"){
                    if(isset($_COOKIE["page"])){
                        $currentpage = (int)$_COOKIE["page"];
                        
                        $nextpage = $currentpage +1;

                        $_COOKIE["page"] = $nextpage;
                        setcookie("page", $nextpage,  time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                    } else {
                        $_COOKIE["page"] = 1;
                        setcookie("page", "1",  time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                    }
                } else {
                    $newpage = (int)$exploded[1];
                    $_COOKIE["page"] = $exploded[1];
                    setcookie("page", $newpage,  time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                }

            }

        }
        
        switch ($event){
            case "viewheads":

                $page::get_template("avatar", ["currentcategory"=>17]);
                setcookie("lastcategory", 17, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                die();
            case "viewpackages":

                $page::get_template("avatar", ["currentcategory"=>32]);
                setcookie("lastcategory", 32, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                die();
            case "viewfaces":
                $page::get_template("avatar", ["currentcategory"=>18]);
                setcookie("lastcategory", 18, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                die();
            case "viewhats":
                $page::get_template("avatar", ["currentcategory"=>8]);
                setcookie("lastcategory", 8, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                die();
            case "viewtshirts":
                $page::get_template("avatar", ["currentcategory"=>2]);
                setcookie("lastcategory", 2, time() + 2, "/", "." . $_ENV["APP_DOMAIN"]);
                die();
            case "viewshirts":
                $page::get_template("avatar", ["currentcategory"=>11]);
                setcookie("lastcategory", 11, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                die();
            case "viewpants":
                setcookie("lastcategory", 12, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                $page::get_template("avatar", ["currentcategory"=>12]);
                die();
            case "viewgear":
                setcookie("lastcategory", 19, time() + 9999999, "/", "." . $_ENV["APP_DOMAIN"]);
                $page::get_template("avatar", ["currentcategory"=>19]);
                die();
            default:
                if(str_contains($event, "Wear")){
                    $exploded = explode("|", $event);

                    if(isset($exploded[1])){
                        $db->table("thumbnails")->where("userid", $currentuser->id)->delete();
                        $db->table("3dthumnails")->where("userid", $currentuser->id)->delete();
                        $assetid = (int)$exploded[1];
                        
                        $iswearing = $db->table("wearingitems")->where("itemid", $assetid)->where("userid", $currentuser->id)->first();

                        if($iswearing == null){

                            $asset = $db->table("assets")->where("id", $assetid)->first();

                            if($asset !== null){

                                $hasasset = $db->table("ownedassets")->where("assetid", $assetid)->where("userid", $currentuser->id)->first();

                                if($hasasset !== null){
                                    $db->table("wearingitems")->insert(["itemid"=>$assetid, "userid"=>$currentuser->id]);
                                }
                                
                                
                            }
                        }
                        $page::get_template("avatar", ["currentcategory"=>$lastcategory]);
                        die();
                    }
                }

                if(str_contains($event, "Remove")){
                    $exploded = explode("|", $event);
                    if(isset($exploded[1])){
                        $db->table("thumbnails")->where("userid", $currentuser->id)->delete();
                        $assetid = (int)$exploded[1];
                        $db->table("wearingitems")->where("userid", $currentuser->id)->where("itemid", $assetid)->delete();
                        $db->table("3dthumnails")->where("userid", $currentuser->id)->delete();
                        $page::get_template("avatar", ["currentcategory"=>$lastcategory]);
                        die();
                    }
                }

                if(str_contains($event, 'ctl00$ctl00$cphRoblox$cphMyRobloxContent$ColorChooser')){
                    $exploded = explode("$", $event);

                    if(isset($exploded[4]) && isset($_POST["__EVENTARGUMENT"])){
                        $color = (int)$_POST["__EVENTARGUMENT"];
                        $bodypart = $exploded[4];

                        $bodycolor = $db->table("bodycolors")->where("userid", $currentuser->id)->where("part", $bodypart)->first();

                        if($bodycolor !== null){
                            $update = [
                                "color"=>$color
                            ];
                            $db->table("bodycolors")->where("userid", $currentuser->id)->where("part", $bodypart)->update($update);
                            $db->table("thumbnails")->where("userid", $currentuser->id)->delete();
                            $db->table("3dthumnails")->where("userid", $currentuser->id)->delete();
                        } else {
                            $insert = [
                                "part"=>$bodypart,
                                "color"=>$color,
                                "userid"=>$currentuser->id
                            ];

                            $db->table("bodycolors")->insert($insert);
                            $db->table("thumbnails")->where("userid", $currentuser->id)->delete();
                            $db->table("3dthumnails")->where("userid", $currentuser->id)->delete();
                        }
                    }
                }
                
        }

    }
    
    $page::get_template("avatar", ["currentcategory"=>$lastcategory]);
    die();
});

$router->get('/my/groups.aspx', function(){
    global $currentuser;
    if (!$currentuser) {
        header("Location: /newlogin");
        exit;
    }
    
    $auth = new authentication();
    $auth->requiresession();
    $page = new pagebuilder;
    $page::get_template("groups/default");
});

$router->post('/my/groups.aspx', function(){


    if(isset($_POST["GroupAdmin"]) && isset($_POST["GroupId"])){

        $groupId = (int)$_POST["GroupId"];
        header("Location: /my/groupadmin.aspx?gid=$groupId");

    } else {
        $page = new pagebuilder;
        $page::get_template("groups/creategroup");
    }
});

$router->get('/my/creategroup.aspx', function(){
    global $currentuser;
    if (!$currentuser) {
        header("Location: /newlogin");
        exit;
    }
    
    $page = new pagebuilder;
    $page::get_template("groups/creategroup");
    
});

$router->post('/my/creategroup.aspx', function(){
    global $currentuser;
    global $db;
    global $s3_client;

    if (!$currentuser) {
        header("Location: /newlogin");
        exit;
    }

    $title = trim($_POST['name'] ?? '');
    $desc  = trim($_POST['description'] ?? '');

    if ($title === '') {
        $page = new pagebuilder;
        $page->setlegacy(true);
        $page->set_page_name("Create Group");
        $page->buildheader();
        $page::get_template("groups/creategroup", ["error" => "Group name is required."]);
        $page->build_footer();
        return;
    }

    $emblemMd5 = null;
    if (isset($_FILES["emblem"]) && $_FILES["emblem"]["error"] === UPLOAD_ERR_OK) {
        $imagesize = getimagesize($_FILES["emblem"]["tmp_name"]);
        if ($imagesize === false) {
            $page = new pagebuilder;
            $page->setlegacy(true);
            $page->set_page_name("Create Group");
            $page->buildheader();
            $page::get_template("groups/creategroup", ["error" => "Invalid image file."]);
            $page->build_footer();
            return;
        }
        $emblemMd5 = md5_file($_FILES["emblem"]["tmp_name"]);
        try {
            $s3_client->putObject([
                'Bucket'     => $_ENV["R2_BUCKET"],
                'Key'        => $emblemMd5,
                'SourceFile' => $_FILES["emblem"]["tmp_name"]
            ]);
        } catch (Exception $e) {
            $page = new pagebuilder;
            $page->setlegacy(true);
            $page->set_page_name("Create Group");
            $page->buildheader();
            $page::get_template("groups/creategroup", ["error" => "Failed to upload emblem."]);
            $page->build_footer();
            return;
        }
    }

    $groupId = $db->table("groups")->insert([
        "iconid"      => 0,
        "title"       => htmlspecialchars($title),
        "description" => htmlspecialchars($desc),
        "shout"       => "",
        "robux"       => 0,
        "tix"         => 0,
        "emblem"      => $emblemMd5
    ]);

    $db->table("group_roles")->insert([
        "name"     => "Owner",
        "priority" => 255,
        "groupid"  => $groupId
    ]);

    $db->table("group_roles")->insert([
        "name"     => "Admin",
        "priority" => 254,
        "groupid"  => $groupId
    ]);

    $db->table("group_roles")->insert([
        "name"     => "Member",
        "priority" => 1,
        "groupid"  => $groupId
    ]);

    $ownerRole = $db->table("group_roles")
        ->where("groupid", $groupId)
        ->where("priority", 255)
        ->first();

    if (!$ownerRole) {
        $page = new pagebuilder;
        $page->setlegacy(true);
        $page->set_page_name("Create Group");
        $page->buildheader();
        $page::get_template("groups/creategroup", ["error" => "Something went wrong. Please try again."]);
        $page->build_footer();
        return;
    }

    $db->table("hasrole")->insert([
        "userid" => $currentuser->id,
        "roleid" => $ownerRole->id
    ]);

    $discord = new discord();
    $discord->set_webhook_url($_ENV["GROUPS_WEBHOOK"]);
    $discord->internal_log($currentuser->username . " created a group \"$title\" with id $groupId", "Groups");

    header("Location: /my/groups.aspx?gid=" . $groupId);
    exit;
});

$router->get("/search/users", function() {
    $page = new pagebuilder;
    if(isset($_COOKIE["has_read"])){
        $page::get_template("search/users");
    } else {
        $page::get_template("notrobloxindex");
    }
});

$router->get("/my/money.aspx", function() {
    $page = new pagebuilder;
    $page::get_template("my/money");
});

$router->get("/userads/{num}", function($num) {
    $sanitize = new sanitize();
    $num = sanitize::integer($num);
    
    if($num > 3 || $num < 1){
        global $router;
        $router->return_status(404);
    } else {
        $page = new pagebuilder;
        $page::get_template("userads/$num");
    }
    
});

$router->get('/grid-test', function(){

    $useService = new watrbx\Grid\Grid;
    $gameserver = new watrbx\gameserver();

    $serverinfo = $gameserver->get_closest_server();
    $url = $gameserver->get_server_url($serverinfo);

    $Close = $useService->Close($url);

    echo $Close->CloseExpiredJobs();

    //$RobloxGrid = new Grid("https://group-she.gl.at.ply.gg:49837");
    //$grid = $RobloxGrid->useGet();

    //$script = new \StructType\ScriptExecution("print(\"hi\")");

    //$execute = $grid->GetVersion(new \StructType\GetVersion());

    //if ($execute !== false) {
    //    $result = $grid->getResult();
    //    echo $result->getGetVersionResult();
    //} else {
    //    $result = $grid->getLastError();
    //    echo $result['ServiceType\GetVersion']->getMessage();
    //}

});

$router->get('/legal/account-deletion', function(){
    $page = new pagebuilder;
    $page::get_template("account");
});

$router->get('/legal/tos', function(){
    $page = new pagebuilder;
    $page::get_template("tos");
});

$router->get('/legal/privacy', function(){
    $page = new pagebuilder;
    $page::get_template("privacy");
});

$router->get("/CSS/Base/CSS/FetchCSS", function() {
    // var_dump($_GET);

    $path = "na";

    if(!isset($_GET["path"])){
        global $router;
        $router->return_status(404);
    } else {
        $path = $_GET["path"];
    }
    
    $sanitize = new sanitize();
    $path = $sanitize::get($path);
    
    if(file_exists("../storage/css/" . $path)){
        $css = file_get_contents("../storage/css/" . $path);
        header("Content-type: text/css");
        echo $css;
        die();
        
    } else {
        global $router;
        $router->return_status(404);
    }
    
});
