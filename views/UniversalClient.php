<?php

$applicationName = $_ENV["APP_NAME"];
//$placeId = (int)$placeId;

?>

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?=htmlspecialchars($applicationName)?> - WASM Client</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a1a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: sans-serif;
      color: #fff;
    }
    #canvas-container {
      position: relative;
      width: 100vw;
      height: 100vh;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
    #loading {
      position: fixed;
      inset: 0;
      background: #1a1a1a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 10;
    }
    #loading.hidden { display: none; }
    #progress-bar {
      width: 300px;
      height: 4px;
      background: #333;
      border-radius: 2px;
      overflow: hidden;
    }
    #progress-fill {
      height: 100%;
      background: #fff;
      width: 0%;
      transition: width 0.2s;
    }
    #status { font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <div id="loading">
    <div id="progress-bar"><div id="progress-fill"></div></div>
    <div id="status">Loading...</div>
  </div>
  <div id="canvas-container">
    <canvas id="canvas" oncontextmenu="event.preventDefault()"></canvas>
  </div>
  <script>
    var Module = {
      canvas: document.getElementById('canvas'),
      arguments: [
        '-j', '<?=$_ENV["BASE_URL"]?>/Game/PlaceLauncher.ashx?placeId=<?=$placeId?>',
        '-t', 'sigmite',
        '-a', '<?=$_ENV["BASE_URL"]?>/Login/Negotiate.ashx',
        '-b', '<?=$_ENV["BASE_URL"]?>'
      ],   
      setStatus: function(text) {
        if (text) document.getElementById('status').innerText = text;
        else document.getElementById('loading').classList.add('hidden');
      },
      
      monitorRunDependencies: function(left) {
        document.getElementById('status').innerText = "Running...";
      },

      onRuntimeInitialized: function() {
        document.getElementById('status').innerText = "Running...";
      }
    };
  </script>
  <script async type="text/javascript" src="UniversalClient.js?tj=is-inside-of-me"></script> <!-- WTFFFFF -->
</body>
</html>
