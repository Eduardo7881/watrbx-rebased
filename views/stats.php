<?php

global $db;

$usercount = $db->table('users')->count();
$assetcount = $db->table("assets")->count();
$thumbnailcount = $db->table("thumbnails")->count();
$friendshipcount = $db->table("friends")->where("status", "accepted")->count();
$commentcount = $db->table("comments")->count();
$renderjobcount = $db->table("jobs")->where("type", "2")->count();
$unapprovedAssets = $db->table("assets")->where("moderation_status", "Pending")->count();
$playercount = $db->table("activeplayers")->count();
$deletedcount = $db->table("moderation")->where("type", "deleted")->count();

$usercount = $usercount - $deletedcount;

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/CSS/base.css?t=<?=time()?>">
    <link href="//fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,500,600,700" rel="stylesheet" type="text/css">
    <title>watrbx - stats</title>
</head>
<body>
    <div id="main">
        <div id="welcome">
            <h1>stats</h1> 
            <p>watrbx stats (updated every 2 seconds, if you have javascript enabled.)</p>
            <ul>
                <li><span id="userCount"><?=number_format($usercount)?></span> Users</li>
                <li><span id="assetCount"><?=number_format($assetcount)?></span> Assets</li>
                <li><span id="thumbCount"><?=number_format($thumbnailcount)?></span> Thumbnails</li>
                <li><span id="friendCount"><?=number_format($friendshipcount)?></span> Friends</li>
                <li><span id="commentCount"><?=number_format($commentcount)?></span> Comments</li>
                <li><span id="currentlyActive"><?=number_format($playercount)?></span> Players Online</li>
                <li><span id="pendingApproval"><?=number_format($unapprovedAssets)?></span> Items waiting to be approved.</li>
                <li><span id="pendingItems"><?=number_format($renderjobcount)?></span> Items/Users waiting to be rendered.</li>
            </ul>
            <button onclick="location.reload()">Refresh</button><button style="margin-left: 5px;" onclick="location.href='/'">Home</button>
        </div>
    </div>
    <script>

        function updateId(updatingId, value){
            document.getElementById(updatingId).textContent = value;
        }

        async function statsLoop(){
            while (true){
                await new Promise(r => setTimeout(r, 2000));

                response = await fetch('/api/v1/get-stats')
                if(response.ok){
                    const data = await response.json(); 

                    updateId("userCount", data.userCount);
                    updateId("assetCount", data.assetCount);
                    updateId("thumbCount", data.thumbnailCount);
                    updateId("friendCount", data.friendCount);
                    updateId("commentCount", data.commentsCount);
                    updateId("currentlyActive", data.currentlyActive);
                    updateId("pendingItems", data.pendingRenderCount);
                    updateId("pendingApproval", data.unnapprovedAssets);
                }

            }
        }

        statsLoop();
    </script>
</body>
</html>