<?php

// TODO: Do something

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/CSS/base.css?t=<?=time()?>">
    <link href="//fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,500,600,700" rel="stylesheet" type="text/css">
    <title><?=htmlspecialchars($_ENV["APP_NAME"])?></title>
</head>
<body>
    <div id="main">
        <div id="welcome">
            <h1><?=htmlspecialchars($_ENV["APP_NAME"])?> | Terms of Service</h1> 
            <p>To gain access to <?=htmlspecialchars($_ENV["APP_NAME"])?>, you must agree to the following terms:</p>
            <ul>
                <li>This is a remake of the ROBLOX website that has working authentication, games, and more</li>
                <li>That this is <b>NOT</b> a phishing attempt</li>
                <li>You <b>CANNOT</b> purchase anything with your <b>REAL ROBLOX ACCOUNT</b></li>
                <li>You <b>CANNOT</b> purchase any <b>membership or currency</b> using your real credit card info.</li>
                <li>We <b>might</b> collect your IP information to choose the closest gameservers, timezone, country configuration and etc... (nothing else)</li>
                <li>That we are in no way affiliated with ROBLOX Corp.</li>
                <li>We no way intend to infringe on ROBLOX, we're just trying to revive an old version of their software.</li>
                <li>You agree to our <a href="/legal/tos">ToS</a> and <a href="/legal/privacy">Privacy Policy</a></li>
            </ul>
            <button onclick="location.href='/agree'">Okay!</button>
            <p>(powered by <a href="https://www.github.com/Eduardo7881/watrbx-rec">watrbx:r</a>)</p>
        </div>
    </div>
</body>
</html>
