<?php
// top banner thing 

$ads = scandir("../public/ads/square/");
$ads = array_diff($ads, array('..', '.'));

$selectedAd = array_rand($ads);
?>



<!DOCTYPE html>
<html>
    <head>
        <title>
            ROBLOX - a kids, parents, and family activity site for building toy amusement
            parks, rc cars, clothing, and electronic devices out of construction blocks that
            are as realistic as a movie or tv show
        </title>
        <style type="text/css">
            body { margin: 0; }
            body.banner { text-align: center; }
            a
            {
                color: gray;
                text-decoration: none;
            }
            a.ad { display: inline-block; }
            body.other a.ad { display: block; }
            a.ad img
            {
                display: block;
                border: none;
            }
            a:hover { text-decoration: underline; }
        </style>
        
<link rel='stylesheet' href='/CSS/Base/CSS/FetchCSS?path=page___48c190c40942ad5412c56a4bf1c94b9b_m.css' />

    </head>
    <body class="abp other">
        <a class="ad" title="Get Builders Club Today." href="/Upgrades/BuildersClubMemberships.aspx" target="_top">
            <img src="/ads/square/<?=$ads[$selectedAd]?>" alt="Get Builders Club Today." height="250" width="300"  />
        </a>
        
        <div class="ad-annotations " style="width: 300px">
            <span class="ad-identification">Advertisement</span>
                <a class="BadAdButton" target="_top" href="/abusereport/Asset?id=0" title="click to report an offensive ad">Report</a>
        </div>
    </body>
</html>