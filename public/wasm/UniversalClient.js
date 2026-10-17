// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split("-")[0];
    // Remove any trailing part from e.g. "12.53.3-alpha"
    var vers = str.split(".").slice(0, 3);
    while (vers.length < 3) vers.push("00");
    vers = vers.map((n, i, arr) => n.padStart(2, "0"));
    return vers.join("");
  }
  // 300000 -> "30.0.0"
  var packedVersionToHumanReadable = n => [ n / 1e4 | 0, (n / 100 | 0) % 100, n % 100 ].join(".");
  var TARGET_NOT_SUPPORTED = 2147483647;
  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.
  var currentNodeVersion = typeof process !== "undefined" && process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
  if (currentNodeVersion < 160400) {
    throw new Error(`This emscripten-generated code requires node v${packedVersionToHumanReadable(160400)} (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
  }
  var userAgent = typeof navigator !== "undefined" && navigator.userAgent;
  if (!userAgent) {
    return;
  }
  var currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 15e4) {
    throw new Error(`This emscripten-generated code requires Safari v${packedVersionToHumanReadable(15e4)} (detected v${currentSafariVersion})`);
  }
  var currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 79) {
    throw new Error(`This emscripten-generated code requires Firefox v79 (detected v${currentFirefoxVersion})`);
  }
  var currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 85) {
    throw new Error(`This emscripten-generated code requires Chrome v85 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != "undefined" ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;

var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;

// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() running directly in a worker. (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
// The way we signal to a worker that it is hosting a pthread is to construct
// it with a specific name.
var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && globalThis.name?.startsWith("em-pthread");

if (ENVIRONMENT_IS_NODE) {
  var worker_threads = require("node:worker_threads");
  global.Worker = worker_threads.Worker;
  ENVIRONMENT_IS_WORKER = !worker_threads.isMainThread;
  // Under node we set `workerData` to `em-pthread` to signal that the worker
  // is hosting a pthread.
  ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && worker_threads.workerData == "em-pthread";
}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: /tmp/tmpgrjaso1g.js
if (!Module["expectedDataFileDownloads"]) Module["expectedDataFileDownloads"] = 0;

Module["expectedDataFileDownloads"]++;

(() => {
  // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
  var isPthread = typeof ENVIRONMENT_IS_PTHREAD != "undefined" && ENVIRONMENT_IS_PTHREAD;
  var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != "undefined" && ENVIRONMENT_IS_WASM_WORKER;
  if (isPthread || isWasmWorker) return;
  var isNode = globalThis.process && globalThis.process.versions && globalThis.process.versions.node && globalThis.process.type != "renderer";
  async function loadPackage(metadata) {
    var PACKAGE_PATH = "";
    if (typeof window === "object") {
      PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/");
    } else if (typeof process === "undefined" && typeof location !== "undefined") {
      // web worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/");
    }
    var PACKAGE_NAME = "UniversalClient.data";
    var REMOTE_PACKAGE_BASE = "UniversalClient.data";
    var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
    var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
    async function fetchRemotePackage(packageName, packageSize) {
      if (isNode) {
        var contents = require("fs").readFileSync(packageName);
        return new Uint8Array(contents).buffer;
      }
      if (!Module["dataFileDownloads"]) Module["dataFileDownloads"] = {};
      try {
        var response = await fetch(packageName);
      } catch (e) {
        throw new Error(`Network Error: ${packageName}`, {
          e
        });
      }
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.url}`);
      }
      const chunks = [];
      const headers = response.headers;
      const total = Number(headers.get("Content-Length") || packageSize);
      let loaded = 0;
      Module["setStatus"] && Module["setStatus"]("Downloading data...");
      const reader = response.body.getReader();
      while (1) {
        var {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        Module["dataFileDownloads"][packageName] = {
          loaded,
          total
        };
        let totalLoaded = 0;
        let totalSize = 0;
        for (const download of Object.values(Module["dataFileDownloads"])) {
          totalLoaded += download.loaded;
          totalSize += download.total;
        }
        Module["setStatus"] && Module["setStatus"](`Downloading data... (${totalLoaded}/${totalSize})`);
      }
      const packageData = new Uint8Array(chunks.map(c => c.length).reduce((a, b) => a + b, 0));
      let offset = 0;
      for (const chunk of chunks) {
        packageData.set(chunk, offset);
        offset += chunk.length;
      }
      return packageData.buffer;
    }
    var fetchPromise;
    var fetched = Module["getPreloadedPackage"] && Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    if (!fetched) {
      // Note that we don't use await here because we want to execute the
      // the rest of this function immediately.
      fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    }
    async function runWithFS(Module) {
      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
      Module["FS_createPath"]("/", "PlatformContent", true, true);
      Module["FS_createPath"]("/PlatformContent", "android", true, true);
      Module["FS_createPath"]("/PlatformContent/android", "terrain", true, true);
      Module["FS_createPath"]("/PlatformContent/android", "textures", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "aluminum", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "brick", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "cobblestone", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "concrete", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "diamondplate", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "fabric", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "granite", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "grass", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "ice", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "marble", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "metal", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "pebble", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "plastic", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "rust", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "sand", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "sky", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "slate", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "terrain", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "water", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "wood", true, true);
      Module["FS_createPath"]("/PlatformContent/android/textures", "woodplanks", true, true);
      Module["FS_createPath"]("/PlatformContent", "pc", true, true);
      Module["FS_createPath"]("/PlatformContent/pc", "terrain", true, true);
      Module["FS_createPath"]("/PlatformContent/pc", "textures", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "aluminum", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "brick", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "cobblestone", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "concrete", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "diamondplate", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "fabric", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "granite", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "grass", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "ice", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "marble", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "metal", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "pebble", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "plastic", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "rust", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "sand", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "sky", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "slate", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "terrain", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "water", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "wood", true, true);
      Module["FS_createPath"]("/PlatformContent/pc/textures", "woodplanks", true, true);
      Module["FS_createPath"]("/", "content", true, true);
      Module["FS_createPath"]("/content", "fonts", true, true);
      Module["FS_createPath"]("/content", "music", true, true);
      Module["FS_createPath"]("/content", "particles", true, true);
      Module["FS_createPath"]("/content", "scripts", true, true);
      Module["FS_createPath"]("/content/scripts", "CoreScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "2013", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts/2013", "BackpackScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "2014", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts/2014", "BackpackScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts/2014", "BuildToolsScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "2015", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts/2015", "BuildToolsScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "2016", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts/2016", "BuildToolsScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "BackpackScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "BuildToolsScripts", true, true);
      Module["FS_createPath"]("/content/scripts", "Libraries", true, true);
      Module["FS_createPath"]("/content/scripts/Libraries", "Settings", true, true);
      Module["FS_createPath"]("/content/scripts/Libraries/Settings", "Pages", true, true);
      Module["FS_createPath"]("/content/scripts", "Modules", true, true);
      Module["FS_createPath"]("/content/scripts/Modules", "CameraManagerModules", true, true);
      Module["FS_createPath"]("/content/scripts/Modules/CameraManagerModules", "CameraManager_Zones", true, true);
      Module["FS_createPath"]("/content/scripts/Modules", "Settings", true, true);
      Module["FS_createPath"]("/content/scripts/Modules/Settings", "Pages", true, true);
      Module["FS_createPath"]("/content/scripts/Modules", "VR", true, true);
      Module["FS_createPath"]("/content/scripts", "ServerCoreScripts", true, true);
      Module["FS_createPath"]("/content", "sky", true, true);
      Module["FS_createPath"]("/content", "sounds", true, true);
      Module["FS_createPath"]("/content", "test", true, true);
      Module["FS_createPath"]("/content", "textures", true, true);
      Module["FS_createPath"]("/content/textures", "Cursors", true, true);
      Module["FS_createPath"]("/content/textures/Cursors", "Gamepad", true, true);
      Module["FS_createPath"]("/content/textures", "aluminum", true, true);
      Module["FS_createPath"]("/content/textures", "brick", true, true);
      Module["FS_createPath"]("/content/textures", "cobblestone", true, true);
      Module["FS_createPath"]("/content/textures", "concrete", true, true);
      Module["FS_createPath"]("/content/textures", "diamondplate", true, true);
      Module["FS_createPath"]("/content/textures", "fabric", true, true);
      Module["FS_createPath"]("/content/textures", "granite", true, true);
      Module["FS_createPath"]("/content/textures", "grass", true, true);
      Module["FS_createPath"]("/content/textures", "ice", true, true);
      Module["FS_createPath"]("/content/textures", "loading", true, true);
      Module["FS_createPath"]("/content/textures", "marble", true, true);
      Module["FS_createPath"]("/content/textures", "metal", true, true);
      Module["FS_createPath"]("/content/textures", "particles", true, true);
      Module["FS_createPath"]("/content/textures", "pebble", true, true);
      Module["FS_createPath"]("/content/textures", "plastic", true, true);
      Module["FS_createPath"]("/content/textures", "rust", true, true);
      Module["FS_createPath"]("/content/textures", "sand", true, true);
      Module["FS_createPath"]("/content/textures", "sky", true, true);
      Module["FS_createPath"]("/content/textures", "slate", true, true);
      Module["FS_createPath"]("/content/textures", "terrain", true, true);
      Module["FS_createPath"]("/content/textures", "ui", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Backpack", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Chat", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Menu", true, true);
      Module["FS_createPath"]("/content/textures/ui", "PlayerList", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Scroll", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Settings", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "DropDown", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "Help", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "MenuBarAssets", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "MenuBarIcons", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "Radial", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "Slider", true, true);
      Module["FS_createPath"]("/content/textures/ui", "TopBar", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Vehicle", true, true);
      Module["FS_createPath"]("/content/textures", "water", true, true);
      Module["FS_createPath"]("/content/textures", "wood", true, true);
      Module["FS_createPath"]("/content/textures", "woodplanks", true, true);
      Module["FS_createPath"]("/", "shaders", true, true);
      Module["FS_createPath"]("/shaders", "source", true, true);
      for (var file of metadata["files"]) {
        var name = file["filename"];
        Module["addRunDependency"](`fp ${name}`);
      }
      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, "Loading data file failed.");
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData " + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
        for (var file of metadata["files"]) {
          var name = file["filename"];
          var data = byteArray.subarray(file["start"], file["end"]);
          // canOwn this data in the filesystem, it is a slice into the heap that will never change
          Module["FS_createDataFile"](name, null, data, true, true, true);
          Module["removeRunDependency"](`fp ${name}`);
        }
        Module["removeRunDependency"]("datafile_UniversalClient.data");
      }
      Module["addRunDependency"]("datafile_UniversalClient.data");
      if (!Module["preloadResults"]) Module["preloadResults"] = {};
      Module["preloadResults"][PACKAGE_NAME] = {
        fromCache: false
      };
      if (!fetched) {
        fetched = await fetchPromise;
      }
      processPackageData(fetched);
    }
    if (Module["calledRun"]) {
      runWithFS(Module);
    } else {
      if (!Module["preRun"]) Module["preRun"] = [];
      Module["preRun"].push(runWithFS);
    }
  }
  loadPackage({
    "files": [ {
      "filename": "/PlatformContent/android/terrain/diffuse.pvr",
      "start": 0,
      "end": 2796268
    }, {
      "filename": "/PlatformContent/android/terrain/materials.json",
      "start": 2796268,
      "end": 2799200
    }, {
      "filename": "/PlatformContent/android/terrain/normal.pvr",
      "start": 2799200,
      "end": 5595468
    }, {
      "filename": "/PlatformContent/android/terrain/specular.pvr",
      "start": 5595468,
      "end": 8391736
    }, {
      "filename": "/PlatformContent/android/textures/aluminum/diffuse.pvr",
      "start": 8391736,
      "end": 8391812
    }, {
      "filename": "/PlatformContent/android/textures/aluminum/normal.pvr",
      "start": 8391812,
      "end": 8566640
    }, {
      "filename": "/PlatformContent/android/textures/aluminum/normaldetail.pvr",
      "start": 8566640,
      "end": 8566716
    }, {
      "filename": "/PlatformContent/android/textures/aluminum/specular.pvr",
      "start": 8566716,
      "end": 8566792
    }, {
      "filename": "/PlatformContent/android/textures/brick/diffuse.pvr",
      "start": 8566792,
      "end": 8916368
    }, {
      "filename": "/PlatformContent/android/textures/brick/normal.pvr",
      "start": 8916368,
      "end": 9615484
    }, {
      "filename": "/PlatformContent/android/textures/brick/normaldetail.pvr",
      "start": 9615484,
      "end": 9615560
    }, {
      "filename": "/PlatformContent/android/textures/brick/specular.pvr",
      "start": 9615560,
      "end": 10314676
    }, {
      "filename": "/PlatformContent/android/textures/cobblestone/diffuse.pvr",
      "start": 10314676,
      "end": 10664252
    }, {
      "filename": "/PlatformContent/android/textures/cobblestone/normal.pvr",
      "start": 10664252,
      "end": 10839080
    }, {
      "filename": "/PlatformContent/android/textures/cobblestone/normaldetail.pvr",
      "start": 10839080,
      "end": 10839148
    }, {
      "filename": "/PlatformContent/android/textures/cobblestone/specular.pvr",
      "start": 10839148,
      "end": 11013976
    }, {
      "filename": "/PlatformContent/android/textures/concrete/diffuse.pvr",
      "start": 11013976,
      "end": 11713092
    }, {
      "filename": "/PlatformContent/android/textures/concrete/normal.pvr",
      "start": 11713092,
      "end": 12412208
    }, {
      "filename": "/PlatformContent/android/textures/concrete/normaldetail.pvr",
      "start": 12412208,
      "end": 12587036
    }, {
      "filename": "/PlatformContent/android/textures/concrete/specular.pvr",
      "start": 12587036,
      "end": 12761864
    }, {
      "filename": "/PlatformContent/android/textures/diamondplate/diffuse.pvr",
      "start": 12761864,
      "end": 12936692
    }, {
      "filename": "/PlatformContent/android/textures/diamondplate/normal.pvr",
      "start": 12936692,
      "end": 13111520
    }, {
      "filename": "/PlatformContent/android/textures/diamondplate/normaldetail.pvr",
      "start": 13111520,
      "end": 13111596
    }, {
      "filename": "/PlatformContent/android/textures/diamondplate/specular.pvr",
      "start": 13111596,
      "end": 13286424
    }, {
      "filename": "/PlatformContent/android/textures/fabric/diffuse.pvr",
      "start": 13286424,
      "end": 13636e3
    }, {
      "filename": "/PlatformContent/android/textures/fabric/normal.pvr",
      "start": 13636e3,
      "end": 13810828
    }, {
      "filename": "/PlatformContent/android/textures/fabric/normaldetail.pvr",
      "start": 13810828,
      "end": 13810904
    }, {
      "filename": "/PlatformContent/android/textures/fabric/specular.pvr",
      "start": 13810904,
      "end": 13985732
    }, {
      "filename": "/PlatformContent/android/textures/granite/diffuse.pvr",
      "start": 13985732,
      "end": 14684848
    }, {
      "filename": "/PlatformContent/android/textures/granite/normal.pvr",
      "start": 14684848,
      "end": 14684924
    }, {
      "filename": "/PlatformContent/android/textures/granite/normaldetail.pvr",
      "start": 14684924,
      "end": 14685e3
    }, {
      "filename": "/PlatformContent/android/textures/granite/specular.pvr",
      "start": 14685e3,
      "end": 15384116
    }, {
      "filename": "/PlatformContent/android/textures/grass/diffuse.pvr",
      "start": 15384116,
      "end": 15733692
    }, {
      "filename": "/PlatformContent/android/textures/grass/normal.pvr",
      "start": 15733692,
      "end": 15908520
    }, {
      "filename": "/PlatformContent/android/textures/grass/normaldetail.pvr",
      "start": 15908520,
      "end": 15908596
    }, {
      "filename": "/PlatformContent/android/textures/grass/specular.pvr",
      "start": 15908596,
      "end": 16083424
    }, {
      "filename": "/PlatformContent/android/textures/ice/diffuse.pvr",
      "start": 16083424,
      "end": 16083500
    }, {
      "filename": "/PlatformContent/android/textures/ice/normal.pvr",
      "start": 16083500,
      "end": 16258328
    }, {
      "filename": "/PlatformContent/android/textures/ice/normaldetail.pvr",
      "start": 16258328,
      "end": 16258404
    }, {
      "filename": "/PlatformContent/android/textures/ice/specular.pvr",
      "start": 16258404,
      "end": 16957520
    }, {
      "filename": "/PlatformContent/android/textures/marble/diffuse.pvr",
      "start": 16957520,
      "end": 17656636
    }, {
      "filename": "/PlatformContent/android/textures/marble/normal.pvr",
      "start": 17656636,
      "end": 17656712
    }, {
      "filename": "/PlatformContent/android/textures/marble/normaldetail.pvr",
      "start": 17656712,
      "end": 17656788
    }, {
      "filename": "/PlatformContent/android/textures/marble/specular.pvr",
      "start": 17656788,
      "end": 18355904
    }, {
      "filename": "/PlatformContent/android/textures/metal/diffuse.pvr",
      "start": 18355904,
      "end": 18530732
    }, {
      "filename": "/PlatformContent/android/textures/metal/normal.pvr",
      "start": 18530732,
      "end": 18705560
    }, {
      "filename": "/PlatformContent/android/textures/metal/normaldetail.pvr",
      "start": 18705560,
      "end": 18705636
    }, {
      "filename": "/PlatformContent/android/textures/metal/specular.pvr",
      "start": 18705636,
      "end": 18880464
    }, {
      "filename": "/PlatformContent/android/textures/pebble/diffuse.pvr",
      "start": 18880464,
      "end": 19055292
    }, {
      "filename": "/PlatformContent/android/textures/pebble/normal.pvr",
      "start": 19055292,
      "end": 19055368
    }, {
      "filename": "/PlatformContent/android/textures/pebble/normaldetail.pvr",
      "start": 19055368,
      "end": 19055444
    }, {
      "filename": "/PlatformContent/android/textures/pebble/specular.pvr",
      "start": 19055444,
      "end": 19230272
    }, {
      "filename": "/PlatformContent/android/textures/plastic/diffuse.dds",
      "start": 19230272,
      "end": 19579935
    }, {
      "filename": "/PlatformContent/android/textures/plastic/normal.dds",
      "start": 19579935,
      "end": 20978203
    }, {
      "filename": "/PlatformContent/android/textures/plastic/normaldetail.pvr",
      "start": 20978203,
      "end": 21153031
    }, {
      "filename": "/PlatformContent/android/textures/rust/diffuse.pvr",
      "start": 21153031,
      "end": 21502607
    }, {
      "filename": "/PlatformContent/android/textures/rust/normal.pvr",
      "start": 21502607,
      "end": 22201723
    }, {
      "filename": "/PlatformContent/android/textures/rust/normaldetail.pvr",
      "start": 22201723,
      "end": 22201799
    }, {
      "filename": "/PlatformContent/android/textures/rust/specular.pvr",
      "start": 22201799,
      "end": 22900915
    }, {
      "filename": "/PlatformContent/android/textures/sand/diffuse.pvr",
      "start": 22900915,
      "end": 23600031
    }, {
      "filename": "/PlatformContent/android/textures/sand/normal.pvr",
      "start": 23600031,
      "end": 23774859
    }, {
      "filename": "/PlatformContent/android/textures/sand/normaldetail.pvr",
      "start": 23774859,
      "end": 23774935
    }, {
      "filename": "/PlatformContent/android/textures/sand/specular.pvr",
      "start": 23774935,
      "end": 24474051
    }, {
      "filename": "/PlatformContent/android/textures/sky/sky512_bk.tex",
      "start": 24474051,
      "end": 25173167
    }, {
      "filename": "/PlatformContent/android/textures/sky/sky512_dn.tex",
      "start": 25173167,
      "end": 25872283
    }, {
      "filename": "/PlatformContent/android/textures/sky/sky512_ft.tex",
      "start": 25872283,
      "end": 26571399
    }, {
      "filename": "/PlatformContent/android/textures/sky/sky512_lf.tex",
      "start": 26571399,
      "end": 27270515
    }, {
      "filename": "/PlatformContent/android/textures/sky/sky512_rt.tex",
      "start": 27270515,
      "end": 27969631
    }, {
      "filename": "/PlatformContent/android/textures/sky/sky512_up.tex",
      "start": 27969631,
      "end": 28668747
    }, {
      "filename": "/PlatformContent/android/textures/slate/diffuse.pvr",
      "start": 28668747,
      "end": 29367863
    }, {
      "filename": "/PlatformContent/android/textures/slate/normal.pvr",
      "start": 29367863,
      "end": 30066979
    }, {
      "filename": "/PlatformContent/android/textures/slate/normaldetail.pvr",
      "start": 30066979,
      "end": 30241807
    }, {
      "filename": "/PlatformContent/android/textures/slate/specular.pvr",
      "start": 30241807,
      "end": 30416635
    }, {
      "filename": "/PlatformContent/android/textures/studs.dds",
      "start": 30416635,
      "end": 30766298
    }, {
      "filename": "/PlatformContent/android/textures/terrain/diffuse.pvr",
      "start": 30766298,
      "end": 33562566
    }, {
      "filename": "/PlatformContent/android/textures/terrain/diffusefar.pvr",
      "start": 33562566,
      "end": 36358834
    }, {
      "filename": "/PlatformContent/android/textures/terrain/normal.pvr",
      "start": 36358834,
      "end": 39155102
    }, {
      "filename": "/PlatformContent/android/textures/terrain/specular.pvr",
      "start": 39155102,
      "end": 41951370
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_01.pvr",
      "start": 41951370,
      "end": 41995126
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_02.pvr",
      "start": 41995126,
      "end": 42038882
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_03.pvr",
      "start": 42038882,
      "end": 42082638
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_04.pvr",
      "start": 42082638,
      "end": 42126394
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_05.pvr",
      "start": 42126394,
      "end": 42170150
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_06.pvr",
      "start": 42170150,
      "end": 42213906
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_07.pvr",
      "start": 42213906,
      "end": 42257662
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_08.pvr",
      "start": 42257662,
      "end": 42301418
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_09.pvr",
      "start": 42301418,
      "end": 42345174
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_10.pvr",
      "start": 42345174,
      "end": 42388930
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_11.pvr",
      "start": 42388930,
      "end": 42432686
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_12.pvr",
      "start": 42432686,
      "end": 42476442
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_13.pvr",
      "start": 42476442,
      "end": 42520198
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_14.pvr",
      "start": 42520198,
      "end": 42563954
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_15.pvr",
      "start": 42563954,
      "end": 42607710
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_16.pvr",
      "start": 42607710,
      "end": 42651466
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_17.pvr",
      "start": 42651466,
      "end": 42695222
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_18.pvr",
      "start": 42695222,
      "end": 42738978
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_19.pvr",
      "start": 42738978,
      "end": 42782734
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_20.pvr",
      "start": 42782734,
      "end": 42826490
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_21.pvr",
      "start": 42826490,
      "end": 42870246
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_22.pvr",
      "start": 42870246,
      "end": 42914002
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_23.pvr",
      "start": 42914002,
      "end": 42957758
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_24.pvr",
      "start": 42957758,
      "end": 43001514
    }, {
      "filename": "/PlatformContent/android/textures/water/normal_25.pvr",
      "start": 43001514,
      "end": 43045270
    }, {
      "filename": "/PlatformContent/android/textures/wood/diffuse.pvr",
      "start": 43045270,
      "end": 43744386
    }, {
      "filename": "/PlatformContent/android/textures/wood/normal.pvr",
      "start": 43744386,
      "end": 43919214
    }, {
      "filename": "/PlatformContent/android/textures/wood/normaldetail.pvr",
      "start": 43919214,
      "end": 44094042
    }, {
      "filename": "/PlatformContent/android/textures/wood/specular.pvr",
      "start": 44094042,
      "end": 44793158
    }, {
      "filename": "/PlatformContent/android/textures/woodplanks/diffuse.pvr",
      "start": 44793158,
      "end": 45142734
    }, {
      "filename": "/PlatformContent/android/textures/woodplanks/normal.pvr",
      "start": 45142734,
      "end": 45317562
    }, {
      "filename": "/PlatformContent/android/textures/woodplanks/normaldetail.pvr",
      "start": 45317562,
      "end": 45317638
    }, {
      "filename": "/PlatformContent/android/textures/woodplanks/specular.pvr",
      "start": 45317638,
      "end": 45492466
    }, {
      "filename": "/PlatformContent/pc/terrain/diffuse.dds",
      "start": 45492466,
      "end": 56677418
    }, {
      "filename": "/PlatformContent/pc/terrain/materials.json",
      "start": 56677418,
      "end": 56680345
    }, {
      "filename": "/PlatformContent/pc/terrain/normal.dds",
      "start": 56680345,
      "end": 79050121
    }, {
      "filename": "/PlatformContent/pc/terrain/specular.dds",
      "start": 79050121,
      "end": 90235073
    }, {
      "filename": "/PlatformContent/pc/textures/aluminum/diffuse.dds",
      "start": 90235073,
      "end": 90235225
    }, {
      "filename": "/PlatformContent/pc/textures/aluminum/normal.dds",
      "start": 90235225,
      "end": 90584905
    }, {
      "filename": "/PlatformContent/pc/textures/aluminum/normaldetail.dds",
      "start": 90584905,
      "end": 90585081
    }, {
      "filename": "/PlatformContent/pc/textures/aluminum/specular.dds",
      "start": 90585081,
      "end": 90585233
    }, {
      "filename": "/PlatformContent/pc/textures/brick/diffuse.dds",
      "start": 90585233,
      "end": 90934913
    }, {
      "filename": "/PlatformContent/pc/textures/brick/normal.dds",
      "start": 90934913,
      "end": 92333169
    }, {
      "filename": "/PlatformContent/pc/textures/brick/normaldetail.dds",
      "start": 92333169,
      "end": 92333345
    }, {
      "filename": "/PlatformContent/pc/textures/brick/specular.dds",
      "start": 92333345,
      "end": 93032537
    }, {
      "filename": "/PlatformContent/pc/textures/cobblestone/diffuse.dds",
      "start": 93032537,
      "end": 94430793
    }, {
      "filename": "/PlatformContent/pc/textures/cobblestone/normal.dds",
      "start": 94430793,
      "end": 95829049
    }, {
      "filename": "/PlatformContent/pc/textures/cobblestone/normaldetail.dds",
      "start": 95829049,
      "end": 95829225
    }, {
      "filename": "/PlatformContent/pc/textures/cobblestone/specular.dds",
      "start": 95829225,
      "end": 96528417
    }, {
      "filename": "/PlatformContent/pc/textures/concrete/diffuse.dds",
      "start": 96528417,
      "end": 97227609
    }, {
      "filename": "/PlatformContent/pc/textures/concrete/normal.dds",
      "start": 97227609,
      "end": 98625865
    }, {
      "filename": "/PlatformContent/pc/textures/concrete/normaldetail.dds",
      "start": 98625865,
      "end": 98975545
    }, {
      "filename": "/PlatformContent/pc/textures/concrete/specular.dds",
      "start": 98975545,
      "end": 99150449
    }, {
      "filename": "/PlatformContent/pc/textures/diamondplate/diffuse.dds",
      "start": 99150449,
      "end": 99325353
    }, {
      "filename": "/PlatformContent/pc/textures/diamondplate/normal.dds",
      "start": 99325353,
      "end": 99675033
    }, {
      "filename": "/PlatformContent/pc/textures/diamondplate/normaldetail.dds",
      "start": 99675033,
      "end": 99675209
    }, {
      "filename": "/PlatformContent/pc/textures/diamondplate/specular.dds",
      "start": 99675209,
      "end": 99850113
    }, {
      "filename": "/PlatformContent/pc/textures/fabric/diffuse.dds",
      "start": 99850113,
      "end": 100199793
    }, {
      "filename": "/PlatformContent/pc/textures/fabric/normal.dds",
      "start": 100199793,
      "end": 100549473
    }, {
      "filename": "/PlatformContent/pc/textures/fabric/normaldetail.dds",
      "start": 100549473,
      "end": 100549649
    }, {
      "filename": "/PlatformContent/pc/textures/fabric/specular.dds",
      "start": 100549649,
      "end": 100724553
    }, {
      "filename": "/PlatformContent/pc/textures/granite/diffuse.dds",
      "start": 100724553,
      "end": 101423745
    }, {
      "filename": "/PlatformContent/pc/textures/granite/normal.dds",
      "start": 101423745,
      "end": 101423921
    }, {
      "filename": "/PlatformContent/pc/textures/granite/normaldetail.dds",
      "start": 101423921,
      "end": 101424097
    }, {
      "filename": "/PlatformContent/pc/textures/granite/specular.dds",
      "start": 101424097,
      "end": 102123289
    }, {
      "filename": "/PlatformContent/pc/textures/grass/diffuse.dds",
      "start": 102123289,
      "end": 102472969
    }, {
      "filename": "/PlatformContent/pc/textures/grass/normal.dds",
      "start": 102472969,
      "end": 102822649
    }, {
      "filename": "/PlatformContent/pc/textures/grass/normaldetail.dds",
      "start": 102822649,
      "end": 102822825
    }, {
      "filename": "/PlatformContent/pc/textures/grass/specular.dds",
      "start": 102822825,
      "end": 102997729
    }, {
      "filename": "/PlatformContent/pc/textures/ice/diffuse.dds",
      "start": 102997729,
      "end": 102997881
    }, {
      "filename": "/PlatformContent/pc/textures/ice/normal.dds",
      "start": 102997881,
      "end": 103347561
    }, {
      "filename": "/PlatformContent/pc/textures/ice/normaldetail.dds",
      "start": 103347561,
      "end": 103347737
    }, {
      "filename": "/PlatformContent/pc/textures/ice/specular.dds",
      "start": 103347737,
      "end": 104046929
    }, {
      "filename": "/PlatformContent/pc/textures/marble/diffuse.dds",
      "start": 104046929,
      "end": 104746121
    }, {
      "filename": "/PlatformContent/pc/textures/marble/normal.dds",
      "start": 104746121,
      "end": 104746297
    }, {
      "filename": "/PlatformContent/pc/textures/marble/normaldetail.dds",
      "start": 104746297,
      "end": 104746473
    }, {
      "filename": "/PlatformContent/pc/textures/marble/specular.dds",
      "start": 104746473,
      "end": 105445665
    }, {
      "filename": "/PlatformContent/pc/textures/metal/diffuse.dds",
      "start": 105445665,
      "end": 105620569
    }, {
      "filename": "/PlatformContent/pc/textures/metal/normal.dds",
      "start": 105620569,
      "end": 105970249
    }, {
      "filename": "/PlatformContent/pc/textures/metal/normaldetail.dds",
      "start": 105970249,
      "end": 105970425
    }, {
      "filename": "/PlatformContent/pc/textures/metal/specular.dds",
      "start": 105970425,
      "end": 106145329
    }, {
      "filename": "/PlatformContent/pc/textures/pebble/diffuse.dds",
      "start": 106145329,
      "end": 106320233
    }, {
      "filename": "/PlatformContent/pc/textures/pebble/normal.dds",
      "start": 106320233,
      "end": 106320409
    }, {
      "filename": "/PlatformContent/pc/textures/pebble/normaldetail.dds",
      "start": 106320409,
      "end": 106320585
    }, {
      "filename": "/PlatformContent/pc/textures/pebble/specular.dds",
      "start": 106320585,
      "end": 106495489
    }, {
      "filename": "/PlatformContent/pc/textures/plastic/diffuse.dds",
      "start": 106495489,
      "end": 106670473
    }, {
      "filename": "/PlatformContent/pc/textures/plastic/normal.dds",
      "start": 106670473,
      "end": 107020313
    }, {
      "filename": "/PlatformContent/pc/textures/plastic/normaldetail.dds",
      "start": 107020313,
      "end": 107369993
    }, {
      "filename": "/PlatformContent/pc/textures/rust/diffuse.dds",
      "start": 107369993,
      "end": 108768249
    }, {
      "filename": "/PlatformContent/pc/textures/rust/normal.dds",
      "start": 108768249,
      "end": 110166505
    }, {
      "filename": "/PlatformContent/pc/textures/rust/normaldetail.dds",
      "start": 110166505,
      "end": 110166681
    }, {
      "filename": "/PlatformContent/pc/textures/rust/specular.dds",
      "start": 110166681,
      "end": 110865873
    }, {
      "filename": "/PlatformContent/pc/textures/sand/diffuse.dds",
      "start": 110865873,
      "end": 111565065
    }, {
      "filename": "/PlatformContent/pc/textures/sand/normal.dds",
      "start": 111565065,
      "end": 111914745
    }, {
      "filename": "/PlatformContent/pc/textures/sand/normaldetail.dds",
      "start": 111914745,
      "end": 111914921
    }, {
      "filename": "/PlatformContent/pc/textures/sand/specular.dds",
      "start": 111914921,
      "end": 112614113
    }, {
      "filename": "/PlatformContent/pc/textures/sky/sky512_bk.tex",
      "start": 112614113,
      "end": 113313305
    }, {
      "filename": "/PlatformContent/pc/textures/sky/sky512_dn.tex",
      "start": 113313305,
      "end": 114012497
    }, {
      "filename": "/PlatformContent/pc/textures/sky/sky512_ft.tex",
      "start": 114012497,
      "end": 114711689
    }, {
      "filename": "/PlatformContent/pc/textures/sky/sky512_lf.tex",
      "start": 114711689,
      "end": 115410881
    }, {
      "filename": "/PlatformContent/pc/textures/sky/sky512_rt.tex",
      "start": 115410881,
      "end": 116110073
    }, {
      "filename": "/PlatformContent/pc/textures/sky/sky512_up.tex",
      "start": 116110073,
      "end": 116809265
    }, {
      "filename": "/PlatformContent/pc/textures/slate/diffuse.dds",
      "start": 116809265,
      "end": 117508457
    }, {
      "filename": "/PlatformContent/pc/textures/slate/normal.dds",
      "start": 117508457,
      "end": 118906713
    }, {
      "filename": "/PlatformContent/pc/textures/slate/normaldetail.dds",
      "start": 118906713,
      "end": 119256393
    }, {
      "filename": "/PlatformContent/pc/textures/slate/specular.dds",
      "start": 119256393,
      "end": 119431297
    }, {
      "filename": "/PlatformContent/pc/textures/studs.dds",
      "start": 119431297,
      "end": 119606281
    }, {
      "filename": "/PlatformContent/pc/textures/terrain/diffuse.dds",
      "start": 119606281,
      "end": 122402625
    }, {
      "filename": "/PlatformContent/pc/textures/terrain/diffusefar.dds",
      "start": 122402625,
      "end": 125198969
    }, {
      "filename": "/PlatformContent/pc/textures/terrain/normal.dds",
      "start": 125198969,
      "end": 130791529
    }, {
      "filename": "/PlatformContent/pc/textures/terrain/specular.dds",
      "start": 130791529,
      "end": 133587873
    }, {
      "filename": "/PlatformContent/pc/textures/wangIndex.dds",
      "start": 133587873,
      "end": 133620769
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_01.dds",
      "start": 133620769,
      "end": 133708305
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_02.dds",
      "start": 133708305,
      "end": 133795841
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_03.dds",
      "start": 133795841,
      "end": 133883377
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_04.dds",
      "start": 133883377,
      "end": 133970913
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_05.dds",
      "start": 133970913,
      "end": 134058449
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_06.dds",
      "start": 134058449,
      "end": 134145985
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_07.dds",
      "start": 134145985,
      "end": 134233521
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_08.dds",
      "start": 134233521,
      "end": 134321057
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_09.dds",
      "start": 134321057,
      "end": 134408593
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_10.dds",
      "start": 134408593,
      "end": 134496129
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_11.dds",
      "start": 134496129,
      "end": 134583665
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_12.dds",
      "start": 134583665,
      "end": 134671201
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_13.dds",
      "start": 134671201,
      "end": 134758737
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_14.dds",
      "start": 134758737,
      "end": 134846273
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_15.dds",
      "start": 134846273,
      "end": 134933809
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_16.dds",
      "start": 134933809,
      "end": 135021345
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_17.dds",
      "start": 135021345,
      "end": 135108881
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_18.dds",
      "start": 135108881,
      "end": 135196417
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_19.dds",
      "start": 135196417,
      "end": 135283953
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_20.dds",
      "start": 135283953,
      "end": 135371489
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_21.dds",
      "start": 135371489,
      "end": 135459025
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_22.dds",
      "start": 135459025,
      "end": 135546561
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_23.dds",
      "start": 135546561,
      "end": 135634097
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_24.dds",
      "start": 135634097,
      "end": 135721633
    }, {
      "filename": "/PlatformContent/pc/textures/water/normal_25.dds",
      "start": 135721633,
      "end": 135809169
    }, {
      "filename": "/PlatformContent/pc/textures/wood/diffuse.dds",
      "start": 135809169,
      "end": 136508361
    }, {
      "filename": "/PlatformContent/pc/textures/wood/normal.dds",
      "start": 136508361,
      "end": 136858041
    }, {
      "filename": "/PlatformContent/pc/textures/wood/normaldetail.dds",
      "start": 136858041,
      "end": 137207721
    }, {
      "filename": "/PlatformContent/pc/textures/wood/specular.dds",
      "start": 137207721,
      "end": 137906913
    }, {
      "filename": "/PlatformContent/pc/textures/woodplanks/diffuse.dds",
      "start": 137906913,
      "end": 138256593
    }, {
      "filename": "/PlatformContent/pc/textures/woodplanks/normal.dds",
      "start": 138256593,
      "end": 138606273
    }, {
      "filename": "/PlatformContent/pc/textures/woodplanks/normaldetail.dds",
      "start": 138606273,
      "end": 138606449
    }, {
      "filename": "/PlatformContent/pc/textures/woodplanks/specular.dds",
      "start": 138606449,
      "end": 138781353
    }, {
      "filename": "/content/fonts/Arial.font",
      "start": 138781353,
      "end": 138841693
    }, {
      "filename": "/content/fonts/ArialBold.font",
      "start": 138841693,
      "end": 138889537
    }, {
      "filename": "/content/fonts/CompositExtraSlot0.mesh",
      "start": 138889537,
      "end": 138890354
    }, {
      "filename": "/content/fonts/CompositExtraSlot1.mesh",
      "start": 138890354,
      "end": 138891171
    }, {
      "filename": "/content/fonts/CompositExtraSlot2.mesh",
      "start": 138891171,
      "end": 138891988
    }, {
      "filename": "/content/fonts/CompositExtraSlot3.mesh",
      "start": 138891988,
      "end": 138892805
    }, {
      "filename": "/content/fonts/CompositExtraSlot4.mesh",
      "start": 138892805,
      "end": 138893622
    }, {
      "filename": "/content/fonts/CompositFullAtlasBaseTexture.mesh",
      "start": 138893622,
      "end": 138893815
    }, {
      "filename": "/content/fonts/CompositFullAtlasOverlayTexture.mesh",
      "start": 138893815,
      "end": 138894008
    }, {
      "filename": "/content/fonts/CompositLeftArmBase.mesh",
      "start": 138894008,
      "end": 138922929
    }, {
      "filename": "/content/fonts/CompositLeftLegBase.mesh",
      "start": 138922929,
      "end": 138951850
    }, {
      "filename": "/content/fonts/CompositPantsTemplate.mesh",
      "start": 138951850,
      "end": 138995051
    }, {
      "filename": "/content/fonts/CompositRightArmBase.mesh",
      "start": 138995051,
      "end": 139023636
    }, {
      "filename": "/content/fonts/CompositRightLegBase.mesh",
      "start": 139023636,
      "end": 139052221
    }, {
      "filename": "/content/fonts/CompositShirtTemplate.mesh",
      "start": 139052221,
      "end": 139095422
    }, {
      "filename": "/content/fonts/CompositTShirt.mesh",
      "start": 139095422,
      "end": 139095615
    }, {
      "filename": "/content/fonts/CompositTorsoBase.mesh",
      "start": 139095615,
      "end": 139124536
    }, {
      "filename": "/content/fonts/LoadingScript.lua",
      "start": 139124536,
      "end": 139150189
    }, {
      "filename": "/content/fonts/Rocket.rbxm",
      "start": 139150189,
      "end": 139154689
    }, {
      "filename": "/content/fonts/SlingshotPellet.rbxm",
      "start": 139154689,
      "end": 139158119
    }, {
      "filename": "/content/fonts/SourceSans.font",
      "start": 139158119,
      "end": 139232563
    }, {
      "filename": "/content/fonts/SourceSansBold.font",
      "start": 139232563,
      "end": 139310751
    }, {
      "filename": "/content/fonts/SourceSansItalic.font",
      "start": 139310751,
      "end": 139386059
    }, {
      "filename": "/content/fonts/SourceSansLight.font",
      "start": 139386059,
      "end": 139460695
    }, {
      "filename": "/content/fonts/SourceSansPro-Bold.ttf",
      "start": 139460695,
      "end": 139752279
    }, {
      "filename": "/content/fonts/SourceSansPro-It.ttf",
      "start": 139752279,
      "end": 139855899
    }, {
      "filename": "/content/fonts/SourceSansPro-Light.ttf",
      "start": 139855899,
      "end": 140149203
    }, {
      "filename": "/content/fonts/SourceSansPro-Regular.ttf",
      "start": 140149203,
      "end": 140443163
    }, {
      "filename": "/content/fonts/arial.ttf",
      "start": 140443163,
      "end": 141217015
    }, {
      "filename": "/content/fonts/arialbd.ttf",
      "start": 141217015,
      "end": 141967231
    }, {
      "filename": "/content/fonts/character.rbxm",
      "start": 141967231,
      "end": 141983889
    }, {
      "filename": "/content/fonts/character3.rbxm",
      "start": 141983889,
      "end": 142002856
    }, {
      "filename": "/content/fonts/characterCameraScript.rbxmx",
      "start": 142002856,
      "end": 142134957
    }, {
      "filename": "/content/fonts/characterControlScript.rbxmx",
      "start": 142134957,
      "end": 142205587
    }, {
      "filename": "/content/fonts/characterR15.rbxm",
      "start": 142205587,
      "end": 142211138
    }, {
      "filename": "/content/fonts/comics.fnt",
      "start": 142211138,
      "end": 142226386
    }, {
      "filename": "/content/fonts/diogenes.fnt",
      "start": 142226386,
      "end": 142229316
    }, {
      "filename": "/content/fonts/fonts.dds",
      "start": 142229316,
      "end": 146423748
    }, {
      "filename": "/content/fonts/gamecontrollerdb.txt",
      "start": 146423748,
      "end": 146447814
    }, {
      "filename": "/content/fonts/head.mesh",
      "start": 146447814,
      "end": 146476603
    }, {
      "filename": "/content/fonts/headA.mesh",
      "start": 146476603,
      "end": 146490164
    }, {
      "filename": "/content/fonts/headB.mesh",
      "start": 146490164,
      "end": 146491197
    }, {
      "filename": "/content/fonts/headC.mesh",
      "start": 146491197,
      "end": 146510158
    }, {
      "filename": "/content/fonts/headD.mesh",
      "start": 146510158,
      "end": 146539667
    }, {
      "filename": "/content/fonts/headE.mesh",
      "start": 146539667,
      "end": 146564172
    }, {
      "filename": "/content/fonts/headF.mesh",
      "start": 146564172,
      "end": 146573773
    }, {
      "filename": "/content/fonts/headG.mesh",
      "start": 146573773,
      "end": 146595362
    }, {
      "filename": "/content/fonts/headH.mesh",
      "start": 146595362,
      "end": 146624151
    }, {
      "filename": "/content/fonts/headI.mesh",
      "start": 146624151,
      "end": 146627032
    }, {
      "filename": "/content/fonts/headJ.mesh",
      "start": 146627032,
      "end": 146629697
    }, {
      "filename": "/content/fonts/headK.mesh",
      "start": 146629697,
      "end": 146658486
    }, {
      "filename": "/content/fonts/headL.mesh",
      "start": 146658486,
      "end": 146672515
    }, {
      "filename": "/content/fonts/headM.mesh",
      "start": 146672515,
      "end": 146675756
    }, {
      "filename": "/content/fonts/headN.mesh",
      "start": 146675756,
      "end": 146705265
    }, {
      "filename": "/content/fonts/headO.mesh",
      "start": 146705265,
      "end": 146724370
    }, {
      "filename": "/content/fonts/headP.mesh",
      "start": 146724370,
      "end": 146753879
    }, {
      "filename": "/content/fonts/humanoidAnimate.rbxm",
      "start": 146753879,
      "end": 146761132
    }, {
      "filename": "/content/fonts/humanoidAnimateLocal.rbxm",
      "start": 146761132,
      "end": 146769539
    }, {
      "filename": "/content/fonts/humanoidAnimateLocalKeyframe.rbxm",
      "start": 146769539,
      "end": 146792136
    }, {
      "filename": "/content/fonts/humanoidAnimateLocalKeyframe2.rbxm",
      "start": 146792136,
      "end": 146812034
    }, {
      "filename": "/content/fonts/humanoidAnimateR15.rbxm",
      "start": 146812034,
      "end": 146817883
    }, {
      "filename": "/content/fonts/humanoidExtra.rbxm",
      "start": 146817883,
      "end": 146820529
    }, {
      "filename": "/content/fonts/humanoidSound.rbxm",
      "start": 146820529,
      "end": 146822845
    }, {
      "filename": "/content/fonts/humanoidSound2.rbxm",
      "start": 146822845,
      "end": 146824645
    }, {
      "filename": "/content/fonts/humanoidSoundNew.rbxm",
      "start": 146824645,
      "end": 146828990
    }, {
      "filename": "/content/fonts/humanoidSoundNewLocal.rbxmx",
      "start": 146828990,
      "end": 146837825
    }, {
      "filename": "/content/fonts/humanoidStatic.rbxm",
      "start": 146837825,
      "end": 146838440
    }, {
      "filename": "/content/fonts/leftarm.mesh",
      "start": 146838440,
      "end": 146840505
    }, {
      "filename": "/content/fonts/leftleg.mesh",
      "start": 146840505,
      "end": 146842570
    }, {
      "filename": "/content/fonts/rightarm.mesh",
      "start": 146842570,
      "end": 146844635
    }, {
      "filename": "/content/fonts/rightleg.mesh",
      "start": 146844635,
      "end": 146846700
    }, {
      "filename": "/content/fonts/safechat.xml",
      "start": 146846700,
      "end": 146872192
    }, {
      "filename": "/content/fonts/torso.mesh",
      "start": 146872192,
      "end": 146874257
    }, {
      "filename": "/content/music/bass.wav",
      "start": 146874257,
      "end": 146880637
    }, {
      "filename": "/content/music/ufofly.wav",
      "start": 146880637,
      "end": 146915079
    }, {
      "filename": "/content/particles/explosion.particle",
      "start": 146915079,
      "end": 146918857
    }, {
      "filename": "/content/particles/explosionMat.material",
      "start": 146918857,
      "end": 146920030
    }, {
      "filename": "/content/particles/fire.particle",
      "start": 146920030,
      "end": 146921476
    }, {
      "filename": "/content/particles/fireMat.material",
      "start": 146921476,
      "end": 146922161
    }, {
      "filename": "/content/particles/forceFieldBeam.particle",
      "start": 146922161,
      "end": 146923080
    }, {
      "filename": "/content/particles/forceFieldRadial.particle",
      "start": 146923080,
      "end": 146924264
    }, {
      "filename": "/content/particles/glow.material",
      "start": 146924264,
      "end": 146924487
    }, {
      "filename": "/content/particles/smoke.particle",
      "start": 146924487,
      "end": 146925383
    }, {
      "filename": "/content/particles/smokeMat.material",
      "start": 146925383,
      "end": 146925656
    }, {
      "filename": "/content/particles/sparkles.particle",
      "start": 146925656,
      "end": 146926644
    }, {
      "filename": "/content/particles/sparklesMat.material",
      "start": 146926644,
      "end": 146927059
    }, {
      "filename": "/content/scripts/CoreScripts/2013/BackpackScripts/BackpackBuilder.lua",
      "start": 146927059,
      "end": 146959077
    }, {
      "filename": "/content/scripts/CoreScripts/2013/BackpackScripts/BackpackGear.lua",
      "start": 146959077,
      "end": 146983595
    }, {
      "filename": "/content/scripts/CoreScripts/2013/BackpackScripts/BackpackManager.lua",
      "start": 146983595,
      "end": 146995580
    }, {
      "filename": "/content/scripts/CoreScripts/2013/BackpackScripts/LoadoutScript.lua",
      "start": 146995580,
      "end": 147025127
    }, {
      "filename": "/content/scripts/CoreScripts/2013/ChatScript.lua",
      "start": 147025127,
      "end": 147076335
    }, {
      "filename": "/content/scripts/CoreScripts/2013/HealthBar.lua",
      "start": 147076335,
      "end": 147076335
    }, {
      "filename": "/content/scripts/CoreScripts/2013/LoadingScript.lua",
      "start": 147076335,
      "end": 147076356
    }, {
      "filename": "/content/scripts/CoreScripts/2013/MainBotChatScript.lua",
      "start": 147076356,
      "end": 147092729
    }, {
      "filename": "/content/scripts/CoreScripts/2013/ModuleRegistration.lua",
      "start": 147092729,
      "end": 147093688
    }, {
      "filename": "/content/scripts/CoreScripts/2013/NotificationScript.lua",
      "start": 147093688,
      "end": 147101460
    }, {
      "filename": "/content/scripts/CoreScripts/2013/PlayerListScript.lua",
      "start": 147101460,
      "end": 147189085
    }, {
      "filename": "/content/scripts/CoreScripts/2013/PopupScript.lua",
      "start": 147189085,
      "end": 147191314
    }, {
      "filename": "/content/scripts/CoreScripts/2013/PurchasePromptScript.lua",
      "start": 147191314,
      "end": 147228251
    }, {
      "filename": "/content/scripts/CoreScripts/2013/RbxGear.lua",
      "start": 147228251,
      "end": 147228799
    }, {
      "filename": "/content/scripts/CoreScripts/2013/RbxGui.lua",
      "start": 147228799,
      "end": 147352542
    }, {
      "filename": "/content/scripts/CoreScripts/2013/RbxStamper.lua",
      "start": 147352542,
      "end": 147434081
    }, {
      "filename": "/content/scripts/CoreScripts/2013/RbxUtility.lua",
      "start": 147434081,
      "end": 147469284
    }, {
      "filename": "/content/scripts/CoreScripts/2013/Sections.lua",
      "start": 147469284,
      "end": 147469284
    }, {
      "filename": "/content/scripts/CoreScripts/2013/Settings.lua",
      "start": 147469284,
      "end": 147542056
    }, {
      "filename": "/content/scripts/CoreScripts/2013/StarterScript.lua",
      "start": 147542056,
      "end": 147552491
    }, {
      "filename": "/content/scripts/CoreScripts/2013/ToolTip.lua",
      "start": 147552491,
      "end": 147555987
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BackpackScript.lua",
      "start": 147555987,
      "end": 147585006
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BackpackScripts/BackpackBuilder.lua",
      "start": 147585006,
      "end": 147605703
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BackpackScripts/BackpackGear.lua",
      "start": 147605703,
      "end": 147631479
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BackpackScripts/BackpackManager.lua",
      "start": 147631479,
      "end": 147643822
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BackpackScripts/BackpackResizer.lua",
      "start": 147643822,
      "end": 147673053
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BackpackScripts/LoadoutScript.lua",
      "start": 147673053,
      "end": 147705148
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BuildToolsScripts/BuildToolManager.lua",
      "start": 147705148,
      "end": 147709968
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BuildToolsScripts/BuildToolsScript.lua",
      "start": 147709968,
      "end": 147715629
    }, {
      "filename": "/content/scripts/CoreScripts/2014/BuildToolsScripts/PersonalServerScript.lua",
      "start": 147715629,
      "end": 147720831
    }, {
      "filename": "/content/scripts/CoreScripts/2014/ChatScript.lua",
      "start": 147720831,
      "end": 147750829
    }, {
      "filename": "/content/scripts/CoreScripts/2014/ChatScript2.lua",
      "start": 147750829,
      "end": 147816243
    }, {
      "filename": "/content/scripts/CoreScripts/2014/ContextActionTouch.lua",
      "start": 147816243,
      "end": 147824695
    }, {
      "filename": "/content/scripts/CoreScripts/2014/DeveloperConsole.lua",
      "start": 147824695,
      "end": 147864155
    }, {
      "filename": "/content/scripts/CoreScripts/2014/DialogScripts.rbxm",
      "start": 147864155,
      "end": 147865271
    }, {
      "filename": "/content/scripts/CoreScripts/2014/HealthScript.lua",
      "start": 147865271,
      "end": 147875657
    }, {
      "filename": "/content/scripts/CoreScripts/2014/LoadingScript.lua",
      "start": 147875657,
      "end": 147899733
    }, {
      "filename": "/content/scripts/CoreScripts/2014/MainBotChatScript.lua",
      "start": 147899733,
      "end": 147916836
    }, {
      "filename": "/content/scripts/CoreScripts/2014/NotificationScript.lua",
      "start": 147916836,
      "end": 147928922
    }, {
      "filename": "/content/scripts/CoreScripts/2014/PlaceConsoleScript.lua",
      "start": 147928922,
      "end": 147941273
    }, {
      "filename": "/content/scripts/CoreScripts/2014/PlayerListScript.lua",
      "start": 147941273,
      "end": 148033683
    }, {
      "filename": "/content/scripts/CoreScripts/2014/PlayerListScript2.lua",
      "start": 148033683,
      "end": 148092314
    }, {
      "filename": "/content/scripts/CoreScripts/2014/PopupScript.lua",
      "start": 148092314,
      "end": 148094619
    }, {
      "filename": "/content/scripts/CoreScripts/2014/PurchasePromptScript.lua",
      "start": 148094619,
      "end": 148142562
    }, {
      "filename": "/content/scripts/CoreScripts/2014/RBXStatusBuffsGUIScript.lua",
      "start": 148142562,
      "end": 148145847
    }, {
      "filename": "/content/scripts/CoreScripts/2014/Sections.lua",
      "start": 148145847,
      "end": 148146058
    }, {
      "filename": "/content/scripts/CoreScripts/2014/Settings.lua",
      "start": 148146058,
      "end": 148241730
    }, {
      "filename": "/content/scripts/CoreScripts/2014/StarterScript.lua",
      "start": 148241730,
      "end": 148246e3
    }, {
      "filename": "/content/scripts/CoreScripts/2014/SubMenuBuilder.lua",
      "start": 148246e3,
      "end": 148254706
    }, {
      "filename": "/content/scripts/CoreScripts/2014/SurfaceMenuMover.lua",
      "start": 148254706,
      "end": 148255691
    }, {
      "filename": "/content/scripts/CoreScripts/2014/ToolTip.lua",
      "start": 148255691,
      "end": 148259296
    }, {
      "filename": "/content/scripts/CoreScripts/2014/TouchControls.lua",
      "start": 148259296,
      "end": 148322088
    }, {
      "filename": "/content/scripts/CoreScripts/2014/fastlog.lua",
      "start": 148322088,
      "end": 148322271
    }, {
      "filename": "/content/scripts/CoreScripts/2015/BuildToolsScripts/BuildToolManager.lua",
      "start": 148322271,
      "end": 148327091
    }, {
      "filename": "/content/scripts/CoreScripts/2015/BuildToolsScripts/BuildToolsScript.lua",
      "start": 148327091,
      "end": 148332654
    }, {
      "filename": "/content/scripts/CoreScripts/2015/BuildToolsScripts/PersonalServerScript.lua",
      "start": 148332654,
      "end": 148337856
    }, {
      "filename": "/content/scripts/CoreScripts/2015/ChatScript2.lua",
      "start": 148337856,
      "end": 148410670
    }, {
      "filename": "/content/scripts/CoreScripts/2015/ContextActionTouch.lua",
      "start": 148410670,
      "end": 148419122
    }, {
      "filename": "/content/scripts/CoreScripts/2015/DeveloperConsole.lua",
      "start": 148419122,
      "end": 148458885
    }, {
      "filename": "/content/scripts/CoreScripts/2015/GamepadMenu.lua",
      "start": 148458885,
      "end": 148467426
    }, {
      "filename": "/content/scripts/CoreScripts/2015/HealthScript.lua",
      "start": 148467426,
      "end": 148477812
    }, {
      "filename": "/content/scripts/CoreScripts/2015/LoadingScript.lua",
      "start": 148477812,
      "end": 148495823
    }, {
      "filename": "/content/scripts/CoreScripts/2015/MainBotChatScript.lua",
      "start": 148495823,
      "end": 148513142
    }, {
      "filename": "/content/scripts/CoreScripts/2015/MainBotChatScript2.lua",
      "start": 148513142,
      "end": 148529274
    }, {
      "filename": "/content/scripts/CoreScripts/2015/NotificationScript2.lua",
      "start": 148529274,
      "end": 148545870
    }, {
      "filename": "/content/scripts/CoreScripts/2015/PlayerListScript.lua",
      "start": 148545870,
      "end": 148638283
    }, {
      "filename": "/content/scripts/CoreScripts/2015/PlayerListScript2.lua",
      "start": 148638283,
      "end": 148708128
    }, {
      "filename": "/content/scripts/CoreScripts/2015/PurchasePromptScript.lua",
      "start": 148708128,
      "end": 148758389
    }, {
      "filename": "/content/scripts/CoreScripts/2015/PurchasePromptScript2.lua",
      "start": 148758389,
      "end": 148796646
    }, {
      "filename": "/content/scripts/CoreScripts/2015/StarterScript.lua",
      "start": 148796646,
      "end": 148801213
    }, {
      "filename": "/content/scripts/CoreScripts/2015/Topbar.lua",
      "start": 148801213,
      "end": 148832204
    }, {
      "filename": "/content/scripts/CoreScripts/2015/TouchControls.lua",
      "start": 148832204,
      "end": 148895132
    }, {
      "filename": "/content/scripts/CoreScripts/2015/VehicleHud.lua",
      "start": 148895132,
      "end": 148899885
    }, {
      "filename": "/content/scripts/CoreScripts/2016/BubbleChat.lua",
      "start": 148899885,
      "end": 148921902
    }, {
      "filename": "/content/scripts/CoreScripts/2016/BuildToolsScripts/BuildToolManager.lua",
      "start": 148921902,
      "end": 148926722
    }, {
      "filename": "/content/scripts/CoreScripts/2016/BuildToolsScripts/BuildToolsScript.lua",
      "start": 148926722,
      "end": 148932285
    }, {
      "filename": "/content/scripts/CoreScripts/2016/BuildToolsScripts/PersonalServerScript.lua",
      "start": 148932285,
      "end": 148938122
    }, {
      "filename": "/content/scripts/CoreScripts/2016/ContextActionTouch.lua",
      "start": 148938122,
      "end": 148946793
    }, {
      "filename": "/content/scripts/CoreScripts/2016/DeveloperConsole.lua",
      "start": 148946793,
      "end": 148988228
    }, {
      "filename": "/content/scripts/CoreScripts/2016/GamepadMenu.lua",
      "start": 148988228,
      "end": 149010610
    }, {
      "filename": "/content/scripts/CoreScripts/2016/HealthScript.lua",
      "start": 149010610,
      "end": 149021013
    }, {
      "filename": "/content/scripts/CoreScripts/2016/LoadingScript.lua",
      "start": 149021013,
      "end": 149045600
    }, {
      "filename": "/content/scripts/CoreScripts/2016/MainBotChatScript2.lua",
      "start": 149045600,
      "end": 149069540
    }, {
      "filename": "/content/scripts/CoreScripts/2016/NotificationScript2.lua",
      "start": 149069540,
      "end": 149093452
    }, {
      "filename": "/content/scripts/CoreScripts/2016/PurchasePromptScript2.lua",
      "start": 149093452,
      "end": 149147051
    }, {
      "filename": "/content/scripts/CoreScripts/2016/StarterScript.lua",
      "start": 149147051,
      "end": 149149703
    }, {
      "filename": "/content/scripts/CoreScripts/2016/Topbar.lua",
      "start": 149149703,
      "end": 149184798
    }, {
      "filename": "/content/scripts/CoreScripts/2016/VehicleHud.lua",
      "start": 149184798,
      "end": 149190807
    }, {
      "filename": "/content/scripts/CoreScripts/AppHome.lua",
      "start": 149190807,
      "end": 149202751
    }, {
      "filename": "/content/scripts/CoreScripts/BackpackScript.lua",
      "start": 149202751,
      "end": 149231770
    }, {
      "filename": "/content/scripts/CoreScripts/BackpackScripts/BackpackBuilder.lua",
      "start": 149231770,
      "end": 149252467
    }, {
      "filename": "/content/scripts/CoreScripts/BackpackScripts/BackpackGear.lua",
      "start": 149252467,
      "end": 149278235
    }, {
      "filename": "/content/scripts/CoreScripts/BackpackScripts/BackpackManager.lua",
      "start": 149278235,
      "end": 149290578
    }, {
      "filename": "/content/scripts/CoreScripts/BackpackScripts/BackpackResizer.lua",
      "start": 149290578,
      "end": 149319801
    }, {
      "filename": "/content/scripts/CoreScripts/BackpackScripts/LoadoutScript.lua",
      "start": 149319801,
      "end": 149351896
    }, {
      "filename": "/content/scripts/CoreScripts/BubbleChat.lua",
      "start": 149351896,
      "end": 149373913
    }, {
      "filename": "/content/scripts/CoreScripts/BuildToolsScripts/BuildToolManager.lua",
      "start": 149373913,
      "end": 149378733
    }, {
      "filename": "/content/scripts/CoreScripts/BuildToolsScripts/BuildToolsScript.lua",
      "start": 149378733,
      "end": 149384386
    }, {
      "filename": "/content/scripts/CoreScripts/BuildToolsScripts/PersonalServerScript.lua",
      "start": 149384386,
      "end": 149389588
    }, {
      "filename": "/content/scripts/CoreScripts/ChatScript.lua",
      "start": 149389588,
      "end": 149419586
    }, {
      "filename": "/content/scripts/CoreScripts/ChatScript2.lua",
      "start": 149419586,
      "end": 149484960
    }, {
      "filename": "/content/scripts/CoreScripts/ContextActionTouch.lua",
      "start": 149484960,
      "end": 149493412
    }, {
      "filename": "/content/scripts/CoreScripts/DeveloperConsole.lua",
      "start": 149493412,
      "end": 149532872
    }, {
      "filename": "/content/scripts/CoreScripts/GamepadMenu.lua",
      "start": 149532872,
      "end": 149555254
    }, {
      "filename": "/content/scripts/CoreScripts/HealthScript.lua",
      "start": 149555254,
      "end": 149565640
    }, {
      "filename": "/content/scripts/CoreScripts/LoadingScript.lua",
      "start": 149565640,
      "end": 149590173
    }, {
      "filename": "/content/scripts/CoreScripts/MainBotChatScript.lua",
      "start": 149590173,
      "end": 149607276
    }, {
      "filename": "/content/scripts/CoreScripts/MainBotChatScript2.lua",
      "start": 149607276,
      "end": 149631216
    }, {
      "filename": "/content/scripts/CoreScripts/NotificationScript.lua",
      "start": 149631216,
      "end": 149643303
    }, {
      "filename": "/content/scripts/CoreScripts/NotificationScript2.lua",
      "start": 149643303,
      "end": 149667215
    }, {
      "filename": "/content/scripts/CoreScripts/PlayerListScript.lua",
      "start": 149667215,
      "end": 149759618
    }, {
      "filename": "/content/scripts/CoreScripts/PlayerListScript2.lua",
      "start": 149759618,
      "end": 149818009
    }, {
      "filename": "/content/scripts/CoreScripts/PopupScript.lua",
      "start": 149818009,
      "end": 149820314
    }, {
      "filename": "/content/scripts/CoreScripts/PurchasePromptScript.lua",
      "start": 149820314,
      "end": 149868257
    }, {
      "filename": "/content/scripts/CoreScripts/PurchasePromptScript2.lua",
      "start": 149868257,
      "end": 149921856
    }, {
      "filename": "/content/scripts/CoreScripts/PurchasePromptScript3.lua",
      "start": 149921856,
      "end": 149979457
    }, {
      "filename": "/content/scripts/CoreScripts/Settings.lua",
      "start": 149979457,
      "end": 150075685
    }, {
      "filename": "/content/scripts/CoreScripts/StarterScript.lua",
      "start": 150075685,
      "end": 150078337
    }, {
      "filename": "/content/scripts/CoreScripts/ToolTip.lua",
      "start": 150078337,
      "end": 150081942
    }, {
      "filename": "/content/scripts/CoreScripts/Topbar.lua",
      "start": 150081942,
      "end": 150117041
    }, {
      "filename": "/content/scripts/CoreScripts/TouchControls.lua",
      "start": 150117041,
      "end": 150179833
    }, {
      "filename": "/content/scripts/CoreScripts/VehicleHud.lua",
      "start": 150179833,
      "end": 150185842
    }, {
      "filename": "/content/scripts/Libraries/BackpackScript.lua",
      "start": 150185842,
      "end": 150234643
    }, {
      "filename": "/content/scripts/Libraries/CSManager.lua",
      "start": 150234643,
      "end": 150238647
    }, {
      "filename": "/content/scripts/Libraries/Chat.lua",
      "start": 150238647,
      "end": 150330934
    }, {
      "filename": "/content/scripts/Libraries/DeveloperConsoleModule.lua",
      "start": 150330934,
      "end": 150418558
    }, {
      "filename": "/content/scripts/Libraries/ModuleRegistration.lua",
      "start": 150418558,
      "end": 150419743
    }, {
      "filename": "/content/scripts/Libraries/PlayerDropDown.lua",
      "start": 150419743,
      "end": 150438912
    }, {
      "filename": "/content/scripts/Libraries/PlayerlistModule.lua",
      "start": 150438912,
      "end": 150493378
    }, {
      "filename": "/content/scripts/Libraries/RBXStatus.lua",
      "start": 150493378,
      "end": 150502083
    }, {
      "filename": "/content/scripts/Libraries/RbxGear.lua",
      "start": 150502083,
      "end": 150502631
    }, {
      "filename": "/content/scripts/Libraries/RbxGearThirteen.lua",
      "start": 150502631,
      "end": 150503179
    }, {
      "filename": "/content/scripts/Libraries/RbxGui.lua",
      "start": 150503179,
      "end": 150637029
    }, {
      "filename": "/content/scripts/Libraries/RbxGuiFifteen.lua",
      "start": 150637029,
      "end": 150778070
    }, {
      "filename": "/content/scripts/Libraries/RbxGuiFourTeen.lua",
      "start": 150778070,
      "end": 150911920
    }, {
      "filename": "/content/scripts/Libraries/RbxGuiSixteen.lua",
      "start": 150911920,
      "end": 151045770
    }, {
      "filename": "/content/scripts/Libraries/RbxGuiThirteen.lua",
      "start": 151045770,
      "end": 151169513
    }, {
      "filename": "/content/scripts/Libraries/RbxStamper.lua",
      "start": 151169513,
      "end": 151254082
    }, {
      "filename": "/content/scripts/Libraries/RbxStamperFifteen.lua",
      "start": 151254082,
      "end": 151338453
    }, {
      "filename": "/content/scripts/Libraries/RbxStamperFourteen.lua",
      "start": 151338453,
      "end": 151423022
    }, {
      "filename": "/content/scripts/Libraries/RbxStamperSixteen.lua",
      "start": 151423022,
      "end": 151507591
    }, {
      "filename": "/content/scripts/Libraries/RbxStamperThirteen.lua",
      "start": 151507591,
      "end": 151589130
    }, {
      "filename": "/content/scripts/Libraries/RbxUtility.lua",
      "start": 151589130,
      "end": 151625742
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/GameSettings.lua",
      "start": 151625742,
      "end": 151647403
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/Help.lua",
      "start": 151647403,
      "end": 151667533
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/Home.lua",
      "start": 151667533,
      "end": 151670235
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/LeaveGame.lua",
      "start": 151670235,
      "end": 151674395
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/Players.lua",
      "start": 151674395,
      "end": 151685740
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/Record.lua",
      "start": 151685740,
      "end": 151691481
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/ReportAbuseMenu.lua",
      "start": 151691481,
      "end": 151700944
    }, {
      "filename": "/content/scripts/Libraries/Settings/Pages/ResetCharacter.lua",
      "start": 151700944,
      "end": 151705662
    }, {
      "filename": "/content/scripts/Libraries/Settings/SettingsHub.lua",
      "start": 151705662,
      "end": 151742266
    }, {
      "filename": "/content/scripts/Libraries/Settings/SettingsPageFactory.lua",
      "start": 151742266,
      "end": 151749962
    }, {
      "filename": "/content/scripts/Libraries/Settings/Utility.lua",
      "start": 151749962,
      "end": 151810266
    }, {
      "filename": "/content/scripts/Libraries/Settings2.lua",
      "start": 151810266,
      "end": 151871233
    }, {
      "filename": "/content/scripts/Libraries/TenFootInterface.lua",
      "start": 151871233,
      "end": 151881392
    }, {
      "filename": "/content/scripts/LoadingScript.lua",
      "start": 151881392,
      "end": 151882718
    }, {
      "filename": "/content/scripts/Modules/AccountManager.lua",
      "start": 151882718,
      "end": 151887964
    }, {
      "filename": "/content/scripts/Modules/AccountScreen.lua",
      "start": 151887964,
      "end": 151890156
    }, {
      "filename": "/content/scripts/Modules/AchievementManager.lua",
      "start": 151890156,
      "end": 151898160
    }, {
      "filename": "/content/scripts/Modules/AppHub.lua",
      "start": 151898160,
      "end": 151911359
    }, {
      "filename": "/content/scripts/Modules/AssetManager.lua",
      "start": 151911359,
      "end": 151915144
    }, {
      "filename": "/content/scripts/Modules/AvatarPane.lua",
      "start": 151915144,
      "end": 151938301
    }, {
      "filename": "/content/scripts/Modules/AvatarTile.lua",
      "start": 151938301,
      "end": 151944495
    }, {
      "filename": "/content/scripts/Modules/BackpackScript.lua",
      "start": 151944495,
      "end": 151993296
    }, {
      "filename": "/content/scripts/Modules/BackpackScript3D.lua",
      "start": 151993296,
      "end": 152009180
    }, {
      "filename": "/content/scripts/Modules/BadgeOverlay.lua",
      "start": 152009180,
      "end": 152014048
    }, {
      "filename": "/content/scripts/Modules/BadgeScreen.lua",
      "start": 152014048,
      "end": 152017988
    }, {
      "filename": "/content/scripts/Modules/BadgeSort.lua",
      "start": 152017988,
      "end": 152023547
    }, {
      "filename": "/content/scripts/Modules/BaseOverlay.lua",
      "start": 152023547,
      "end": 152027723
    }, {
      "filename": "/content/scripts/Modules/BaseScreen.lua",
      "start": 152027723,
      "end": 152031982
    }, {
      "filename": "/content/scripts/Modules/BaseSignInScreen.lua",
      "start": 152031982,
      "end": 152039179
    }, {
      "filename": "/content/scripts/Modules/BaseTile.lua",
      "start": 152039179,
      "end": 152042412
    }, {
      "filename": "/content/scripts/Modules/CSManager.lua",
      "start": 152042412,
      "end": 152046559
    }, {
      "filename": "/content/scripts/Modules/CameraManager.lua",
      "start": 152046559,
      "end": 152053732
    }, {
      "filename": "/content/scripts/Modules/CameraManagerModules/CameraManager_ZoneManager.lua",
      "start": 152053732,
      "end": 152056e3
    }, {
      "filename": "/content/scripts/Modules/CameraManagerModules/CameraManager_Zones/CameraManagerZone_City.lua",
      "start": 152056e3,
      "end": 152061078
    }, {
      "filename": "/content/scripts/Modules/CameraManagerModules/CameraManager_Zones/CameraManagerZone_Space.lua",
      "start": 152061078,
      "end": 152064672
    }, {
      "filename": "/content/scripts/Modules/CameraManagerModules/CameraManager_Zones/CameraManagerZone_Volcano.lua",
      "start": 152064672,
      "end": 152065940
    }, {
      "filename": "/content/scripts/Modules/CarouselController.lua",
      "start": 152065940,
      "end": 152074729
    }, {
      "filename": "/content/scripts/Modules/CarouselView.lua",
      "start": 152074729,
      "end": 152081681
    }, {
      "filename": "/content/scripts/Modules/Chat.lua",
      "start": 152081681,
      "end": 152173968
    }, {
      "filename": "/content/scripts/Modules/ConfirmPrompt.lua",
      "start": 152173968,
      "end": 152188471
    }, {
      "filename": "/content/scripts/Modules/ControllerStateManager.lua",
      "start": 152188471,
      "end": 152192855
    }, {
      "filename": "/content/scripts/Modules/CurrencyWidget.lua",
      "start": 152192855,
      "end": 152201907
    }, {
      "filename": "/content/scripts/Modules/DeveloperConsoleModule.lua",
      "start": 152201907,
      "end": 152289531
    }, {
      "filename": "/content/scripts/Modules/EngagementScreen.lua",
      "start": 152289531,
      "end": 152296544
    }, {
      "filename": "/content/scripts/Modules/ErrorOverlay.lua",
      "start": 152296544,
      "end": 152300325
    }, {
      "filename": "/content/scripts/Modules/Errors.lua",
      "start": 152300325,
      "end": 152308708
    }, {
      "filename": "/content/scripts/Modules/EventHub.lua",
      "start": 152308708,
      "end": 152314833
    }, {
      "filename": "/content/scripts/Modules/FriendPresenceItem.lua",
      "start": 152314833,
      "end": 152319822
    }, {
      "filename": "/content/scripts/Modules/FriendsData.lua",
      "start": 152319822,
      "end": 152328875
    }, {
      "filename": "/content/scripts/Modules/FriendsView.lua",
      "start": 152328875,
      "end": 152335787
    }, {
      "filename": "/content/scripts/Modules/GameCollection.lua",
      "start": 152335787,
      "end": 152338905
    }, {
      "filename": "/content/scripts/Modules/GameData.lua",
      "start": 152338905,
      "end": 152345989
    }, {
      "filename": "/content/scripts/Modules/GameDetail.lua",
      "start": 152345989,
      "end": 152382103
    }, {
      "filename": "/content/scripts/Modules/GameGenre.lua",
      "start": 152382103,
      "end": 152407235
    }, {
      "filename": "/content/scripts/Modules/GameJoin.lua",
      "start": 152407235,
      "end": 152408975
    }, {
      "filename": "/content/scripts/Modules/GamePane.lua",
      "start": 152408975,
      "end": 152415755
    }, {
      "filename": "/content/scripts/Modules/GameSort.lua",
      "start": 152415755,
      "end": 152424531
    }, {
      "filename": "/content/scripts/Modules/GlobalSettings.lua",
      "start": 152424531,
      "end": 152428099
    }, {
      "filename": "/content/scripts/Modules/HeroStatsManager.lua",
      "start": 152428099,
      "end": 152431566
    }, {
      "filename": "/content/scripts/Modules/HomePane.lua",
      "start": 152431566,
      "end": 152449629
    }, {
      "filename": "/content/scripts/Modules/Http.lua",
      "start": 152449629,
      "end": 152473589
    }, {
      "filename": "/content/scripts/Modules/ImageOverlay.lua",
      "start": 152473589,
      "end": 152480682
    }, {
      "filename": "/content/scripts/Modules/ImageSlider.lua",
      "start": 152480682,
      "end": 152487999
    }, {
      "filename": "/content/scripts/Modules/LinkAccountScreen.lua",
      "start": 152487999,
      "end": 152493097
    }, {
      "filename": "/content/scripts/Modules/LoadingScreen3D.lua",
      "start": 152493097,
      "end": 152502703
    }, {
      "filename": "/content/scripts/Modules/LoadingWidget.lua",
      "start": 152502703,
      "end": 152504723
    }, {
      "filename": "/content/scripts/Modules/LocalizedStrings.lua",
      "start": 152504723,
      "end": 152518390
    }, {
      "filename": "/content/scripts/Modules/ModuleRegistration.lua",
      "start": 152518390,
      "end": 152519575
    }, {
      "filename": "/content/scripts/Modules/NoActionOverlay.lua",
      "start": 152519575,
      "end": 152523006
    }, {
      "filename": "/content/scripts/Modules/OutfitData.lua",
      "start": 152523006,
      "end": 152526307
    }, {
      "filename": "/content/scripts/Modules/OutfitTile.lua",
      "start": 152526307,
      "end": 152529217
    }, {
      "filename": "/content/scripts/Modules/OverscanScreen.lua",
      "start": 152529217,
      "end": 152544206
    }, {
      "filename": "/content/scripts/Modules/PackageData.lua",
      "start": 152544206,
      "end": 152554631
    }, {
      "filename": "/content/scripts/Modules/Panel3D.lua",
      "start": 152554631,
      "end": 152570163
    }, {
      "filename": "/content/scripts/Modules/PlatformCatalogData.lua",
      "start": 152570163,
      "end": 152572709
    }, {
      "filename": "/content/scripts/Modules/PlatformInterface.lua",
      "start": 152572709,
      "end": 152573493
    }, {
      "filename": "/content/scripts/Modules/PlayerDropDown.lua",
      "start": 152573493,
      "end": 152592662
    }, {
      "filename": "/content/scripts/Modules/PlayerPermissionsModule.lua",
      "start": 152592662,
      "end": 152593849
    }, {
      "filename": "/content/scripts/Modules/PlayerlistModule.lua",
      "start": 152593849,
      "end": 152648315
    }, {
      "filename": "/content/scripts/Modules/PopupText.lua",
      "start": 152648315,
      "end": 152651921
    }, {
      "filename": "/content/scripts/Modules/PurchasePackagePrompt.lua",
      "start": 152651921,
      "end": 152669109
    }, {
      "filename": "/content/scripts/Modules/RBXStatus14.lua",
      "start": 152669109,
      "end": 152677814
    }, {
      "filename": "/content/scripts/Modules/RbxGear.lua",
      "start": 152677814,
      "end": 152678362
    }, {
      "filename": "/content/scripts/Modules/RbxGear14.lua",
      "start": 152678362,
      "end": 152678910
    }, {
      "filename": "/content/scripts/Modules/RbxGui14.lua",
      "start": 152678910,
      "end": 152812760
    }, {
      "filename": "/content/scripts/Modules/RbxGui15.lua",
      "start": 152812760,
      "end": 152953801
    }, {
      "filename": "/content/scripts/Modules/RbxGui16.lua",
      "start": 152953801,
      "end": 153087651
    }, {
      "filename": "/content/scripts/Modules/RbxGuiThirteen.lua",
      "start": 153087651,
      "end": 153211394
    }, {
      "filename": "/content/scripts/Modules/RbxStamper.lua",
      "start": 153211394,
      "end": 153292933
    }, {
      "filename": "/content/scripts/Modules/RbxStamper14.lua",
      "start": 153292933,
      "end": 153377502
    }, {
      "filename": "/content/scripts/Modules/RbxStamper15.lua",
      "start": 153377502,
      "end": 153461873
    }, {
      "filename": "/content/scripts/Modules/RbxStamper16.lua",
      "start": 153461873,
      "end": 153546442
    }, {
      "filename": "/content/scripts/Modules/RbxUtility.lua",
      "start": 153546442,
      "end": 153581645
    }, {
      "filename": "/content/scripts/Modules/RbxUtility14.lua",
      "start": 153581645,
      "end": 153618257
    }, {
      "filename": "/content/scripts/Modules/RbxUtility15.lua",
      "start": 153618257,
      "end": 153654869
    }, {
      "filename": "/content/scripts/Modules/RbxUtility16.lua",
      "start": 153654869,
      "end": 153691481
    }, {
      "filename": "/content/scripts/Modules/ReportOverlay.lua",
      "start": 153691481,
      "end": 153695062
    }, {
      "filename": "/content/scripts/Modules/RobuxBalanceOverlay.lua",
      "start": 153695062,
      "end": 153701846
    }, {
      "filename": "/content/scripts/Modules/ScreenManager.lua",
      "start": 153701846,
      "end": 153708812
    }, {
      "filename": "/content/scripts/Modules/ScrollingGrid.lua",
      "start": 153708812,
      "end": 153724972
    }, {
      "filename": "/content/scripts/Modules/ScrollingTextBox.lua",
      "start": 153724972,
      "end": 153730655
    }, {
      "filename": "/content/scripts/Modules/SetAccountCredentialsScreen.lua",
      "start": 153730655,
      "end": 153740050
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/GameSettings.lua",
      "start": 153740050,
      "end": 153761978
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Help.lua",
      "start": 153761978,
      "end": 153782108
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Home.lua",
      "start": 153782108,
      "end": 153784810
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/LeaveGame.lua",
      "start": 153784810,
      "end": 153788970
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Players.lua",
      "start": 153788970,
      "end": 153800315
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Record.lua",
      "start": 153800315,
      "end": 153806056
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/ReportAbuseMenu.lua",
      "start": 153806056,
      "end": 153815519
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/ResetCharacter.lua",
      "start": 153815519,
      "end": 153820237
    }, {
      "filename": "/content/scripts/Modules/Settings/SettingsHub.lua",
      "start": 153820237,
      "end": 153857138
    }, {
      "filename": "/content/scripts/Modules/Settings/SettingsPageFactory.lua",
      "start": 153857138,
      "end": 153864834
    }, {
      "filename": "/content/scripts/Modules/Settings/Utility.lua",
      "start": 153864834,
      "end": 153925138
    }, {
      "filename": "/content/scripts/Modules/Settings2.lua",
      "start": 153925138,
      "end": 153986002
    }, {
      "filename": "/content/scripts/Modules/SettingsScreen.lua",
      "start": 153986002,
      "end": 153994724
    }, {
      "filename": "/content/scripts/Modules/SideBar.lua",
      "start": 153994724,
      "end": 153999657
    }, {
      "filename": "/content/scripts/Modules/SignInScreen.lua",
      "start": 153999657,
      "end": 154006903
    }, {
      "filename": "/content/scripts/Modules/SocialPane.lua",
      "start": 154006903,
      "end": 154015294
    }, {
      "filename": "/content/scripts/Modules/SocialScreen.lua",
      "start": 154015294,
      "end": 154020484
    }, {
      "filename": "/content/scripts/Modules/SortCarousel.lua",
      "start": 154020484,
      "end": 154026477
    }, {
      "filename": "/content/scripts/Modules/SortData.lua",
      "start": 154026477,
      "end": 154031314
    }, {
      "filename": "/content/scripts/Modules/SoundManager.lua",
      "start": 154031314,
      "end": 154036663
    }, {
      "filename": "/content/scripts/Modules/StorePane.lua",
      "start": 154036663,
      "end": 154055603
    }, {
      "filename": "/content/scripts/Modules/TabDock.lua",
      "start": 154055603,
      "end": 154063335
    }, {
      "filename": "/content/scripts/Modules/TabDockItem.lua",
      "start": 154063335,
      "end": 154065995
    }, {
      "filename": "/content/scripts/Modules/TenFootInterface.lua",
      "start": 154065995,
      "end": 154076154
    }, {
      "filename": "/content/scripts/Modules/TextBox.lua",
      "start": 154076154,
      "end": 154081369
    }, {
      "filename": "/content/scripts/Modules/ThumbnailLoader.lua",
      "start": 154081369,
      "end": 154085815
    }, {
      "filename": "/content/scripts/Modules/UnlinkAccountOverlay.lua",
      "start": 154085815,
      "end": 154089279
    }, {
      "filename": "/content/scripts/Modules/UnlinkAccountScreen.lua",
      "start": 154089279,
      "end": 154095684
    }, {
      "filename": "/content/scripts/Modules/UserData.lua",
      "start": 154095684,
      "end": 154101429
    }, {
      "filename": "/content/scripts/Modules/Utility.lua",
      "start": 154101429,
      "end": 154115295
    }, {
      "filename": "/content/scripts/Modules/VR/Dialog.lua",
      "start": 154115295,
      "end": 154121030
    }, {
      "filename": "/content/scripts/Modules/VR/NotificationHub.lua",
      "start": 154121030,
      "end": 154143792
    }, {
      "filename": "/content/scripts/Modules/VR/NotifierHint3D.lua",
      "start": 154143792,
      "end": 154145902
    }, {
      "filename": "/content/scripts/Modules/VR/Panel3D.lua",
      "start": 154145902,
      "end": 154175606
    }, {
      "filename": "/content/scripts/Modules/VR/Recenter.lua",
      "start": 154175606,
      "end": 154178065
    }, {
      "filename": "/content/scripts/Modules/VR/UserGui.lua",
      "start": 154178065,
      "end": 154180783
    }, {
      "filename": "/content/scripts/Modules/VR/VRHub.lua",
      "start": 154180783,
      "end": 154182535
    }, {
      "filename": "/content/scripts/Modules/VR/VirtualKeyboard.lua",
      "start": 154182535,
      "end": 154222872
    }, {
      "filename": "/content/scripts/Modules/VoteFrame.lua",
      "start": 154222872,
      "end": 154225035
    }, {
      "filename": "/content/scripts/Modules/VoteView.lua",
      "start": 154225035,
      "end": 154234462
    }, {
      "filename": "/content/scripts/ServerCoreScripts/ServerSocialScript.lua",
      "start": 154234462,
      "end": 154241355
    }, {
      "filename": "/content/scripts/ServerStarterScript.lua",
      "start": 154241355,
      "end": 154243383
    }, {
      "filename": "/content/scripts/StarterScript.lua",
      "start": 154243383,
      "end": 154245078
    }, {
      "filename": "/content/sky/lensflare.jpg",
      "start": 154245078,
      "end": 154253515
    }, {
      "filename": "/content/sky/moon-alpha.jpg",
      "start": 154253515,
      "end": 154258435
    }, {
      "filename": "/content/sky/moon.jpg",
      "start": 154258435,
      "end": 154265829
    }, {
      "filename": "/content/sky/null_plainsky512_bk.jpg",
      "start": 154265829,
      "end": 154315106
    }, {
      "filename": "/content/sky/null_plainsky512_dn.jpg",
      "start": 154315106,
      "end": 154348774
    }, {
      "filename": "/content/sky/null_plainsky512_ft.jpg",
      "start": 154348774,
      "end": 154396465
    }, {
      "filename": "/content/sky/null_plainsky512_lf.jpg",
      "start": 154396465,
      "end": 154440122
    }, {
      "filename": "/content/sky/null_plainsky512_rt.jpg",
      "start": 154440122,
      "end": 154490323
    }, {
      "filename": "/content/sky/null_plainsky512_up.jpg",
      "start": 154490323,
      "end": 154525835
    }, {
      "filename": "/content/sky/skyspheremap.jpg",
      "start": 154525835,
      "end": 154536315
    }, {
      "filename": "/content/sky/sun-rays.jpg",
      "start": 154536315,
      "end": 154540894
    }, {
      "filename": "/content/sky/sun.jpg",
      "start": 154540894,
      "end": 154555667
    }, {
      "filename": "/content/sounds/Kerplunk.mp3",
      "start": 154555667,
      "end": 154560713
    }, {
      "filename": "/content/sounds/Kid saying Ouch.mp3",
      "start": 154560713,
      "end": 154568024
    }, {
      "filename": "/content/sounds/Rubber band sling shot.mp3",
      "start": 154568024,
      "end": 154577055
    }, {
      "filename": "/content/sounds/Rubber band.mp3",
      "start": 154577055,
      "end": 154587818
    }, {
      "filename": "/content/sounds/SWITCH3.mp3",
      "start": 154587818,
      "end": 154592863
    }, {
      "filename": "/content/sounds/action_falling.mp3",
      "start": 154592863,
      "end": 154726926
    }, {
      "filename": "/content/sounds/action_footsteps_plastic.mp3",
      "start": 154726926,
      "end": 154767784
    }, {
      "filename": "/content/sounds/action_get_up.mp3",
      "start": 154767784,
      "end": 154778131
    }, {
      "filename": "/content/sounds/action_jump.mp3",
      "start": 154778131,
      "end": 154784716
    }, {
      "filename": "/content/sounds/action_jump_land.mp3",
      "start": 154784716,
      "end": 154790047
    }, {
      "filename": "/content/sounds/action_swim.mp3",
      "start": 154790047,
      "end": 154869357
    }, {
      "filename": "/content/sounds/bass.mp3",
      "start": 154869357,
      "end": 154879537
    }, {
      "filename": "/content/sounds/bfsl-minifigfoots1.mp3",
      "start": 154879537,
      "end": 154896049
    }, {
      "filename": "/content/sounds/bfsl-minifigfoots2.mp3",
      "start": 154896049,
      "end": 154937137
    }, {
      "filename": "/content/sounds/button.mp3",
      "start": 154937137,
      "end": 154943863
    }, {
      "filename": "/content/sounds/clickfast.mp3",
      "start": 154943863,
      "end": 154948288
    }, {
      "filename": "/content/sounds/collide.mp3",
      "start": 154948288,
      "end": 154960021
    }, {
      "filename": "/content/sounds/electronicpingshort.mp3",
      "start": 154960021,
      "end": 154967912
    }, {
      "filename": "/content/sounds/flashbulb.mp3",
      "start": 154967912,
      "end": 154972913
    }, {
      "filename": "/content/sounds/grass.mp3",
      "start": 154972913,
      "end": 154979837
    }, {
      "filename": "/content/sounds/grass2.mp3",
      "start": 154979837,
      "end": 154986762
    }, {
      "filename": "/content/sounds/grass3.mp3",
      "start": 154986762,
      "end": 154993687
    }, {
      "filename": "/content/sounds/grassstone.mp3",
      "start": 154993687,
      "end": 155000616
    }, {
      "filename": "/content/sounds/grassstone2.mp3",
      "start": 155000616,
      "end": 155007546
    }, {
      "filename": "/content/sounds/grassstone3.mp3",
      "start": 155007546,
      "end": 155014476
    }, {
      "filename": "/content/sounds/hit.mp3",
      "start": 155014476,
      "end": 155023279
    }, {
      "filename": "/content/sounds/ice.mp3",
      "start": 155023279,
      "end": 155030201
    }, {
      "filename": "/content/sounds/ice2.mp3",
      "start": 155030201,
      "end": 155037124
    }, {
      "filename": "/content/sounds/ice3.mp3",
      "start": 155037124,
      "end": 155044047
    }, {
      "filename": "/content/sounds/icegrass.mp3",
      "start": 155044047,
      "end": 155050974
    }, {
      "filename": "/content/sounds/icegrass2.mp3",
      "start": 155050974,
      "end": 155057902
    }, {
      "filename": "/content/sounds/icegrass3.mp3",
      "start": 155057902,
      "end": 155064830
    }, {
      "filename": "/content/sounds/icemetal.mp3",
      "start": 155064830,
      "end": 155071757
    }, {
      "filename": "/content/sounds/icemetal2.mp3",
      "start": 155071757,
      "end": 155078685
    }, {
      "filename": "/content/sounds/icemetal3.mp3",
      "start": 155078685,
      "end": 155085613
    }, {
      "filename": "/content/sounds/icestone.mp3",
      "start": 155085613,
      "end": 155092540
    }, {
      "filename": "/content/sounds/icestone2.mp3",
      "start": 155092540,
      "end": 155099468
    }, {
      "filename": "/content/sounds/icestone3.mp3",
      "start": 155099468,
      "end": 155106396
    }, {
      "filename": "/content/sounds/impact_bodyfall.mp3",
      "start": 155106396,
      "end": 155116743
    }, {
      "filename": "/content/sounds/impact_explosion_01.mp3",
      "start": 155116743,
      "end": 155149659
    }, {
      "filename": "/content/sounds/impact_explosion_02.mp3",
      "start": 155149659,
      "end": 155184665
    }, {
      "filename": "/content/sounds/impact_explosion_03.mp3",
      "start": 155184665,
      "end": 155227194
    }, {
      "filename": "/content/sounds/impact_water.mp3",
      "start": 155227194,
      "end": 155266380
    }, {
      "filename": "/content/sounds/metal.mp3",
      "start": 155266380,
      "end": 155273304
    }, {
      "filename": "/content/sounds/metal2.mp3",
      "start": 155273304,
      "end": 155280229
    }, {
      "filename": "/content/sounds/metal3.mp3",
      "start": 155280229,
      "end": 155287154
    }, {
      "filename": "/content/sounds/metalgrass.mp3",
      "start": 155287154,
      "end": 155294083
    }, {
      "filename": "/content/sounds/metalgrass2.mp3",
      "start": 155294083,
      "end": 155301013
    }, {
      "filename": "/content/sounds/metalgrass3.mp3",
      "start": 155301013,
      "end": 155307943
    }, {
      "filename": "/content/sounds/metalstone.mp3",
      "start": 155307943,
      "end": 155314872
    }, {
      "filename": "/content/sounds/metalstone2.mp3",
      "start": 155314872,
      "end": 155321802
    }, {
      "filename": "/content/sounds/metalstone3.mp3",
      "start": 155321802,
      "end": 155328732
    }, {
      "filename": "/content/sounds/plasticgrass.mp3",
      "start": 155328732,
      "end": 155335663
    }, {
      "filename": "/content/sounds/plasticgrass2.mp3",
      "start": 155335663,
      "end": 155342595
    }, {
      "filename": "/content/sounds/plasticgrass3.mp3",
      "start": 155342595,
      "end": 155349527
    }, {
      "filename": "/content/sounds/plasticice.mp3",
      "start": 155349527,
      "end": 155356456
    }, {
      "filename": "/content/sounds/plasticice2.mp3",
      "start": 155356456,
      "end": 155363386
    }, {
      "filename": "/content/sounds/plasticice3.mp3",
      "start": 155363386,
      "end": 155370316
    }, {
      "filename": "/content/sounds/plasticmetal.mp3",
      "start": 155370316,
      "end": 155377247
    }, {
      "filename": "/content/sounds/plasticmetal2.mp3",
      "start": 155377247,
      "end": 155384179
    }, {
      "filename": "/content/sounds/plasticmetal3.mp3",
      "start": 155384179,
      "end": 155391111
    }, {
      "filename": "/content/sounds/plasticplastic.mp3",
      "start": 155391111,
      "end": 155398044
    }, {
      "filename": "/content/sounds/plasticplastic2.mp3",
      "start": 155398044,
      "end": 155404978
    }, {
      "filename": "/content/sounds/plasticplastic3.mp3",
      "start": 155404978,
      "end": 155413793
    }, {
      "filename": "/content/sounds/plasticstone.mp3",
      "start": 155413793,
      "end": 155420724
    }, {
      "filename": "/content/sounds/plasticstone2.mp3",
      "start": 155420724,
      "end": 155427656
    }, {
      "filename": "/content/sounds/plasticstone3.mp3",
      "start": 155427656,
      "end": 155434588
    }, {
      "filename": "/content/sounds/snap.mp3",
      "start": 155434588,
      "end": 155440048
    }, {
      "filename": "/content/sounds/splat.mp3",
      "start": 155440048,
      "end": 155446197
    }, {
      "filename": "/content/sounds/stone.mp3",
      "start": 155446197,
      "end": 155453121
    }, {
      "filename": "/content/sounds/stone2.mp3",
      "start": 155453121,
      "end": 155460046
    }, {
      "filename": "/content/sounds/stone3.mp3",
      "start": 155460046,
      "end": 155466971
    }, {
      "filename": "/content/sounds/switch.mp3",
      "start": 155466971,
      "end": 155472851
    }, {
      "filename": "/content/sounds/swoosh.mp3",
      "start": 155472851,
      "end": 155478425
    }, {
      "filename": "/content/sounds/swordlunge.mp3",
      "start": 155478425,
      "end": 155486817
    }, {
      "filename": "/content/sounds/swordslash.mp3",
      "start": 155486817,
      "end": 155494164
    }, {
      "filename": "/content/sounds/unsheath.mp3",
      "start": 155494164,
      "end": 155507987
    }, {
      "filename": "/content/sounds/uuhhh.mp3",
      "start": 155507987,
      "end": 155513448
    }, {
      "filename": "/content/sounds/victory.mp3",
      "start": 155513448,
      "end": 155526016
    }, {
      "filename": "/content/sounds/woodgrass.mp3",
      "start": 155526016,
      "end": 155532944
    }, {
      "filename": "/content/sounds/woodgrass2.mp3",
      "start": 155532944,
      "end": 155539873
    }, {
      "filename": "/content/sounds/woodgrass3.mp3",
      "start": 155539873,
      "end": 155546802
    }, {
      "filename": "/content/sounds/woodice.mp3",
      "start": 155546802,
      "end": 155553728
    }, {
      "filename": "/content/sounds/woodice2.mp3",
      "start": 155553728,
      "end": 155560655
    }, {
      "filename": "/content/sounds/woodice3.mp3",
      "start": 155560655,
      "end": 155567582
    }, {
      "filename": "/content/sounds/woodmetal.mp3",
      "start": 155567582,
      "end": 155574510
    }, {
      "filename": "/content/sounds/woodmetal2.mp3",
      "start": 155574510,
      "end": 155581439
    }, {
      "filename": "/content/sounds/woodmetal3.mp3",
      "start": 155581439,
      "end": 155588368
    }, {
      "filename": "/content/sounds/woodplastic.mp3",
      "start": 155588368,
      "end": 155595298
    }, {
      "filename": "/content/sounds/woodplastic2.mp3",
      "start": 155595298,
      "end": 155602229
    }, {
      "filename": "/content/sounds/woodplastic3.mp3",
      "start": 155602229,
      "end": 155609160
    }, {
      "filename": "/content/sounds/woodstone.mp3",
      "start": 155609160,
      "end": 155616088
    }, {
      "filename": "/content/sounds/woodstone2.mp3",
      "start": 155616088,
      "end": 155623017
    }, {
      "filename": "/content/sounds/woodstone3.mp3",
      "start": 155623017,
      "end": 155629946
    }, {
      "filename": "/content/sounds/woodwood.mp3",
      "start": 155629946,
      "end": 155636873
    }, {
      "filename": "/content/sounds/woodwood2.mp3",
      "start": 155636873,
      "end": 155643801
    }, {
      "filename": "/content/sounds/woodwood3.mp3",
      "start": 155643801,
      "end": 155650729
    }, {
      "filename": "/content/test/Baseplate.rbxl",
      "start": 155650729,
      "end": 155691202
    }, {
      "filename": "/content/textures/AluminumFallback.dds",
      "start": 155691202,
      "end": 156040850
    }, {
      "filename": "/content/textures/AnchorCursor.png",
      "start": 156040850,
      "end": 156042109
    }, {
      "filename": "/content/textures/ArrowCursor.png",
      "start": 156042109,
      "end": 156042392
    }, {
      "filename": "/content/textures/ArrowCursorDecalDrag.png",
      "start": 156042392,
      "end": 156042675
    }, {
      "filename": "/content/textures/ArrowFarCursor.png",
      "start": 156042675,
      "end": 156042962
    }, {
      "filename": "/content/textures/BWGradient.png",
      "start": 156042962,
      "end": 156092809
    }, {
      "filename": "/content/textures/BackgroundImage.png",
      "start": 156092809,
      "end": 156095805
    }, {
      "filename": "/content/textures/Blank.png",
      "start": 156095805,
      "end": 156095992
    }, {
      "filename": "/content/textures/CameraTiltDown.png",
      "start": 156095992,
      "end": 156099794
    }, {
      "filename": "/content/textures/CameraTiltDown_dn.png",
      "start": 156099794,
      "end": 156103557
    }, {
      "filename": "/content/textures/CameraTiltDown_ds.png",
      "start": 156103557,
      "end": 156104489
    }, {
      "filename": "/content/textures/CameraTiltDown_ovr.png",
      "start": 156104489,
      "end": 156108252
    }, {
      "filename": "/content/textures/CameraTiltUp.png",
      "start": 156108252,
      "end": 156110181
    }, {
      "filename": "/content/textures/CameraTiltUp_dn.png",
      "start": 156110181,
      "end": 156112059
    }, {
      "filename": "/content/textures/CameraTiltUp_ds.png",
      "start": 156112059,
      "end": 156112997
    }, {
      "filename": "/content/textures/CameraTiltUp_ovr.png",
      "start": 156112997,
      "end": 156114875
    }, {
      "filename": "/content/textures/CameraZoomIn.png",
      "start": 156114875,
      "end": 156116817
    }, {
      "filename": "/content/textures/CameraZoomIn_dn.png",
      "start": 156116817,
      "end": 156118708
    }, {
      "filename": "/content/textures/CameraZoomIn_ds.png",
      "start": 156118708,
      "end": 156119716
    }, {
      "filename": "/content/textures/CameraZoomIn_ovr.png",
      "start": 156119716,
      "end": 156121607
    }, {
      "filename": "/content/textures/CameraZoomOut.png",
      "start": 156121607,
      "end": 156123472
    }, {
      "filename": "/content/textures/CameraZoomOut_dn.png",
      "start": 156123472,
      "end": 156125309
    }, {
      "filename": "/content/textures/CameraZoomOut_ds.png",
      "start": 156125309,
      "end": 156126239
    }, {
      "filename": "/content/textures/CameraZoomOut_ovr.png",
      "start": 156126239,
      "end": 156128076
    }, {
      "filename": "/content/textures/Chat.png",
      "start": 156128076,
      "end": 156129830
    }, {
      "filename": "/content/textures/Chat_dn.png",
      "start": 156129830,
      "end": 156131489
    }, {
      "filename": "/content/textures/Chat_ds.png",
      "start": 156131489,
      "end": 156132388
    }, {
      "filename": "/content/textures/Chat_ovr.png",
      "start": 156132388,
      "end": 156133743
    }, {
      "filename": "/content/textures/Clone.png",
      "start": 156133743,
      "end": 156140012
    }, {
      "filename": "/content/textures/CloneCursor.png",
      "start": 156140012,
      "end": 156143196
    }, {
      "filename": "/content/textures/CloneDownCursor.png",
      "start": 156143196,
      "end": 156147951
    }, {
      "filename": "/content/textures/CloneOverCursor.png",
      "start": 156147951,
      "end": 156151167
    }, {
      "filename": "/content/textures/ConcreteFallback.dds",
      "start": 156151167,
      "end": 156500815
    }, {
      "filename": "/content/textures/Crinkled_Normal.dds",
      "start": 156500815,
      "end": 156763023
    }, {
      "filename": "/content/textures/Cursors/Gamepad/Pointer.png",
      "start": 156763023,
      "end": 156764360
    }, {
      "filename": "/content/textures/Cursors/Gamepad/Pointer@2x.png",
      "start": 156764360,
      "end": 156765847
    }, {
      "filename": "/content/textures/Cursors/Gamepad/PointerOver.png",
      "start": 156765847,
      "end": 156767e3
    }, {
      "filename": "/content/textures/Cursors/Gamepad/PointerOver@2x.png",
      "start": 156767e3,
      "end": 156768961
    }, {
      "filename": "/content/textures/DPlate_Normal.dds",
      "start": 156768961,
      "end": 156785409
    }, {
      "filename": "/content/textures/DialogHelp.png",
      "start": 156785409,
      "end": 156786299
    }, {
      "filename": "/content/textures/DialogQuest.png",
      "start": 156786299,
      "end": 156786858
    }, {
      "filename": "/content/textures/DialogShop.png",
      "start": 156786858,
      "end": 156788057
    }, {
      "filename": "/content/textures/DiamondPlateFallback.dds",
      "start": 156788057,
      "end": 157137705
    }, {
      "filename": "/content/textures/DragCursor.png",
      "start": 157137705,
      "end": 157139768
    }, {
      "filename": "/content/textures/DropperCursor.png",
      "start": 157139768,
      "end": 157140121
    }, {
      "filename": "/content/textures/Exit.png",
      "start": 157140121,
      "end": 157143240
    }, {
      "filename": "/content/textures/Exit_dn.png",
      "start": 157143240,
      "end": 157146321
    }, {
      "filename": "/content/textures/Exit_ovr.png",
      "start": 157146321,
      "end": 157149402
    }, {
      "filename": "/content/textures/FillCursor.png",
      "start": 157149402,
      "end": 157149835
    }, {
      "filename": "/content/textures/FirstPersonIndicator.png",
      "start": 157149835,
      "end": 157154422
    }, {
      "filename": "/content/textures/FirstPersonIndicator_ds.png",
      "start": 157154422,
      "end": 157157273
    }, {
      "filename": "/content/textures/FlagCursor.png",
      "start": 157157273,
      "end": 157157901
    }, {
      "filename": "/content/textures/FlatCursor.png",
      "start": 157157901,
      "end": 157158496
    }, {
      "filename": "/content/textures/GameTool.png",
      "start": 157158496,
      "end": 157161267
    }, {
      "filename": "/content/textures/Grab.png",
      "start": 157161267,
      "end": 157164777
    }, {
      "filename": "/content/textures/GrabCursor.png",
      "start": 157164777,
      "end": 157167054
    }, {
      "filename": "/content/textures/GrabRotateCursor.png",
      "start": 157167054,
      "end": 157169947
    }, {
      "filename": "/content/textures/Grass_Normal.dds",
      "start": 157169947,
      "end": 157519259
    }, {
      "filename": "/content/textures/Grass_Texture.jpg",
      "start": 157519259,
      "end": 157760078
    }, {
      "filename": "/content/textures/Grass_Texture_gray.dds",
      "start": 157760078,
      "end": 158109726
    }, {
      "filename": "/content/textures/GunCursor.png",
      "start": 158109726,
      "end": 158110673
    }, {
      "filename": "/content/textures/GunWaitCursor.png",
      "start": 158110673,
      "end": 158112608
    }, {
      "filename": "/content/textures/HammerCursor.png",
      "start": 158112608,
      "end": 158115051
    }, {
      "filename": "/content/textures/HammerDownCursor.png",
      "start": 158115051,
      "end": 158119052
    }, {
      "filename": "/content/textures/HammerOverCursor.png",
      "start": 158119052,
      "end": 158121920
    }, {
      "filename": "/content/textures/Help.png",
      "start": 158121920,
      "end": 158124061
    }, {
      "filename": "/content/textures/Help_dn.png",
      "start": 158124061,
      "end": 158126114
    }, {
      "filename": "/content/textures/Help_ovr.png",
      "start": 158126114,
      "end": 158128167
    }, {
      "filename": "/content/textures/HingeCursor.png",
      "start": 158128167,
      "end": 158128794
    }, {
      "filename": "/content/textures/HorizLines_normal.dds",
      "start": 158128794,
      "end": 158216330
    }, {
      "filename": "/content/textures/IceFallback.dds",
      "start": 158216330,
      "end": 158565978
    }, {
      "filename": "/content/textures/LockCursor.png",
      "start": 158565978,
      "end": 158566766
    }, {
      "filename": "/content/textures/LogoImage.png",
      "start": 158566766,
      "end": 158608326
    }, {
      "filename": "/content/textures/MaterialCursor.png",
      "start": 158608326,
      "end": 158615782
    }, {
      "filename": "/content/textures/MissingCursor.png",
      "start": 158615782,
      "end": 158617452
    }, {
      "filename": "/content/textures/MotorCursor.png",
      "start": 158617452,
      "end": 158618112
    }, {
      "filename": "/content/textures/MouseLockedCursor.png",
      "start": 158618112,
      "end": 158620442
    }, {
      "filename": "/content/textures/RecordIndicator.png",
      "start": 158620442,
      "end": 158621722
    }, {
      "filename": "/content/textures/RecordToggle.png",
      "start": 158621722,
      "end": 158624409
    }, {
      "filename": "/content/textures/RecordToggle_dn.png",
      "start": 158624409,
      "end": 158627068
    }, {
      "filename": "/content/textures/RecordToggle_ds.png",
      "start": 158627068,
      "end": 158628402
    }, {
      "filename": "/content/textures/RecordToggle_ovr.png",
      "start": 158628402,
      "end": 158631061
    }, {
      "filename": "/content/textures/RecordToggle_sdn.png",
      "start": 158631061,
      "end": 158632037
    }, {
      "filename": "/content/textures/RecordToggle_sel.png",
      "start": 158632037,
      "end": 158633013
    }, {
      "filename": "/content/textures/RecordToggle_sovr.png",
      "start": 158633013,
      "end": 158633989
    }, {
      "filename": "/content/textures/ReportAbuse.PNG",
      "start": 158633989,
      "end": 158637207
    }, {
      "filename": "/content/textures/ReportAbuse_dn.PNG",
      "start": 158637207,
      "end": 158640293
    }, {
      "filename": "/content/textures/ReportAbuse_ds.PNG",
      "start": 158640293,
      "end": 158640473
    }, {
      "filename": "/content/textures/ReportAbuse_ovr.PNG",
      "start": 158640473,
      "end": 158643559
    }, {
      "filename": "/content/textures/ReportInfected.png",
      "start": 158643559,
      "end": 158646023
    }, {
      "filename": "/content/textures/ReportInfected_dn.png",
      "start": 158646023,
      "end": 158648487
    }, {
      "filename": "/content/textures/ReportInfected_ds.png",
      "start": 158648487,
      "end": 158649672
    }, {
      "filename": "/content/textures/ReportInfected_ovr.png",
      "start": 158649672,
      "end": 158652143
    }, {
      "filename": "/content/textures/ResizeCursor.png",
      "start": 158652143,
      "end": 158652695
    }, {
      "filename": "/content/textures/Roblox-loading-glow.png",
      "start": 158652695,
      "end": 158658607
    }, {
      "filename": "/content/textures/Roblox-loading-glow@2x.png",
      "start": 158658607,
      "end": 158671808
    }, {
      "filename": "/content/textures/Roblox-loading.png",
      "start": 158671808,
      "end": 158698936
    }, {
      "filename": "/content/textures/Roblox-loading@2x.png",
      "start": 158698936,
      "end": 158762037
    }, {
      "filename": "/content/textures/Roblox.bmp",
      "start": 158762037,
      "end": 158774381
    }, {
      "filename": "/content/textures/RustGradient.png",
      "start": 158774381,
      "end": 158805171
    }, {
      "filename": "/content/textures/Sand_Normal.dds",
      "start": 158805171,
      "end": 159067442
    }, {
      "filename": "/content/textures/Screenshot.png",
      "start": 159067442,
      "end": 159070204
    }, {
      "filename": "/content/textures/Screenshot_dn.png",
      "start": 159070204,
      "end": 159072886
    }, {
      "filename": "/content/textures/Screenshot_ds.png",
      "start": 159072886,
      "end": 159074206
    }, {
      "filename": "/content/textures/Screenshot_ovr.png",
      "start": 159074206,
      "end": 159076888
    }, {
      "filename": "/content/textures/SlateBorder.dds",
      "start": 159076888,
      "end": 159164396
    }, {
      "filename": "/content/textures/SlateTile.dds",
      "start": 159164396,
      "end": 159863574
    }, {
      "filename": "/content/textures/SlateTileMono.dds",
      "start": 159863574,
      "end": 160213222
    }, {
      "filename": "/content/textures/Smoke.png",
      "start": 160213222,
      "end": 160268973
    }, {
      "filename": "/content/textures/SpawnCursor.png",
      "start": 160268973,
      "end": 160269628
    }, {
      "filename": "/content/textures/SpawnLocation.png",
      "start": 160269628,
      "end": 160272300
    }, {
      "filename": "/content/textures/Surfaces.png",
      "start": 160272300,
      "end": 160285081
    }, {
      "filename": "/content/textures/SurfacesDefault.png",
      "start": 160285081,
      "end": 160285247
    }, {
      "filename": "/content/textures/SurfacesStrip.png",
      "start": 160285247,
      "end": 160292115
    }, {
      "filename": "/content/textures/SurfacesTruss.png",
      "start": 160292115,
      "end": 160306848
    }, {
      "filename": "/content/textures/ToggleFullScreen.png",
      "start": 160306848,
      "end": 160308699
    }, {
      "filename": "/content/textures/ToggleFullScreen_dn.png",
      "start": 160308699,
      "end": 160310506
    }, {
      "filename": "/content/textures/ToggleFullScreen_ds.png",
      "start": 160310506,
      "end": 160310972
    }, {
      "filename": "/content/textures/ToggleFullScreen_ovr.png",
      "start": 160310972,
      "end": 160312779
    }, {
      "filename": "/content/textures/TogglePlayMode.png",
      "start": 160312779,
      "end": 160314550
    }, {
      "filename": "/content/textures/TogglePlayMode_dn.png",
      "start": 160314550,
      "end": 160316226
    }, {
      "filename": "/content/textures/TogglePlayMode_ds.png",
      "start": 160316226,
      "end": 160319032
    }, {
      "filename": "/content/textures/TogglePlayMode_ovr.png",
      "start": 160319032,
      "end": 160320708
    }, {
      "filename": "/content/textures/UnAnchorCursor.png",
      "start": 160320708,
      "end": 160322544
    }, {
      "filename": "/content/textures/UnlockCursor.png",
      "start": 160322544,
      "end": 160323342
    }, {
      "filename": "/content/textures/WeldCursor.png",
      "start": 160323342,
      "end": 160323864
    }, {
      "filename": "/content/textures/WhiteCircle.png",
      "start": 160323864,
      "end": 160330377
    }, {
      "filename": "/content/textures/WoodFallback.dds",
      "start": 160330377,
      "end": 160680025
    }, {
      "filename": "/content/textures/advClosed-hand-no-weld.png",
      "start": 160680025,
      "end": 160681260
    }, {
      "filename": "/content/textures/advClosed-hand-weld.png",
      "start": 160681260,
      "end": 160682561
    }, {
      "filename": "/content/textures/advClosed-hand.png",
      "start": 160682561,
      "end": 160683742
    }, {
      "filename": "/content/textures/advCursor-default.png",
      "start": 160683742,
      "end": 160684918
    }, {
      "filename": "/content/textures/advCursor-openedHand.png",
      "start": 160684918,
      "end": 160686155
    }, {
      "filename": "/content/textures/advCursor-white.png",
      "start": 160686155,
      "end": 160687317
    }, {
      "filename": "/content/textures/advancedMove.png",
      "start": 160687317,
      "end": 160690101
    }, {
      "filename": "/content/textures/advancedMoveResize.png",
      "start": 160690101,
      "end": 160693143
    }, {
      "filename": "/content/textures/advancedMove_joint.png",
      "start": 160693143,
      "end": 160697677
    }, {
      "filename": "/content/textures/advancedMove_keysOnly.png",
      "start": 160697677,
      "end": 160701501
    }, {
      "filename": "/content/textures/advancedMove_noJoint.png",
      "start": 160701501,
      "end": 160706412
    }, {
      "filename": "/content/textures/aluminum/diffuse.dds",
      "start": 160706412,
      "end": 160706564
    }, {
      "filename": "/content/textures/aluminum/normal.dds",
      "start": 160706564,
      "end": 161056244
    }, {
      "filename": "/content/textures/aluminum/normaldetail.dds",
      "start": 161056244,
      "end": 161056420
    }, {
      "filename": "/content/textures/aluminum/specular.dds",
      "start": 161056420,
      "end": 161056572
    }, {
      "filename": "/content/textures/blackBkg_round.png",
      "start": 161056572,
      "end": 161057015
    }, {
      "filename": "/content/textures/blackBkg_square.png",
      "start": 161057015,
      "end": 161057169
    }, {
      "filename": "/content/textures/brick/diffuse.dds",
      "start": 161057169,
      "end": 161406849
    }, {
      "filename": "/content/textures/brick/normal.dds",
      "start": 161406849,
      "end": 162805105
    }, {
      "filename": "/content/textures/brick/normaldetail.dds",
      "start": 162805105,
      "end": 162805281
    }, {
      "filename": "/content/textures/brick/specular.dds",
      "start": 162805281,
      "end": 163504473
    }, {
      "filename": "/content/textures/chatBubble_botBlue_bkg.png",
      "start": 163504473,
      "end": 163507249
    }, {
      "filename": "/content/textures/chatBubble_botBlue_notify_bkg.png",
      "start": 163507249,
      "end": 163511353
    }, {
      "filename": "/content/textures/chatBubble_botBlue_tail.png",
      "start": 163511353,
      "end": 163517750
    }, {
      "filename": "/content/textures/chatBubble_botBlue_tailRight.png",
      "start": 163517750,
      "end": 163522031
    }, {
      "filename": "/content/textures/chatBubble_botGreen_bkg.png",
      "start": 163522031,
      "end": 163524222
    }, {
      "filename": "/content/textures/chatBubble_botGreen_notify_bkg.png",
      "start": 163524222,
      "end": 163527643
    }, {
      "filename": "/content/textures/chatBubble_botGreen_tail.png",
      "start": 163527643,
      "end": 163532466
    }, {
      "filename": "/content/textures/chatBubble_botGreen_tailRight.png",
      "start": 163532466,
      "end": 163536047
    }, {
      "filename": "/content/textures/chatBubble_botRed_bkg.png",
      "start": 163536047,
      "end": 163538690
    }, {
      "filename": "/content/textures/chatBubble_botRed_notify_bkg.png",
      "start": 163538690,
      "end": 163541910
    }, {
      "filename": "/content/textures/chatBubble_botRed_tail.png",
      "start": 163541910,
      "end": 163545776
    }, {
      "filename": "/content/textures/chatBubble_botRed_tailRight.png",
      "start": 163545776,
      "end": 163549404
    }, {
      "filename": "/content/textures/chatBubble_bot_notifyGray_dotDotDot.png",
      "start": 163549404,
      "end": 163552322
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_bang.png",
      "start": 163552322,
      "end": 163553427
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_dotDotDot.png",
      "start": 163553427,
      "end": 163554460
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_money.png",
      "start": 163554460,
      "end": 163555960
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_question.png",
      "start": 163555960,
      "end": 163557230
    }, {
      "filename": "/content/textures/chatBubble_white_bkg.png",
      "start": 163557230,
      "end": 163561534
    }, {
      "filename": "/content/textures/chatBubble_white_notify_bkg.png",
      "start": 163561534,
      "end": 163565595
    }, {
      "filename": "/content/textures/chatBubble_white_tail.png",
      "start": 163565595,
      "end": 163567174
    }, {
      "filename": "/content/textures/cobblestone/diffuse.dds",
      "start": 163567174,
      "end": 163916854
    }, {
      "filename": "/content/textures/cobblestone/normal.dds",
      "start": 163916854,
      "end": 164266534
    }, {
      "filename": "/content/textures/cobblestone/normaldetail.dds",
      "start": 164266534,
      "end": 164266710
    }, {
      "filename": "/content/textures/cobblestone/specular.dds",
      "start": 164266710,
      "end": 164441614
    }, {
      "filename": "/content/textures/concrete/diffuse.dds",
      "start": 164441614,
      "end": 165140806
    }, {
      "filename": "/content/textures/concrete/normal.dds",
      "start": 165140806,
      "end": 166539062
    }, {
      "filename": "/content/textures/concrete/normaldetail.dds",
      "start": 166539062,
      "end": 166888742
    }, {
      "filename": "/content/textures/concrete/specular.dds",
      "start": 166888742,
      "end": 167063646
    }, {
      "filename": "/content/textures/diamondplate/diffuse.dds",
      "start": 167063646,
      "end": 167238550
    }, {
      "filename": "/content/textures/diamondplate/normal.dds",
      "start": 167238550,
      "end": 167588230
    }, {
      "filename": "/content/textures/diamondplate/normaldetail.dds",
      "start": 167588230,
      "end": 167588406
    }, {
      "filename": "/content/textures/diamondplate/specular.dds",
      "start": 167588406,
      "end": 167763310
    }, {
      "filename": "/content/textures/dirt.jpg",
      "start": 167763310,
      "end": 167936796
    }, {
      "filename": "/content/textures/explosion.png",
      "start": 167936796,
      "end": 167949565
    }, {
      "filename": "/content/textures/fabric/diffuse.dds",
      "start": 167949565,
      "end": 168299245
    }, {
      "filename": "/content/textures/fabric/normal.dds",
      "start": 168299245,
      "end": 168648925
    }, {
      "filename": "/content/textures/fabric/normaldetail.dds",
      "start": 168648925,
      "end": 168649101
    }, {
      "filename": "/content/textures/fabric/specular.dds",
      "start": 168649101,
      "end": 168824005
    }, {
      "filename": "/content/textures/face.png",
      "start": 168824005,
      "end": 168825054
    }, {
      "filename": "/content/textures/fire_0.png",
      "start": 168825054,
      "end": 168850590
    }, {
      "filename": "/content/textures/glow.png",
      "start": 168850590,
      "end": 168907195
    }, {
      "filename": "/content/textures/gradient.png",
      "start": 168907195,
      "end": 169111148
    }, {
      "filename": "/content/textures/granite/diffuse.dds",
      "start": 169111148,
      "end": 169810340
    }, {
      "filename": "/content/textures/granite/normal.dds",
      "start": 169810340,
      "end": 169810516
    }, {
      "filename": "/content/textures/granite/normaldetail.dds",
      "start": 169810516,
      "end": 169810692
    }, {
      "filename": "/content/textures/granite/specular.dds",
      "start": 169810692,
      "end": 170509884
    }, {
      "filename": "/content/textures/grass/diffuse.dds",
      "start": 170509884,
      "end": 170859564
    }, {
      "filename": "/content/textures/grass/normal.dds",
      "start": 170859564,
      "end": 171209244
    }, {
      "filename": "/content/textures/grass/normaldetail.dds",
      "start": 171209244,
      "end": 171209420
    }, {
      "filename": "/content/textures/grass/specular.dds",
      "start": 171209420,
      "end": 171384324
    }, {
      "filename": "/content/textures/ice/diffuse.dds",
      "start": 171384324,
      "end": 171384476
    }, {
      "filename": "/content/textures/ice/normal.dds",
      "start": 171384476,
      "end": 171734156
    }, {
      "filename": "/content/textures/ice/normaldetail.dds",
      "start": 171734156,
      "end": 171734332
    }, {
      "filename": "/content/textures/ice/specular.dds",
      "start": 171734332,
      "end": 172433524
    }, {
      "filename": "/content/textures/loading/cancelButton.png",
      "start": 172433524,
      "end": 172436852
    }, {
      "filename": "/content/textures/loading/darkLoadingTexture.png",
      "start": 172436852,
      "end": 172499957
    }, {
      "filename": "/content/textures/loading/loadingCircle.png",
      "start": 172499957,
      "end": 172513252
    }, {
      "filename": "/content/textures/loading/loadingTexture.png",
      "start": 172513252,
      "end": 172597126
    }, {
      "filename": "/content/textures/loading/loadingvignette.png",
      "start": 172597126,
      "end": 172617834
    }, {
      "filename": "/content/textures/loading/robloxlogo.png",
      "start": 172617834,
      "end": 172641209
    }, {
      "filename": "/content/textures/lua.png",
      "start": 172641209,
      "end": 172705787
    }, {
      "filename": "/content/textures/marble/diffuse.dds",
      "start": 172705787,
      "end": 173404979
    }, {
      "filename": "/content/textures/marble/normal.dds",
      "start": 173404979,
      "end": 173405155
    }, {
      "filename": "/content/textures/marble/normaldetail.dds",
      "start": 173405155,
      "end": 173405331
    }, {
      "filename": "/content/textures/marble/specular.dds",
      "start": 173405331,
      "end": 174104523
    }, {
      "filename": "/content/textures/metal/diffuse.dds",
      "start": 174104523,
      "end": 174279427
    }, {
      "filename": "/content/textures/metal/normal.dds",
      "start": 174279427,
      "end": 174629107
    }, {
      "filename": "/content/textures/metal/normaldetail.dds",
      "start": 174629107,
      "end": 174629283
    }, {
      "filename": "/content/textures/metal/specular.dds",
      "start": 174629283,
      "end": 174804187
    }, {
      "filename": "/content/textures/noiseL8_32x32x32.dds",
      "start": 174804187,
      "end": 174837083
    }, {
      "filename": "/content/textures/nosurfacesAlpha.png",
      "start": 174837083,
      "end": 174837812
    }, {
      "filename": "/content/textures/nosurfacesTruss.png",
      "start": 174837812,
      "end": 174839776
    }, {
      "filename": "/content/textures/nosurfacesTrussAlpha.png",
      "start": 174839776,
      "end": 174845815
    }, {
      "filename": "/content/textures/particles/common_alpha.dds",
      "start": 174845815,
      "end": 174850039
    }, {
      "filename": "/content/textures/particles/explosion01_core_alpha.png",
      "start": 174850039,
      "end": 174878987
    }, {
      "filename": "/content/textures/particles/explosion01_core_main.dds",
      "start": 174878987,
      "end": 174966523
    }, {
      "filename": "/content/textures/particles/explosion01_implosion_color.png",
      "start": 174966523,
      "end": 174975301
    }, {
      "filename": "/content/textures/particles/explosion01_implosion_main.dds",
      "start": 174975301,
      "end": 175062837
    }, {
      "filename": "/content/textures/particles/explosion01_shockwave_main.dds",
      "start": 175062837,
      "end": 175150373
    }, {
      "filename": "/content/textures/particles/explosion01_smoke_alpha.dds",
      "start": 175150373,
      "end": 175153261
    }, {
      "filename": "/content/textures/particles/explosion01_smoke_color_new.dds",
      "start": 175153261,
      "end": 175156149
    }, {
      "filename": "/content/textures/particles/explosion01_smoke_main.dds",
      "start": 175156149,
      "end": 175243685
    }, {
      "filename": "/content/textures/particles/explosion_alpha.dds",
      "start": 175243685,
      "end": 175246573
    }, {
      "filename": "/content/textures/particles/explosion_color.dds",
      "start": 175246573,
      "end": 175252221
    }, {
      "filename": "/content/textures/particles/fire_alpha.dds",
      "start": 175252221,
      "end": 175257869
    }, {
      "filename": "/content/textures/particles/fire_color.dds",
      "start": 175257869,
      "end": 175263517
    }, {
      "filename": "/content/textures/particles/fire_main.dds",
      "start": 175263517,
      "end": 175351053
    }, {
      "filename": "/content/textures/particles/fire_sparks_color.dds",
      "start": 175351053,
      "end": 175356701
    }, {
      "filename": "/content/textures/particles/fire_sparks_main.dds",
      "start": 175356701,
      "end": 175362317
    }, {
      "filename": "/content/textures/particles/forcefield_alpha.dds",
      "start": 175362317,
      "end": 175367965
    }, {
      "filename": "/content/textures/particles/forcefield_glow_alpha.dds",
      "start": 175367965,
      "end": 175373613
    }, {
      "filename": "/content/textures/particles/forcefield_glow_color.dds",
      "start": 175373613,
      "end": 175379261
    }, {
      "filename": "/content/textures/particles/forcefield_glow_main.dds",
      "start": 175379261,
      "end": 175466797
    }, {
      "filename": "/content/textures/particles/forcefield_vortex_color.dds",
      "start": 175466797,
      "end": 175472445
    }, {
      "filename": "/content/textures/particles/forcefield_vortex_main.dds",
      "start": 175472445,
      "end": 175494445
    }, {
      "filename": "/content/textures/particles/legacy_fire_alpha_color.dds",
      "start": 175494445,
      "end": 175497333
    }, {
      "filename": "/content/textures/particles/smoke_color.dds",
      "start": 175497333,
      "end": 175502981
    }, {
      "filename": "/content/textures/particles/smoke_main.dds",
      "start": 175502981,
      "end": 175524981
    }, {
      "filename": "/content/textures/particles/sparkles_color.dds",
      "start": 175524981,
      "end": 175530629
    }, {
      "filename": "/content/textures/particles/sparkles_main.dds",
      "start": 175530629,
      "end": 175552629
    }, {
      "filename": "/content/textures/pebble/diffuse.dds",
      "start": 175552629,
      "end": 175727533
    }, {
      "filename": "/content/textures/pebble/normal.dds",
      "start": 175727533,
      "end": 175727709
    }, {
      "filename": "/content/textures/pebble/normaldetail.dds",
      "start": 175727709,
      "end": 176077389
    }, {
      "filename": "/content/textures/pebble/specular.dds",
      "start": 176077389,
      "end": 176252293
    }, {
      "filename": "/content/textures/penv.dds",
      "start": 176252293,
      "end": 176514645
    }, {
      "filename": "/content/textures/plastic/diffuse.dds",
      "start": 176514645,
      "end": 176689629
    }, {
      "filename": "/content/textures/plastic/normal.dds",
      "start": 176689629,
      "end": 177039469
    }, {
      "filename": "/content/textures/plastic/normaldetail.dds",
      "start": 177039469,
      "end": 177389149
    }, {
      "filename": "/content/textures/reflection.dds",
      "start": 177389149,
      "end": 177651501
    }, {
      "filename": "/content/textures/roblox-logo.png",
      "start": 177651501,
      "end": 177818983
    }, {
      "filename": "/content/textures/rotationArrow.png",
      "start": 177818983,
      "end": 177823052
    }, {
      "filename": "/content/textures/rust/diffuse.dds",
      "start": 177823052,
      "end": 179221308
    }, {
      "filename": "/content/textures/rust/normal.dds",
      "start": 179221308,
      "end": 180619564
    }, {
      "filename": "/content/textures/rust/normaldetail.dds",
      "start": 180619564,
      "end": 180619740
    }, {
      "filename": "/content/textures/rust/specular.dds",
      "start": 180619740,
      "end": 181318932
    }, {
      "filename": "/content/textures/rust_combined.dds",
      "start": 181318932,
      "end": 181581204
    }, {
      "filename": "/content/textures/sand/diffuse.dds",
      "start": 181581204,
      "end": 182280396
    }, {
      "filename": "/content/textures/sand/normal.dds",
      "start": 182280396,
      "end": 182630076
    }, {
      "filename": "/content/textures/sand/normaldetail.dds",
      "start": 182630076,
      "end": 182630252
    }, {
      "filename": "/content/textures/sand/specular.dds",
      "start": 182630252,
      "end": 183329444
    }, {
      "filename": "/content/textures/script.png",
      "start": 183329444,
      "end": 183330192
    }, {
      "filename": "/content/textures/shadowmask.png",
      "start": 183330192,
      "end": 183333777
    }, {
      "filename": "/content/textures/sky/sky512_bk.tex",
      "start": 183333777,
      "end": 184032969
    }, {
      "filename": "/content/textures/sky/sky512_dn.tex",
      "start": 184032969,
      "end": 184732161
    }, {
      "filename": "/content/textures/sky/sky512_ft.tex",
      "start": 184732161,
      "end": 185431353
    }, {
      "filename": "/content/textures/sky/sky512_lf.tex",
      "start": 185431353,
      "end": 186130545
    }, {
      "filename": "/content/textures/sky/sky512_rt.tex",
      "start": 186130545,
      "end": 186829737
    }, {
      "filename": "/content/textures/sky/sky512_up.tex",
      "start": 186829737,
      "end": 187528929
    }, {
      "filename": "/content/textures/slate/diffuse.dds",
      "start": 187528929,
      "end": 188228121
    }, {
      "filename": "/content/textures/slate/normal.dds",
      "start": 188228121,
      "end": 189626377
    }, {
      "filename": "/content/textures/slate/normaldetail.dds",
      "start": 189626377,
      "end": 189976057
    }, {
      "filename": "/content/textures/slate/specular.dds",
      "start": 189976057,
      "end": 190150961
    }, {
      "filename": "/content/textures/spark.png",
      "start": 190150961,
      "end": 190154538
    }, {
      "filename": "/content/textures/sparkle.png",
      "start": 190154538,
      "end": 190158805
    }, {
      "filename": "/content/textures/studs.dds",
      "start": 190158805,
      "end": 190333789
    }, {
      "filename": "/content/textures/surfacesAlpha.dds",
      "start": 190333789,
      "end": 190508699
    }, {
      "filename": "/content/textures/surfacesTrussAlpha.png",
      "start": 190508699,
      "end": 190528686
    }, {
      "filename": "/content/textures/terrain/diffuse.dds",
      "start": 190528686,
      "end": 193325030
    }, {
      "filename": "/content/textures/terrain/diffusefar.dds",
      "start": 193325030,
      "end": 196121374
    }, {
      "filename": "/content/textures/terrain/normal.dds",
      "start": 196121374,
      "end": 201713934
    }, {
      "filename": "/content/textures/terrain/specular.dds",
      "start": 201713934,
      "end": 204510278
    }, {
      "filename": "/content/textures/transformFiveDegrees.png",
      "start": 204510278,
      "end": 204515341
    }, {
      "filename": "/content/textures/transformNinetyDegrees.png",
      "start": 204515341,
      "end": 204520857
    }, {
      "filename": "/content/textures/transformOneDegree.png",
      "start": 204520857,
      "end": 204525610
    }, {
      "filename": "/content/textures/transformTwentyTwoDegrees.png",
      "start": 204525610,
      "end": 204529678
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack.png",
      "start": 204529678,
      "end": 204530501
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack@2x.png",
      "start": 204530501,
      "end": 204532677
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack_Down.png",
      "start": 204532677,
      "end": 204533657
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack_Down@2x.png",
      "start": 204533657,
      "end": 204535909
    }, {
      "filename": "/content/textures/ui/Backpack_Close.png",
      "start": 204535909,
      "end": 204536143
    }, {
      "filename": "/content/textures/ui/Backpack_Close@2x.png",
      "start": 204536143,
      "end": 204536596
    }, {
      "filename": "/content/textures/ui/Backpack_Open.png",
      "start": 204536596,
      "end": 204536840
    }, {
      "filename": "/content/textures/ui/Backpack_Open@2x.png",
      "start": 204536840,
      "end": 204537285
    }, {
      "filename": "/content/textures/ui/BottomRightControl.png",
      "start": 204537285,
      "end": 204538313
    }, {
      "filename": "/content/textures/ui/BuildToolsFrame.png",
      "start": 204538313,
      "end": 204539803
    }, {
      "filename": "/content/textures/ui/ButtonLeft.png",
      "start": 204539803,
      "end": 204554915
    }, {
      "filename": "/content/textures/ui/ButtonLeftDown.png",
      "start": 204554915,
      "end": 204570026
    }, {
      "filename": "/content/textures/ui/ButtonRight.png",
      "start": 204570026,
      "end": 204585121
    }, {
      "filename": "/content/textures/ui/ButtonRightDown.png",
      "start": 204585121,
      "end": 204600229
    }, {
      "filename": "/content/textures/ui/Chat/Chat.png",
      "start": 204600229,
      "end": 204601084
    }, {
      "filename": "/content/textures/ui/Chat/Chat@2x.png",
      "start": 204601084,
      "end": 204603205
    }, {
      "filename": "/content/textures/ui/Chat/ChatDown.png",
      "start": 204603205,
      "end": 204604009
    }, {
      "filename": "/content/textures/ui/Chat/ChatDown@2x.png",
      "start": 204604009,
      "end": 204605845
    }, {
      "filename": "/content/textures/ui/Chat/MessageCounter.png",
      "start": 204605845,
      "end": 204606442
    }, {
      "filename": "/content/textures/ui/Chat/MessageCounter@2x.png",
      "start": 204606442,
      "end": 204607752
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChat.png",
      "start": 204607752,
      "end": 204608822
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChat@2x.png",
      "start": 204608822,
      "end": 204611507
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChatDown.png",
      "start": 204611507,
      "end": 204612665
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChatDown@2x.png",
      "start": 204612665,
      "end": 204615406
    }, {
      "filename": "/content/textures/ui/CloneButton.png",
      "start": 204615406,
      "end": 204617071
    }, {
      "filename": "/content/textures/ui/CloneButton_dn.png",
      "start": 204617071,
      "end": 204618808
    }, {
      "filename": "/content/textures/ui/CloseButton.png",
      "start": 204618808,
      "end": 204620375
    }, {
      "filename": "/content/textures/ui/CloseButton_dn.png",
      "start": 204620375,
      "end": 204621881
    }, {
      "filename": "/content/textures/ui/Concrete.png",
      "start": 204621881,
      "end": 204624001
    }, {
      "filename": "/content/textures/ui/CorrodedMetal.png",
      "start": 204624001,
      "end": 204625956
    }, {
      "filename": "/content/textures/ui/DPadSheet.png",
      "start": 204625956,
      "end": 204643823
    }, {
      "filename": "/content/textures/ui/DeleteButton.png",
      "start": 204643823,
      "end": 204645379
    }, {
      "filename": "/content/textures/ui/DeleteButton_dn.png",
      "start": 204645379,
      "end": 204646954
    }, {
      "filename": "/content/textures/ui/DiamondPlate.png",
      "start": 204646954,
      "end": 204648897
    }, {
      "filename": "/content/textures/ui/Div.png",
      "start": 204648897,
      "end": 204649063
    }, {
      "filename": "/content/textures/ui/ErrorIcon.png",
      "start": 204649063,
      "end": 204652126
    }, {
      "filename": "/content/textures/ui/ErrorIconSmall.png",
      "start": 204652126,
      "end": 204655246
    }, {
      "filename": "/content/textures/ui/Foil.png",
      "start": 204655246,
      "end": 204657329
    }, {
      "filename": "/content/textures/ui/Gear.png",
      "start": 204657329,
      "end": 204658567
    }, {
      "filename": "/content/textures/ui/Gear_dn.png",
      "start": 204658567,
      "end": 204659770
    }, {
      "filename": "/content/textures/ui/Glue.png",
      "start": 204659770,
      "end": 204662511
    }, {
      "filename": "/content/textures/ui/Grass.png",
      "start": 204662511,
      "end": 204663897
    }, {
      "filename": "/content/textures/ui/GroupMoveButton.png",
      "start": 204663897,
      "end": 204665710
    }, {
      "filename": "/content/textures/ui/GroupMoveButton_dn.png",
      "start": 204665710,
      "end": 204667559
    }, {
      "filename": "/content/textures/ui/Health-BKG-Center.png",
      "start": 204667559,
      "end": 204668518
    }, {
      "filename": "/content/textures/ui/Health-BKG-Center@2x.png",
      "start": 204668518,
      "end": 204669504
    }, {
      "filename": "/content/textures/ui/Health-BKG-Left-Cap.png",
      "start": 204669504,
      "end": 204670589
    }, {
      "filename": "/content/textures/ui/Health-BKG-Left-Cap@2x.png",
      "start": 204670589,
      "end": 204671899
    }, {
      "filename": "/content/textures/ui/Health-BKG-Right-Cap.png",
      "start": 204671899,
      "end": 204673004
    }, {
      "filename": "/content/textures/ui/Health-BKG-Right-Cap@2x.png",
      "start": 204673004,
      "end": 204674358
    }, {
      "filename": "/content/textures/ui/Hinge.png",
      "start": 204674358,
      "end": 204675225
    }, {
      "filename": "/content/textures/ui/Ice.png",
      "start": 204675225,
      "end": 204677144
    }, {
      "filename": "/content/textures/ui/Inlets.png",
      "start": 204677144,
      "end": 204679403
    }, {
      "filename": "/content/textures/ui/InsertButton.png",
      "start": 204679403,
      "end": 204681041
    }, {
      "filename": "/content/textures/ui/InsertButton_dn.png",
      "start": 204681041,
      "end": 204682711
    }, {
      "filename": "/content/textures/ui/LoadingBKG.png",
      "start": 204682711,
      "end": 204688621
    }, {
      "filename": "/content/textures/ui/MaterialButton.png",
      "start": 204688621,
      "end": 204690663
    }, {
      "filename": "/content/textures/ui/MaterialButton_dn.png",
      "start": 204690663,
      "end": 204692758
    }, {
      "filename": "/content/textures/ui/MaterialMenu.png",
      "start": 204692758,
      "end": 204694245
    }, {
      "filename": "/content/textures/ui/Menu/Hamburger.png",
      "start": 204694245,
      "end": 204694492
    }, {
      "filename": "/content/textures/ui/Menu/Hamburger@2x.png",
      "start": 204694492,
      "end": 204695126
    }, {
      "filename": "/content/textures/ui/Menu/HamburgerDown.png",
      "start": 204695126,
      "end": 204695388
    }, {
      "filename": "/content/textures/ui/Menu/HamburgerDown@2x.png",
      "start": 204695388,
      "end": 204696033
    }, {
      "filename": "/content/textures/ui/Modal.png",
      "start": 204696033,
      "end": 204712050
    }, {
      "filename": "/content/textures/ui/Motor.png",
      "start": 204712050,
      "end": 204712930
    }, {
      "filename": "/content/textures/ui/PaintButton.png",
      "start": 204712930,
      "end": 204714504
    }, {
      "filename": "/content/textures/ui/PaintButton_dn.png",
      "start": 204714504,
      "end": 204716117
    }, {
      "filename": "/content/textures/ui/PaintMenu.png",
      "start": 204716117,
      "end": 204717811
    }, {
      "filename": "/content/textures/ui/PartMoveButton.png",
      "start": 204717811,
      "end": 204719517
    }, {
      "filename": "/content/textures/ui/PartMoveButton_dn.png",
      "start": 204719517,
      "end": 204721210
    }, {
      "filename": "/content/textures/ui/Plastic.png",
      "start": 204721210,
      "end": 204722383
    }, {
      "filename": "/content/textures/ui/PlayerList/BlockedIcon.png",
      "start": 204722383,
      "end": 204722728
    }, {
      "filename": "/content/textures/ui/PlayerList/CharacterImageBackground.png",
      "start": 204722728,
      "end": 204723308
    }, {
      "filename": "/content/textures/ui/PlayerList/TileShadowMissingTop.png",
      "start": 204723308,
      "end": 204723804
    }, {
      "filename": "/content/textures/ui/PlayerListFriendRequestReceivedIcon.png",
      "start": 204723804,
      "end": 204726254
    }, {
      "filename": "/content/textures/ui/PlayerListFriendRequestSentIcon.png",
      "start": 204726254,
      "end": 204728602
    }, {
      "filename": "/content/textures/ui/PlayerlistFriendIcon.png",
      "start": 204728602,
      "end": 204730696
    }, {
      "filename": "/content/textures/ui/PropertyButton.png",
      "start": 204730696,
      "end": 204732345
    }, {
      "filename": "/content/textures/ui/PropertyButton_dn.png",
      "start": 204732345,
      "end": 204734032
    }, {
      "filename": "/content/textures/ui/RecordDown.png",
      "start": 204734032,
      "end": 204736392
    }, {
      "filename": "/content/textures/ui/RecordStop.png",
      "start": 204736392,
      "end": 204738379
    }, {
      "filename": "/content/textures/ui/ResetIcon.png",
      "start": 204738379,
      "end": 204740785
    }, {
      "filename": "/content/textures/ui/RobuxIcon.png",
      "start": 204740785,
      "end": 204742949
    }, {
      "filename": "/content/textures/ui/ScaleButton.png",
      "start": 204742949,
      "end": 204744696
    }, {
      "filename": "/content/textures/ui/ScaleButton_dn.png",
      "start": 204744696,
      "end": 204746488
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-bottom.png",
      "start": 204746488,
      "end": 204747489
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-bottom@2x.png",
      "start": 204747489,
      "end": 204748578
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-middle.png",
      "start": 204748578,
      "end": 204749508
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-middle@2x.png",
      "start": 204749508,
      "end": 204750441
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-top.png",
      "start": 204750441,
      "end": 204751447
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-top@2x.png",
      "start": 204751447,
      "end": 204752555
    }, {
      "filename": "/content/textures/ui/SearchIcon.png",
      "start": 204752555,
      "end": 204753854
    }, {
      "filename": "/content/textures/ui/SelectionBox.png",
      "start": 204753854,
      "end": 204758240
    }, {
      "filename": "/content/textures/ui/SelectionBox@2x.png",
      "start": 204758240,
      "end": 204764112
    }, {
      "filename": "/content/textures/ui/Settings/DropDown/DropDown.png",
      "start": 204764112,
      "end": 204767016
    }, {
      "filename": "/content/textures/ui/Settings/DropDown/DropDown@2x.png",
      "start": 204767016,
      "end": 204770092
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonDark.png",
      "start": 204770092,
      "end": 204775420
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonDark@2x.png",
      "start": 204775420,
      "end": 204789318
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonLight.png",
      "start": 204789318,
      "end": 204793358
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonLight@2x.png",
      "start": 204793358,
      "end": 204803423
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonLightSmall.png",
      "start": 204803423,
      "end": 204804668
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonDark.png",
      "start": 204804668,
      "end": 204809937
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonDark@2x.png",
      "start": 204809937,
      "end": 204823697
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonLight.png",
      "start": 204823697,
      "end": 204827894
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonLight@2x.png",
      "start": 204827894,
      "end": 204838221
    }, {
      "filename": "/content/textures/ui/Settings/Help/EscapeIcon.png",
      "start": 204838221,
      "end": 204839229
    }, {
      "filename": "/content/textures/ui/Settings/Help/GenericController.png",
      "start": 204839229,
      "end": 204870831
    }, {
      "filename": "/content/textures/ui/Settings/Help/GenericController@2x.png",
      "start": 204870831,
      "end": 204950247
    }, {
      "filename": "/content/textures/ui/Settings/Help/LeaveIcon.png",
      "start": 204950247,
      "end": 204950663
    }, {
      "filename": "/content/textures/ui/Settings/Help/ResetIcon.png",
      "start": 204950663,
      "end": 204951303
    }, {
      "filename": "/content/textures/ui/Settings/Help/RotateCameraGesture.png",
      "start": 204951303,
      "end": 204959663
    }, {
      "filename": "/content/textures/ui/Settings/Help/UseToolGesture.png",
      "start": 204959663,
      "end": 204963461
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonDark.png",
      "start": 204963461,
      "end": 204969013
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonDark@2x.png",
      "start": 204969013,
      "end": 204983458
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonLight.png",
      "start": 204983458,
      "end": 204987504
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonLight@2x.png",
      "start": 204987504,
      "end": 204997552
    }, {
      "filename": "/content/textures/ui/Settings/Help/XboxController.png",
      "start": 204997552,
      "end": 205091278
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonDark.png",
      "start": 205091278,
      "end": 205096613
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonDark@2x.png",
      "start": 205096613,
      "end": 205110352
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonLight.png",
      "start": 205110352,
      "end": 205114156
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonLight@2x.png",
      "start": 205114156,
      "end": 205123879
    }, {
      "filename": "/content/textures/ui/Settings/Help/ZoomGesture.png",
      "start": 205123879,
      "end": 205130688
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuBackground.png",
      "start": 205130688,
      "end": 205133620
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButton.png",
      "start": 205133620,
      "end": 205134368
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButton@2x.png",
      "start": 205134368,
      "end": 205136321
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButtonSelected.png",
      "start": 205136321,
      "end": 205137084
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButtonSelected@2x.png",
      "start": 205137084,
      "end": 205139039
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuSelection.png",
      "start": 205139039,
      "end": 205141899
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuSelection@2x.png",
      "start": 205141899,
      "end": 205144839
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/GameSettingsTab.png",
      "start": 205144839,
      "end": 205147655
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/GameSettingsTab@2x.png",
      "start": 205147655,
      "end": 205155055
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HelpTab.png",
      "start": 205155055,
      "end": 205157721
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HelpTab@2x.png",
      "start": 205157721,
      "end": 205165020
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HomeTab.png",
      "start": 205165020,
      "end": 205166131
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HomeTab@2x.png",
      "start": 205166131,
      "end": 205168995
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/PlayersTabIcon.png",
      "start": 205168995,
      "end": 205169489
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/PlayersTabIcon@2x.png",
      "start": 205169489,
      "end": 205171166
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/RecordTab.png",
      "start": 205171166,
      "end": 205173070
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/RecordTab@2x.png",
      "start": 205173070,
      "end": 205177644
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/ReportAbuseTab.png",
      "start": 205177644,
      "end": 205179007
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/ReportAbuseTab@2x.png",
      "start": 205179007,
      "end": 205181650
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Alert.png",
      "start": 205181650,
      "end": 205184260
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Alert@2x.png",
      "start": 205184260,
      "end": 205190951
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Backpack.png",
      "start": 205190951,
      "end": 205193145
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Backpack@2x.png",
      "start": 205193145,
      "end": 205198470
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Bottom.png",
      "start": 205198470,
      "end": 205209351
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomLeft.png",
      "start": 205209351,
      "end": 205220543
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomLeftSelected.png",
      "start": 205220543,
      "end": 205231557
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomRight.png",
      "start": 205231557,
      "end": 205242782
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomRightSelected.png",
      "start": 205242782,
      "end": 205253555
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomSelected.png",
      "start": 205253555,
      "end": 205263370
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Chat.png",
      "start": 205263370,
      "end": 205265512
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Chat@2x.png",
      "start": 205265512,
      "end": 205270655
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyBottom.png",
      "start": 205270655,
      "end": 205284708
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyBottomLeft.png",
      "start": 205284708,
      "end": 205299283
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyBottomRight.png",
      "start": 205299283,
      "end": 205313964
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyTop.png",
      "start": 205313964,
      "end": 205327997
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyTopLeft.png",
      "start": 205327997,
      "end": 205342623
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyTopRight.png",
      "start": 205342623,
      "end": 205357575
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Leave.png",
      "start": 205357575,
      "end": 205359698
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Leave@2x.png",
      "start": 205359698,
      "end": 205365172
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Menu.png",
      "start": 205365172,
      "end": 205366286
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Menu@2x.png",
      "start": 205366286,
      "end": 205369123
    }, {
      "filename": "/content/textures/ui/Settings/Radial/PlayerList.png",
      "start": 205369123,
      "end": 205370513
    }, {
      "filename": "/content/textures/ui/Settings/Radial/PlayerList@2x.png",
      "start": 205370513,
      "end": 205374327
    }, {
      "filename": "/content/textures/ui/Settings/Radial/RadialLabel.png",
      "start": 205374327,
      "end": 205377740
    }, {
      "filename": "/content/textures/ui/Settings/Radial/RadialLabel@2x.png",
      "start": 205377740,
      "end": 205382021
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Top.png",
      "start": 205382021,
      "end": 205392934
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopLeft.png",
      "start": 205392934,
      "end": 205404158
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopLeftSelected.png",
      "start": 205404158,
      "end": 205414488
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopRight.png",
      "start": 205414488,
      "end": 205425929
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopRightSelected.png",
      "start": 205425929,
      "end": 205436589
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopSelected.png",
      "start": 205436589,
      "end": 205446755
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarLeft.png",
      "start": 205446755,
      "end": 205446966
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarLeft@2x.png",
      "start": 205446966,
      "end": 205447328
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarRight.png",
      "start": 205447328,
      "end": 205447520
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarRight@2x.png",
      "start": 205447520,
      "end": 205447863
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Left.png",
      "start": 205447863,
      "end": 205448228
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Left@2x.png",
      "start": 205448228,
      "end": 205448909
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Right.png",
      "start": 205448909,
      "end": 205449247
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Right@2x.png",
      "start": 205449247,
      "end": 205449981
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarLeft.png",
      "start": 205449981,
      "end": 205450178
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarLeft@2x.png",
      "start": 205450178,
      "end": 205450540
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarRight.png",
      "start": 205450540,
      "end": 205450728
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarRight@2x.png",
      "start": 205450728,
      "end": 205451040
    }, {
      "filename": "/content/textures/ui/SettingsButton.png",
      "start": 205451040,
      "end": 205454526
    }, {
      "filename": "/content/textures/ui/SettingsButton_dn.png",
      "start": 205454526,
      "end": 205457928
    }, {
      "filename": "/content/textures/ui/SettingsButton_ds.png",
      "start": 205457928,
      "end": 205460519
    }, {
      "filename": "/content/textures/ui/SettingsButton_ovr.png",
      "start": 205460519,
      "end": 205463921
    }, {
      "filename": "/content/textures/ui/SettingsIcon.png",
      "start": 205463921,
      "end": 205472525
    }, {
      "filename": "/content/textures/ui/SingleButton.png",
      "start": 205472525,
      "end": 205473876
    }, {
      "filename": "/content/textures/ui/SingleButtonDown.png",
      "start": 205473876,
      "end": 205475208
    }, {
      "filename": "/content/textures/ui/Slate.png",
      "start": 205475208,
      "end": 205476952
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Center.png",
      "start": 205476952,
      "end": 205477884
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Center@2x.png",
      "start": 205477884,
      "end": 205478816
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Left-Cap.png",
      "start": 205478816,
      "end": 205479798
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Left-Cap@2x.png",
      "start": 205479798,
      "end": 205480879
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Right-Cap.png",
      "start": 205480879,
      "end": 205481870
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Right-Cap@2x.png",
      "start": 205481870,
      "end": 205482949
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Center.png",
      "start": 205482949,
      "end": 205483881
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Center@2x.png",
      "start": 205483881,
      "end": 205484813
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Left-Cap.png",
      "start": 205484813,
      "end": 205485796
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Left-Cap@2x.png",
      "start": 205485796,
      "end": 205486856
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Right-Cap.png",
      "start": 205486856,
      "end": 205487846
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Right-Cap@2x.png",
      "start": 205487846,
      "end": 205488924
    }, {
      "filename": "/content/textures/ui/Slider.png",
      "start": 205488924,
      "end": 205490270
    }, {
      "filename": "/content/textures/ui/Slider_dn.png",
      "start": 205490270,
      "end": 205491534
    }, {
      "filename": "/content/textures/ui/Slider_sel.png",
      "start": 205491534,
      "end": 205492798
    }, {
      "filename": "/content/textures/ui/Smooth.png",
      "start": 205492798,
      "end": 205492985
    }, {
      "filename": "/content/textures/ui/StampToolButton.png",
      "start": 205492985,
      "end": 205494479
    }, {
      "filename": "/content/textures/ui/StampToolButton_dn.png",
      "start": 205494479,
      "end": 205496278
    }, {
      "filename": "/content/textures/ui/Studs.png",
      "start": 205496278,
      "end": 205499599
    }, {
      "filename": "/content/textures/ui/SurfaceButton.png",
      "start": 205499599,
      "end": 205501506
    }, {
      "filename": "/content/textures/ui/SurfaceButton_dn.png",
      "start": 205501506,
      "end": 205503495
    }, {
      "filename": "/content/textures/ui/SurfaceMenu.png",
      "start": 205503495,
      "end": 205504938
    }, {
      "filename": "/content/textures/ui/TinyBcIcon.png",
      "start": 205504938,
      "end": 205508290
    }, {
      "filename": "/content/textures/ui/TinyObcIcon.png",
      "start": 205508290,
      "end": 205511533
    }, {
      "filename": "/content/textures/ui/TinyTbcIcon.png",
      "start": 205511533,
      "end": 205514879
    }, {
      "filename": "/content/textures/ui/TixIcon.png",
      "start": 205514879,
      "end": 205515972
    }, {
      "filename": "/content/textures/ui/ToggleFullScreen_ds.png",
      "start": 205515972,
      "end": 205516438
    }, {
      "filename": "/content/textures/ui/ToolButton.png",
      "start": 205516438,
      "end": 205518139
    }, {
      "filename": "/content/textures/ui/ToolButton_dn.png",
      "start": 205518139,
      "end": 205519840
    }, {
      "filename": "/content/textures/ui/ToolButton_ds.png",
      "start": 205519840,
      "end": 205523040
    }, {
      "filename": "/content/textures/ui/TopBar/dropshadow.png",
      "start": 205523040,
      "end": 205523203
    }, {
      "filename": "/content/textures/ui/TopBar/dropshadow@2x.png",
      "start": 205523203,
      "end": 205523405
    }, {
      "filename": "/content/textures/ui/TouchControlsSheet.png",
      "start": 205523405,
      "end": 205640325
    }, {
      "filename": "/content/textures/ui/Universal.png",
      "start": 205640325,
      "end": 205643584
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBar.png",
      "start": 205643584,
      "end": 205643995
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBar@2x.png",
      "start": 205643995,
      "end": 205644460
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarBKG.png",
      "start": 205644460,
      "end": 205644739
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarBKG@2x.png",
      "start": 205644739,
      "end": 205645340
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarEmpty.png",
      "start": 205645340,
      "end": 205645458
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarEmpty@2x.png",
      "start": 205645458,
      "end": 205645625
    }, {
      "filename": "/content/textures/ui/Weld.png",
      "start": 205645625,
      "end": 205648951
    }, {
      "filename": "/content/textures/ui/Wood.png",
      "start": 205648951,
      "end": 205649926
    }, {
      "filename": "/content/textures/ui/backpackButton.png",
      "start": 205649926,
      "end": 205653018
    }, {
      "filename": "/content/textures/ui/backpackButton_ovr.png",
      "start": 205653018,
      "end": 205655952
    }, {
      "filename": "/content/textures/ui/backpackButton_sel.png",
      "start": 205655952,
      "end": 205658886
    }, {
      "filename": "/content/textures/ui/bottomLeftControl.png",
      "start": 205658886,
      "end": 205660198
    }, {
      "filename": "/content/textures/ui/btn_grey.png",
      "start": 205660198,
      "end": 205660618
    }, {
      "filename": "/content/textures/ui/btn_greyTransp.png",
      "start": 205660618,
      "end": 205661046
    }, {
      "filename": "/content/textures/ui/btn_newBlue.png",
      "start": 205661046,
      "end": 205675941
    }, {
      "filename": "/content/textures/ui/btn_newBlue@2x.png",
      "start": 205675941,
      "end": 205691253
    }, {
      "filename": "/content/textures/ui/btn_newBlueGlow.png",
      "start": 205691253,
      "end": 205706147
    }, {
      "filename": "/content/textures/ui/btn_newBlueGlow@2x.png",
      "start": 205706147,
      "end": 205721463
    }, {
      "filename": "/content/textures/ui/btn_newGrey.png",
      "start": 205721463,
      "end": 205736340
    }, {
      "filename": "/content/textures/ui/btn_newGrey@2x.png",
      "start": 205736340,
      "end": 205751636
    }, {
      "filename": "/content/textures/ui/btn_newGreyGlow.png",
      "start": 205751636,
      "end": 205766514
    }, {
      "filename": "/content/textures/ui/btn_newGreyGlow@2x.png",
      "start": 205766514,
      "end": 205781816
    }, {
      "filename": "/content/textures/ui/btn_newWhite.png",
      "start": 205781816,
      "end": 205796646
    }, {
      "filename": "/content/textures/ui/btn_newWhite@2x.png",
      "start": 205796646,
      "end": 205811897
    }, {
      "filename": "/content/textures/ui/btn_newWhiteGlow.png",
      "start": 205811897,
      "end": 205826761
    }, {
      "filename": "/content/textures/ui/btn_newWhiteGlow@2x.png",
      "start": 205826761,
      "end": 205842039
    }, {
      "filename": "/content/textures/ui/btn_red.png",
      "start": 205842039,
      "end": 205842420
    }, {
      "filename": "/content/textures/ui/btn_redGlow.png",
      "start": 205842420,
      "end": 205842943
    }, {
      "filename": "/content/textures/ui/btn_white.png",
      "start": 205842943,
      "end": 205843309
    }, {
      "filename": "/content/textures/ui/chatBubble_blue_notify_bkg.png",
      "start": 205843309,
      "end": 205844232
    }, {
      "filename": "/content/textures/ui/chatBubble_green_notify_bkg.png",
      "start": 205844232,
      "end": 205845131
    }, {
      "filename": "/content/textures/ui/chatBubble_red_notify_bkg.png",
      "start": 205845131,
      "end": 205845950
    }, {
      "filename": "/content/textures/ui/chatBubble_white_notify_bkg.png",
      "start": 205845950,
      "end": 205846791
    }, {
      "filename": "/content/textures/ui/chat_teamButton.png",
      "start": 205846791,
      "end": 205847159
    }, {
      "filename": "/content/textures/ui/chat_teamButton@2x.png",
      "start": 205847159,
      "end": 205848001
    }, {
      "filename": "/content/textures/ui/dialog_blue.png",
      "start": 205848001,
      "end": 205848302
    }, {
      "filename": "/content/textures/ui/dialog_blue@2x.png",
      "start": 205848302,
      "end": 205849040
    }, {
      "filename": "/content/textures/ui/dialog_ellipses.png",
      "start": 205849040,
      "end": 205849454
    }, {
      "filename": "/content/textures/ui/dialog_green.png",
      "start": 205849454,
      "end": 205849762
    }, {
      "filename": "/content/textures/ui/dialog_green@2x.png",
      "start": 205849762,
      "end": 205850472
    }, {
      "filename": "/content/textures/ui/dialog_purpose_help.png",
      "start": 205850472,
      "end": 205851042
    }, {
      "filename": "/content/textures/ui/dialog_purpose_quest.png",
      "start": 205851042,
      "end": 205851371
    }, {
      "filename": "/content/textures/ui/dialog_purpose_shop.png",
      "start": 205851371,
      "end": 205852093
    }, {
      "filename": "/content/textures/ui/dialog_red.png",
      "start": 205852093,
      "end": 205852415
    }, {
      "filename": "/content/textures/ui/dialog_red@2x.png",
      "start": 205852415,
      "end": 205853048
    }, {
      "filename": "/content/textures/ui/dialog_tail.png",
      "start": 205853048,
      "end": 205853239
    }, {
      "filename": "/content/textures/ui/dialog_tail@2x.png",
      "start": 205853239,
      "end": 205853525
    }, {
      "filename": "/content/textures/ui/dialog_white.png",
      "start": 205853525,
      "end": 205853718
    }, {
      "filename": "/content/textures/ui/dialog_white@2x.png",
      "start": 205853718,
      "end": 205854068
    }, {
      "filename": "/content/textures/ui/dropdown_arrow.png",
      "start": 205854068,
      "end": 205854386
    }, {
      "filename": "/content/textures/ui/dropdown_arrow@2x.png",
      "start": 205854386,
      "end": 205855017
    }, {
      "filename": "/content/textures/ui/expandPlayerList.png",
      "start": 205855017,
      "end": 205855226
    }, {
      "filename": "/content/textures/ui/expandPlayerList@2x.png",
      "start": 205855226,
      "end": 205855652
    }, {
      "filename": "/content/textures/ui/homeButton.png",
      "start": 205855652,
      "end": 205870335
    }, {
      "filename": "/content/textures/ui/homeButton@2x.png",
      "start": 205870335,
      "end": 205871141
    }, {
      "filename": "/content/textures/ui/icon_BC-16.png",
      "start": 205871141,
      "end": 205872256
    }, {
      "filename": "/content/textures/ui/icon_OBC-16.png",
      "start": 205872256,
      "end": 205873416
    }, {
      "filename": "/content/textures/ui/icon_TBC-16.png",
      "start": 205873416,
      "end": 205874583
    }, {
      "filename": "/content/textures/ui/icon_admin-16.png",
      "start": 205874583,
      "end": 205875178
    }, {
      "filename": "/content/textures/ui/icon_follower-16.png",
      "start": 205875178,
      "end": 205876339
    }, {
      "filename": "/content/textures/ui/icon_following-16.png",
      "start": 205876339,
      "end": 205877566
    }, {
      "filename": "/content/textures/ui/icon_friendrequestrecieved-16.png",
      "start": 205877566,
      "end": 205878716
    }, {
      "filename": "/content/textures/ui/icon_friendrequestsent_16.png",
      "start": 205878716,
      "end": 205879775
    }, {
      "filename": "/content/textures/ui/icon_friends_16.png",
      "start": 205879775,
      "end": 205880986
    }, {
      "filename": "/content/textures/ui/icon_mutualfollowing-16.png",
      "start": 205880986,
      "end": 205882088
    }, {
      "filename": "/content/textures/ui/icon_placeowner.png",
      "start": 205882088,
      "end": 205883309
    }, {
      "filename": "/content/textures/ui/mouseLock_off.png",
      "start": 205883309,
      "end": 205884877
    }, {
      "filename": "/content/textures/ui/mouseLock_off@2x.png",
      "start": 205884877,
      "end": 205889096
    }, {
      "filename": "/content/textures/ui/mouseLock_off_ds.png",
      "start": 205889096,
      "end": 205890537
    }, {
      "filename": "/content/textures/ui/mouseLock_off_ovr.png",
      "start": 205890537,
      "end": 205894369
    }, {
      "filename": "/content/textures/ui/mouseLock_off_ovr@2x.png",
      "start": 205894369,
      "end": 205903270
    }, {
      "filename": "/content/textures/ui/mouseLock_on.png",
      "start": 205903270,
      "end": 205905194
    }, {
      "filename": "/content/textures/ui/mouseLock_on@2x.png",
      "start": 205905194,
      "end": 205910088
    }, {
      "filename": "/content/textures/ui/mouseLock_on_ds.png",
      "start": 205910088,
      "end": 205911676
    }, {
      "filename": "/content/textures/ui/mouseLock_on_ovr.png",
      "start": 205911676,
      "end": 205915416
    }, {
      "filename": "/content/textures/ui/mouseLock_on_ovr@2x.png",
      "start": 205915416,
      "end": 205924218
    }, {
      "filename": "/content/textures/ui/newBkg_square.png",
      "start": 205924218,
      "end": 205939030
    }, {
      "filename": "/content/textures/ui/newBkg_square@2x.png",
      "start": 205939030,
      "end": 205954171
    }, {
      "filename": "/content/textures/ui/playerlist_big_hide.png",
      "start": 205954171,
      "end": 205956208
    }, {
      "filename": "/content/textures/ui/playerlist_big_hide_dn.png",
      "start": 205956208,
      "end": 205958204
    }, {
      "filename": "/content/textures/ui/playerlist_big_hide_ovr.png",
      "start": 205958204,
      "end": 205960200
    }, {
      "filename": "/content/textures/ui/playerlist_hidden_maximize.png",
      "start": 205960200,
      "end": 205964660
    }, {
      "filename": "/content/textures/ui/playerlist_hidden_maximize_dn.png",
      "start": 205964660,
      "end": 205968191
    }, {
      "filename": "/content/textures/ui/playerlist_hidden_maximize_ovr.png",
      "start": 205968191,
      "end": 205971722
    }, {
      "filename": "/content/textures/ui/playerlist_hidden_small.png",
      "start": 205971722,
      "end": 205973900
    }, {
      "filename": "/content/textures/ui/playerlist_hidden_small_dn.png",
      "start": 205973900,
      "end": 205975797
    }, {
      "filename": "/content/textures/ui/playerlist_hidden_small_ovr.png",
      "start": 205975797,
      "end": 205977694
    }, {
      "filename": "/content/textures/ui/playerlist_small_hide.png",
      "start": 205977694,
      "end": 205979817
    }, {
      "filename": "/content/textures/ui/playerlist_small_hide_dn.png",
      "start": 205979817,
      "end": 205981884
    }, {
      "filename": "/content/textures/ui/playerlist_small_hide_ovr.png",
      "start": 205981884,
      "end": 205983951
    }, {
      "filename": "/content/textures/ui/playerlist_small_maximize.png",
      "start": 205983951,
      "end": 205985778
    }, {
      "filename": "/content/textures/ui/playerlist_small_maximize_dn.png",
      "start": 205985778,
      "end": 205987546
    }, {
      "filename": "/content/textures/ui/playerlist_small_maximize_ovr.png",
      "start": 205987546,
      "end": 205989314
    }, {
      "filename": "/content/textures/ui/scroll-bottom.png",
      "start": 205989314,
      "end": 205989496
    }, {
      "filename": "/content/textures/ui/scroll-bottom@2x.png",
      "start": 205989496,
      "end": 206004164
    }, {
      "filename": "/content/textures/ui/scroll-middle.png",
      "start": 206004164,
      "end": 206004279
    }, {
      "filename": "/content/textures/ui/scroll-middle@2x.png",
      "start": 206004279,
      "end": 206004397
    }, {
      "filename": "/content/textures/ui/scroll-top.png",
      "start": 206004397,
      "end": 206004595
    }, {
      "filename": "/content/textures/ui/scroll-top@2x.png",
      "start": 206004595,
      "end": 206019274
    }, {
      "filename": "/content/textures/ui/scrollbar.png",
      "start": 206019274,
      "end": 206020215
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown.png",
      "start": 206020215,
      "end": 206021333
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown_dn.png",
      "start": 206021333,
      "end": 206022424
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown_ds.png",
      "start": 206022424,
      "end": 206023542
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown_ovr.png",
      "start": 206023542,
      "end": 206024633
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp.png",
      "start": 206024633,
      "end": 206025745
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp_dn.png",
      "start": 206025745,
      "end": 206026835
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp_ds.png",
      "start": 206026835,
      "end": 206027945
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp_ovr.png",
      "start": 206027945,
      "end": 206029035
    }, {
      "filename": "/content/textures/ui/slider_new_tab.png",
      "start": 206029035,
      "end": 206030003
    }, {
      "filename": "/content/textures/ui/slider_new_tab@2x.png",
      "start": 206030003,
      "end": 206032188
    }, {
      "filename": "/content/textures/unified_new.dds",
      "start": 206032188,
      "end": 206381820
    }, {
      "filename": "/content/textures/unified_studs.png",
      "start": 206381820,
      "end": 206384961
    }, {
      "filename": "/content/textures/vol_ice_cracked2.dds",
      "start": 206384961,
      "end": 206684682
    }, {
      "filename": "/content/textures/water/normal_01.dds",
      "start": 206684682,
      "end": 206772218
    }, {
      "filename": "/content/textures/water/normal_02.dds",
      "start": 206772218,
      "end": 206859754
    }, {
      "filename": "/content/textures/water/normal_03.dds",
      "start": 206859754,
      "end": 206947290
    }, {
      "filename": "/content/textures/water/normal_04.dds",
      "start": 206947290,
      "end": 207034826
    }, {
      "filename": "/content/textures/water/normal_05.dds",
      "start": 207034826,
      "end": 207122362
    }, {
      "filename": "/content/textures/water/normal_06.dds",
      "start": 207122362,
      "end": 207209898
    }, {
      "filename": "/content/textures/water/normal_07.dds",
      "start": 207209898,
      "end": 207297434
    }, {
      "filename": "/content/textures/water/normal_08.dds",
      "start": 207297434,
      "end": 207384970
    }, {
      "filename": "/content/textures/water/normal_09.dds",
      "start": 207384970,
      "end": 207472506
    }, {
      "filename": "/content/textures/water/normal_10.dds",
      "start": 207472506,
      "end": 207560042
    }, {
      "filename": "/content/textures/water/normal_11.dds",
      "start": 207560042,
      "end": 207647578
    }, {
      "filename": "/content/textures/water/normal_12.dds",
      "start": 207647578,
      "end": 207735114
    }, {
      "filename": "/content/textures/water/normal_13.dds",
      "start": 207735114,
      "end": 207822650
    }, {
      "filename": "/content/textures/water/normal_14.dds",
      "start": 207822650,
      "end": 207910186
    }, {
      "filename": "/content/textures/water/normal_15.dds",
      "start": 207910186,
      "end": 207997722
    }, {
      "filename": "/content/textures/water/normal_16.dds",
      "start": 207997722,
      "end": 208085258
    }, {
      "filename": "/content/textures/water/normal_17.dds",
      "start": 208085258,
      "end": 208172794
    }, {
      "filename": "/content/textures/water/normal_18.dds",
      "start": 208172794,
      "end": 208260330
    }, {
      "filename": "/content/textures/water/normal_19.dds",
      "start": 208260330,
      "end": 208347866
    }, {
      "filename": "/content/textures/water/normal_20.dds",
      "start": 208347866,
      "end": 208435402
    }, {
      "filename": "/content/textures/water/normal_21.dds",
      "start": 208435402,
      "end": 208522938
    }, {
      "filename": "/content/textures/water/normal_22.dds",
      "start": 208522938,
      "end": 208610474
    }, {
      "filename": "/content/textures/water/normal_23.dds",
      "start": 208610474,
      "end": 208698010
    }, {
      "filename": "/content/textures/water/normal_24.dds",
      "start": 208698010,
      "end": 208785546
    }, {
      "filename": "/content/textures/water/normal_25.dds",
      "start": 208785546,
      "end": 208873082
    }, {
      "filename": "/content/textures/water_Subsurface.dds",
      "start": 208873082,
      "end": 208895054
    }, {
      "filename": "/content/textures/water_Wave.dds",
      "start": 208895054,
      "end": 208917026
    }, {
      "filename": "/content/textures/wood/diffuse.dds",
      "start": 208917026,
      "end": 209616218
    }, {
      "filename": "/content/textures/wood/normal.dds",
      "start": 209616218,
      "end": 209965898
    }, {
      "filename": "/content/textures/wood/normaldetail.dds",
      "start": 209965898,
      "end": 210315578
    }, {
      "filename": "/content/textures/wood/specular.dds",
      "start": 210315578,
      "end": 211014770
    }, {
      "filename": "/content/textures/woodplanks/diffuse.dds",
      "start": 211014770,
      "end": 211364450
    }, {
      "filename": "/content/textures/woodplanks/normal.dds",
      "start": 211364450,
      "end": 211714130
    }, {
      "filename": "/content/textures/woodplanks/normaldetail.dds",
      "start": 211714130,
      "end": 211714306
    }, {
      "filename": "/content/textures/woodplanks/specular.dds",
      "start": 211714306,
      "end": 211889210
    }, {
      "filename": "/content/textures/wrench.png",
      "start": 211889210,
      "end": 211889820
    }, {
      "filename": "/shaders/shaders.json",
      "start": 211889820,
      "end": 211907805
    }, {
      "filename": "/shaders/shaders_d3d11.pack",
      "start": 211907805,
      "end": 212379825
    }, {
      "filename": "/shaders/shaders_d3d11_durango.pack",
      "start": 212379825,
      "end": 213084601
    }, {
      "filename": "/shaders/shaders_d3d9.pack",
      "start": 213084601,
      "end": 213319249
    }, {
      "filename": "/shaders/shaders_glsl.pack",
      "start": 213319249,
      "end": 213651998
    }, {
      "filename": "/shaders/shaders_glsl3.pack",
      "start": 213651998,
      "end": 213983207
    }, {
      "filename": "/shaders/shaders_glsles.pack",
      "start": 213983207,
      "end": 214203889
    }, {
      "filename": "/shaders/shaders_glsles3.pack",
      "start": 214203889,
      "end": 214580340
    }, {
      "filename": "/shaders/source/adorn.hlsl",
      "start": 214580340,
      "end": 214587032
    }, {
      "filename": "/shaders/source/aluminum.hlsl",
      "start": 214587032,
      "end": 214587624
    }, {
      "filename": "/shaders/source/brick.hlsl",
      "start": 214587624,
      "end": 214588208
    }, {
      "filename": "/shaders/source/cobblestone.hlsl",
      "start": 214588208,
      "end": 214588720
    }, {
      "filename": "/shaders/source/common.h",
      "start": 214588720,
      "end": 214597091
    }, {
      "filename": "/shaders/source/concrete.hlsl",
      "start": 214597091,
      "end": 214597682
    }, {
      "filename": "/shaders/source/default.hlsl",
      "start": 214597682,
      "end": 214607370
    }, {
      "filename": "/shaders/source/diamondplate.hlsl",
      "start": 214607370,
      "end": 214607926
    }, {
      "filename": "/shaders/source/fabric.hlsl",
      "start": 214607926,
      "end": 214608511
    }, {
      "filename": "/shaders/source/gbuffer.hlsl",
      "start": 214608511,
      "end": 214609302
    }, {
      "filename": "/shaders/source/globals.h",
      "start": 214609302,
      "end": 214610039
    }, {
      "filename": "/shaders/source/granite.hlsl",
      "start": 214610039,
      "end": 214610632
    }, {
      "filename": "/shaders/source/grass.hlsl",
      "start": 214610632,
      "end": 214611220
    }, {
      "filename": "/shaders/source/ice.hlsl",
      "start": 214611220,
      "end": 214611813
    }, {
      "filename": "/shaders/source/marble.hlsl",
      "start": 214611813,
      "end": 214612400
    }, {
      "filename": "/shaders/source/material.hlsl",
      "start": 214612400,
      "end": 214615219
    }, {
      "filename": "/shaders/source/megacluster.hlsl",
      "start": 214615219,
      "end": 214620330
    }, {
      "filename": "/shaders/source/metal.hlsl",
      "start": 214620330,
      "end": 214620890
    }, {
      "filename": "/shaders/source/neon.hlsl",
      "start": 214620890,
      "end": 214620951
    }, {
      "filename": "/shaders/source/particle.hlsl",
      "start": 214620951,
      "end": 214627517
    }, {
      "filename": "/shaders/source/pebble.hlsl",
      "start": 214627517,
      "end": 214628073
    }, {
      "filename": "/shaders/source/plastic.hlsl",
      "start": 214628073,
      "end": 214629251
    }, {
      "filename": "/shaders/source/profiler.hlsl",
      "start": 214629251,
      "end": 214630010
    }, {
      "filename": "/shaders/source/rust.hlsl",
      "start": 214630010,
      "end": 214630598
    }, {
      "filename": "/shaders/source/sand.hlsl",
      "start": 214630598,
      "end": 214631150
    }, {
      "filename": "/shaders/source/screenspace.hlsl",
      "start": 214631150,
      "end": 214635928
    }, {
      "filename": "/shaders/source/shadow.hlsl",
      "start": 214635928,
      "end": 214636995
    }, {
      "filename": "/shaders/source/sky.hlsl",
      "start": 214636995,
      "end": 214638140
    }, {
      "filename": "/shaders/source/slate.hlsl",
      "start": 214638140,
      "end": 214638702
    }, {
      "filename": "/shaders/source/smoothcluster.hlsl",
      "start": 214638702,
      "end": 214643766
    }, {
      "filename": "/shaders/source/smoothplastic.hlsl",
      "start": 214643766,
      "end": 214643810
    }, {
      "filename": "/shaders/source/smoothwater.hlsl",
      "start": 214643810,
      "end": 214652546
    }, {
      "filename": "/shaders/source/ssao.hlsl",
      "start": 214652546,
      "end": 214661726
    }, {
      "filename": "/shaders/source/texcomp.hlsl",
      "start": 214661726,
      "end": 214662461
    }, {
      "filename": "/shaders/source/ui.hlsl",
      "start": 214662461,
      "end": 214663622
    }, {
      "filename": "/shaders/source/water.hlsl",
      "start": 214663622,
      "end": 214669015
    }, {
      "filename": "/shaders/source/wood.hlsl",
      "start": 214669015,
      "end": 214669571
    }, {
      "filename": "/shaders/source/woodplanks.hlsl",
      "start": 214669571,
      "end": 214670154
    } ],
    "remote_package_size": 214670154
  });
})();

// end include: /tmp/tmpgrjaso1g.js
// include: /tmp/tmpha45l1zt.js
// All the pre-js content up to here must remain later on, we need to run
// it.
if ((typeof ENVIRONMENT_IS_WASM_WORKER != "undefined" && ENVIRONMENT_IS_WASM_WORKER) || (typeof ENVIRONMENT_IS_PTHREAD != "undefined" && ENVIRONMENT_IS_PTHREAD) || (typeof ENVIRONMENT_IS_AUDIO_WORKLET != "undefined" && ENVIRONMENT_IS_AUDIO_WORKLET)) Module["preRun"] = [];

var necessaryPreJSTasks = Module["preRun"].slice();

// end include: /tmp/tmpha45l1zt.js
// include: /tmp/tmpi_zxgi0f.js
if (!Module["preRun"]) throw "Module.preRun should exist because file support used it; did a pre-js delete it?";

necessaryPreJSTasks.forEach(task => {
  if (Module["preRun"].indexOf(task) < 0) throw "All preRun tasks that exist before user pre-js code should remain after; did you replace Module or modify Module.preRun?";
});

// end include: /tmp/tmpi_zxgi0f.js
var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

// In MODULARIZE mode _scriptName needs to be captured already at the very top of the page immediately when the page is parsed, so it is generated there
// before the page load. In non-MODULARIZE modes generate it here.
var _scriptName = globalThis.document?.currentScript?.src;

if (typeof __filename != "undefined") {
  // Node
  _scriptName = __filename;
} else if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  const isNode = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
  if (!isNode) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require("node:fs");
  scriptDirectory = __dirname + "/";
  // include: node_shell_read.js
  readBinary = filename => {
    // We need to re-wrap `file://` strings to URLs.
    filename = isFileURI(filename) ? new URL(filename) : filename;
    var ret = fs.readFileSync(filename);
    assert(Buffer.isBuffer(ret));
    return ret;
  };
  readAsync = async (filename, binary = true) => {
    // See the comment in the `readBinary` function.
    filename = isFileURI(filename) ? new URL(filename) : filename;
    var ret = fs.readFileSync(filename, binary ? undefined : "utf8");
    assert(binary ? Buffer.isBuffer(ret) : typeof ret == "string");
    return ret;
  };
  // end include: node_shell_read.js
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  // MODULARIZE will export the module in the proper place outside, we don't need to export here
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
} else if (ENVIRONMENT_IS_SHELL) {} else // Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL(".", _scriptName).href;
  } catch {}
  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  if (!ENVIRONMENT_IS_NODE) {
    // include: web_or_worker_shell_read.js
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = async url => {
      // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
      // See https://github.com/github/fetch/pull/92#issuecomment-140665932
      // Cordova or Electron apps are typically loaded from a file:// url.
      // So use XHR on webview if URL is a file URL.
      if (isFileURI(url)) {
        return new Promise((resolve, reject) => {
          var xhr = new XMLHttpRequest;
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = () => {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
              // file URLs can return 0
              resolve(xhr.response);
              return;
            }
            reject(xhr.status);
          };
          xhr.onerror = reject;
          xhr.send(null);
        });
      }
      var response = await fetch(url, {
        credentials: "same-origin"
      });
      if (response.ok) {
        return response.arrayBuffer();
      }
      throw new Error(response.status + " : " + response.url);
    };
  }
} else {
  throw new Error("environment detection error");
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// Normally just binding console.log/console.error here works fine, but
// under node (with workers) we see missing/out-of-order messages so route
// directly to stdout and stderr.
// See https://github.com/emscripten-core/emscripten/issues/14804
var defaultPrint = console.log.bind(console);

var defaultPrintErr = console.error.bind(console);

if (ENVIRONMENT_IS_NODE) {
  var utils = require("node:util");
  var stringify = a => typeof a == "object" ? utils.inspect(a) : a;
  defaultPrint = (...args) => fs.writeSync(1, args.map(stringify).join(" ") + "\n");
  defaultPrintErr = (...args) => fs.writeSync(2, args.map(stringify).join(" ") + "\n");
}

var out = defaultPrint;

var err = defaultPrintErr;

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";

var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";

var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";

var OPFS = "OPFS is no longer included by default; build with -lopfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message
assert(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_NODE, "Pthreads do not work in this environment yet (need Web Workers, or an alternative to them)");

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");

// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary;

if (!globalThis.WebAssembly) {
  err("no native wasm support detected");
}

// Wasm globals
// For sending to workers.
var wasmModule;

//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

// include: runtime_common.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  (growMemViews(), HEAPU32)[((max) >> 2)] = 34821223;
  (growMemViews(), HEAPU32)[(((max) + (4)) >> 2)] = 2310721022;
  // Also test the global address 0 for integrity.
  (growMemViews(), HEAPU32)[((0) >> 2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = (growMemViews(), HEAPU32)[((max) >> 2)];
  var cookie2 = (growMemViews(), HEAPU32)[(((max) + (4)) >> 2)];
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if ((growMemViews(), HEAPU32)[((0) >> 2)] != 1668509029) {
    abort("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}

// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH extends Error {}

class EmscriptenSjLj extends EmscriptenEH {}

class CppException extends EmscriptenEH {
  constructor(excPtr) {
    super(excPtr);
    this.excPtr = excPtr;
    const excInfo = getExceptionMessage(excPtr);
    this.name = excInfo[0];
    this.message = excInfo[1];
  }
}

// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true;

// Switch to false at runtime to disable logging at the right times
// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug != "undefined") return;
  // Avoid using the console for debugging in multi-threaded node applications
  // See https://github.com/emscripten-core/emscripten/issues/14804
  if (ENVIRONMENT_IS_NODE) {
    // TODO(sbc): Unify with err/out implementation in shell.sh.
    var fs = require("node:fs");
    var utils = require("node:util");
    function stringify(a) {
      switch (typeof a) {
       case "object":
        return utils.inspect(a);

       case "undefined":
        return "undefined";
      }
      return a;
    }
    fs.writeSync(2, args.map(stringify).join(" ") + "\n");
  } else // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) abort("Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)");
})();

function consumedModuleProp(prop) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      set() {
        abort(`Attempt to set \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`);
      }
    });
  }
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_preloadFile" || name === "FS_unlink" || name === "addRunDependency" || // The old FS has some functionality that WasmFS lacks.
  name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

/**
 * Intercept access to a symbols in the global symbol.  This enables us to give
 * informative warnings/errors when folks attempt to use symbols they did not
 * include in their build, or no symbols that no longer exist.
 *
 * We don't define this in MODULARIZE mode since in that mode emscripten symbols
 * are never placed in the global scope.
 */ function hookGlobalSymbolAccess(sym, func) {
  if (!Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}

function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce(`\`${sym}\` is no longer defined by emscripten. ${msg}`);
  });
}

missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");

missingGlobal("asm", "Please use wasmExports instead");

function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    var librarySymbol = sym;
    if (!librarySymbol.startsWith("_")) {
      librarySymbol = "$" + sym;
    }
    msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
    if (isExportedByForceFilesystem(sym)) {
      msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    warnOnce(msg);
  });
  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (ENVIRONMENT_IS_PTHREAD) {
    return;
  }
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      }
    });
  }
}

/**
 * Override `err`/`out`/`dbg` to report thread / worker information
 */ function initWorkerLogging() {
  function getLogPrefix() {
    var t = 0;
    if (runtimeInitialized && typeof _pthread_self != "undefined") {
      t = _pthread_self();
    }
    return `w:${workerID},t:${ptrToString(t)}:`;
  }
  // Prefix all dbg() messages with the calling thread info.
  var origDbg = dbg;
  dbg = (...args) => origDbg(getLogPrefix(), ...args);
}

initWorkerLogging();

// end include: runtime_debug.js
// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function growMemViews() {
  // `updateMemoryViews` updates all the views simultaneously, so it's enough to check any of them.
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
}

if (ENVIRONMENT_IS_NODE && (ENVIRONMENT_IS_PTHREAD)) {
  // Create as web-worker-like an environment as we can.
  globalThis.self = globalThis;
  var parentPort = worker_threads.parentPort;
  // Deno and Bun already have `postMessage` defined on the global scope and
  // deliver messages to `globalThis.onmessage`, so we must not duplicate that
  // behavior here if `postMessage` is already present.
  if (!globalThis.postMessage) {
    parentPort.on("message", msg => globalThis.onmessage?.({
      data: msg
    }));
    globalThis.postMessage = msg => parentPort.postMessage(msg);
  }
  // Node.js Workers do not pass postMessage()s and uncaught exception events to the parent
  // thread necessarily in the same order where they were generated in sequential program order.
  // See https://github.com/nodejs/node/issues/59617
  // To remedy this, capture all uncaughtExceptions in the Worker, and sequentialize those over
  // to the same postMessage pipe that other messages use.
  process.on("uncaughtException", err => {
    postMessage({
      cmd: "uncaughtException",
      error: err
    });
    // Also shut down the Worker to match the same semantics as if this uncaughtException
    // handler was not registered.
    // (n.b. this will not shut down the whole Node.js app process, but just the Worker)
    process.exit(1);
  });
}

// include: runtime_pthread.js
// Pthread Web Worker handling code.
// This code runs only on pthread web workers and handles pthread setup
// and communication with the main thread via postMessage.
// Unique ID of the current pthread worker (zero on non-pthread-workers
// including the main thread).
var workerID = 0;

var startWorker;

if (ENVIRONMENT_IS_PTHREAD) {
  // Thread-local guard variable for one-time init of the JS state
  var initializedJS = false;
  // Turn unhandled rejected promises into errors so that the main thread will be
  // notified about them.
  self.onunhandledrejection = e => {
    throw e.reason || e;
  };
  function handleMessage(e) {
    try {
      var msgData = e["data"];
      //dbg('msgData: ' + Object.keys(msgData));
      var cmd = msgData.cmd;
      if (cmd === "load") {
        // Preload command that is called once per worker to parse and load the Emscripten code.
        workerID = msgData.workerID;
        // Until we initialize the runtime, queue up any further incoming messages.
        let messageQueue = [];
        self.onmessage = e => messageQueue.push(e);
        // And add a callback for when the runtime is initialized.
        startWorker = () => {
          // Notify the main thread that this thread has loaded.
          postMessage({
            cmd: "loaded"
          });
          // Process any messages that were queued before the thread was ready.
          for (let msg of messageQueue) {
            handleMessage(msg);
          }
          // Restore the real message handler.
          self.onmessage = handleMessage;
        };
        // Use `const` here to ensure that the variable is scoped only to
        // that iteration, allowing safe reference from a closure.
        for (const handler of msgData.handlers) {
          // If the main module has a handler for a certain event, but no
          // handler exists on the pthread worker, then proxy that handler
          // back to the main thread.
          if (!Module[handler] || Module[handler].proxy) {
            Module[handler] = (...args) => {
              postMessage({
                cmd: "callHandler",
                handler,
                args
              });
            };
            // Rebind the out / err handlers if needed
            if (handler == "print") out = Module[handler];
            if (handler == "printErr") err = Module[handler];
          }
        }
        wasmMemory = msgData.wasmMemory;
        updateMemoryViews();
        wasmModule = msgData.wasmModule;
        createWasm();
        run();
      } else if (cmd === "run") {
        assert(msgData.pthread_ptr);
        // Call inside JS module to set up the stack frame for this pthread in JS module scope.
        // This needs to be the first thing that we do, as we cannot call to any C/C++ functions
        // until the thread stack is initialized.
        establishStackSpace(msgData.pthread_ptr);
        // Pass the thread address to wasm to store it for fast access.
        __emscripten_thread_init(msgData.pthread_ptr, /*is_main=*/ 0, /*is_runtime=*/ 0, /*can_block=*/ 1, 0, 0);
        PThread.threadInitTLS();
        // Await mailbox notifications with `Atomics.waitAsync` so we can start
        // using the fast `Atomics.notify` notification path.
        __emscripten_thread_mailbox_await(msgData.pthread_ptr);
        if (!initializedJS) {
          // Embind must initialize itself on all threads, as it generates support JS.
          // We only do this once per worker since they get reused
          __embind_initialize_bindings();
          initializedJS = true;
        }
        try {
          invokeEntryPoint(msgData.start_routine, msgData.arg);
        } catch (ex) {
          if (ex != "unwind") {
            // The pthread "crashed".  Do not call `_emscripten_thread_exit` (which
            // would make this thread joinable).  Instead, re-throw the exception
            // and let the top level handler propagate it back to the main thread.
            throw ex;
          }
        }
      } else if (msgData.target === "setimmediate") {} else if (cmd === "checkMailbox") {
        if (initializedJS) {
          checkMailbox();
        }
      } else if (cmd) {
        // The received message looks like something that should be handled by this message
        // handler, (since there is a cmd field present), but is not one of the
        // recognized commands:
        err(`worker: received unknown command ${cmd}`);
        err(msgData);
      }
    } catch (ex) {
      err(`worker: onmessage() captured an uncaught exception: ${ex}`);
      if (ex?.stack) err(ex.stack);
      __emscripten_thread_crashed();
      throw ex;
    }
  }
  self.onmessage = handleMessage;
}

// ENVIRONMENT_IS_PTHREAD
// end include: runtime_pthread.js
// Memory management
var runtimeInitialized = false;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// In non-standalone/normal mode, we create the memory here.
// include: runtime_init_memory.js
// Create the wasm memory. (Note: this only applies if IMPORTED_MEMORY is defined)
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
function initMemory() {
  if ((ENVIRONMENT_IS_PTHREAD)) {
    return;
  }
  if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"];
  } else {
    var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 536870912;
    assert(INITIAL_MEMORY >= 1048576, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 1048576 + ")");
    /** @suppress {checkTypes} */ wasmMemory = new WebAssembly.Memory({
      "initial": INITIAL_MEMORY / 65536,
      // In theory we should not need to emit the maximum if we want "unlimited"
      // or 4GB of memory, but VMs error on that atm, see
      // https://github.com/emscripten-core/emscripten/issues/14130
      // And in the pthreads case we definitely need to emit a maximum. So
      // always emit one.
      "maximum": 32768,
      "shared": true
    });
  }
  updateMemoryViews();
}

// end include: runtime_init_memory.js
// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set, "JS engine does not provide full typed array support");

function preRun() {
  assert(!ENVIRONMENT_IS_PTHREAD);
  // PThreads reuse the runtime from the main thread.
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  consumedModuleProp("preRun");
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  if (ENVIRONMENT_IS_PTHREAD) return startWorker();
  checkStackCookie();
  // Begin ATINITS hooks
  SOCKFS.root = FS.mount(SOCKFS, {}, null);
  if (!Module["noFSInit"] && !FS.initialized) FS.init();
  TTY.init();
  // End ATINITS hooks
  wasmExports["__wasm_call_ctors"]();
  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
}

function preMain() {
  checkStackCookie();
}

function postRun() {
  checkStackCookie();
  if ((ENVIRONMENT_IS_PTHREAD)) {
    return;
  }
  // PThreads reuse the runtime from the main thread.
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  consumedModuleProp("postRun");
  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
}

/** @param {string|number=} what */ function abort(what) {
  Module["onAbort"]?.(what);
  what = "Aborted(" + what + ")";
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  if (what.search(/RuntimeError: [Uu]nreachable/) >= 0) {
    what += '. "unreachable" may be due to ASYNCIFY_STACK_SIZE not being large enough (try increasing it)';
  }
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile("UniversalClient.wasm");
}

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw "both async and sync fetching of the wasm failed";
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {}
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
    try {
      var response = fetch(binaryFile, {
        credentials: "same-origin"
      });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  assignWasmImports();
  // instrumenting imports is used in asyncify in two ways: to add assertions
  // that check for proper import use, and for JSPI we use them to set up
  // the Promise API on the import side.
  // In pthreads builds getWasmImports is called more than once but we only
  // and the instrument the imports once.
  if (!wasmImports.__instrumented) {
    wasmImports.__instrumented = true;
    Asyncify.instrumentWasmImports(wasmImports);
  }
  // prepare imports
  var imports = {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    wasmExports = Asyncify.instrumentWasmExports(wasmExports);
    registerTLSInit(wasmExports["_emscripten_tls_init"]);
    assignWasmExports(wasmExports);
    // We now have the Wasm module loaded up, keep a reference to the compiled module so we can post it to the workers.
    wasmModule = module;
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  addRunDependency("wasm-instantiate");
  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    return receiveInstance(result["instance"], result["module"]);
  }
  var info = getWasmImports();
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module["instantiateWasm"]) {
    return new Promise((resolve, reject) => {
      try {
        Module["instantiateWasm"](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      } catch (e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        reject(e);
      }
    });
  }
  if ((ENVIRONMENT_IS_PTHREAD)) {
    // Instantiate from the module that was received via postMessage from
    // the main thread. We can just use sync instantiation in the worker.
    assert(wasmModule, "wasmModule should have been received via postMessage");
    var instance = new WebAssembly.Instance(wasmModule, getWasmImports());
    return receiveInstance(instance, wasmModule);
  }
  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js
// Begin JS library code
class ExitStatus {
  name="ExitStatus";
  constructor(status) {
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
  }
}

/** @type {!Int16Array} */ var HEAP16;

/** @type {!Int32Array} */ var HEAP32;

/** not-@type {!BigInt64Array} */ var HEAP64;

/** @type {!Int8Array} */ var HEAP8;

/** @type {!Float32Array} */ var HEAPF32;

/** @type {!Float64Array} */ var HEAPF64;

/** @type {!Uint16Array} */ var HEAPU16;

/** @type {!Uint32Array} */ var HEAPU32;

/** not-@type {!BigUint64Array} */ var HEAPU64;

/** @type {!Uint8Array} */ var HEAPU8;

var terminateWorker = worker => {
  worker.terminate();
  // terminate() can be asynchronous, so in theory the worker can continue
  // to run for some amount of time after termination.  However from our POV
  // the worker is now dead and we don't want to hear from it again, so we stub
  // out its message handler here.  This avoids having to check in each of
  // the onmessage handlers if the message was coming from a valid worker.
  worker.onmessage = e => {
    var cmd = e["data"].cmd;
    err(`received "${cmd}" command from terminated worker: ${worker.workerID}`);
  };
};

var cleanupThread = pthread_ptr => {
  assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! cleanupThread() can only ever be called from main application thread!");
  assert(pthread_ptr, "Internal Error! Null pthread_ptr in cleanupThread!");
  var worker = PThread.pthreads[pthread_ptr];
  assert(worker);
  PThread.returnWorkerToPool(worker);
};

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
    callbacks.shift()(Module);
  }
};

var onPreRuns = [];

var addOnPreRun = cb => onPreRuns.push(cb);

var runDependencies = 0;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

var runDependencyWatcher = null;

var removeRunDependency = id => {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  assert(id, "removeRunDependency requires an ID");
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
};

var addRunDependency = id => {
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
  assert(id, "addRunDependency requires an ID");
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && globalThis.setInterval) {
    // Check for missing dependencies every few seconds
    runDependencyWatcher = setInterval(() => {
      if (ABORT) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null;
        return;
      }
      var shown = false;
      for (var dep in runDependencyTracking) {
        if (!shown) {
          shown = true;
          err("still waiting on run dependencies:");
        }
        err(`dependency: ${dep}`);
      }
      if (shown) {
        err("(end of list)");
      }
    }, 1e4);
    // Prevent this timer from keeping the runtime alive if nothing
    // else is.
    runDependencyWatcher.unref?.();
  }
};

var spawnThread = threadParams => {
  assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! spawnThread() can only ever be called from main application thread!");
  assert(threadParams.pthread_ptr, "Internal error, no pthread ptr!");
  var worker = PThread.getNewWorker();
  if (!worker) {
    // No available workers in the PThread pool.
    return 6;
  }
  assert(!worker.pthread_ptr, "Internal error!");
  PThread.runningWorkers.push(worker);
  // Add to pthreads map
  PThread.pthreads[threadParams.pthread_ptr] = worker;
  worker.pthread_ptr = threadParams.pthread_ptr;
  var msg = {
    cmd: "run",
    start_routine: threadParams.startRoutine,
    arg: threadParams.arg,
    pthread_ptr: threadParams.pthread_ptr
  };
  if (ENVIRONMENT_IS_NODE) {
    // Mark worker as weakly referenced once we start executing a pthread,
    // so that its existence does not prevent Node.js from exiting.  This
    // has no effect if the worker is already weakly referenced (e.g. if
    // this worker was previously idle/unused).
    worker.unref();
  }
  // Ask the worker to start executing its pthread entry point function.
  worker.postMessage(msg, threadParams.transferList);
  return 0;
};

var runtimeKeepaliveCounter = 0;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var stackSave = () => _emscripten_stack_get_current();

var stackRestore = val => __emscripten_stack_restore(val);

var stackAlloc = sz => __emscripten_stack_alloc(sz);

/** @type{function(number, (number|boolean), ...number)} */ var proxyToMainThread = (funcIndex, emAsmAddr, proxyMode, ...callArgs) => {
  // EM_ASM proxying is done by passing a pointer to the address of the EM_ASM
  // content as `emAsmAddr`.  JS library proxying is done by passing an index
  // into `proxiedJSCallArgs` as `funcIndex`. If `emAsmAddr` is non-zero then
  // `funcIndex` will be ignored.
  // Additional arguments are passed after the first three are the actual
  // function arguments.
  // The serialization buffer contains the number of call params, and then
  // all the args here.
  // We also pass 'proxyMode' to C separately, since C needs to look at it.
  // Allocate a buffer (on the stack), which will be copied if necessary by
  // the C code.
  // First passed parameter specifies the number of arguments to the function.
  // When BigInt support is enabled, we must handle types in a more complex
  // way, detecting at runtime if a value is a BigInt or not (as we have no
  // type info here). To do that, add a "prefix" before each value that
  // indicates if it is a BigInt, which effectively doubles the number of
  // values we serialize for proxying. TODO: pack this?
  var bufSize = 8 * callArgs.length * 2;
  var sp = stackSave();
  var args = stackAlloc(bufSize);
  var b = ((args) >> 3);
  for (var arg of callArgs) {
    if (typeof arg == "bigint") {
      // The prefix is non-zero to indicate a bigint.
      (growMemViews(), HEAP64)[b++] = 1n;
      (growMemViews(), HEAP64)[b++] = arg;
    } else {
      // The prefix is zero to indicate a JS Number.
      (growMemViews(), HEAP64)[b++] = 0n;
      (growMemViews(), HEAPF64)[b++] = arg;
    }
  }
  var rtn = __emscripten_run_js_on_main_thread(funcIndex, emAsmAddr, bufSize, args, proxyMode);
  stackRestore(sp);
  return rtn;
};

function _proc_exit(code) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 1, code);
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    PThread.terminateAllThreads();
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}

function exitOnMainThread(returnCode) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 0, returnCode);
  _exit(returnCode);
}

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  if (ENVIRONMENT_IS_PTHREAD) {
    // implicit exit can never happen on a pthread
    assert(!implicit);
    // When running in a pthread we propagate the exit back to the main thread
    // where it can decide if the whole process should be shut down or not.
    // The pthread may have decided not to exit its own runtime, for example
    // because it runs a main loop, but that doesn't affect the main thread.
    exitOnMainThread(status);
    throw "unwind";
  }
  // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    err(msg);
  }
  _proc_exit(status);
};

var _exit = exitJS;

function ptrToString(ptr) {
  assert(typeof ptr === "number", `ptrToString expects a number, got ${typeof ptr}`);
  // Convert to 32-bit unsigned value
  ptr >>>= 0;
  return "0x" + ptr.toString(16).padStart(8, "0");
}

var PThread = {
  unusedWorkers: [],
  runningWorkers: [],
  tlsInitFunctions: [],
  pthreads: {},
  nextWorkerID: 1,
  init() {
    if ((!(ENVIRONMENT_IS_PTHREAD))) {
      PThread.initMainThread();
    }
  },
  initMainThread() {
    var pthreadPoolSize = 100;
    // Start loading up the Worker pool, if requested.
    while (pthreadPoolSize--) {
      PThread.allocateUnusedWorker();
    }
    // MINIMAL_RUNTIME takes care of calling loadWasmModuleToAllWorkers
    // in postamble_minimal.js
    addOnPreRun(async () => {
      var pthreadPoolReady = PThread.loadWasmModuleToAllWorkers();
      addRunDependency("loading-workers");
      await pthreadPoolReady;
      removeRunDependency("loading-workers");
    });
  },
  terminateAllThreads: () => {
    assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! terminateAllThreads() can only ever be called from main application thread!");
    // Attempt to kill all workers.  Sadly (at least on the web) there is no
    // way to terminate a worker synchronously, or to be notified when a
    // worker is actually terminated.  This means there is some risk that
    // pthreads will continue to be executing after `worker.terminate` has
    // returned.  For this reason, we don't call `returnWorkerToPool` here or
    // free the underlying pthread data structures.
    for (var worker of PThread.runningWorkers) {
      terminateWorker(worker);
    }
    for (var worker of PThread.unusedWorkers) {
      terminateWorker(worker);
    }
    PThread.unusedWorkers = [];
    PThread.runningWorkers = [];
    PThread.pthreads = {};
  },
  returnWorkerToPool: worker => {
    // We don't want to run main thread queued calls here, since we are doing
    // some operations that leave the worker queue in an invalid state until
    // we are completely done (it would be bad if free() ends up calling a
    // queued pthread_create which looks at the global data structures we are
    // modifying). To achieve that, defer the free() until the very end, when
    // we are all done.
    var pthread_ptr = worker.pthread_ptr;
    delete PThread.pthreads[pthread_ptr];
    // Note: worker is intentionally not terminated so the pool can
    // dynamically grow.
    PThread.unusedWorkers.push(worker);
    PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
    // Not a running Worker anymore
    // Detach the worker from the pthread object, and return it to the
    // worker pool as an unused worker.
    worker.pthread_ptr = 0;
    // Finally, free the underlying (and now-unused) pthread structure in
    // linear memory.
    __emscripten_thread_free_data(pthread_ptr);
  },
  threadInitTLS() {
    // Call thread init functions (these are the _emscripten_tls_init for each
    // module loaded.
    PThread.tlsInitFunctions.forEach(f => f());
  },
  loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
    worker.onmessage = e => {
      var d = e["data"];
      var cmd = d.cmd;
      // If this message is intended to a recipient that is not the main
      // thread, forward it to the target thread.
      if (d.targetThread && d.targetThread != _pthread_self()) {
        var targetWorker = PThread.pthreads[d.targetThread];
        if (targetWorker) {
          targetWorker.postMessage(d, d.transferList);
        } else {
          err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d.targetThread}, but that thread no longer exists!`);
        }
        return;
      }
      if (cmd === "checkMailbox") {
        checkMailbox();
      } else if (cmd === "spawnThread") {
        spawnThread(d);
      } else if (cmd === "cleanupThread") {
        // cleanupThread needs to be run via callUserCallback since it calls
        // back into user code to free thread data. Without this it's possible
        // the unwind or ExitStatus exception could escape here.
        callUserCallback(() => cleanupThread(d.thread));
      } else if (cmd === "loaded") {
        worker.loaded = true;
        // Check that this worker doesn't have an associated pthread.
        if (ENVIRONMENT_IS_NODE && !worker.pthread_ptr) {
          // Once worker is loaded & idle, mark it as weakly referenced,
          // so that mere existence of a Worker in the pool does not prevent
          // Node.js from exiting the app.
          worker.unref();
        }
        onFinishedLoading(worker);
      } else if (d.target === "setimmediate") {
        // Worker wants to postMessage() to itself to implement setImmediate()
        // emulation.
        worker.postMessage(d);
      } else if (cmd === "uncaughtException") {
        // Message handler for Node.js specific out-of-order behavior:
        // https://github.com/nodejs/node/issues/59617
        // A pthread sent an uncaught exception event. Re-raise it on the main thread.
        worker.onerror(d.error);
      } else if (cmd === "callHandler") {
        Module[d.handler](...d.args);
      } else if (cmd) {
        // The received message looks like something that should be handled by this message
        // handler, (since there is a e.data.cmd field present), but is not one of the
        // recognized commands:
        err(`worker sent an unknown command ${cmd}`);
      }
    };
    worker.onerror = e => {
      var message = "worker sent an error!";
      if (worker.pthread_ptr) {
        message = `Pthread ${ptrToString(worker.pthread_ptr)} sent an error!`;
      }
      err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
      throw e;
    };
    if (ENVIRONMENT_IS_NODE) {
      worker.on("message", data => worker.onmessage({
        data
      }));
      worker.on("error", e => worker.onerror(e));
    }
    assert(wasmMemory instanceof WebAssembly.Memory, "WebAssembly memory should have been loaded by now!");
    assert(wasmModule instanceof WebAssembly.Module, "WebAssembly Module should have been loaded by now!");
    // When running on a pthread, none of the incoming parameters on the module
    // object are present. Proxy known handlers back to the main thread if specified.
    var handlers = [];
    var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
    for (var handler of knownHandlers) {
      if (Module.propertyIsEnumerable(handler)) {
        handlers.push(handler);
      }
    }
    // Ask the new worker to load up the Emscripten-compiled page. This is a heavy operation.
    worker.postMessage({
      cmd: "load",
      handlers,
      wasmMemory,
      wasmModule,
      "workerID": worker.workerID
    });
  }),
  async loadWasmModuleToAllWorkers() {
    // Instantiation is synchronous in pthreads.
    if (ENVIRONMENT_IS_PTHREAD) {
      return;
    }
    let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
    return pthreadPoolReady;
  },
  allocateUnusedWorker() {
    var worker;
    var pthreadMainJs = _scriptName;
    // We can't use makeModuleReceiveWithVar here since we want to also
    // call URL.createObjectURL on the mainScriptUrlOrBlob.
    if (Module["mainScriptUrlOrBlob"]) {
      pthreadMainJs = Module["mainScriptUrlOrBlob"];
      if (typeof pthreadMainJs != "string") {
        pthreadMainJs = URL.createObjectURL(pthreadMainJs);
      }
    }
    worker = new Worker(pthreadMainJs, {
      // This is the way that we signal to the node worker that it is hosting
      // a pthread.
      "workerData": "em-pthread",
      // This is the way that we signal to the Web Worker that it is hosting
      // a pthread.
      "name": "em-pthread-" + PThread.nextWorkerID
    });
    worker.workerID = PThread.nextWorkerID++;
    PThread.unusedWorkers.push(worker);
  },
  getNewWorker() {
    if (PThread.unusedWorkers.length == 0) {
      // PTHREAD_POOL_SIZE_STRICT should show a warning and, if set to level `2`, return from the function.
      PThread.allocateUnusedWorker();
      PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
    }
    return PThread.unusedWorkers.pop();
  }
};

var onPostRuns = [];

var addOnPostRun = cb => onPostRuns.push(cb);

var dynCalls = {};

var dynCallLegacy = (sig, ptr, args) => {
  sig = sig.replace(/p/g, "i");
  assert(sig in dynCalls, `bad function pointer type - sig is not in dynCalls: '${sig}'`);
  if (args?.length) {
    // j (64-bit integer) is fine, and is implemented as a BigInt. Without
    // legalization, the number of parameters should match (j is not expanded
    // into two i's).
    assert(args.length === sig.length - 1);
  } else {
    assert(sig.length == 1);
  }
  var f = dynCalls[sig];
  return f(ptr, ...args);
};

var dynCall = (sig, ptr, args = [], promising = false) => {
  assert(ptr, `null function pointer in dynCall`);
  assert(!promising, "async dynCall is not supported in this mode");
  var rtn = dynCallLegacy(sig, ptr, args);
  function convert(rtn) {
    return rtn;
  }
  return convert(rtn);
};

function establishStackSpace(pthread_ptr) {
  var stackHigh = (growMemViews(), HEAPU32)[(((pthread_ptr) + (48)) >> 2)];
  var stackSize = (growMemViews(), HEAPU32)[(((pthread_ptr) + (52)) >> 2)];
  var stackLow = stackHigh - stackSize;
  assert(stackHigh != 0);
  assert(stackLow != 0);
  assert(stackHigh > stackLow, "stackHigh must be higher then stackLow");
  // Set stack limits used by `emscripten/stack.h` function.  These limits are
  // cached in wasm-side globals to make checks as fast as possible.
  _emscripten_stack_set_limits(stackHigh, stackLow);
  // Call inside wasm module to set up the stack frame for this pthread in wasm module scope
  stackRestore(stackHigh);
  // Write the stack cookie last, after we have set up the proper bounds and
  // current position of the stack.
  writeStackCookie();
}

/**
   * @param {number} ptr
   * @param {string} type
   */ function getValue(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    return (growMemViews(), HEAP8)[ptr];

   case "i8":
    return (growMemViews(), HEAP8)[ptr];

   case "i16":
    return (growMemViews(), HEAP16)[((ptr) >> 1)];

   case "i32":
    return (growMemViews(), HEAP32)[((ptr) >> 2)];

   case "i64":
    return (growMemViews(), HEAP64)[((ptr) >> 3)];

   case "float":
    return (growMemViews(), HEAPF32)[((ptr) >> 2)];

   case "double":
    return (growMemViews(), HEAPF64)[((ptr) >> 3)];

   case "*":
    return (growMemViews(), HEAPU32)[((ptr) >> 2)];

   default:
    abort(`invalid type for getValue: ${type}`);
  }
}

var invokeEntryPoint = (ptr, arg) => {
  // An old thread on this worker may have been canceled without returning the
  // `runtimeKeepaliveCounter` to zero. Reset it now so the new thread won't
  // be affected.
  runtimeKeepaliveCounter = 0;
  // Same for noExitRuntime.  The default for pthreads should always be false
  // otherwise pthreads would never complete and attempts to pthread_join to
  // them would block forever.
  // pthreads can still choose to set `noExitRuntime` explicitly, or
  // call emscripten_unwind_to_js_event_loop to extend their lifetime beyond
  // their main function.  See comment in src/runtime_pthread.js for more.
  noExitRuntime = 0;
  // pthread entry points are always of signature 'void *ThreadMain(void *arg)'
  // Native codebases sometimes spawn threads with other thread entry point
  // signatures, such as void ThreadMain(void *arg), void *ThreadMain(), or
  // void ThreadMain().  That is not acceptable per C/C++ specification, but
  // x86 compiler ABI extensions enable that to work. If you find the
  // following line to crash, either change the signature to "proper" void
  // *ThreadMain(void *arg) form, or try linking with the Emscripten linker
  // flag -sEMULATE_FUNCTION_POINTER_CASTS to add in emulation for this x86
  // ABI extension.
  var result = (a1 => dynCall_ii(ptr, a1))(arg);
  checkStackCookie();
  function finish(result) {
    // In MINIMAL_RUNTIME the noExitRuntime concept does not apply to
    // pthreads. To exit a pthread with live runtime, use the function
    // emscripten_unwind_to_js_event_loop() in the pthread body.
    if (keepRuntimeAlive()) {
      EXITSTATUS = result;
      return;
    }
    __emscripten_thread_exit(result);
  }
  finish(result);
};

var noExitRuntime = true;

var registerTLSInit = tlsInitFunc => PThread.tlsInitFunctions.push(tlsInitFunc);

/**
   * @param {number} ptr
   * @param {number} value
   * @param {string} type
   */ function setValue(ptr, value, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    (growMemViews(), HEAP8)[ptr] = value;
    break;

   case "i8":
    (growMemViews(), HEAP8)[ptr] = value;
    break;

   case "i16":
    (growMemViews(), HEAP16)[((ptr) >> 1)] = value;
    break;

   case "i32":
    (growMemViews(), HEAP32)[((ptr) >> 2)] = value;
    break;

   case "i64":
    (growMemViews(), HEAP64)[((ptr) >> 3)] = BigInt(value);
    break;

   case "float":
    (growMemViews(), HEAPF32)[((ptr) >> 2)] = value;
    break;

   case "double":
    (growMemViews(), HEAPF64)[((ptr) >> 3)] = value;
    break;

   case "*":
    (growMemViews(), HEAPU32)[((ptr) >> 2)] = value;
    break;

   default:
    abort(`invalid type for setValue: ${type}`);
  }
}

var warnOnce = text => {
  warnOnce.shown ||= {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
    err(text);
  }
};

var wasmMemory;

var UTF8Decoder = globalThis.TextDecoder && new TextDecoder;

var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
  var maxIdx = idx + maxBytesToRead;
  if (ignoreNul) return maxIdx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.
  // As a tiny code save trick, compare idx against maxIdx using a negation,
  // so that maxBytesToRead=undefined/NaN means Infinity.
  while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
  return idx;
};

/**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer ? heapOrArray.subarray(idx, endPtr) : heapOrArray.slice(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

/**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
  assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
  return ptr ? UTF8ArrayToString((growMemViews(), HEAPU8), ptr, maxBytesToRead, ignoreNul) : "";
};

var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);

var ___call_sighandler = (fp, sig) => (a1 => dynCall_vi(fp, a1))(sig);

var exceptionCaught = [];

var uncaughtExceptionCount = 0;

var ___cxa_begin_catch = ptr => {
  var info = new ExceptionInfo(ptr);
  if (!info.get_caught()) {
    info.set_caught(true);
    uncaughtExceptionCount--;
  }
  info.set_rethrown(false);
  exceptionCaught.push(info);
  return ___cxa_get_exception_ptr(ptr);
};

var exceptionLast = 0;

var ___cxa_end_catch = () => {
  // Clear state flag.
  _setThrew(0, 0);
  assert(exceptionCaught.length > 0);
  // Call destructor if one is registered then clear it.
  var info = exceptionCaught.pop();
  ___cxa_decrement_exception_refcount(info.excPtr);
  exceptionLast = 0;
};

class ExceptionInfo {
  // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
  constructor(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - 24;
  }
  set_type(type) {
    (growMemViews(), HEAPU32)[(((this.ptr) + (4)) >> 2)] = type;
  }
  get_type() {
    return (growMemViews(), HEAPU32)[(((this.ptr) + (4)) >> 2)];
  }
  set_destructor(destructor) {
    (growMemViews(), HEAPU32)[(((this.ptr) + (8)) >> 2)] = destructor;
  }
  get_destructor() {
    return (growMemViews(), HEAPU32)[(((this.ptr) + (8)) >> 2)];
  }
  set_caught(caught) {
    caught = caught ? 1 : 0;
    (growMemViews(), HEAP8)[(this.ptr) + (12)] = caught;
  }
  get_caught() {
    return (growMemViews(), HEAP8)[(this.ptr) + (12)] != 0;
  }
  set_rethrown(rethrown) {
    rethrown = rethrown ? 1 : 0;
    (growMemViews(), HEAP8)[(this.ptr) + (13)] = rethrown;
  }
  get_rethrown() {
    return (growMemViews(), HEAP8)[(this.ptr) + (13)] != 0;
  }
  // Initialize native structure fields. Should be called once after allocated.
  init(type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
  }
  set_adjusted_ptr(adjustedPtr) {
    (growMemViews(), HEAPU32)[(((this.ptr) + (16)) >> 2)] = adjustedPtr;
  }
  get_adjusted_ptr() {
    return (growMemViews(), HEAPU32)[(((this.ptr) + (16)) >> 2)];
  }
}

var setTempRet0 = val => __emscripten_tempret_set(val);

var findMatchingCatch = args => {
  var thrown = exceptionLast?.excPtr;
  if (!thrown) {
    // just pass through the null ptr
    setTempRet0(0);
    return 0;
  }
  var info = new ExceptionInfo(thrown);
  info.set_adjusted_ptr(thrown);
  var thrownType = info.get_type();
  if (!thrownType) {
    // just pass through the thrown ptr
    setTempRet0(0);
    return thrown;
  }
  // can_catch receives a **, add indirection
  // The different catch blocks are denoted by different types.
  // Due to inheritance, those types may not precisely match the
  // type of the thrown object. Find one which matches, and
  // return the type of the catch block which should be called.
  for (var caughtType of args) {
    if (caughtType === 0 || caughtType === thrownType) {
      // Catch all clause matched or exactly the same type is caught
      break;
    }
    var adjusted_ptr_addr = info.ptr + 16;
    if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
      setTempRet0(caughtType);
      return thrown;
    }
  }
  setTempRet0(thrownType);
  return thrown;
};

var ___cxa_find_matching_catch_2 = () => findMatchingCatch([]);

var ___cxa_find_matching_catch_3 = arg0 => findMatchingCatch([ arg0 ]);

var ___cxa_find_matching_catch_4 = (arg0, arg1) => findMatchingCatch([ arg0, arg1 ]);

var ___cxa_find_matching_catch_5 = (arg0, arg1, arg2) => findMatchingCatch([ arg0, arg1, arg2 ]);

var ___cxa_find_matching_catch_6 = (arg0, arg1, arg2, arg3) => findMatchingCatch([ arg0, arg1, arg2, arg3 ]);

var ___cxa_rethrow = () => {
  var info = exceptionCaught.pop();
  if (!info) {
    abort("no exception to throw");
  }
  var ptr = info.excPtr;
  if (!info.get_rethrown()) {
    // Only pop if the corresponding push was through rethrow_primary_exception
    exceptionCaught.push(info);
    info.set_rethrown(true);
    info.set_caught(false);
    uncaughtExceptionCount++;
  }
  ___cxa_increment_exception_refcount(ptr);
  exceptionLast = new CppException(ptr);
  throw exceptionLast;
};

var ___cxa_rethrow_primary_exception = ptr => {
  if (!ptr) return;
  var info = new ExceptionInfo(ptr);
  exceptionCaught.push(info);
  info.set_rethrown(true);
  ___cxa_rethrow();
};

var exnToPtr = exn => {
  if (exn instanceof CppException) {
    return exn.excPtr;
  }
  return exn;
};

var getExceptionMessageCommon = ptr => {
  var sp = stackSave();
  var type_addr_addr = stackAlloc(4);
  var message_addr_addr = stackAlloc(4);
  ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
  var type_addr = (growMemViews(), HEAPU32)[((type_addr_addr) >> 2)];
  var message_addr = (growMemViews(), HEAPU32)[((message_addr_addr) >> 2)];
  var type = UTF8ToString(type_addr);
  _free(type_addr);
  var message;
  if (message_addr) {
    message = UTF8ToString(message_addr);
    _free(message_addr);
  }
  stackRestore(sp);
  return [ type, message ];
};

var getExceptionMessage = exn => getExceptionMessageCommon(exnToPtr(exn));

var decrementExceptionRefcount = exn => ___cxa_decrement_exception_refcount(exnToPtr(exn));

var incrementExceptionRefcount = exn => ___cxa_increment_exception_refcount(exnToPtr(exn));

var ___cxa_throw = (ptr, type, destructor) => {
  var info = new ExceptionInfo(ptr);
  // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
  info.init(type, destructor);
  ___cxa_increment_exception_refcount(ptr);
  exceptionLast = new CppException(ptr);
  uncaughtExceptionCount++;
  throw exceptionLast;
};

var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
  return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

var _emscripten_has_threading_support = () => !!globalThis.SharedArrayBuffer;

var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
  if (!_emscripten_has_threading_support()) {
    dbg("pthread_create: environment does not support SharedArrayBuffer, pthreads are not available");
    return 6;
  }
  // List of JS objects that will transfer ownership to the Worker hosting the thread
  var transferList = [];
  var error = 0;
  // Synchronously proxy the thread creation to main thread if possible. If we
  // need to transfer ownership of objects, then proxy asynchronously via
  // postMessage.
  if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
    return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
  }
  // If on the main thread, and accessing Canvas/OffscreenCanvas failed, abort
  // with the detected error.
  if (error) return error;
  var threadParams = {
    startRoutine,
    pthread_ptr,
    arg,
    transferList
  };
  if (ENVIRONMENT_IS_PTHREAD) {
    // The prepopulated pool of web workers that can host pthreads is stored
    // in the main JS thread. Therefore if a pthread is attempting to spawn a
    // new thread, the thread creation must be deferred to the main JS thread.
    threadParams.cmd = "spawnThread";
    postMessage(threadParams, transferList);
    // When we defer thread creation this way, we have no way to detect thread
    // creation synchronously today, so we have to assume success and return 0.
    return 0;
  }
  // We are the main thread, so we have the pthread warmup pool in this
  // thread and can fire off JS thread creation directly ourselves.
  return spawnThread(threadParams);
};

var ___resumeException = ptr => {
  if (!exceptionLast) {
    exceptionLast = new CppException(ptr);
  }
  throw exceptionLast;
};

var initRandomFill = () => {
  // This block is not needed on v19+ since crypto.getRandomValues is builtin
  if (ENVIRONMENT_IS_NODE) {
    var nodeCrypto = require("node:crypto");
    return view => nodeCrypto.randomFillSync(view);
  }
  // like with most Web APIs, we can't use Web Crypto API directly on shared memory,
  // so we need to create an intermediate buffer and copy it to the destination
  return view => view.set(crypto.getRandomValues(new Uint8Array(view.byteLength)));
};

var randomFill = view => {
  // Lazily init on the first invocation.
  (randomFill = initRandomFill())(view);
};

var PATH = {
  isAbs: path => path.charAt(0) === "/",
  splitPath: filename => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: (parts, allowAboveRoot) => {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (;up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: path => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    // Normalize the path
    path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: path => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      // No dirname whatsoever
      return ".";
    }
    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.slice(0, -1);
    }
    return root + dir;
  },
  basename: path => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join: (...paths) => PATH.normalize(paths.join("/")),
  join2: (l, r) => PATH.normalize(l + "/" + r)
};

var PATH_FS = {
  resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? args[i] : FS.cwd();
      // Skip empty and invalid entries
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
    return ((resolvedAbsolute ? "/" : "") + resolvedPath) || ".";
  },
  relative: (from, to) => {
    from = PATH_FS.resolve(from).slice(1);
    to = PATH_FS.resolve(to).slice(1);
    function trim(arr) {
      var start = 0;
      for (;start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (;end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  }
};

var FS_stdin_getChar_buffer = [];

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i);
    // possibly a lead surrogate
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.codePointAt(i);
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
      // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
      // We need to manually skip over the second code unit for correct iteration.
      i++;
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
};

/** @type {function(string, boolean=, number=)} */ var intArrayFromString = (stringy, dontAddNull, length) => {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
};

var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
      // we will read data by chunks of BUFSIZE
      var BUFSIZE = 256;
      var buf = Buffer.alloc(BUFSIZE);
      var bytesRead = 0;
      // For some reason we must suppress a closure warning here, even though
      // fd definitely exists on process.stdin, and is even the proper way to
      // get the fd of stdin,
      // https://github.com/nodejs/help/issues/2136#issuecomment-523649904
      // This started to happen after moving this logic out of library_tty.js,
      // so it is related to the surrounding code in some unclear manner.
      /** @suppress {missingProperties} */ var fd = process.stdin.fd;
      try {
        bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
      } catch (e) {
        // Cross-platform differences: on Windows, reading EOF throws an
        // exception, but on other OSes, reading EOF returns 0. Uniformize
        // behavior by treating the EOF exception to return 0.
        if (e.toString().includes("EOF")) bytesRead = 0; else throw e;
      }
      if (bytesRead > 0) {
        result = buf.slice(0, bytesRead).toString("utf-8");
      }
    } else if (globalThis.window?.prompt) {
      // Browser.
      result = window.prompt("Input: ");
      // returns null on cancel
      if (result !== null) {
        result += "\n";
      }
    } else {}
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};

var TTY = {
  ttys: [],
  init() {},
  shutdown() {},
  register(dev, ops) {
    TTY.ttys[dev] = {
      input: [],
      output: [],
      ops
    };
    FS.registerDevice(dev, TTY.stream_ops);
  },
  stream_ops: {
    open(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    },
    close(stream) {
      // flush any pending line data
      stream.tty.ops.fsync(stream.tty);
    },
    fsync(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    read(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === undefined) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    },
    write(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    }
  },
  default_tty_ops: {
    get_char(tty) {
      return FS_stdin_getChar();
    },
    put_char(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    },
    ioctl_tcgets(tty) {
      // typical setting
      return {
        c_iflag: 25856,
        c_oflag: 5,
        c_cflag: 191,
        c_lflag: 35387,
        c_cc: [ 3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
      };
    },
    ioctl_tcsets(tty, optional_actions, data) {
      // currently just ignore
      return 0;
    },
    ioctl_tiocgwinsz(tty) {
      return [ 24, 80 ];
    }
  },
  default_tty1_ops: {
    put_char(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    }
  }
};

var zeroMemory = (ptr, size) => (growMemViews(), HEAPU8).fill(0, ptr, ptr + size);

var alignMemory = (size, alignment) => {
  assert(alignment, "alignment argument is required");
  return Math.ceil(size / alignment) * alignment;
};

var mmapAlloc = size => {
  size = alignMemory(size, 65536);
  var ptr = _emscripten_builtin_memalign(65536, size);
  if (ptr) zeroMemory(ptr, size);
  return ptr;
};

var MEMFS = {
  ops_table: null,
  mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  },
  createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      // not supported
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= {
      dir: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          lookup: MEMFS.node_ops.lookup,
          mknod: MEMFS.node_ops.mknod,
          rename: MEMFS.node_ops.rename,
          unlink: MEMFS.node_ops.unlink,
          rmdir: MEMFS.node_ops.rmdir,
          readdir: MEMFS.node_ops.readdir,
          symlink: MEMFS.node_ops.symlink
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek
        }
      },
      file: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek,
          read: MEMFS.stream_ops.read,
          write: MEMFS.stream_ops.write,
          mmap: MEMFS.stream_ops.mmap,
          msync: MEMFS.stream_ops.msync
        }
      },
      link: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          readlink: MEMFS.node_ops.readlink
        },
        stream: {}
      },
      chrdev: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr
        },
        stream: FS.chrdev_stream_ops
      }
    };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      // The actual number of bytes used in the typed array, as opposed to
      // contents.length which gives the whole capacity.
      node.usedBytes = 0;
      // The byte data of the file is stored in a typed array.
      // Note: typed arrays are not resizable like normal JS arrays are, so
      // there is a small penalty involved for appending file writes that
      // continuously grow a file similar to std::vector capacity vs used.
      node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    // add the new node to the parent
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  },
  getFileDataAsTypedArray(node) {
    assert(FS.isFile(node.mode), "getFileDataAsTypedArray called on non-file");
    return node.contents.subarray(0, node.usedBytes);
  },
  expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents.length;
    if (prevCapacity >= newCapacity) return;
    // No need to expand, the storage was already large enough.
    // Don't expand strictly to the given requested limit if it's only a very
    // small increase, but instead geometrically grow capacity.
    // For small filesizes (<1MB), perform size*2 geometric increase, but for
    // large sizes, do a much more conservative size*1.125 increase to avoid
    // overshooting the allocation cap by a very large margin.
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
    if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
    // At minimum allocate 256b for each file when expanding.
    var oldContents = MEMFS.getFileDataAsTypedArray(node);
    node.contents = new Uint8Array(newCapacity);
    // Allocate new storage.
    node.contents.set(oldContents);
  },
  resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    // Allocate new storage.
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    // Copy old data over to the new storage.
    node.usedBytes = newSize;
  },
  node_ops: {
    getattr(node) {
      var attr = {};
      // device numbers reuse inode numbers.
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.atime);
      attr.mtime = new Date(node.mtime);
      attr.ctime = new Date(node.ctime);
      // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
      //       but this is not required by the standard.
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    },
    setattr(node, attr) {
      for (const key of [ "mode", "atime", "mtime", "ctime" ]) {
        if (attr[key] != null) {
          node[key] = attr[key];
        }
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    },
    lookup(parent, name) {
      throw new FS.ErrnoError(44);
    },
    mknod(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev);
    },
    rename(old_node, new_dir, new_name) {
      var new_node;
      try {
        new_node = FS.lookupNode(new_dir, new_name);
      } catch (e) {}
      if (new_node) {
        if (FS.isDir(old_node.mode)) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(55);
          }
        }
        FS.hashRemoveNode(new_node);
      }
      // do the internal rewiring
      delete old_node.parent.contents[old_node.name];
      new_dir.contents[new_name] = old_node;
      old_node.name = new_name;
      new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
    },
    unlink(parent, name) {
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    rmdir(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    readdir(node) {
      return [ ".", "..", ...Object.keys(node.contents) ];
    },
    symlink(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    },
    readlink(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    }
  },
  stream_ops: {
    read(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes) return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      assert(size >= 0);
      buffer.set(contents.subarray(position, position + size), offset);
      return size;
    },
    write(stream, buffer, offset, length, position, canOwn) {
      assert(buffer.subarray, "FS.write expects a TypedArray");
      // If the buffer is located in main memory (HEAP), and if
      // memory can grow, we can't hold on to references of the
      // memory buffer, as they may get invalidated. That means we
      // need to copy its contents.
      if (buffer.buffer === (growMemViews(), HEAP8).buffer) {
        canOwn = false;
      }
      if (!length) return 0;
      var node = stream.node;
      node.mtime = node.ctime = Date.now();
      if (canOwn) {
        assert(position === 0, "canOwn must imply no weird position inside the file");
        node.contents = buffer.subarray(offset, offset + length);
        node.usedBytes = length;
      } else if (node.usedBytes === 0 && position === 0) {
        // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
        node.contents = buffer.slice(offset, offset + length);
        node.usedBytes = length;
      } else {
        MEMFS.expandFileStorage(node, position + length);
        // Use typed array write which is available.
        node.contents.set(buffer.subarray(offset, offset + length), position);
        node.usedBytes = Math.max(node.usedBytes, position + length);
      }
      return length;
    },
    llseek(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    mmap(stream, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      // Only make a new copy when MAP_PRIVATE is specified.
      if (!(flags & 2) && contents.buffer === (growMemViews(), HEAP8).buffer) {
        // We can't emulate MAP_SHARED when the file is not backed by the
        // buffer we're mapping to (e.g. the HEAP buffer).
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        if (contents) {
          // Try to avoid unnecessary slices.
          if (position > 0 || position + length < contents.length) {
            if (contents.subarray) {
              contents = contents.subarray(position, position + length);
            } else {
              contents = Array.prototype.slice.call(contents, position, position + length);
            }
          }
          (growMemViews(), HEAP8).set(contents, ptr);
        }
      }
      return {
        ptr,
        allocated
      };
    },
    msync(stream, buffer, offset, length, mmapFlags) {
      MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
      // should we check if bytesWritten and length are the same?
      return 0;
    }
  }
};

var FS_modeStringToFlags = str => {
  if (typeof str != "string") return str;
  var flagModes = {
    "r": 0,
    "r+": 2,
    "w": 512 | 64 | 1,
    "w+": 512 | 64 | 2,
    "a": 1024 | 64 | 1,
    "a+": 1024 | 64 | 2
  };
  var flags = flagModes[str];
  if (typeof flags == "undefined") {
    throw new Error(`Unknown file open mode: ${str}`);
  }
  return flags;
};

var FS_fileDataToTypedArray = data => {
  if (typeof data == "string") {
    data = intArrayFromString(data, true);
  }
  if (!data.subarray) {
    data = new Uint8Array(data);
  }
  return data;
};

var FS_getMode = (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
};

var strError = errno => UTF8ToString(_strerror(errno));

var ERRNO_CODES = {
  "EPERM": 63,
  "ENOENT": 44,
  "ESRCH": 71,
  "EINTR": 27,
  "EIO": 29,
  "ENXIO": 60,
  "E2BIG": 1,
  "ENOEXEC": 45,
  "EBADF": 8,
  "ECHILD": 12,
  "EAGAIN": 6,
  "EWOULDBLOCK": 6,
  "ENOMEM": 48,
  "EACCES": 2,
  "EFAULT": 21,
  "ENOTBLK": 105,
  "EBUSY": 10,
  "EEXIST": 20,
  "EXDEV": 75,
  "ENODEV": 43,
  "ENOTDIR": 54,
  "EISDIR": 31,
  "EINVAL": 28,
  "ENFILE": 41,
  "EMFILE": 33,
  "ENOTTY": 59,
  "ETXTBSY": 74,
  "EFBIG": 22,
  "ENOSPC": 51,
  "ESPIPE": 70,
  "EROFS": 69,
  "EMLINK": 34,
  "EPIPE": 64,
  "EDOM": 18,
  "ERANGE": 68,
  "ENOMSG": 49,
  "EIDRM": 24,
  "ECHRNG": 106,
  "EL2NSYNC": 156,
  "EL3HLT": 107,
  "EL3RST": 108,
  "ELNRNG": 109,
  "EUNATCH": 110,
  "ENOCSI": 111,
  "EL2HLT": 112,
  "EDEADLK": 16,
  "ENOLCK": 46,
  "EBADE": 113,
  "EBADR": 114,
  "EXFULL": 115,
  "ENOANO": 104,
  "EBADRQC": 103,
  "EBADSLT": 102,
  "EDEADLOCK": 16,
  "EBFONT": 101,
  "ENOSTR": 100,
  "ENODATA": 116,
  "ETIME": 117,
  "ENOSR": 118,
  "ENONET": 119,
  "ENOPKG": 120,
  "EREMOTE": 121,
  "ENOLINK": 47,
  "EADV": 122,
  "ESRMNT": 123,
  "ECOMM": 124,
  "EPROTO": 65,
  "EMULTIHOP": 36,
  "EDOTDOT": 125,
  "EBADMSG": 9,
  "ENOTUNIQ": 126,
  "EBADFD": 127,
  "EREMCHG": 128,
  "ELIBACC": 129,
  "ELIBBAD": 130,
  "ELIBSCN": 131,
  "ELIBMAX": 132,
  "ELIBEXEC": 133,
  "ENOSYS": 52,
  "ENOTEMPTY": 55,
  "ENAMETOOLONG": 37,
  "ELOOP": 32,
  "EOPNOTSUPP": 138,
  "EPFNOSUPPORT": 139,
  "ECONNRESET": 15,
  "ENOBUFS": 42,
  "EAFNOSUPPORT": 5,
  "EPROTOTYPE": 67,
  "ENOTSOCK": 57,
  "ENOPROTOOPT": 50,
  "ESHUTDOWN": 140,
  "ECONNREFUSED": 14,
  "EADDRINUSE": 3,
  "ECONNABORTED": 13,
  "ENETUNREACH": 40,
  "ENETDOWN": 38,
  "ETIMEDOUT": 73,
  "EHOSTDOWN": 142,
  "EHOSTUNREACH": 23,
  "EINPROGRESS": 26,
  "EALREADY": 7,
  "EDESTADDRREQ": 17,
  "EMSGSIZE": 35,
  "EPROTONOSUPPORT": 66,
  "ESOCKTNOSUPPORT": 137,
  "EADDRNOTAVAIL": 4,
  "ENETRESET": 39,
  "EISCONN": 30,
  "ENOTCONN": 53,
  "ETOOMANYREFS": 141,
  "EUSERS": 136,
  "EDQUOT": 19,
  "ESTALE": 72,
  "ENOTSUP": 138,
  "ENOMEDIUM": 148,
  "EILSEQ": 25,
  "EOVERFLOW": 61,
  "ECANCELED": 11,
  "ENOTRECOVERABLE": 56,
  "EOWNERDEAD": 62,
  "ESTRPIPE": 135
};

var asyncLoad = async url => {
  var arrayBuffer = await readAsync(url);
  assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
  return new Uint8Array(arrayBuffer);
};

var FS_createDataFile = (...args) => FS.createDataFile(...args);

var getUniqueRunDependency = id => {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
};

var preloadPlugins = [];

var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
  // Ensure plugins are ready.
  if (typeof Browser != "undefined") Browser.init();
  for (var plugin of preloadPlugins) {
    if (plugin["canHandle"](fullname)) {
      assert(plugin["handle"].constructor.name === "AsyncFunction", "Filesystem plugin handlers must be async functions (See #24914)");
      return plugin["handle"](byteArray, fullname);
    }
  }
  // If no plugin handled this file then return the original/unmodified
  // byteArray.
  return byteArray;
};

var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
  // TODO we should allow people to just pass in a complete filename instead
  // of parent and name being that we just join them anyways
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency(`cp ${fullname}`);
  // might have several active requests for the same fullname
  addRunDependency(dep);
  try {
    var byteArray = url;
    if (typeof url == "string") {
      byteArray = await asyncLoad(url);
    }
    byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
    preFinish?.();
    if (!dontCreateFile) {
      FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
  } finally {
    removeRunDependency(dep);
  }
};

var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
  FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
};

var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  filesystems: null,
  syncFSRequests: 0,
  ErrnoError: class extends Error {
    name="ErrnoError";
    // We set the `name` property to be able to identify `FS.ErrnoError`
    // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
    // - when using PROXYFS, an error can come from an underlying FS
    // as different FS objects have their own FS.ErrnoError each,
    // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
    // we'll use the reliable test `err.name == "ErrnoError"` instead
    constructor(errno) {
      super(runtimeInitialized ? strError(errno) : "");
      this.errno = errno;
      for (var key in ERRNO_CODES) {
        if (ERRNO_CODES[key] === errno) {
          this.code = key;
          break;
        }
      }
    }
  },
  FSStream: class {
    shared={};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return (this.flags & 1024);
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  },
  FSNode: class {
    node_ops={};
    stream_ops={};
    readMode=292 | 73;
    writeMode=146;
    mounted=null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
  },
  lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      // split the absolute path
      var parts = path.split("/").filter(p => !!p);
      // start at the root
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = (i === parts.length - 1);
        if (islast && opts.parent) {
          // stop resolving
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            // We're making progress here, don't let many consecutive ..'s
            // lead to ELOOP
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          // if noent_okay is true, suppress a ENOENT in the last component
          // and return an object with an undefined node. This is needed for
          // resolving symlinks in the path when creating a file.
          if ((e?.errno === 44) && islast && opts.noent_okay) {
            return {
              path: current_path
            };
          }
          throw e;
        }
        // jump to the mount's root node if this is a mountpoint
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        // by default, lookupPath will not follow a symlink if it is the final path component.
        // setting opts.follow = true will override this behavior.
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return {
        path: current_path,
        node: current
      };
    }
    throw new FS.ErrnoError(32);
  },
  getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  },
  hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length;
  },
  hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  },
  hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  },
  lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    // if we failed to find it in the cache, call into the VFS
    return FS.lookup(parent, name);
  },
  createNode(parent, name, mode, rdev) {
    assert(typeof parent == "object");
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  },
  destroyNode(node) {
    FS.hashRemoveNode(node);
  },
  isRoot(node) {
    return node === node.parent;
  },
  isMountpoint(node) {
    return !!node.mounted;
  },
  isFile(mode) {
    return (mode & 61440) === 32768;
  },
  isDir(mode) {
    return (mode & 61440) === 16384;
  },
  isLink(mode) {
    return (mode & 61440) === 40960;
  },
  isChrdev(mode) {
    return (mode & 61440) === 8192;
  },
  isBlkdev(mode) {
    return (mode & 61440) === 24576;
  },
  isFIFO(mode) {
    return (mode & 61440) === 4096;
  },
  isSocket(mode) {
    return (mode & 49152) === 49152;
  },
  flagsToPermissionString(flag) {
    var perms = [ "r", "w", "rw" ][flag & 3];
    if ((flag & 512)) {
      perms += "w";
    }
    return perms;
  },
  nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    // return 0 if any user, group or owner bits are set.
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    }
    if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    }
    if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  },
  mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  },
  mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {}
    return FS.nodePermissions(dir, "wx");
  },
  mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else if (FS.isDir(node.mode)) {
      return 31;
    }
    return 0;
  },
  mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    }
    var mode = FS.flagsToPermissionString(flags);
    if (FS.isDir(node.mode)) {
      // opening for write
      // TODO: check for O_SEARCH? (== search for dir only)
      if (mode !== "r" || (flags & (512 | 64))) {
        return 31;
      }
    }
    return FS.nodePermissions(node, mode);
  },
  checkOpExists(op, err) {
    if (!op) {
      throw new FS.ErrnoError(err);
    }
    return op;
  },
  MAX_OPEN_FDS: 4096,
  nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  },
  getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  },
  getStream: fd => FS.streams[fd],
  createStream(stream, fd = -1) {
    assert(fd >= -1);
    // clone it, so we can return an instance of FSStream
    stream = Object.assign(new FS.FSStream, stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  },
  closeStream(fd) {
    FS.streams[fd] = null;
  },
  dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  },
  doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    setattr(arg, attr);
  },
  chrdev_stream_ops: {
    open(stream) {
      var device = FS.getDevice(stream.node.rdev);
      // override node's stream ops with the device's
      stream.stream_ops = device.stream_ops;
      // forward the open call
      stream.stream_ops.open?.(stream);
    },
    llseek() {
      throw new FS.ErrnoError(70);
    }
  },
  major: dev => ((dev) >> 8),
  minor: dev => ((dev) & 255),
  makedev: (ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
    FS.devices[dev] = {
      stream_ops: ops
    };
  },
  getDevice: dev => FS.devices[dev],
  getMounts(mount) {
    var mounts = [];
    var check = [ mount ];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  },
  syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      assert(FS.syncFSRequests > 0);
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    // sync all mounts
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done);
      } else {
        done(null);
      }
    }
  },
  mount(type, opts, mountpoint) {
    if (typeof type == "string") {
      // The filesystem was not included, and instead we have an error
      // message stored in the variable.
      throw type;
    }
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, {
        follow_mount: false
      });
      mountpoint = lookup.path;
      // use the absolute path
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = {
      type,
      opts,
      mountpoint,
      mounts: []
    };
    // create a root node for the fs
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      // set as a mountpoint
      node.mounted = mount;
      // add the new mount to the current mount's children
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  },
  unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, {
      follow_mount: false
    });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    // destroy the nodes for this mount, and all its child mounts
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    // no longer a mountpoint
    node.mounted = null;
    // remove this mount from the child mounts
    var idx = node.mount.mounts.indexOf(mount);
    assert(idx !== -1);
    node.mount.mounts.splice(idx, 1);
  },
  lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  },
  mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  },
  statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, {
      follow: true
    }).node);
  },
  statfsStream(stream) {
    // We keep a separate statfsStream function because noderawfs overrides
    // it. In noderawfs, stream.node is sometimes null. Instead, we need to
    // look at stream.path.
    return FS.statfsNode(stream.node);
  },
  statfsNode(node) {
    // NOTE: None of the defaults here are true. We're just returning safe and
    //       sane values. Currently nodefs and rawfs replace these defaults,
    //       other file systems leave them alone.
    var rtn = {
      bsize: 4096,
      frsize: 4096,
      blocks: 1e6,
      bfree: 5e5,
      bavail: 5e5,
      files: FS.nextInode,
      ffree: FS.nextInode - 1,
      fsid: 42,
      flags: 2,
      namelen: 255
    };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  },
  create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  },
  mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  },
  mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  },
  mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  },
  symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  },
  rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    // parents must exist
    var lookup, old_dir, new_dir;
    // let the errors from non existent directories percolate up
    lookup = FS.lookupPath(old_path, {
      parent: true
    });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, {
      parent: true
    });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    // need to be part of the same mount
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    // source must exist
    var old_node = FS.lookupNode(old_dir, old_name);
    // old path should not be an ancestor of the new path
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    // new path should not be an ancestor of the old path
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    // see if the new path already exists
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    // early out if nothing needs to change
    if (old_node === new_node) {
      return;
    }
    // we'll need to delete the old entry
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    // need delete permissions if we'll be overwriting.
    // need create permissions if new doesn't already exist.
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(10);
    }
    // if we are going to change the parent, check write permissions
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    // remove the node from the lookup hash
    FS.hashRemoveNode(old_node);
    // do the underlying fs rename
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      // update old node (we do this here to avoid each backend
      // needing to)
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      // add the node back to the hash (in case node_ops.rename
      // changed its name)
      FS.hashAddNode(old_node);
    }
  },
  rmdir(path) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  },
  readdir(path) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  },
  unlink(path) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      // According to POSIX, we should map EISDIR to EPERM, but
      // we instead do what Linux does (and we must, as we use
      // the musl linux libc).
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  },
  readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  },
  stat(path, dontFollow) {
    var lookup = FS.lookupPath(path, {
      follow: !dontFollow
    });
    var node = lookup.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  },
  fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  },
  lstat(path) {
    return FS.stat(path, true);
  },
  doChmod(stream, node, mode, dontFollow) {
    FS.doSetAttr(stream, node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      ctime: Date.now(),
      dontFollow
    });
  },
  chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  },
  lchmod(path, mode) {
    FS.chmod(path, mode, true);
  },
  fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  },
  doChown(stream, node, dontFollow) {
    FS.doSetAttr(stream, node, {
      timestamp: Date.now(),
      dontFollow
    });
  },
  chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  },
  lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  },
  fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  },
  doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, {
      size: len,
      timestamp: Date.now()
    });
  },
  truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: true
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  },
  ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  },
  utime(path, atime, mtime) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
    setattr(node, {
      atime,
      mtime
    });
  },
  open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = FS_modeStringToFlags(flags);
    if ((flags & 64)) {
      mode = (mode & 4095) | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path == "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      // noent_okay makes it so that if the final component of the path
      // doesn't exist, lookupPath returns `node: undefined`. `path` will be
      // updated to point to the target of all symlinks.
      var lookup = FS.lookupPath(path, {
        follow: !(flags & 131072),
        noent_okay: true
      });
      node = lookup.node;
      path = lookup.path;
    }
    // perhaps we need to create the node
    var created = false;
    if ((flags & 64)) {
      if (node) {
        // if O_CREAT and O_EXCL are set, error out if the node already exists
        if ((flags & 128)) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        // node doesn't exist, try to create it
        // Ignore the permission bits here to ensure we can `open` this new
        // file below. We use chmod below to apply the permissions once the
        // file is open.
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    // can't truncate a device
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    // if asked only for a directory, then this must be one
    if ((flags & 65536) && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    // check permissions, if this is not a file we just created now (it is ok to
    // create and write to a file with read-only permissions; it is read-only
    // for later use)
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    // do truncation if necessary
    if ((flags & 512) && !created) {
      FS.truncate(node, 0);
    }
    // we've already handled these, don't pass down to the underlying vfs
    flags &= ~(128 | 512 | 131072);
    // register the stream with the filesystem
    var stream = FS.createStream({
      node,
      path: FS.getPath(node),
      // we want the absolute path to the node
      flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      // used by the file family libc calls (fopen, fwrite, ferror, etc.)
      ungotten: [],
      error: false
    });
    // call the new stream's open function
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    return stream;
  },
  close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    // free readdir state
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  },
  isClosed(stream) {
    return stream.fd === null;
  },
  llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  },
  read(stream, buffer, offset, length, position) {
    assert(offset >= 0);
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write(stream, buffer, offset, length, position, canOwn) {
    assert(offset >= 0);
    assert(buffer.subarray, "FS.write expects a TypedArray");
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      // seek to the end before writing in append mode
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  },
  mmap(stream, length, position, prot, flags) {
    // User requests writing to file (prot & PROT_WRITE != 0).
    // Checking if we have permissions to write to the file unless
    // MAP_PRIVATE flag is set. According to POSIX spec it is possible
    // to write to file opened in read-only mode with MAP_PRIVATE flag,
    // as all modifications will be visible only in the memory of
    // the current process.
    if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  },
  msync(stream, buffer, offset, length, mmapFlags) {
    assert(offset >= 0);
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  },
  ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  },
  readFile(path, opts = {}) {
    opts.flags = opts.flags || 0;
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  },
  writeFile(path, data, opts = {}) {
    opts.flags = opts.flags || 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    data = FS_fileDataToTypedArray(data);
    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    FS.close(stream);
  },
  cwd: () => FS.currentPath,
  chdir(path) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  },
  createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  },
  createDefaultDevices() {
    // create /dev
    FS.mkdir("/dev");
    // setup /dev/null
    FS.registerDevice(FS.makedev(1, 3), {
      read: () => 0,
      write: (stream, buffer, offset, length, pos) => length,
      llseek: () => 0
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    // setup /dev/tty and /dev/tty1
    // stderr needs to print output using err() rather than out()
    // so we register a second tty just for it.
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    // setup /dev/[u]random
    // use a buffer to avoid overhead of individual crypto calls per byte
    var randomBuffer = new Uint8Array(1024), randomLeft = 0;
    var randomByte = () => {
      if (randomLeft === 0) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    // we're not going to emulate the actual shm device,
    // just create the tmp dirs that reside in it commonly
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  },
  createSpecialDirectories() {
    // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
    // name of the stream for fd 6 (see test_unistd_ttyname)
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({
      mount() {
        var node = FS.createNode(proc_self, "fd", 16895, 73);
        node.stream_ops = {
          llseek: MEMFS.stream_ops.llseek
        };
        node.node_ops = {
          lookup(parent, name) {
            var fd = +name;
            var stream = FS.getStreamChecked(fd);
            var ret = {
              parent: null,
              mount: {
                mountpoint: "fake"
              },
              node_ops: {
                readlink: () => stream.path
              },
              id: fd + 1
            };
            ret.parent = ret;
            // make it look like a simple root node
            return ret;
          },
          readdir() {
            return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
          }
        };
        return node;
      }
    }, {}, "/proc/self/fd");
  },
  createStandardStreams(input, output, error) {
    // TODO deprecate the old functionality of a single
    // input / output callback and that utilizes FS.createDevice
    // and instead require a unique set of stream ops
    // by default, we symlink the standard streams to the
    // default tty devices. however, if the standard streams
    // have been overwritten we create a unique device for
    // them instead.
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    // open default streams for the stdin, stdout and stderr devices
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
    assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
    assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
    assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
  },
  staticInit() {
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = {
      "MEMFS": MEMFS
    };
  },
  init(input, output, error) {
    assert(!FS.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
    FS.initialized = true;
    // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
    input ??= Module["stdin"];
    output ??= Module["stdout"];
    error ??= Module["stderr"];
    FS.createStandardStreams(input, output, error);
  },
  quit() {
    FS.initialized = false;
    // force-flush all streams, so we get musl std streams printed out
    _fflush(0);
    // close all of our streams
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  },
  findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  },
  analyzePath(path, dontResolveLastLink) {
    // operate from within the context of the symlink's target
    try {
      var lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      path = lookup.path;
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null
    };
    try {
      var lookup = FS.lookupPath(path, {
        parent: true
      });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  },
  createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  },
  createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      data = FS_fileDataToTypedArray(data);
      // make sure we can write to the file
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  },
  createDevice(parent, name, input, output) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    // Create a fake device that a set of stream ops to emulate
    // the old behavior.
    FS.registerDevice(dev, {
      open(stream) {
        stream.seekable = false;
      },
      close(stream) {
        // flush any pending line data
        if (output?.buffer?.length) {
          output(10);
        }
      },
      read(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        if (bytesRead) {
          stream.node.atime = Date.now();
        }
        return bytesRead;
      },
      write(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.mtime = stream.node.ctime = Date.now();
        }
        return i;
      }
    });
    return FS.mkdev(path, mode, dev);
  },
  forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    } else {
      // Command-line.
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  },
  createLazyFile(parent, name, url, canRead, canWrite) {
    // Lazy chunked Uint8Array (implements get and length from Uint8Array).
    // Actual getting is abstracted away for eventual reuse.
    class LazyUint8Array {
      lengthKnown=false;
      chunks=[];
      // Loaded chunks. Index is the chunk number
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return undefined;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = (idx / this.chunkSize) | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        // Find length
        var xhr = new XMLHttpRequest;
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        // Chunk size in bytes
        if (!hasByteServing) chunkSize = datalength;
        // Function to get a range from the remote URL.
        var doXHR = (from, to) => {
          if (from > to) abort("invalid range (" + from + ", " + to + ") or no bytes requested!");
          if (to > datalength - 1) abort("only " + datalength + " bytes available! programmer error!");
          // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
          var xhr = new XMLHttpRequest;
          xhr.open("GET", url, false);
          if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
          // Some hints to the browser that we want binary data.
          xhr.responseType = "arraybuffer";
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
          if (xhr.response !== undefined) {
            return new Uint8Array(/** @type{Array<number>} */ (xhr.response || []));
          }
          return intArrayFromString(xhr.responseText || "", true);
        };
        var lazyArray = this;
        lazyArray.setDataGetter(chunkNum => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          // including this byte
          end = Math.min(end, datalength - 1);
          // if datalength-1 is selected, this is the last block
          if (typeof lazyArray.chunks[chunkNum] == "undefined") {
            lazyArray.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray.chunks[chunkNum] == "undefined") abort("doXHR failed!");
          return lazyArray.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
          chunkSize = datalength = 1;
          // this will force getter(0)/doXHR do download the whole file
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
      var lazyArray = new LazyUint8Array;
      var properties = {
        isDevice: false,
        contents: lazyArray
      };
    } else {
      var properties = {
        isDevice: false,
        url
      };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    // This is a total hack, but I want to get this lazy file code out of the
    // core of MEMFS. If we want to keep this lazy file concept I feel it should
    // be its own thin LAZYFS proxying calls to MEMFS.
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    // Add a function that defers querying the file size until it is asked the first time.
    Object.defineProperties(node, {
      usedBytes: {
        get: function() {
          return this.contents.length;
        }
      }
    });
    // override each stream op with one that tries to force load the lazy file first
    var stream_ops = {};
    for (const [key, fn] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      assert(size >= 0);
      if (contents.slice) {
        // normal array
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          // LazyUint8Array from sync binary XHR
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    // use a custom read function
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    // use a custom mmap function
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, (growMemViews(), HEAP8), ptr, length, position);
      return {
        ptr,
        allocated: true
      };
    };
    node.stream_ops = stream_ops;
    return node;
  }
};

var SOCKFS = {
  websocketArgs: {},
  callbacks: {},
  on(event, callback) {
    SOCKFS.callbacks[event] = callback;
  },
  emit(event, param) {
    SOCKFS.callbacks[event]?.(param);
  },
  mount(mount) {
    // The incoming Module['websocket'] can be used for configuring 
    // subprotocol/url, etc
    SOCKFS.websocketArgs = Module["websocket"] || {};
    // Add the Event registration mechanism to the exported websocket configuration
    // object so we can register network callbacks from native JavaScript too.
    // For more documentation see system/include/emscripten/emscripten.h
    (Module["websocket"] ??= {})["on"] = SOCKFS.on;
    return FS.createNode(null, "/", 16895, 0);
  },
  createSocket(family, type, protocol) {
    // Emscripten only supports AF_INET
    if (family != 2) {
      throw new FS.ErrnoError(5);
    }
    type &= ~526336;
    // Some applications may pass it; it makes no sense for a single process.
    // Emscripten only supports SOCK_STREAM and SOCK_DGRAM
    if (type != 1 && type != 2) {
      throw new FS.ErrnoError(28);
    }
    var streaming = type == 1;
    if (streaming && protocol && protocol != 6) {
      throw new FS.ErrnoError(66);
    }
    // create our internal socket structure
    var sock = {
      family,
      type,
      protocol,
      server: null,
      error: null,
      // Used in getsockopt for SOL_SOCKET/SO_ERROR test
      peers: {},
      pending: [],
      recv_queue: [],
      sock_ops: SOCKFS.websocket_sock_ops
    };
    // create the filesystem node to store the socket structure
    var name = SOCKFS.nextname();
    var node = FS.createNode(SOCKFS.root, name, 49152, 0);
    node.sock = sock;
    // and the wrapping stream that enables library functions such
    // as read and write to indirectly interact with the socket
    var stream = FS.createStream({
      path: name,
      node,
      flags: 2,
      seekable: false,
      stream_ops: SOCKFS.stream_ops
    });
    // map the new stream to the socket structure (sockets have a 1:1
    // relationship with a stream)
    sock.stream = stream;
    return sock;
  },
  getSocket(fd) {
    var stream = FS.getStream(fd);
    if (!stream || !FS.isSocket(stream.node.mode)) {
      return null;
    }
    return stream.node.sock;
  },
  stream_ops: {
    poll(stream) {
      var sock = stream.node.sock;
      return sock.sock_ops.poll(sock);
    },
    ioctl(stream, request, varargs) {
      var sock = stream.node.sock;
      return sock.sock_ops.ioctl(sock, request, varargs);
    },
    read(stream, buffer, offset, length, position) {
      var sock = stream.node.sock;
      var msg = sock.sock_ops.recvmsg(sock, length);
      if (!msg) {
        // socket is closed
        return 0;
      }
      buffer.set(msg.buffer, offset);
      return msg.buffer.length;
    },
    write(stream, buffer, offset, length, position) {
      var sock = stream.node.sock;
      return sock.sock_ops.sendmsg(sock, buffer, offset, length);
    },
    close(stream) {
      var sock = stream.node.sock;
      sock.sock_ops.close(sock);
    }
  },
  nextname() {
    if (!SOCKFS.nextname.current) {
      SOCKFS.nextname.current = 0;
    }
    return `socket[${SOCKFS.nextname.current++}]`;
  },
  websocket_sock_ops: {
    createPeer(sock, addr, port) {
      var ws;
      if (typeof addr == "object") {
        ws = addr;
        addr = null;
        port = null;
      }
      if (ws) {
        // for sockets that've already connected (e.g. we're the server)
        // we can inspect the _socket property for the address
        if (ws._socket) {
          addr = ws._socket.remoteAddress;
          port = ws._socket.remotePort;
        } else {
          var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
          if (!result) {
            throw new Error("WebSocket URL must be in the format ws(s)://address:port");
          }
          addr = result[1];
          port = parseInt(result[2], 10);
        }
      } else {
        // create the actual websocket object and connect
        try {
          // The default value is 'ws://' the replace is needed because the compiler replaces '//' comments with '#'
          // comments without checking context, so we'd end up with ws:#, the replace swaps the '#' for '//' again.
          var url = "ws://".replace("#", "//");
          // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
          var subProtocols = "binary";
          // The default value is 'binary'
          // The default WebSocket options
          var opts = undefined;
          // Fetch runtime WebSocket URL config.
          if (SOCKFS.websocketArgs["url"]) {
            url = SOCKFS.websocketArgs["url"];
          }
          // Fetch runtime WebSocket subprotocol config.
          if (SOCKFS.websocketArgs["subprotocol"]) {
            subProtocols = SOCKFS.websocketArgs["subprotocol"];
          } else if (SOCKFS.websocketArgs["subprotocol"] === null) {
            subProtocols = "null";
          }
          if (url === "ws://" || url === "wss://") {
            // Is the supplied URL config just a prefix, if so complete it.
            var parts = addr.split("/");
            url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
          }
          if (subProtocols !== "null") {
            // The regex trims the string (removes spaces at the beginning and end), then splits the string by
            // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
            subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
            opts = subProtocols;
          }
          // If node we use the ws library.
          var WebSocketConstructor;
          if (ENVIRONMENT_IS_NODE) {
            WebSocketConstructor = /** @type{(typeof WebSocket)} */ (require("ws"));
          } else {
            WebSocketConstructor = WebSocket;
          }
          ws = new WebSocketConstructor(url, opts);
          ws.binaryType = "arraybuffer";
        } catch (e) {
          throw new FS.ErrnoError(23);
        }
      }
      var peer = {
        addr,
        port,
        socket: ws,
        msg_send_queue: []
      };
      SOCKFS.websocket_sock_ops.addPeer(sock, peer);
      SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
      // if this is a bound dgram socket, send the port number first to allow
      // us to override the ephemeral port reported to us by remotePort on the
      // remote end.
      if (sock.type === 2 && typeof sock.sport != "undefined") {
        peer.msg_send_queue.push(new Uint8Array([ 255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), ((sock.sport & 65280) >> 8), (sock.sport & 255) ]));
      }
      return peer;
    },
    getPeer(sock, addr, port) {
      return sock.peers[addr + ":" + port];
    },
    addPeer(sock, peer) {
      sock.peers[peer.addr + ":" + peer.port] = peer;
    },
    removePeer(sock, peer) {
      delete sock.peers[peer.addr + ":" + peer.port];
    },
    handlePeerEvents(sock, peer) {
      var first = true;
      var handleOpen = function() {
        sock.connecting = false;
        SOCKFS.emit("open", sock.stream.fd);
        try {
          var queued = peer.msg_send_queue.shift();
          while (queued) {
            peer.socket.send(queued);
            queued = peer.msg_send_queue.shift();
          }
        } catch (e) {
          // not much we can do here in the way of proper error handling as we've already
          // lied and said this data was sent. shut it down.
          peer.socket.close();
        }
      };
      function handleMessage(data) {
        if (typeof data == "string") {
          var encoder = new TextEncoder;
          // should be utf-8
          data = encoder.encode(data);
        } else {
          assert(data.byteLength !== undefined);
          // must receive an ArrayBuffer
          if (data.byteLength == 0) {
            // An empty ArrayBuffer will emit a pseudo disconnect event
            // as recv/recvmsg will return zero which indicates that a socket
            // has performed a shutdown although the connection has not been disconnected yet.
            return;
          }
          data = new Uint8Array(data);
        }
        // if this is the port message, override the peer's port with it
        var wasfirst = first;
        first = false;
        if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
          // update the peer's port and its key in the peer map
          var newport = ((data[8] << 8) | data[9]);
          SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          peer.port = newport;
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          return;
        }
        sock.recv_queue.push({
          addr: peer.addr,
          port: peer.port,
          data
        });
        SOCKFS.emit("message", sock.stream.fd);
      }
      if (ENVIRONMENT_IS_NODE) {
        peer.socket.on("open", handleOpen);
        peer.socket.on("message", function(data, isBinary) {
          if (!isBinary) {
            return;
          }
          handleMessage((new Uint8Array(data)).buffer);
        });
        peer.socket.on("close", function() {
          SOCKFS.emit("close", sock.stream.fd);
        });
        peer.socket.on("error", function(error) {
          // Although the ws library may pass errors that may be more descriptive than
          // ECONNREFUSED they are not necessarily the expected error code e.g.
          // ENOTFOUND on getaddrinfo seems to be node.js specific, so using ECONNREFUSED
          // is still probably the most useful thing to do.
          sock.error = 14;
          // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
          SOCKFS.emit("error", [ sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused" ]);
        });
      } else {
        peer.socket.onopen = handleOpen;
        peer.socket.onclose = function() {
          SOCKFS.emit("close", sock.stream.fd);
        };
        peer.socket.onmessage = function peer_socket_onmessage(event) {
          handleMessage(event.data);
        };
        peer.socket.onerror = function(error) {
          // The WebSocket spec only allows a 'simple event' to be thrown on error,
          // so we only really know as much as ECONNREFUSED.
          sock.error = 14;
          // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
          SOCKFS.emit("error", [ sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused" ]);
        };
      }
    },
    poll(sock) {
      if (sock.type === 1 && sock.server) {
        // listen sockets should only say they're available for reading
        // if there are pending clients.
        return sock.pending.length ? (64 | 1) : 0;
      }
      var mask = 0;
      var dest = sock.type === 1 ? // we only care about the socket state for connection-based sockets
      SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
      if (sock.recv_queue.length || !dest || // connection-less sockets are always ready to read
      (dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
        // let recv return 0 once closed
        mask |= (64 | 1);
      }
      if (!dest || // connection-less sockets are always ready to write
      (dest && dest.socket.readyState === dest.socket.OPEN)) {
        mask |= 4;
      }
      if ((dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
        // When an non-blocking connect fails mark the socket as writable.
        // Its up to the calling code to then use getsockopt with SO_ERROR to
        // retrieve the error.
        // See https://man7.org/linux/man-pages/man2/connect.2.html
        if (sock.connecting) {
          mask |= 4;
        } else {
          mask |= 16;
        }
      }
      return mask;
    },
    ioctl(sock, request, arg) {
      switch (request) {
       case 21531:
        var bytes = 0;
        if (sock.recv_queue.length) {
          bytes = sock.recv_queue[0].data.length;
        }
        (growMemViews(), HEAP32)[((arg) >> 2)] = bytes;
        return 0;

       case 21537:
        var on = (growMemViews(), HEAP32)[((arg) >> 2)];
        if (on) {
          sock.stream.flags |= 2048;
        } else {
          sock.stream.flags &= ~2048;
        }
        return 0;

       default:
        return 28;
      }
    },
    close(sock) {
      // if we've spawned a listen server, close it
      if (sock.server) {
        try {
          sock.server.close();
        } catch (e) {}
        sock.server = null;
      }
      // close any peer connections
      for (var peer of Object.values(sock.peers)) {
        try {
          peer.socket.close();
        } catch (e) {}
        SOCKFS.websocket_sock_ops.removePeer(sock, peer);
      }
      return 0;
    },
    bind(sock, addr, port) {
      if (typeof sock.saddr != "undefined" || typeof sock.sport != "undefined") {
        throw new FS.ErrnoError(28);
      }
      sock.saddr = addr;
      sock.sport = port;
      // in order to emulate dgram sockets, we need to launch a listen server when
      // binding on a connection-less socket
      // note: this is only required on the server side
      if (sock.type === 2) {
        // close the existing server if it exists
        if (sock.server) {
          sock.server.close();
          sock.server = null;
        }
        // swallow error operation not supported error that occurs when binding in the
        // browser where this isn't supported
        try {
          sock.sock_ops.listen(sock, 0);
        } catch (e) {
          if (!(e.name === "ErrnoError")) throw e;
          if (e.errno !== 138) throw e;
        }
      }
    },
    connect(sock, addr, port) {
      if (sock.server) {
        throw new FS.ErrnoError(138);
      }
      // TODO autobind
      // if (!sock.addr && sock.type == 2) {
      // }
      // early out if we're already connected / in the middle of connecting
      if (typeof sock.daddr != "undefined" && typeof sock.dport != "undefined") {
        var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
        if (dest) {
          if (dest.socket.readyState === dest.socket.CONNECTING) {
            throw new FS.ErrnoError(7);
          } else {
            throw new FS.ErrnoError(30);
          }
        }
      }
      // add the socket to our peer list and set our
      // destination address / port to match
      var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
      sock.daddr = peer.addr;
      sock.dport = peer.port;
      // because we cannot synchronously block to wait for the WebSocket
      // connection to complete, we return here pretending that the connection
      // was a success.
      sock.connecting = true;
    },
    listen(sock, backlog) {
      if (!ENVIRONMENT_IS_NODE) {
        throw new FS.ErrnoError(138);
      }
      if (sock.server) {
        throw new FS.ErrnoError(28);
      }
      var WebSocketServer = require("ws").Server;
      var host = sock.saddr;
      sock.server = new WebSocketServer({
        host,
        port: sock.sport
      });
      SOCKFS.emit("listen", sock.stream.fd);
      // Send Event with listen fd.
      sock.server.on("connection", function(ws) {
        if (sock.type === 1) {
          var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
          // create a peer on the new socket
          var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
          newsock.daddr = peer.addr;
          newsock.dport = peer.port;
          // push to queue for accept to pick up
          sock.pending.push(newsock);
          SOCKFS.emit("connection", newsock.stream.fd);
        } else {
          // create a peer on the listen socket so calling sendto
          // with the listen socket and an address will resolve
          // to the correct client
          SOCKFS.websocket_sock_ops.createPeer(sock, ws);
          SOCKFS.emit("connection", sock.stream.fd);
        }
      });
      sock.server.on("close", function() {
        SOCKFS.emit("close", sock.stream.fd);
        sock.server = null;
      });
      sock.server.on("error", function(error) {
        // Although the ws library may pass errors that may be more descriptive than
        // ECONNREFUSED they are not necessarily the expected error code e.g.
        // ENOTFOUND on getaddrinfo seems to be node.js specific, so using EHOSTUNREACH
        // is still probably the most useful thing to do. This error shouldn't
        // occur in a well written app as errors should get trapped in the compiled
        // app's own getaddrinfo call.
        sock.error = 23;
        // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
        SOCKFS.emit("error", [ sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable" ]);
      });
    },
    accept(listensock) {
      if (!listensock.server || !listensock.pending.length) {
        throw new FS.ErrnoError(28);
      }
      var newsock = listensock.pending.shift();
      newsock.stream.flags = listensock.stream.flags;
      return newsock;
    },
    getname(sock, peer) {
      var addr, port;
      if (peer) {
        if (sock.daddr === undefined || sock.dport === undefined) {
          throw new FS.ErrnoError(53);
        }
        addr = sock.daddr;
        port = sock.dport;
      } else {
        // TODO saddr and sport will be set for bind()'d UDP sockets, but what
        // should we be returning for TCP sockets that've been connect()'d?
        addr = sock.saddr || 0;
        port = sock.sport || 0;
      }
      return {
        addr,
        port
      };
    },
    sendmsg(sock, buffer, offset, length, addr, port) {
      if (sock.type === 2) {
        // connection-less sockets will honor the message address,
        // and otherwise fall back to the bound destination address
        if (addr === undefined || port === undefined) {
          addr = sock.daddr;
          port = sock.dport;
        }
        // if there was no address to fall back to, error out
        if (addr === undefined || port === undefined) {
          throw new FS.ErrnoError(17);
        }
      } else {
        // connection-based sockets will only use the bound
        addr = sock.daddr;
        port = sock.dport;
      }
      // find the peer for the destination address
      var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
      // early out if not connected with a connection-based socket
      if (sock.type === 1) {
        if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
          throw new FS.ErrnoError(53);
        }
      }
      // create a copy of the incoming data to send, as the WebSocket API
      // doesn't work entirely with an ArrayBufferView, it'll just send
      // the entire underlying buffer
      if (ArrayBuffer.isView(buffer)) {
        offset += buffer.byteOffset;
        buffer = buffer.buffer;
      }
      var data = buffer.slice(offset, offset + length);
      // WebSockets .send() does not allow passing a SharedArrayBuffer, so
      // clone the SharedArrayBuffer as regular ArrayBuffer before
      // sending.
      if (data instanceof SharedArrayBuffer) {
        data = new Uint8Array(new Uint8Array(data)).buffer;
      }
      // if we don't have a cached connectionless UDP datagram connection, or
      // the TCP socket is still connecting, queue the message to be sent upon
      // connect, and lie, saying the data was sent now.
      if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
        // if we're not connected, open a new connection
        if (sock.type === 2) {
          if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
            dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          }
        }
        dest.msg_send_queue.push(data);
        return length;
      }
      try {
        // send the actual data
        dest.socket.send(data);
        return length;
      } catch (e) {
        throw new FS.ErrnoError(28);
      }
    },
    recvmsg(sock, length) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
      if (sock.type === 1 && sock.server) {
        // tcp servers should not be recv()'ing on the listen socket
        throw new FS.ErrnoError(53);
      }
      var queued = sock.recv_queue.shift();
      if (!queued) {
        if (sock.type === 1) {
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
          if (!dest) {
            // if we have a destination address but are not connected, error out
            throw new FS.ErrnoError(53);
          }
          if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
            // return null if the socket has closed
            return null;
          }
          // else, our socket is in a valid state but truly has nothing available
          throw new FS.ErrnoError(6);
        }
        throw new FS.ErrnoError(6);
      }
      // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
      // requeued TCP data it'll be an ArrayBufferView
      var queuedLength = queued.data.byteLength || queued.data.length;
      var queuedOffset = queued.data.byteOffset || 0;
      var queuedBuffer = queued.data.buffer || queued.data;
      var bytesRead = Math.min(length, queuedLength);
      var res = {
        buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
        addr: queued.addr,
        port: queued.port
      };
      // push back any unread data for TCP connections
      if (sock.type === 1 && bytesRead < queuedLength) {
        var bytesRemaining = queuedLength - bytesRead;
        queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
        sock.recv_queue.unshift(queued);
      }
      return res;
    }
  }
};

var getSocketFromFD = fd => {
  var socket = SOCKFS.getSocket(fd);
  if (!socket) throw new FS.ErrnoError(8);
  return socket;
};

var inetNtop4 = addr => (addr & 255) + "." + ((addr >> 8) & 255) + "." + ((addr >> 16) & 255) + "." + ((addr >> 24) & 255);

var inetNtop6 = ints => {
  //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
  //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
  //  128-bits are split into eight 16-bit words
  //  stored in network byte order (big-endian)
  //  |                80 bits               | 16 |      32 bits        |
  //  +-----------------------------------------------------------------+
  //  |               10 bytes               |  2 |      4 bytes        |
  //  +--------------------------------------+--------------------------+
  //  +               5 words                |  1 |      2 words        |
  //  +--------------------------------------+--------------------------+
  //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
  //  +--------------------------------------+----+---------------------+
  //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
  //  +--------------------------------------+----+---------------------+
  var str = "";
  var word = 0;
  var longest = 0;
  var lastzero = 0;
  var zstart = 0;
  var len = 0;
  var i = 0;
  var parts = [ ints[0] & 65535, (ints[0] >> 16), ints[1] & 65535, (ints[1] >> 16), ints[2] & 65535, (ints[2] >> 16), ints[3] & 65535, (ints[3] >> 16) ];
  // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  var hasipv4 = true;
  var v4part = "";
  // check if the 10 high-order bytes are all zeros (first 5 words)
  for (i = 0; i < 5; i++) {
    if (parts[i] !== 0) {
      hasipv4 = false;
      break;
    }
  }
  if (hasipv4) {
    // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
    v4part = inetNtop4(parts[6] | (parts[7] << 16));
    // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
    if (parts[5] === -1) {
      str = "::ffff:";
      str += v4part;
      return str;
    }
    // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
    if (parts[5] === 0) {
      str = "::";
      // special case IPv6 addresses
      if (v4part === "0.0.0.0") v4part = "";
      // any/unspecified address
      if (v4part === "0.0.0.1") v4part = "1";
      // loopback address
      str += v4part;
      return str;
    }
  }
  // Handle all other IPv6 addresses
  // first run to find the longest contiguous zero words
  for (word = 0; word < 8; word++) {
    if (parts[word] === 0) {
      if (word - lastzero > 1) {
        len = 0;
      }
      lastzero = word;
      len++;
    }
    if (len > longest) {
      longest = len;
      zstart = word - longest + 1;
    }
  }
  for (word = 0; word < 8; word++) {
    if (longest > 1) {
      // compress contiguous zeros - to produce "::"
      if (parts[word] === 0 && word >= zstart && word < (zstart + longest)) {
        if (word === zstart) {
          str += ":";
          if (zstart === 0) str += ":";
        }
        continue;
      }
    }
    // converts 16-bit words from big-endian to little-endian before converting to hex string
    str += Number(_ntohs(parts[word] & 65535)).toString(16);
    str += word < 7 ? ":" : "";
  }
  return str;
};

var readSockaddr = (sa, salen) => {
  // family / port offsets are common to both sockaddr_in and sockaddr_in6
  var family = (growMemViews(), HEAP16)[((sa) >> 1)];
  var port = _ntohs((growMemViews(), HEAPU16)[(((sa) + (2)) >> 1)]);
  var addr;
  switch (family) {
   case 2:
    if (salen !== 16) {
      return {
        errno: 28
      };
    }
    addr = (growMemViews(), HEAP32)[(((sa) + (4)) >> 2)];
    addr = inetNtop4(addr);
    break;

   case 10:
    if (salen !== 28) {
      return {
        errno: 28
      };
    }
    addr = [ (growMemViews(), HEAP32)[(((sa) + (8)) >> 2)], (growMemViews(), HEAP32)[(((sa) + (12)) >> 2)], (growMemViews(), 
    HEAP32)[(((sa) + (16)) >> 2)], (growMemViews(), HEAP32)[(((sa) + (20)) >> 2)] ];
    addr = inetNtop6(addr);
    break;

   default:
    return {
      errno: 5
    };
  }
  return {
    family,
    addr,
    port
  };
};

var inetPton4 = str => {
  var b = str.split(".");
  for (var i = 0; i < 4; i++) {
    var tmp = Number(b[i]);
    if (isNaN(tmp)) return null;
    b[i] = tmp;
  }
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
};

var inetPton6 = str => {
  var words;
  var w, offset, z, i;
  /* http://home.deds.nl/~aeron/regex/ */ var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
  var parts = [];
  if (!valid6regx.test(str)) {
    return null;
  }
  if (str === "::") {
    return [ 0, 0, 0, 0, 0, 0, 0, 0 ];
  }
  // Z placeholder to keep track of zeros when splitting the string on ":"
  if (str.startsWith("::")) {
    str = str.replace("::", "Z:");
  } else {
    str = str.replace("::", ":Z:");
  }
  if (str.indexOf(".") > 0) {
    // parse IPv4 embedded address
    str = str.replace(new RegExp("[.]", "g"), ":");
    words = str.split(":");
    words[words.length - 4] = Number(words[words.length - 4]) + Number(words[words.length - 3]) * 256;
    words[words.length - 3] = Number(words[words.length - 2]) + Number(words[words.length - 1]) * 256;
    words = words.slice(0, words.length - 2);
  } else {
    words = str.split(":");
  }
  offset = 0;
  z = 0;
  for (w = 0; w < words.length; w++) {
    if (typeof words[w] == "string") {
      if (words[w] === "Z") {
        // compressed zeros - write appropriate number of zero words
        for (z = 0; z < (8 - words.length + 1); z++) {
          parts[w + z] = 0;
        }
        offset = z - 1;
      } else {
        // parse hex field to 16-bit value and write it in network byte-order
        parts[w + offset] = _htons(parseInt(words[w], 16));
      }
    } else {
      // parsed IPv4 words
      parts[w + offset] = words[w];
    }
  }
  return [ (parts[1] << 16) | parts[0], (parts[3] << 16) | parts[2], (parts[5] << 16) | parts[4], (parts[7] << 16) | parts[6] ];
};

var DNS = {
  address_map: {
    id: 1,
    addrs: {},
    names: {}
  },
  lookup_name(name) {
    // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
    var res = inetPton4(name);
    if (res !== null) {
      return name;
    }
    res = inetPton6(name);
    if (res !== null) {
      return name;
    }
    // See if this name is already mapped.
    var addr;
    if (DNS.address_map.addrs[name]) {
      addr = DNS.address_map.addrs[name];
    } else {
      var id = DNS.address_map.id++;
      assert(id < 65535, "exceeded max address mappings of 65535");
      addr = "172.29." + (id & 255) + "." + (id & 65280);
      DNS.address_map.names[addr] = name;
      DNS.address_map.addrs[name] = addr;
    }
    return addr;
  },
  lookup_addr(addr) {
    if (DNS.address_map.names[addr]) {
      return DNS.address_map.names[addr];
    }
    return null;
  }
};

var getSocketAddress = (addrp, addrlen) => {
  var info = readSockaddr(addrp, addrlen);
  if (info.errno) throw new FS.ErrnoError(info.errno);
  info.addr = DNS.lookup_addr(info.addr) || info.addr;
  return info;
};

function ___syscall_bind(fd, addr, addrlen, d1, d2, d3) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 0, 1, fd, addr, addrlen, d1, d2, d3);
  try {
    var sock = getSocketFromFD(fd);
    var info = getSocketAddress(addr, addrlen);
    sock.sock_ops.bind(sock, info.addr, info.port);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var SYSCALLS = {
  calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    // relative path
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  },
  writeStat(buf, stat) {
    (growMemViews(), HEAPU32)[((buf) >> 2)] = stat.dev;
    (growMemViews(), HEAPU32)[(((buf) + (4)) >> 2)] = stat.mode;
    (growMemViews(), HEAPU32)[(((buf) + (8)) >> 2)] = stat.nlink;
    (growMemViews(), HEAPU32)[(((buf) + (12)) >> 2)] = stat.uid;
    (growMemViews(), HEAPU32)[(((buf) + (16)) >> 2)] = stat.gid;
    (growMemViews(), HEAPU32)[(((buf) + (20)) >> 2)] = stat.rdev;
    (growMemViews(), HEAP64)[(((buf) + (24)) >> 3)] = BigInt(stat.size);
    (growMemViews(), HEAP32)[(((buf) + (32)) >> 2)] = 4096;
    (growMemViews(), HEAP32)[(((buf) + (36)) >> 2)] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    (growMemViews(), HEAP64)[(((buf) + (40)) >> 3)] = BigInt(Math.floor(atime / 1e3));
    (growMemViews(), HEAPU32)[(((buf) + (48)) >> 2)] = (atime % 1e3) * 1e3 * 1e3;
    (growMemViews(), HEAP64)[(((buf) + (56)) >> 3)] = BigInt(Math.floor(mtime / 1e3));
    (growMemViews(), HEAPU32)[(((buf) + (64)) >> 2)] = (mtime % 1e3) * 1e3 * 1e3;
    (growMemViews(), HEAP64)[(((buf) + (72)) >> 3)] = BigInt(Math.floor(ctime / 1e3));
    (growMemViews(), HEAPU32)[(((buf) + (80)) >> 2)] = (ctime % 1e3) * 1e3 * 1e3;
    (growMemViews(), HEAP64)[(((buf) + (88)) >> 3)] = BigInt(stat.ino);
    return 0;
  },
  writeStatFs(buf, stats) {
    (growMemViews(), HEAPU32)[(((buf) + (4)) >> 2)] = stats.bsize;
    (growMemViews(), HEAPU32)[(((buf) + (60)) >> 2)] = stats.bsize;
    (growMemViews(), HEAP64)[(((buf) + (8)) >> 3)] = BigInt(stats.blocks);
    (growMemViews(), HEAP64)[(((buf) + (16)) >> 3)] = BigInt(stats.bfree);
    (growMemViews(), HEAP64)[(((buf) + (24)) >> 3)] = BigInt(stats.bavail);
    (growMemViews(), HEAP64)[(((buf) + (32)) >> 3)] = BigInt(stats.files);
    (growMemViews(), HEAP64)[(((buf) + (40)) >> 3)] = BigInt(stats.ffree);
    (growMemViews(), HEAPU32)[(((buf) + (48)) >> 2)] = stats.fsid;
    (growMemViews(), HEAPU32)[(((buf) + (64)) >> 2)] = stats.flags;
    // ST_NOSUID
    (growMemViews(), HEAPU32)[(((buf) + (56)) >> 2)] = stats.namelen;
  },
  doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      // MAP_PRIVATE calls need not to be synced back to underlying fs
      return 0;
    }
    var buffer = (growMemViews(), HEAPU8).slice(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  },
  getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  },
  varargs: undefined,
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  }
};

function ___syscall_dup3(fd, newfd, flags) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 0, 1, fd, newfd, flags);
  try {
    var old = SYSCALLS.getStreamFromFD(fd);
    assert(!flags);
    if (old.fd === newfd) return -28;
    // Check newfd is within range of valid open file descriptors.
    if (newfd < 0 || newfd >= FS.MAX_OPEN_FDS) return -8;
    var existing = FS.getStream(newfd);
    if (existing) FS.close(existing);
    return FS.dupStream(old, newfd).fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var syscallGetVarargI = () => {
  assert(SYSCALLS.varargs != undefined);
  // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
  var ret = (growMemViews(), HEAP32)[((+SYSCALLS.varargs) >> 2)];
  SYSCALLS.varargs += 4;
  return ret;
};

var syscallGetVarargP = syscallGetVarargI;

function ___syscall_fcntl64(fd, cmd, varargs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 0, 1, fd, cmd, varargs);
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
     case 0:
      {
        var arg = syscallGetVarargI();
        if (arg < 0) {
          return -28;
        }
        while (FS.streams[arg]) {
          arg++;
        }
        var newStream;
        newStream = FS.dupStream(stream, arg);
        return newStream.fd;
      }

     case 1:
     case 2:
      return 0;

     // FD_CLOEXEC makes no sense for a single process.
      case 3:
      return stream.flags;

     case 4:
      {
        var arg = syscallGetVarargI();
        stream.flags |= arg;
        return 0;
      }

     case 12:
      {
        var arg = syscallGetVarargP();
        var offset = 0;
        // We're always unlocked.
        (growMemViews(), HEAP16)[(((arg) + (offset)) >> 1)] = 2;
        return 0;
      }

     case 13:
     case 14:
      // Pretend that the locking is successful. These are process-level locks,
      // and Emscripten programs are a single process. If we supported linking a
      // filesystem between programs, we'd need to do more here.
      // See https://github.com/emscripten-core/emscripten/issues/23697
      return 0;
    }
    return -28;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fstat64(fd, buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1, fd, buf);
  try {
    return SYSCALLS.writeStat(buf, FS.fstat(fd));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  return stringToUTF8Array(str, (growMemViews(), HEAPU8), outPtr, maxBytesToWrite);
};

function ___syscall_getcwd(buf, size) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 0, 1, buf, size);
  try {
    if (size === 0) return -28;
    var cwd = FS.cwd();
    var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
    if (size < cwdLengthInBytes) return -68;
    stringToUTF8(cwd, buf, size);
    return cwdLengthInBytes;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_getdents64(fd, dirp, count) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 0, 1, fd, dirp, count);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    stream.getdents ||= FS.readdir(stream.path);
    var struct_size = 280;
    var pos = 0;
    var off = FS.llseek(stream, 0, 1);
    var startIdx = Math.floor(off / struct_size);
    var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count / struct_size));
    for (var idx = startIdx; idx < endIdx; idx++) {
      var id;
      var type;
      var name = stream.getdents[idx];
      if (name === ".") {
        id = stream.node.id;
        type = 4;
      } else if (name === "..") {
        var lookup = FS.lookupPath(stream.path, {
          parent: true
        });
        id = lookup.node.id;
        type = 4;
      } else {
        var child;
        try {
          child = FS.lookupNode(stream.node, name);
        } catch (e) {
          // If the entry is not a directory, file, or symlink, nodefs
          // lookupNode will raise EINVAL. Skip these and continue.
          if (e?.errno === 28) {
            continue;
          }
          throw e;
        }
        id = child.id;
        type = FS.isChrdev(child.mode) ? 2 : // character device.
        FS.isDir(child.mode) ? 4 : // directory
        FS.isLink(child.mode) ? 10 : // symbolic link.
        8;
      }
      assert(id);
      (growMemViews(), HEAP64)[((dirp + pos) >> 3)] = BigInt(id);
      (growMemViews(), HEAP64)[(((dirp + pos) + (8)) >> 3)] = BigInt((idx + 1) * struct_size);
      (growMemViews(), HEAP16)[(((dirp + pos) + (16)) >> 1)] = 280;
      (growMemViews(), HEAP8)[(dirp + pos) + (18)] = type;
      stringToUTF8(name, dirp + pos + 19, 256);
      pos += struct_size;
    }
    FS.llseek(stream, idx * struct_size, 0);
    return pos;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

/** @param {number=} addrlen */ var writeSockaddr = (sa, family, addr, port, addrlen) => {
  switch (family) {
   case 2:
    addr = inetPton4(addr);
    zeroMemory(sa, 16);
    if (addrlen) {
      (growMemViews(), HEAP32)[((addrlen) >> 2)] = 16;
    }
    (growMemViews(), HEAP16)[((sa) >> 1)] = family;
    (growMemViews(), HEAP32)[(((sa) + (4)) >> 2)] = addr;
    (growMemViews(), HEAP16)[(((sa) + (2)) >> 1)] = _htons(port);
    break;

   case 10:
    addr = inetPton6(addr);
    zeroMemory(sa, 28);
    if (addrlen) {
      (growMemViews(), HEAP32)[((addrlen) >> 2)] = 28;
    }
    (growMemViews(), HEAP32)[((sa) >> 2)] = family;
    (growMemViews(), HEAP32)[(((sa) + (8)) >> 2)] = addr[0];
    (growMemViews(), HEAP32)[(((sa) + (12)) >> 2)] = addr[1];
    (growMemViews(), HEAP32)[(((sa) + (16)) >> 2)] = addr[2];
    (growMemViews(), HEAP32)[(((sa) + (20)) >> 2)] = addr[3];
    (growMemViews(), HEAP16)[(((sa) + (2)) >> 1)] = _htons(port);
    break;

   default:
    return 5;
  }
  return 0;
};

function ___syscall_getsockname(fd, addr, addrlen, d1, d2, d3) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 0, 1, fd, addr, addrlen, d1, d2, d3);
  try {
    var sock = getSocketFromFD(fd);
    // TODO: sock.saddr should never be undefined, see TODO in websocket_sock_ops.getname
    var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport, addrlen);
    assert(!errno);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_getsockopt(fd, level, optname, optval, optlen, d1) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, fd, level, optname, optval, optlen, d1);
  try {
    var sock = getSocketFromFD(fd);
    // Minimal getsockopt aimed at resolving https://github.com/emscripten-core/emscripten/issues/2211
    // so only supports SOL_SOCKET with SO_ERROR.
    if (level === 1) {
      if (optname === 4) {
        (growMemViews(), HEAP32)[((optval) >> 2)] = sock.error;
        (growMemViews(), HEAP32)[((optlen) >> 2)] = 4;
        sock.error = null;
        // Clear the error (The SO_ERROR option obtains and then clears this field).
        return 0;
      }
    }
    return -50;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_ioctl(fd, op, varargs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 0, 1, fd, op, varargs);
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
     case 21509:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     case 21505:
      {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcgets) {
          var termios = stream.tty.ops.ioctl_tcgets(stream);
          var argp = syscallGetVarargP();
          (growMemViews(), HEAP32)[((argp) >> 2)] = termios.c_iflag || 0;
          (growMemViews(), HEAP32)[(((argp) + (4)) >> 2)] = termios.c_oflag || 0;
          (growMemViews(), HEAP32)[(((argp) + (8)) >> 2)] = termios.c_cflag || 0;
          (growMemViews(), HEAP32)[(((argp) + (12)) >> 2)] = termios.c_lflag || 0;
          for (var i = 0; i < 32; i++) {
            (growMemViews(), HEAP8)[(argp + i) + (17)] = termios.c_cc[i] || 0;
          }
          return 0;
        }
        return 0;
      }

     case 21510:
     case 21511:
     case 21512:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     case 21506:
     case 21507:
     case 21508:
      {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcsets) {
          var argp = syscallGetVarargP();
          var c_iflag = (growMemViews(), HEAP32)[((argp) >> 2)];
          var c_oflag = (growMemViews(), HEAP32)[(((argp) + (4)) >> 2)];
          var c_cflag = (growMemViews(), HEAP32)[(((argp) + (8)) >> 2)];
          var c_lflag = (growMemViews(), HEAP32)[(((argp) + (12)) >> 2)];
          var c_cc = [];
          for (var i = 0; i < 32; i++) {
            c_cc.push((growMemViews(), HEAP8)[(argp + i) + (17)]);
          }
          return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
            c_iflag,
            c_oflag,
            c_cflag,
            c_lflag,
            c_cc
          });
        }
        return 0;
      }

     case 21519:
      {
        if (!stream.tty) return -59;
        var argp = syscallGetVarargP();
        (growMemViews(), HEAP32)[((argp) >> 2)] = 0;
        return 0;
      }

     case 21520:
      {
        if (!stream.tty) return -59;
        return -28;
      }

     case 21537:
     case 21531:
      {
        var argp = syscallGetVarargP();
        return FS.ioctl(stream, op, argp);
      }

     case 21523:
      {
        // TODO: in theory we should write to the winsize struct that gets
        // passed in, but for now musl doesn't read anything on it
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tiocgwinsz) {
          var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
          var argp = syscallGetVarargP();
          (growMemViews(), HEAP16)[((argp) >> 1)] = winsize[0];
          (growMemViews(), HEAP16)[(((argp) + (2)) >> 1)] = winsize[1];
        }
        return 0;
      }

     case 21524:
      {
        // TODO: technically, this ioctl call should change the window size.
        // but, since emscripten doesn't have any concept of a terminal window
        // yet, we'll just silently throw it away as we do TIOCGWINSZ
        if (!stream.tty) return -59;
        return 0;
      }

     case 21515:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     default:
      return -28;
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_lstat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 0, 1, path, buf);
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.writeStat(buf, FS.lstat(path));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_mkdirat(dirfd, path, mode) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 0, 1, dirfd, path, mode);
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    FS.mkdir(path, mode, 0);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 0, 1, dirfd, path, buf, flags);
  try {
    path = SYSCALLS.getStr(path);
    var nofollow = flags & 256;
    var allowEmpty = flags & 4096;
    flags = flags & (~6400);
    assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
    path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
    return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(15, 0, 1, dirfd, path, flags, varargs);
  SYSCALLS.varargs = varargs;
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    var mode = varargs ? syscallGetVarargI() : 0;
    return FS.open(path, flags, mode).fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(16, 0, 1, fd, buf, len, flags, addr, addrlen);
  try {
    var sock = getSocketFromFD(fd);
    var msg = sock.sock_ops.recvmsg(sock, len);
    if (!msg) return 0;
    // socket is closed
    if (addr) {
      var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
      assert(!errno);
    }
    (growMemViews(), HEAPU8).set(msg.buffer, buf);
    return msg.buffer.byteLength;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_rmdir(path) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(17, 0, 1, path);
  try {
    path = SYSCALLS.getStr(path);
    FS.rmdir(path);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(18, 0, 1, fd, message, length, flags, addr, addr_len);
  try {
    var sock = getSocketFromFD(fd);
    if (!addr) {
      // send, no address provided
      return FS.write(sock.stream, (growMemViews(), HEAP8), message, length);
    }
    var dest = getSocketAddress(addr, addr_len);
    // sendto an address
    return sock.sock_ops.sendmsg(sock, (growMemViews(), HEAP8), message, length, dest.addr, dest.port);
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_socket(domain, type, protocol) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(19, 0, 1, domain, type, protocol);
  try {
    var sock = SOCKFS.createSocket(domain, type, protocol);
    assert(sock.stream.fd < 64);
    // XXX ? select() assumes socket fd values are in 0..63
    return sock.stream.fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_stat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(20, 0, 1, path, buf);
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.writeStat(buf, FS.stat(path));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_unlinkat(dirfd, path, flags) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(21, 0, 1, dirfd, path, flags);
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (!flags) {
      FS.unlink(path);
    } else if (flags === 512) {
      FS.rmdir(path);
    } else {
      return -28;
    }
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var __abort_js = () => abort("native code called abort()");

var AsciiToString = ptr => {
  var str = "";
  while (1) {
    var ch = (growMemViews(), HEAPU8)[ptr++];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
};

var awaitingDependencies = {};

var registeredTypes = {};

var typeDependencies = {};

var BindingError = class BindingError extends Error {
  constructor(message) {
    super(message);
    this.name = "BindingError";
  }
};

var throwBindingError = message => {
  throw new BindingError(message);
};

/** @param {Object=} options */ function sharedRegisterType(rawType, registeredInstance, options = {}) {
  var name = registeredInstance.name;
  if (!rawType) {
    throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
  }
  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError(`Cannot register type '${name}' twice`);
    }
  }
  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];
  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach(cb => cb());
  }
}

/** @param {Object=} options */ function registerType(rawType, registeredInstance, options = {}) {
  return sharedRegisterType(rawType, registeredInstance, options);
}

var integerReadValueFromPointer = (name, width, signed) => {
  // integers are quite common, so generate very specialized functions
  switch (width) {
   case 1:
    return signed ? pointer => (growMemViews(), HEAP8)[pointer] : pointer => (growMemViews(), 
    HEAPU8)[pointer];

   case 2:
    return signed ? pointer => (growMemViews(), HEAP16)[((pointer) >> 1)] : pointer => (growMemViews(), 
    HEAPU16)[((pointer) >> 1)];

   case 4:
    return signed ? pointer => (growMemViews(), HEAP32)[((pointer) >> 2)] : pointer => (growMemViews(), 
    HEAPU32)[((pointer) >> 2)];

   case 8:
    return signed ? pointer => (growMemViews(), HEAP64)[((pointer) >> 3)] : pointer => (growMemViews(), 
    HEAPU64)[((pointer) >> 3)];

   default:
    throw new TypeError(`invalid integer width (${width}): ${name}`);
  }
};

var embindRepr = v => {
  if (v === null) {
    return "null";
  }
  var t = typeof v;
  if (t === "object" || t === "array" || t === "function") {
    return v.toString();
  } else {
    return "" + v;
  }
};

var assertIntegerRange = (typeName, value, minRange, maxRange) => {
  if (value < minRange || value > maxRange) {
    throw new TypeError(`Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${typeName}", which is outside the valid range [${minRange}, ${maxRange}]!`);
  }
};

/** @suppress {globalThis} */ var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {
  name = AsciiToString(name);
  const isUnsignedType = minRange === 0n;
  let fromWireType = value => value;
  if (isUnsignedType) {
    // uint64 get converted to int64 in ABI, fix them up like we do for 32-bit integers.
    const bitSize = size * 8;
    fromWireType = value => BigInt.asUintN(bitSize, value);
    maxRange = fromWireType(maxRange);
  }
  registerType(primitiveType, {
    name,
    fromWireType,
    toWireType: (destructors, value) => {
      if (typeof value == "number") {
        value = BigInt(value);
      } else if (typeof value != "bigint") {
        throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${this.name}`);
      }
      assertIntegerRange(name, value, minRange, maxRange);
      return value;
    },
    readValueFromPointer: integerReadValueFromPointer(name, size, !isUnsignedType),
    destructorFunction: null
  });
};

/** @suppress {globalThis} */ var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
  name = AsciiToString(name);
  registerType(rawType, {
    name,
    fromWireType: function(wt) {
      // ambiguous emscripten ABI: sometimes return values are
      // true or false, and sometimes integers (0 or 1)
      return !!wt;
    },
    toWireType: function(destructors, o) {
      return o ? trueValue : falseValue;
    },
    readValueFromPointer: function(pointer) {
      return this.fromWireType((growMemViews(), HEAPU8)[pointer]);
    },
    destructorFunction: null
  });
};

var emval_freelist = [];

var emval_handles = [ 0, 1, , 1, null, 1, true, 1, false, 1 ];

var __emval_decref = handle => {
  if (handle > 9 && 0 === --emval_handles[handle + 1]) {
    assert(emval_handles[handle] !== undefined, `Decref for unallocated handle.`);
    emval_handles[handle] = undefined;
    emval_freelist.push(handle);
  }
};

var Emval = {
  toValue: handle => {
    if (!handle) {
      throwBindingError(`Cannot use deleted val. handle = ${handle}`);
    }
    // handle 2 is supposed to be `undefined`.
    assert(handle === 2 || emval_handles[handle] !== undefined && handle % 2 === 0, `invalid handle: ${handle}`);
    return emval_handles[handle];
  },
  toHandle: value => {
    switch (value) {
     case undefined:
      return 2;

     case null:
      return 4;

     case true:
      return 6;

     case false:
      return 8;

     default:
      {
        const handle = emval_freelist.pop() || emval_handles.length;
        emval_handles[handle] = value;
        emval_handles[handle + 1] = 1;
        return handle;
      }
    }
  }
};

/** @suppress {globalThis} */ function readPointer(pointer) {
  return this.fromWireType((growMemViews(), HEAPU32)[((pointer) >> 2)]);
}

var EmValType = {
  name: "emscripten::val",
  fromWireType: handle => {
    var rv = Emval.toValue(handle);
    __emval_decref(handle);
    return rv;
  },
  toWireType: (destructors, value) => Emval.toHandle(value),
  readValueFromPointer: readPointer,
  destructorFunction: null
};

var __embind_register_emval = rawType => registerType(rawType, EmValType);

var floatReadValueFromPointer = (name, width) => {
  switch (width) {
   case 4:
    return function(pointer) {
      return this.fromWireType((growMemViews(), HEAPF32)[((pointer) >> 2)]);
    };

   case 8:
    return function(pointer) {
      return this.fromWireType((growMemViews(), HEAPF64)[((pointer) >> 3)]);
    };

   default:
    throw new TypeError(`invalid float width (${width}): ${name}`);
  }
};

var __embind_register_float = (rawType, name, size) => {
  name = AsciiToString(name);
  registerType(rawType, {
    name,
    fromWireType: value => value,
    toWireType: (destructors, value) => {
      if (typeof value != "number" && typeof value != "boolean") {
        throw new TypeError(`Cannot convert ${embindRepr(value)} to ${this.name}`);
      }
      // The VM will perform JS to Wasm value conversion, according to the spec:
      // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
      return value;
    },
    readValueFromPointer: floatReadValueFromPointer(name, size),
    destructorFunction: null
  });
};

/** @suppress {globalThis} */ var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
  name = AsciiToString(name);
  const isUnsignedType = minRange === 0;
  let fromWireType = value => value;
  if (isUnsignedType) {
    var bitshift = 32 - 8 * size;
    fromWireType = value => (value << bitshift) >>> bitshift;
    maxRange = fromWireType(maxRange);
  }
  registerType(primitiveType, {
    name,
    fromWireType,
    toWireType: (destructors, value) => {
      if (typeof value != "number" && typeof value != "boolean") {
        throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${name}`);
      }
      assertIntegerRange(name, value, minRange, maxRange);
      // The VM will perform JS to Wasm value conversion, according to the spec:
      // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
      return value;
    },
    readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0),
    destructorFunction: null
  });
};

var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
  var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array ];
  var TA = typeMapping[dataTypeIndex];
  function decodeMemoryView(handle) {
    var size = (growMemViews(), HEAPU32)[((handle) >> 2)];
    var data = (growMemViews(), HEAPU32)[(((handle) + (4)) >> 2)];
    return new TA((growMemViews(), HEAP8).buffer, data, size);
  }
  name = AsciiToString(name);
  registerType(rawType, {
    name,
    fromWireType: decodeMemoryView,
    readValueFromPointer: decodeMemoryView
  }, {
    ignoreDuplicateRegistrations: true
  });
};

var __embind_register_std_string = (rawType, name) => {
  name = AsciiToString(name);
  var stdStringIsUTF8 = true;
  registerType(rawType, {
    name,
    // For some method names we use string keys here since they are part of
    // the public/external API and/or used by the runtime-generated code.
    fromWireType(value) {
      var length = (growMemViews(), HEAPU32)[((value) >> 2)];
      var payload = value + 4;
      var str;
      if (stdStringIsUTF8) {
        str = UTF8ToString(payload, length, true);
      } else {
        str = "";
        for (var i = 0; i < length; ++i) {
          str += String.fromCharCode((growMemViews(), HEAPU8)[payload + i]);
        }
      }
      _free(value);
      return str;
    },
    toWireType(destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value);
      }
      var length;
      var valueIsOfTypeString = (typeof value == "string");
      // We accept `string` or array views with single byte elements
      if (!(valueIsOfTypeString || (ArrayBuffer.isView(value) && value.BYTES_PER_ELEMENT == 1))) {
        throwBindingError("Cannot pass non-string to std::string");
      }
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        length = lengthBytesUTF8(value);
      } else {
        length = value.length;
      }
      // assumes POINTER_SIZE alignment
      var base = _malloc(4 + length + 1);
      var ptr = base + 4;
      (growMemViews(), HEAPU32)[((base) >> 2)] = length;
      if (valueIsOfTypeString) {
        if (stdStringIsUTF8) {
          stringToUTF8(value, ptr, length + 1);
        } else {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);
            if (charCode > 255) {
              _free(base);
              throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
            }
            (growMemViews(), HEAPU8)[ptr + i] = charCode;
          }
        }
      } else {
        (growMemViews(), HEAPU8).set(value, ptr);
      }
      if (destructors !== null) {
        destructors.push(_free, base);
      }
      return base;
    },
    readValueFromPointer: readPointer,
    destructorFunction(ptr) {
      _free(ptr);
    }
  });
};

var UTF16Decoder = globalThis.TextDecoder ? new TextDecoder("utf-16le") : undefined;

var UTF16ToString = (ptr, maxBytesToRead, ignoreNul) => {
  assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
  var idx = ((ptr) >> 1);
  var endIdx = findStringEnd((growMemViews(), HEAPU16), idx, maxBytesToRead / 2, ignoreNul);
  // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
  if (endIdx - idx > 16 && UTF16Decoder) return UTF16Decoder.decode((growMemViews(), 
  HEAPU16).slice(idx, endIdx));
  // Fallback: decode without UTF16Decoder
  var str = "";
  // If maxBytesToRead is not passed explicitly, it will be undefined, and the
  // for-loop's condition will always evaluate to true. The loop is then
  // terminated on the first null char.
  for (var i = idx; i < endIdx; ++i) {
    var codeUnit = (growMemViews(), HEAPU16)[i];
    // fromCharCode constructs a character from a UTF-16 code unit, so we can
    // pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
  return str;
};

var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
  assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
  assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  maxBytesToWrite ??= 2147483647;
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length * 2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i);
    // possibly a lead surrogate
    (growMemViews(), HEAP16)[((outPtr) >> 1)] = codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  (growMemViews(), HEAP16)[((outPtr) >> 1)] = 0;
  return outPtr - startPtr;
};

var lengthBytesUTF16 = str => str.length * 2;

var UTF32ToString = (ptr, maxBytesToRead, ignoreNul) => {
  assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
  var str = "";
  var startIdx = ((ptr) >> 2);
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  for (var i = 0; !(i >= maxBytesToRead / 4); i++) {
    var utf32 = (growMemViews(), HEAPU32)[startIdx + i];
    if (!utf32 && !ignoreNul) break;
    str += String.fromCodePoint(utf32);
  }
  return str;
};

var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
  assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
  assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  maxBytesToWrite ??= 2147483647;
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    var codePoint = str.codePointAt(i);
    // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
    // We need to manually skip over the second code unit for correct iteration.
    if (codePoint > 65535) {
      i++;
    }
    (growMemViews(), HEAP32)[((outPtr) >> 2)] = codePoint;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  (growMemViews(), HEAP32)[((outPtr) >> 2)] = 0;
  return outPtr - startPtr;
};

var lengthBytesUTF32 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var codePoint = str.codePointAt(i);
    // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
    // We need to manually skip over the second code unit for correct iteration.
    if (codePoint > 65535) {
      i++;
    }
    len += 4;
  }
  return len;
};

var __embind_register_std_wstring = (rawType, charSize, name) => {
  name = AsciiToString(name);
  var decodeString, encodeString, lengthBytesUTF;
  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;
  } else {
    assert(charSize === 4, "only 2-byte and 4-byte strings are currently supported");
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;
  }
  registerType(rawType, {
    name,
    fromWireType: value => {
      // Code mostly taken from _embind_register_std_string fromWireType
      var length = (growMemViews(), HEAPU32)[((value) >> 2)];
      var str = decodeString(value + 4, length * charSize, true);
      _free(value);
      return str;
    },
    toWireType: (destructors, value) => {
      if (!(typeof value == "string")) {
        throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
      }
      // assumes POINTER_SIZE alignment
      var length = lengthBytesUTF(value);
      var ptr = _malloc(4 + length + charSize);
      (growMemViews(), HEAPU32)[((ptr) >> 2)] = length / charSize;
      encodeString(value, ptr + 4, length + charSize);
      if (destructors !== null) {
        destructors.push(_free, ptr);
      }
      return ptr;
    },
    readValueFromPointer: readPointer,
    destructorFunction(ptr) {
      _free(ptr);
    }
  });
};

var __embind_register_void = (rawType, name) => {
  name = AsciiToString(name);
  registerType(rawType, {
    isVoid: true,
    // void return values can be optimized out sometimes
    name,
    fromWireType: () => undefined,
    // TODO: assert if anything else is given?
    toWireType: (destructors, o) => undefined
  });
};

var __emscripten_init_main_thread_js = tb => {
  // Pass the thread address to the native code where they are stored in wasm
  // globals which act as a form of TLS. Global constructors trying
  // to access this value will read the wrong value, but that is UB anyway.
  __emscripten_thread_init(tb, /*is_main=*/ !ENVIRONMENT_IS_WORKER, /*is_runtime=*/ 1, /*can_block=*/ !ENVIRONMENT_IS_WEB, /*default_stacksize=*/ 1048576, /*start_profiling=*/ false);
  PThread.threadInitTLS();
};

var __emscripten_lookup_name = name => {
  // uint32_t _emscripten_lookup_name(const char *name);
  var nameString = UTF8ToString(name);
  return inetPton4(DNS.lookup_name(nameString));
};

var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 1048576)");
    }
  }
  quit_(1, e);
};

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      if (ENVIRONMENT_IS_PTHREAD) {
        // exit the current thread, but only if there is one active.
        // TODO(https://github.com/emscripten-core/emscripten/issues/25076):
        // Unify this check with the runtimeExited check above
        if (_pthread_self()) __emscripten_thread_exit(EXITSTATUS);
        return;
      }
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

var callUserCallback = func => {
  if (ABORT) {
    err("user callback triggered after runtime exited or application aborted.  Ignoring.");
    return;
  }
  try {
    return func();
  } catch (e) {
    handleException(e);
  } finally {
    maybeExit();
  }
};

var waitAsyncPolyfilled = (!Atomics.waitAsync || (globalThis.navigator?.userAgent && Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]) < 91));

var __emscripten_thread_mailbox_await = pthread_ptr => {
  if (!waitAsyncPolyfilled) {
    // Wait on the pthread's initial self-pointer field because it is easy and
    // safe to access from sending threads that need to notify the waiting
    // thread.
    // TODO: How to make this work with wasm64?
    var wait = Atomics.waitAsync((growMemViews(), HEAP32), ((pthread_ptr) >> 2), pthread_ptr);
    assert(wait.async);
    wait.value.then(checkMailbox);
    var waitingAsync = pthread_ptr + 120;
    Atomics.store((growMemViews(), HEAP32), ((waitingAsync) >> 2), 1);
  }
};

var checkMailbox = () => callUserCallback(() => {
  // Only check the mailbox if we have a live pthread runtime. We implement
  // pthread_self to return 0 if there is no live runtime.
  // TODO(https://github.com/emscripten-core/emscripten/issues/25076):
  // Is this check still needed?  `callUserCallback` is supposed to
  // ensure the runtime is alive, and if `_pthread_self` is NULL then the
  // runtime certainly is *not* alive, so this should be a redundant check.
  var pthread_ptr = _pthread_self();
  if (pthread_ptr) {
    // If we are using Atomics.waitAsync as our notification mechanism, wait
    // for a notification before processing the mailbox to avoid missing any
    // work that could otherwise arrive after we've finished processing the
    // mailbox and before we're ready for the next notification.
    __emscripten_thread_mailbox_await(pthread_ptr);
    __emscripten_check_mailbox();
  }
});

var __emscripten_notify_mailbox_postmessage = (targetThread, currThreadId) => {
  if (targetThread == currThreadId) {
    setTimeout(checkMailbox);
  } else if (ENVIRONMENT_IS_PTHREAD) {
    postMessage({
      targetThread,
      cmd: "checkMailbox"
    });
  } else {
    var worker = PThread.pthreads[targetThread];
    if (!worker) {
      err(`Cannot send message to thread with ID ${targetThread}, unknown thread ID!`);
      return;
    }
    worker.postMessage({
      cmd: "checkMailbox"
    });
  }
};

var proxiedJSCallArgs = [];

var __emscripten_receive_on_main_thread_js = (funcIndex, emAsmAddr, callingThread, bufSize, args, ctx, ctxArgs) => {
  // Sometimes we need to backproxy events to the calling thread (e.g.
  // HTML5 DOM events handlers such as
  // emscripten_set_mousemove_callback()), so keep track in a globally
  // accessible variable about the thread that initiated the proxying.
  proxiedJSCallArgs.length = 0;
  var b = ((args) >> 3);
  var end = ((args + bufSize) >> 3);
  while (b < end) {
    var arg;
    if ((growMemViews(), HEAP64)[b++]) {
      // It's a BigInt.
      arg = (growMemViews(), HEAP64)[b++];
    } else {
      // It's a Number.
      arg = (growMemViews(), HEAPF64)[b++];
    }
    proxiedJSCallArgs.push(arg);
  }
  // Proxied JS library funcs use funcIndex and EM_ASM functions use emAsmAddr
  var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex];
  assert(!(funcIndex && emAsmAddr));
  assert(func.length == proxiedJSCallArgs.length, "Call args mismatch in _emscripten_receive_on_main_thread_js");
  PThread.currentProxiedOperationCallerThread = callingThread;
  var rtn = func(...proxiedJSCallArgs);
  PThread.currentProxiedOperationCallerThread = 0;
  if (ctx) {
    rtn.then(rtn => __emscripten_run_js_on_main_thread_done(ctx, ctxArgs, rtn));
    return;
  }
  // Proxied functions can return any type except bigint.  All other types
  // coerce to f64/double (the return type of this function in C) but not
  // bigint.
  assert(typeof rtn != "bigint");
  return rtn;
};

var __emscripten_runtime_keepalive_clear = () => {
  noExitRuntime = false;
  runtimeKeepaliveCounter = 0;
};

var __emscripten_thread_cleanup = thread => {
  // Called when a thread needs to be cleaned up so it can be reused.
  // A thread is considered reusable when it either returns from its
  // entry point, calls pthread_exit, or acts upon a cancellation.
  // Detached threads are responsible for calling this themselves,
  // otherwise pthread_join is responsible for calling this.
  if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
    cmd: "cleanupThread",
    thread
  });
};

var __emscripten_thread_set_strongref = thread => {
  // Called when a thread needs to be strongly referenced.
  // Currently only used for:
  // - keeping the "main" thread alive in PROXY_TO_PTHREAD mode;
  // - crashed threads that need to propagate the uncaught exception
  //   back to the main thread.
  if (ENVIRONMENT_IS_NODE) {
    PThread.pthreads[thread].ref();
  }
};

var __emscripten_throw_longjmp = () => {
  throw new EmscriptenSjLj;
};

var emval_methodCallers = [];

var emval_addMethodCaller = caller => {
  var id = emval_methodCallers.length;
  emval_methodCallers.push(caller);
  return id;
};

var getTypeName = type => {
  var ptr = ___getTypeName(type);
  var rv = AsciiToString(ptr);
  _free(ptr);
  return rv;
};

var requireRegisteredType = (rawType, humanName) => {
  var impl = registeredTypes[rawType];
  if (undefined === impl) {
    throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
  }
  return impl;
};

var emval_lookupTypes = (argCount, argTypes) => {
  var a = new Array(argCount);
  for (var i = 0; i < argCount; ++i) {
    a[i] = requireRegisteredType((growMemViews(), HEAPU32)[(((argTypes) + (i * 4)) >> 2)], `parameter ${i}`);
  }
  return a;
};

var createNamedFunction = (name, func) => Object.defineProperty(func, "name", {
  value: name
});

var emval_returnValue = (toReturnWire, destructorsRef, handle) => {
  var destructors = [];
  var result = toReturnWire(destructors, handle);
  if (destructors.length) {
    // void, primitives and any other types w/o destructors don't need to allocate a handle
    (growMemViews(), HEAPU32)[((destructorsRef) >> 2)] = Emval.toHandle(destructors);
  }
  return result;
};

var emval_symbols = {};

var getStringOrSymbol = address => {
  var symbol = emval_symbols[address];
  if (symbol === undefined) {
    return AsciiToString(address);
  }
  return symbol;
};

var __emval_create_invoker = (argCount, argTypesPtr, kind) => {
  var GenericWireTypeSize = 8;
  var [retType, ...argTypes] = emval_lookupTypes(argCount, argTypesPtr);
  var toReturnWire = retType.toWireType.bind(retType);
  var argFromPtr = argTypes.map(type => type.readValueFromPointer.bind(type));
  argCount--;
  // remove the extracted return type
  var captures = {
    "toValue": Emval.toValue
  };
  var args = argFromPtr.map((argFromPtr, i) => {
    var captureName = `argFromPtr${i}`;
    captures[captureName] = argFromPtr;
    return `${captureName}(args${i ? "+" + i * GenericWireTypeSize : ""})`;
  });
  var functionBody;
  switch (kind) {
   case 0:
    functionBody = "toValue(handle)";
    break;

   case 2:
    functionBody = "new (toValue(handle))";
    break;

   case 3:
    functionBody = "";
    break;

   case 1:
    captures["getStringOrSymbol"] = getStringOrSymbol;
    functionBody = "toValue(handle)[getStringOrSymbol(methodName)]";
    break;
  }
  functionBody += `(${args})`;
  if (!retType.isVoid) {
    captures["toReturnWire"] = toReturnWire;
    captures["emval_returnValue"] = emval_returnValue;
    functionBody = `return emval_returnValue(toReturnWire, destructorsRef, ${functionBody})`;
  }
  functionBody = `return function (handle, methodName, destructorsRef, args) {\n${functionBody}\n}`;
  var invokerFunction = new Function(Object.keys(captures), functionBody)(...Object.values(captures));
  var functionName = `methodCaller<(${argTypes.map(t => t.name)}) => ${retType.name}>`;
  return emval_addMethodCaller(createNamedFunction(functionName, invokerFunction));
};

var __emval_get_global = name => {
  if (!name) {
    return Emval.toHandle(globalThis);
  }
  name = getStringOrSymbol(name);
  return Emval.toHandle(globalThis[name]);
};

var __emval_get_property = (handle, key) => {
  handle = Emval.toValue(handle);
  key = Emval.toValue(key);
  return Emval.toHandle(handle[key]);
};

var __emval_incref = handle => {
  if (handle > 9) {
    emval_handles[handle + 1] += 1;
  }
};

var __emval_invoke = (caller, handle, methodName, destructorsRef, args) => emval_methodCallers[caller](handle, methodName, destructorsRef, args);

var __emval_new_cstring = v => Emval.toHandle(getStringOrSymbol(v));

var runDestructors = destructors => {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr);
  }
};

var __emval_run_destructors = handle => {
  var destructors = Emval.toValue(handle);
  runDestructors(destructors);
  __emval_decref(handle);
};

var INT53_MAX = 9007199254740992;

var INT53_MIN = -9007199254740992;

var bigintToI53Checked = num => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);

function __gmtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  (growMemViews(), HEAP32)[((tmPtr) >> 2)] = date.getUTCSeconds();
  (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)] = date.getUTCMinutes();
  (growMemViews(), HEAP32)[(((tmPtr) + (8)) >> 2)] = date.getUTCHours();
  (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)] = date.getUTCDate();
  (growMemViews(), HEAP32)[(((tmPtr) + (16)) >> 2)] = date.getUTCMonth();
  (growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] = date.getUTCFullYear() - 1900;
  (growMemViews(), HEAP32)[(((tmPtr) + (24)) >> 2)] = date.getUTCDay();
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (28)) >> 2)] = yday;
}

var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

var ydayFromDate = date => {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  // -1 since it's days since Jan 1
  return yday;
};

function __localtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  (growMemViews(), HEAP32)[((tmPtr) >> 2)] = date.getSeconds();
  (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
  (growMemViews(), HEAP32)[(((tmPtr) + (8)) >> 2)] = date.getHours();
  (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)] = date.getDate();
  (growMemViews(), HEAP32)[(((tmPtr) + (16)) >> 2)] = date.getMonth();
  (growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] = date.getFullYear() - 1900;
  (growMemViews(), HEAP32)[(((tmPtr) + (24)) >> 2)] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (28)) >> 2)] = yday;
  (growMemViews(), HEAP32)[(((tmPtr) + (36)) >> 2)] = -(date.getTimezoneOffset() * 60);
  // Attention: DST is in December in South, and some regions don't have DST at all.
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (32)) >> 2)] = dst;
}

var __mktime_js = function(tmPtr) {
  var ret = (() => {
    var date = new Date((growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] + 1900, (growMemViews(), 
    HEAP32)[(((tmPtr) + (16)) >> 2)], (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)], (growMemViews(), 
    HEAP32)[(((tmPtr) + (8)) >> 2)], (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)], (growMemViews(), 
    HEAP32)[((tmPtr) >> 2)], 0);
    // There's an ambiguous hour when the time goes back; the tm_isdst field is
    // used to disambiguate it.  Date() basically guesses, so we fix it up if it
    // guessed wrong, or fill in tm_isdst with the guess if it's -1.
    var dst = (growMemViews(), HEAP32)[(((tmPtr) + (32)) >> 2)];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset);
    // DST is in December in South
    if (dst < 0) {
      // Attention: some regions don't have DST at all.
      (growMemViews(), HEAP32)[(((tmPtr) + (32)) >> 2)] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
    } else if ((dst > 0) != (dstOffset == guessedOffset)) {
      var nonDstOffset = Math.max(winterOffset, summerOffset);
      var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
      // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
      date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
    }
    (growMemViews(), HEAP32)[(((tmPtr) + (24)) >> 2)] = date.getDay();
    var yday = ydayFromDate(date) | 0;
    (growMemViews(), HEAP32)[(((tmPtr) + (28)) >> 2)] = yday;
    // To match expected behavior, update fields from date
    (growMemViews(), HEAP32)[((tmPtr) >> 2)] = date.getSeconds();
    (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
    (growMemViews(), HEAP32)[(((tmPtr) + (8)) >> 2)] = date.getHours();
    (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)] = date.getDate();
    (growMemViews(), HEAP32)[(((tmPtr) + (16)) >> 2)] = date.getMonth();
    (growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] = date.getYear();
    var timeMs = date.getTime();
    if (isNaN(timeMs)) {
      return -1;
    }
    // Return time in microseconds
    return timeMs / 1e3;
  })();
  return BigInt(ret);
};

function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(22, 0, 1, len, prot, flags, fd, offset, allocated, addr);
  offset = bigintToI53Checked(offset);
  try {
    // musl's mmap doesn't allow values over a certain limit
    // see OFF_MASK in mmap.c.
    assert(!isNaN(offset));
    var stream = SYSCALLS.getStreamFromFD(fd);
    var res = FS.mmap(stream, len, offset, prot, flags);
    var ptr = res.ptr;
    (growMemViews(), HEAP32)[((allocated) >> 2)] = res.allocated;
    (growMemViews(), HEAPU32)[((addr) >> 2)] = ptr;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function __munmap_js(addr, len, prot, flags, fd, offset) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(23, 0, 1, addr, len, prot, flags, fd, offset);
  offset = bigintToI53Checked(offset);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    if (prot & 2) {
      SYSCALLS.doMsync(addr, stream, len, flags, offset);
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var __tzset_js = (timezone, daylight, std_name, dst_name) => {
  // TODO: Use (malleable) environment variables instead of system settings.
  var currentYear = (new Date).getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  // Local standard timezone offset. Local standard time is not adjusted for
  // daylight savings.  This code uses the fact that getTimezoneOffset returns
  // a greater value during Standard Time versus Daylight Saving Time (DST).
  // Thus it determines the expected output during Standard Time, and it
  // compares whether the output of the given date the same (Standard) or less
  // (DST).
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  // timezone is specified as seconds west of UTC ("The external variable
  // `timezone` shall be set to the difference, in seconds, between
  // Coordinated Universal Time (UTC) and local standard time."), the same
  // as returned by stdTimezoneOffset.
  // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
  (growMemViews(), HEAPU32)[((timezone) >> 2)] = stdTimezoneOffset * 60;
  (growMemViews(), HEAP32)[((daylight) >> 2)] = Number(winterOffset != summerOffset);
  var extractZone = timezoneOffset => {
    // Why inverse sign?
    // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    var sign = timezoneOffset >= 0 ? "-" : "+";
    var absOffset = Math.abs(timezoneOffset);
    var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    var minutes = String(absOffset % 60).padStart(2, "0");
    return `UTC${sign}${hours}${minutes}`;
  };
  var winterName = extractZone(winterOffset);
  var summerName = extractZone(summerOffset);
  assert(winterName);
  assert(summerName);
  assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
  assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
  if (summerOffset < winterOffset) {
    // Northern hemisphere
    stringToUTF8(winterName, std_name, 17);
    stringToUTF8(summerName, dst_name, 17);
  } else {
    stringToUTF8(winterName, dst_name, 17);
    stringToUTF8(summerName, std_name, 17);
  }
};

var _emscripten_get_now = () => performance.timeOrigin + performance.now();

var _emscripten_date_now = () => Date.now();

var nowIsMonotonic = 1;

var checkWasiClock = clock_id => clock_id >= 0 && clock_id <= 3;

function _clock_time_get(clk_id, ignored_precision, ptime) {
  ignored_precision = bigintToI53Checked(ignored_precision);
  if (!checkWasiClock(clk_id)) {
    return 28;
  }
  var now;
  // all wasi clocks but realtime are monotonic
  if (clk_id === 0) {
    now = _emscripten_date_now();
  } else if (nowIsMonotonic) {
    now = _emscripten_get_now();
  } else {
    return 52;
  }
  // "now" is in ms, and wasi times are in ns.
  var nsec = Math.round(now * 1e3 * 1e3);
  (growMemViews(), HEAP64)[((ptime) >> 3)] = BigInt(nsec);
  return 0;
}

function getFullscreenElement() {
  return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement || document.msFullscreenElement;
}

var runtimeKeepalivePush = () => {
  runtimeKeepaliveCounter += 1;
};

var runtimeKeepalivePop = () => {
  assert(runtimeKeepaliveCounter > 0);
  runtimeKeepaliveCounter -= 1;
};

/** @param {number=} timeout */ var safeSetTimeout = (func, timeout) => {
  runtimeKeepalivePush();
  return setTimeout(() => {
    runtimeKeepalivePop();
    callUserCallback(func);
  }, timeout);
};

var Browser = {
  useWebGL: false,
  isFullscreen: false,
  pointerLock: false,
  moduleContextCreatedCallbacks: [],
  workers: [],
  preloadedImages: {},
  preloadedAudios: {},
  getCanvas: () => Module["canvas"],
  init() {
    if (Browser.initted) return;
    Browser.initted = true;
    // Support for plugins that can process preloaded files. You can add more of these to
    // your app by creating and appending to preloadPlugins.
    // Each plugin is asked if it can handle a file based on the file's name. If it can,
    // it is given the file's raw data. When it is done, it calls a callback with the file's
    // (possibly modified) data. For example, a plugin might decompress a file, or it
    // might create some side data structure for use later (like an Image element, etc.).
    var imagePlugin = {};
    imagePlugin["canHandle"] = name => !Module["noImageDecoding"] && /\.(jpg|jpeg|png|bmp|webp)$/i.test(name);
    imagePlugin["handle"] = async (byteArray, name) => {
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      if (b.size !== byteArray.length) {
        // Safari bug #118630
        // Safari's Blob can only take an ArrayBuffer
        b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
          type: Browser.getMimetype(name)
        });
      }
      var url = URL.createObjectURL(b);
      return new Promise((resolve, reject) => {
        var img = new Image;
        img.onload = () => {
          assert(img.complete, `Image ${name} could not be decoded`);
          var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          Browser.preloadedImages[name] = canvas;
          URL.revokeObjectURL(url);
          resolve(byteArray);
        };
        img.onerror = event => {
          err(`Image ${url} could not be decoded`);
          reject();
        };
        img.src = url;
      });
    };
    preloadPlugins.push(imagePlugin);
    var audioPlugin = {};
    audioPlugin["canHandle"] = name => !Module["noAudioDecoding"] && name.slice(-4) in {
      ".ogg": 1,
      ".wav": 1,
      ".mp3": 1
    };
    audioPlugin["handle"] = async (byteArray, name) => new Promise((resolve, reject) => {
      var done = false;
      function finish(audio) {
        if (done) return;
        done = true;
        Browser.preloadedAudios[name] = audio;
        resolve(byteArray);
      }
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      var url = URL.createObjectURL(b);
      // XXX we never revoke this!
      var audio = new Audio;
      audio.addEventListener("canplaythrough", () => finish(audio), false);
      // use addEventListener due to chromium bug 124926
      audio.onerror = event => {
        if (done) return;
        err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
        function encode64(data) {
          var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var PAD = "=";
          var ret = "";
          var leftchar = 0;
          var leftbits = 0;
          for (var i = 0; i < data.length; i++) {
            leftchar = (leftchar << 8) | data[i];
            leftbits += 8;
            while (leftbits >= 6) {
              var curr = (leftchar >> (leftbits - 6)) & 63;
              leftbits -= 6;
              ret += BASE[curr];
            }
          }
          if (leftbits == 2) {
            ret += BASE[(leftchar & 3) << 4];
            ret += PAD + PAD;
          } else if (leftbits == 4) {
            ret += BASE[(leftchar & 15) << 2];
            ret += PAD;
          }
          return ret;
        }
        audio.src = "data:audio/x-" + name.slice(-3) + ";base64," + encode64(byteArray);
        finish(audio);
      };
      audio.src = url;
      // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
      safeSetTimeout(() => {
        finish(audio);
      }, 1e4);
    });
    preloadPlugins.push(audioPlugin);
    // Canvas event setup
    function pointerLockChange() {
      var canvas = Browser.getCanvas();
      Browser.pointerLock = document.pointerLockElement === canvas;
    }
    var canvas = Browser.getCanvas();
    if (canvas) {
      // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
      // Module['forcedAspectRatio'] = 4 / 3;
      document.addEventListener("pointerlockchange", pointerLockChange, false);
      if (Module["elementPointerLock"]) {
        canvas.addEventListener("click", ev => {
          if (!Browser.pointerLock && Browser.getCanvas().requestPointerLock) {
            Browser.getCanvas().requestPointerLock();
            ev.preventDefault();
          }
        }, false);
      }
    }
  },
  createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
    if (useWebGL && Module["ctx"] && canvas == Browser.getCanvas()) return Module["ctx"];
    // no need to recreate GL context if it's already been created for this canvas.
    var ctx;
    var contextHandle;
    if (useWebGL) {
      // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
      var contextAttributes = {
        antialias: false,
        alpha: false,
        majorVersion: (typeof WebGL2RenderingContext != "undefined") ? 2 : 1
      };
      if (webGLContextAttributes) {
        for (var attribute in webGLContextAttributes) {
          contextAttributes[attribute] = webGLContextAttributes[attribute];
        }
      }
      // This check of existence of GL is here to satisfy Closure compiler, which yells if variable GL is referenced below but GL object is not
      // actually compiled in because application is not doing any GL operations. TODO: Ideally if GL is not being used, this function
      // Browser.createContext() should not even be emitted.
      if (typeof GL != "undefined") {
        contextHandle = GL.createContext(canvas, contextAttributes);
        if (contextHandle) {
          ctx = GL.getContext(contextHandle).GLctx;
        }
      }
    } else {
      ctx = canvas.getContext("2d");
    }
    if (!ctx) return null;
    if (setInModule) {
      if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
      Module["ctx"] = ctx;
      if (useWebGL) GL.makeContextCurrent(contextHandle);
      Browser.useWebGL = useWebGL;
      Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
      Browser.init();
    }
    return ctx;
  },
  fullscreenHandlersInstalled: false,
  lockPointer: undefined,
  resizeCanvas: undefined,
  requestFullscreen(lockPointer, resizeCanvas) {
    Browser.lockPointer = lockPointer;
    Browser.resizeCanvas = resizeCanvas;
    if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
    if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
    var canvas = Browser.getCanvas();
    function fullscreenChange() {
      Browser.isFullscreen = false;
      var canvasContainer = canvas.parentNode;
      if (getFullscreenElement() === canvasContainer) {
        canvas.exitFullscreen = Browser.exitFullscreen;
        if (Browser.lockPointer) canvas.requestPointerLock();
        Browser.isFullscreen = true;
        if (Browser.resizeCanvas) {
          Browser.setFullscreenCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      } else {
        // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
        canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
        canvasContainer.parentNode.removeChild(canvasContainer);
        if (Browser.resizeCanvas) {
          Browser.setWindowedCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      }
      Module["onFullScreen"]?.(Browser.isFullscreen);
      Module["onFullscreen"]?.(Browser.isFullscreen);
    }
    if (!Browser.fullscreenHandlersInstalled) {
      Browser.fullscreenHandlersInstalled = true;
      document.addEventListener("fullscreenchange", fullscreenChange, false);
      document.addEventListener("mozfullscreenchange", fullscreenChange, false);
      document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
      document.addEventListener("MSFullscreenChange", fullscreenChange, false);
    }
    // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
    canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
    canvasContainer.requestFullscreen();
  },
  requestFullScreen() {
    abort("Module.requestFullScreen has been replaced by Module.requestFullscreen (without a capital S)");
  },
  exitFullscreen() {
    // This is workaround for chrome. Trying to exit from fullscreen
    // not in fullscreen state will cause "TypeError: Document not active"
    // in chrome. See https://github.com/emscripten-core/emscripten/pull/8236
    if (!Browser.isFullscreen) {
      return false;
    }
    var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
    CFS.apply(document, []);
    return true;
  },
  safeSetTimeout(func, timeout) {
    // Legacy function, this is used by the SDL2 port so we need to keep it
    // around at least until that is updated.
    // See https://github.com/libsdl-org/SDL/pull/6304
    return safeSetTimeout(func, timeout);
  },
  getMimetype(name) {
    return {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "bmp": "image/bmp",
      "ogg": "audio/ogg",
      "wav": "audio/wav",
      "mp3": "audio/mpeg"
    }[name.slice(name.lastIndexOf(".") + 1)];
  },
  getUserMedia(func) {
    window.getUserMedia ||= navigator["getUserMedia"] || navigator["mozGetUserMedia"];
    window.getUserMedia(func);
  },
  getMovementX(event) {
    return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
  },
  getMovementY(event) {
    return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
  },
  getMouseWheelDelta(event) {
    var delta = 0;
    switch (event.type) {
     case "DOMMouseScroll":
      // 3 lines make up a step
      delta = event.detail / 3;
      break;

     case "mousewheel":
      // 120 units make up a step
      delta = event.wheelDelta / 120;
      break;

     case "wheel":
      delta = event.deltaY;
      switch (event.deltaMode) {
       case 0:
        // DOM_DELTA_PIXEL: 100 pixels make up a step
        delta /= 100;
        break;

       case 1:
        // DOM_DELTA_LINE: 3 lines make up a step
        delta /= 3;
        break;

       case 2:
        // DOM_DELTA_PAGE: A page makes up 80 steps
        delta *= 80;
        break;

       default:
        abort("unrecognized mouse wheel delta mode: " + event.deltaMode);
      }
      break;

     default:
      abort("unrecognized mouse wheel event: " + event.type);
    }
    return delta;
  },
  mouseX: 0,
  mouseY: 0,
  mouseMovementX: 0,
  mouseMovementY: 0,
  touches: {},
  lastTouches: {},
  calculateMouseCoords(pageX, pageY) {
    // Calculate the movement based on the changes
    // in the coordinates.
    var canvas = Browser.getCanvas();
    var rect = canvas.getBoundingClientRect();
    // Neither .scrollX or .pageXOffset are defined in a spec, but
    // we prefer .scrollX because it is currently in a spec draft.
    // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
    var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
    var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
    // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
    // and we have no viable fallback.
    assert((typeof scrollX != "undefined") && (typeof scrollY != "undefined"), "Unable to retrieve scroll position, mouse positions likely broken.");
    var adjustedX = pageX - (scrollX + rect.left);
    var adjustedY = pageY - (scrollY + rect.top);
    // the canvas might be CSS-scaled compared to its backbuffer;
    // SDL-using content will want mouse coordinates in terms
    // of backbuffer units.
    adjustedX = adjustedX * (canvas.width / rect.width);
    adjustedY = adjustedY * (canvas.height / rect.height);
    return {
      x: adjustedX,
      y: adjustedY
    };
  },
  setMouseCoords(pageX, pageY) {
    const {x, y} = Browser.calculateMouseCoords(pageX, pageY);
    Browser.mouseMovementX = x - Browser.mouseX;
    Browser.mouseMovementY = y - Browser.mouseY;
    Browser.mouseX = x;
    Browser.mouseY = y;
  },
  calculateMouseEvent(event) {
    // event should be mousemove, mousedown or mouseup
    if (Browser.pointerLock) {
      // When the pointer is locked, calculate the coordinates
      // based on the movement of the mouse.
      // Workaround for Firefox bug 764498
      if (event.type != "mousemove" && ("mozMovementX" in event)) {
        Browser.mouseMovementX = Browser.mouseMovementY = 0;
      } else {
        Browser.mouseMovementX = Browser.getMovementX(event);
        Browser.mouseMovementY = Browser.getMovementY(event);
      }
      // add the mouse delta to the current absolute mouse position
      Browser.mouseX += Browser.mouseMovementX;
      Browser.mouseY += Browser.mouseMovementY;
    } else {
      if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
        var touch = event.touch;
        if (touch === undefined) {
          return;
        }
        var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
        if (event.type === "touchstart") {
          Browser.lastTouches[touch.identifier] = coords;
          Browser.touches[touch.identifier] = coords;
        } else if (event.type === "touchend" || event.type === "touchmove") {
          var last = Browser.touches[touch.identifier];
          last ||= coords;
          Browser.lastTouches[touch.identifier] = last;
          Browser.touches[touch.identifier] = coords;
        }
        return;
      }
      Browser.setMouseCoords(event.pageX, event.pageY);
    }
  },
  resizeListeners: [],
  updateResizeListeners() {
    var canvas = Browser.getCanvas();
    Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height));
  },
  setCanvasSize(width, height, noUpdates) {
    var canvas = Browser.getCanvas();
    Browser.updateCanvasDimensions(canvas, width, height);
    if (!noUpdates) Browser.updateResizeListeners();
  },
  windowedWidth: 0,
  windowedHeight: 0,
  setFullscreenCanvasSize() {
    // check if SDL is available
    if (typeof SDL != "undefined") {
      var flags = (growMemViews(), HEAPU32)[((SDL.screen) >> 2)];
      flags = flags | 8388608;
      // set SDL_FULLSCREEN flag
      (growMemViews(), HEAP32)[((SDL.screen) >> 2)] = flags;
    }
    Browser.updateCanvasDimensions(Browser.getCanvas());
    Browser.updateResizeListeners();
  },
  setWindowedCanvasSize() {
    // check if SDL is available
    if (typeof SDL != "undefined") {
      var flags = (growMemViews(), HEAPU32)[((SDL.screen) >> 2)];
      flags = flags & ~8388608;
      // clear SDL_FULLSCREEN flag
      (growMemViews(), HEAP32)[((SDL.screen) >> 2)] = flags;
    }
    Browser.updateCanvasDimensions(Browser.getCanvas());
    Browser.updateResizeListeners();
  },
  updateCanvasDimensions(canvas, wNative, hNative) {
    if (wNative && hNative) {
      canvas.widthNative = wNative;
      canvas.heightNative = hNative;
    } else {
      wNative = canvas.widthNative;
      hNative = canvas.heightNative;
    }
    var w = wNative;
    var h = hNative;
    if (Module["forcedAspectRatio"] > 0) {
      if (w / h < Module["forcedAspectRatio"]) {
        w = Math.round(h * Module["forcedAspectRatio"]);
      } else {
        h = Math.round(w / Module["forcedAspectRatio"]);
      }
    }
    if ((getFullscreenElement() === canvas.parentNode) && (typeof screen != "undefined")) {
      var factor = Math.min(screen.width / w, screen.height / h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    if (Browser.resizeCanvas) {
      if (canvas.width != w) canvas.width = w;
      if (canvas.height != h) canvas.height = h;
      if (typeof canvas.style != "undefined") {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    } else {
      if (canvas.width != wNative) canvas.width = wNative;
      if (canvas.height != hNative) canvas.height = hNative;
      if (typeof canvas.style != "undefined") {
        if (w != wNative || h != hNative) {
          canvas.style.setProperty("width", w + "px", "important");
          canvas.style.setProperty("height", h + "px", "important");
        } else {
          canvas.style.removeProperty("width");
          canvas.style.removeProperty("height");
        }
      }
    }
  }
};

var EGL = {
  errorCode: 12288,
  defaultDisplayInitialized: false,
  currentContext: 0,
  currentReadSurface: 0,
  currentDrawSurface: 0,
  contextAttributes: {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false
  },
  stringCache: {},
  setErrorCode(code) {
    EGL.errorCode = code;
  },
  chooseConfig(display, attribList, config, config_size, numConfigs) {
    if (display != 62e3) {
      EGL.setErrorCode(12296);
      return 0;
    }
    if (attribList) {
      // read attribList if it is non-null
      for (;;) {
        var param = (growMemViews(), HEAP32)[((attribList) >> 2)];
        if (param == 12321) {
          var alphaSize = (growMemViews(), HEAP32)[(((attribList) + (4)) >> 2)];
          EGL.contextAttributes.alpha = (alphaSize > 0);
        } else if (param == 12325) {
          var depthSize = (growMemViews(), HEAP32)[(((attribList) + (4)) >> 2)];
          EGL.contextAttributes.depth = (depthSize > 0);
        } else if (param == 12326) {
          var stencilSize = (growMemViews(), HEAP32)[(((attribList) + (4)) >> 2)];
          EGL.contextAttributes.stencil = (stencilSize > 0);
        } else if (param == 12337) {
          var samples = (growMemViews(), HEAP32)[(((attribList) + (4)) >> 2)];
          EGL.contextAttributes.antialias = (samples > 0);
        } else if (param == 12338) {
          var samples = (growMemViews(), HEAP32)[(((attribList) + (4)) >> 2)];
          EGL.contextAttributes.antialias = (samples == 1);
        } else if (param == 12544) {
          var requestedPriority = (growMemViews(), HEAP32)[(((attribList) + (4)) >> 2)];
          EGL.contextAttributes.lowLatency = (requestedPriority != 12547);
        } else if (param == 12344) {
          break;
        }
        attribList += 8;
      }
    }
    if ((!config || !config_size) && !numConfigs) {
      EGL.setErrorCode(12300);
      return 0;
    }
    if (numConfigs) {
      (growMemViews(), HEAP32)[((numConfigs) >> 2)] = 1;
    }
    if (config && config_size > 0) {
      (growMemViews(), HEAPU32)[((config) >> 2)] = 62002;
    }
    EGL.setErrorCode(12288);
    return 1;
  }
};

function _eglBindAPI(api) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(24, 0, 1, api);
  if (api == 12448) {
    EGL.setErrorCode(12288);
    return 1;
  }
  // if (api == 0x30A1 /* EGL_OPENVG_API */ || api == 0x30A2 /* EGL_OPENGL_API */) {
  EGL.setErrorCode(12300);
  return 0;
}

function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(25, 0, 1, display, attrib_list, configs, config_size, numConfigs);
  return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs);
}

var GLctx;

var webgl_enable_ANGLE_instanced_arrays = ctx => {
  // Extension available in WebGL 1 from Firefox 26 and Google Chrome 30 onwards. Core feature in WebGL 2.
  var ext = ctx.getExtension("ANGLE_instanced_arrays");
  // Because this extension is a core function in WebGL 2, assign the extension entry points in place of
  // where the core functions will reside in WebGL 2. This way the calling code can call these without
  // having to dynamically branch depending if running against WebGL 1 or WebGL 2.
  if (ext) {
    ctx["vertexAttribDivisor"] = (index, divisor) => ext["vertexAttribDivisorANGLE"](index, divisor);
    ctx["drawArraysInstanced"] = (mode, first, count, primcount) => ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
    ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) => ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
    return 1;
  }
};

var webgl_enable_OES_vertex_array_object = ctx => {
  // Extension available in WebGL 1 from Firefox 25 and WebKit 536.28/desktop Safari 6.0.3 onwards. Core feature in WebGL 2.
  var ext = ctx.getExtension("OES_vertex_array_object");
  if (ext) {
    ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
    ctx["deleteVertexArray"] = vao => ext["deleteVertexArrayOES"](vao);
    ctx["bindVertexArray"] = vao => ext["bindVertexArrayOES"](vao);
    ctx["isVertexArray"] = vao => ext["isVertexArrayOES"](vao);
    return 1;
  }
};

var webgl_enable_WEBGL_draw_buffers = ctx => {
  // Extension available in WebGL 1 from Firefox 28 onwards. Core feature in WebGL 2.
  var ext = ctx.getExtension("WEBGL_draw_buffers");
  if (ext) {
    ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
    return 1;
  }
};

var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = ctx => // Closure is expected to be allowed to minify the '.dibvbi' property, so not accessing it quoted.
!!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = ctx => !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"));

var webgl_enable_EXT_polygon_offset_clamp = ctx => !!(ctx.extPolygonOffsetClamp = ctx.getExtension("EXT_polygon_offset_clamp"));

var webgl_enable_EXT_clip_control = ctx => !!(ctx.extClipControl = ctx.getExtension("EXT_clip_control"));

var webgl_enable_WEBGL_polygon_mode = ctx => !!(ctx.webglPolygonMode = ctx.getExtension("WEBGL_polygon_mode"));

var webgl_enable_WEBGL_multi_draw = ctx => // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
!!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));

var getEmscriptenSupportedExtensions = ctx => {
  // Restrict the list of advertised extensions to those that we actually
  // support.
  var supportedExtensions = [ // WebGL 1 extensions
  "ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_disjoint_timer_query", "EXT_frag_depth", "EXT_shader_texture_lod", "EXT_sRGB", "OES_element_index_uint", "OES_fbo_render_mipmap", "OES_standard_derivatives", "OES_texture_float", "OES_texture_half_float", "OES_texture_half_float_linear", "OES_vertex_array_object", "WEBGL_color_buffer_float", "WEBGL_depth_texture", "WEBGL_draw_buffers", // WebGL 2 extensions
  "EXT_color_buffer_float", "EXT_conservative_depth", "EXT_disjoint_timer_query_webgl2", "EXT_texture_norm16", "NV_shader_noperspective_interpolation", "WEBGL_clip_cull_distance", // WebGL 1 and WebGL 2 extensions
  "EXT_clip_control", "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_float_blend", "EXT_polygon_offset_clamp", "EXT_texture_compression_bptc", "EXT_texture_compression_rgtc", "EXT_texture_filter_anisotropic", "KHR_parallel_shader_compile", "OES_texture_float_linear", "WEBGL_blend_func_extended", "WEBGL_compressed_texture_astc", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1", "WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb", "WEBGL_debug_renderer_info", "WEBGL_debug_shaders", "WEBGL_lose_context", "WEBGL_multi_draw", "WEBGL_polygon_mode" ];
  // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
  return (ctx.getSupportedExtensions() || []).filter(ext => supportedExtensions.includes(ext));
};

var registerPreMainLoop = f => {
  // Does nothing unless $MainLoop is included/used.
  typeof MainLoop != "undefined" && MainLoop.preMainLoop.push(f);
};

var GL = {
  counter: 1,
  buffers: [],
  mappedBuffers: {},
  programs: [],
  framebuffers: [],
  renderbuffers: [],
  textures: [],
  shaders: [],
  vaos: [],
  contexts: {},
  offscreenCanvases: {},
  queries: [],
  samplers: [],
  transformFeedbacks: [],
  syncs: [],
  byteSizeByTypeRoot: 5120,
  byteSizeByType: [ 1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8 ],
  stringCache: {},
  stringiCache: {},
  unpackAlignment: 4,
  unpackRowLength: 0,
  recordError: errorCode => {
    if (!GL.lastError) {
      GL.lastError = errorCode;
    }
  },
  getNewId: table => {
    var ret = GL.counter++;
    for (var i = table.length; i < ret; i++) {
      table[i] = null;
    }
    // Skip over any non-null elements that might have been created by
    // glBindBuffer.
    while (table[ret]) {
      ret = GL.counter++;
    }
    return ret;
  },
  genObject: (n, buffers, createFunction, objectTable) => {
    for (var i = 0; i < n; i++) {
      var buffer = GLctx[createFunction]();
      var id = buffer && GL.getNewId(objectTable);
      if (buffer) {
        buffer.name = id;
        objectTable[id] = buffer;
      } else {
        GL.recordError(1282);
      }
      (growMemViews(), HEAP32)[(((buffers) + (i * 4)) >> 2)] = id;
    }
  },
  MAX_TEMP_BUFFER_SIZE: 2097152,
  numTempVertexBuffersPerSize: 64,
  log2ceilLookup: i => 32 - Math.clz32(i === 0 ? 0 : i - 1),
  generateTempBuffers: (quads, context) => {
    var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
    context.tempVertexBufferCounters1 = [];
    context.tempVertexBufferCounters2 = [];
    context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
    context.tempVertexBuffers1 = [];
    context.tempVertexBuffers2 = [];
    context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
    context.tempIndexBuffers = [];
    context.tempIndexBuffers.length = largestIndex + 1;
    for (var i = 0; i <= largestIndex; ++i) {
      context.tempIndexBuffers[i] = null;
      // Created on-demand
      context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
      var ringbufferLength = GL.numTempVertexBuffersPerSize;
      context.tempVertexBuffers1[i] = [];
      context.tempVertexBuffers2[i] = [];
      var ringbuffer1 = context.tempVertexBuffers1[i];
      var ringbuffer2 = context.tempVertexBuffers2[i];
      ringbuffer1.length = ringbuffer2.length = ringbufferLength;
      for (var j = 0; j < ringbufferLength; ++j) {
        ringbuffer1[j] = ringbuffer2[j] = null;
      }
    }
    if (quads) {
      // GL_QUAD indexes can be precalculated
      context.tempQuadIndexBuffer = GLctx.createBuffer();
      context.GLctx.bindBuffer(34963, context.tempQuadIndexBuffer);
      var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
      var quadIndexes = new Uint16Array(numIndexes);
      var i = 0, v = 0;
      while (1) {
        quadIndexes[i++] = v;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 1;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 2;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 2;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 3;
        if (i >= numIndexes) break;
        v += 4;
      }
      context.GLctx.bufferData(34963, quadIndexes, 35044);
      context.GLctx.bindBuffer(34963, null);
    }
  },
  getTempVertexBuffer: sizeBytes => {
    var idx = GL.log2ceilLookup(sizeBytes);
    var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
    var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
    GL.currentContext.tempVertexBufferCounters1[idx] = (GL.currentContext.tempVertexBufferCounters1[idx] + 1) & (GL.numTempVertexBuffersPerSize - 1);
    var vbo = ringbuffer[nextFreeBufferIndex];
    if (vbo) {
      return vbo;
    }
    var prevVBO = GLctx.getParameter(34964);
    ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
    GLctx.bindBuffer(34962, ringbuffer[nextFreeBufferIndex]);
    GLctx.bufferData(34962, 1 << idx, 35048);
    GLctx.bindBuffer(34962, prevVBO);
    return ringbuffer[nextFreeBufferIndex];
  },
  getTempIndexBuffer: sizeBytes => {
    var idx = GL.log2ceilLookup(sizeBytes);
    var ibo = GL.currentContext.tempIndexBuffers[idx];
    if (ibo) {
      return ibo;
    }
    var prevIBO = GLctx.getParameter(34965);
    GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
    GLctx.bindBuffer(34963, GL.currentContext.tempIndexBuffers[idx]);
    GLctx.bufferData(34963, 1 << idx, 35048);
    GLctx.bindBuffer(34963, prevIBO);
    return GL.currentContext.tempIndexBuffers[idx];
  },
  newRenderingFrameStarted: () => {
    if (!GL.currentContext) {
      return;
    }
    var vb = GL.currentContext.tempVertexBuffers1;
    GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
    GL.currentContext.tempVertexBuffers2 = vb;
    vb = GL.currentContext.tempVertexBufferCounters1;
    GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
    GL.currentContext.tempVertexBufferCounters2 = vb;
    var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
    for (var i = 0; i <= largestIndex; ++i) {
      GL.currentContext.tempVertexBufferCounters1[i] = 0;
    }
  },
  getSource: (shader, count, string, length) => {
    var source = "";
    for (var i = 0; i < count; ++i) {
      var len = length ? (growMemViews(), HEAPU32)[(((length) + (i * 4)) >> 2)] : undefined;
      source += UTF8ToString((growMemViews(), HEAPU32)[(((string) + (i * 4)) >> 2)], len);
    }
    return source;
  },
  calcBufLength: (size, type, stride, count) => {
    if (stride > 0) {
      return count * stride;
    }
    var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
    return size * typeSize * count;
  },
  usedTempBuffers: [],
  preDrawHandleClientVertexAttribBindings: count => {
    GL.resetBufferBinding = false;
    // TODO: initial pass to detect ranges we need to upload, might not need
    // an upload per attrib
    for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
      var cb = GL.currentContext.clientBuffers[i];
      if (!cb.clientside || !cb.enabled) continue;
      GL.resetBufferBinding = true;
      var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
      var buf = GL.getTempVertexBuffer(size);
      GLctx.bindBuffer(34962, buf);
      GLctx.bufferSubData(34962, 0, (growMemViews(), HEAPU8).subarray(cb.ptr, cb.ptr + size));
      cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0);
    }
  },
  postDrawHandleClientVertexAttribBindings: () => {
    if (GL.resetBufferBinding) {
      GLctx.bindBuffer(34962, GL.buffers[GLctx.currentArrayBufferBinding]);
    }
  },
  createContext: (/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
    // BUG: Workaround Safari WebGL issue: After successfully acquiring WebGL
    // context on a canvas, calling .getContext() will always return that
    // context independent of which 'webgl' or 'webgl2'
    // context version was passed. See:
    //   https://webkit.org/b/222758
    // and:
    //   https://github.com/emscripten-core/emscripten/issues/13295.
    // TODO: Once the bug is fixed and shipped in Safari, adjust the Safari
    // version field in above check.
    if (!canvas.getContextSafariWebGL2Fixed) {
      canvas.getContextSafariWebGL2Fixed = canvas.getContext;
      /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (Object|null)} */ function fixedGetContext(ver, attrs) {
        var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
        return ((ver == "webgl") == (gl instanceof WebGLRenderingContext)) ? gl : null;
      }
      canvas.getContext = fixedGetContext;
    }
    var ctx = (webGLContextAttributes.majorVersion > 1) ? canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes);
    if (!ctx) return 0;
    var handle = GL.registerContext(ctx, webGLContextAttributes);
    return handle;
  },
  registerContext: (ctx, webGLContextAttributes) => {
    // with pthreads a context is a location in memory with some synchronized
    // data between threads
    var handle = _malloc(8);
    (growMemViews(), HEAPU32)[(((handle) + (4)) >> 2)] = _pthread_self();
    // the thread pointer of the thread that owns the control of the context
    var context = {
      handle,
      attributes: webGLContextAttributes,
      version: webGLContextAttributes.majorVersion,
      GLctx: ctx
    };
    // Store the created context object so that we can access the context
    // given a canvas without having to pass the parameters again.
    if (ctx.canvas) ctx.canvas.GLctxObject = context;
    GL.contexts[handle] = context;
    if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
      GL.initExtensions(context);
    }
    context.maxVertexAttribs = context.GLctx.getParameter(34921);
    context.clientBuffers = [];
    for (var i = 0; i < context.maxVertexAttribs; i++) {
      context.clientBuffers[i] = {
        enabled: false,
        clientside: false,
        size: 0,
        type: 0,
        normalized: 0,
        stride: 0,
        ptr: 0,
        vertexAttribPointerAdaptor: null
      };
    }
    GL.generateTempBuffers(false, context);
    return handle;
  },
  makeContextCurrent: contextHandle => {
    // Active Emscripten GL layer context object.
    GL.currentContext = GL.contexts[contextHandle];
    // Active WebGL context object.
    Module["ctx"] = GLctx = GL.currentContext?.GLctx;
    return !(contextHandle && !GLctx);
  },
  getContext: contextHandle => GL.contexts[contextHandle],
  deleteContext: contextHandle => {
    if (GL.currentContext === GL.contexts[contextHandle]) {
      GL.currentContext = null;
    }
    if (typeof JSEvents == "object") {
      // Release all JS event handlers on the DOM element that the GL context is
      // associated with since the context is now deleted.
      JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
    }
    // Make sure the canvas object no longer refers to the context object so
    // there are no GC surprises.
    if (GL.contexts[contextHandle]?.GLctx.canvas) {
      GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
    }
    _free(GL.contexts[contextHandle].handle);
    GL.contexts[contextHandle] = null;
  },
  initExtensions: context => {
    // If this function is called without a specific context object, init the
    // extensions of the currently active context.
    context ||= GL.currentContext;
    if (context.initExtensionsDone) return;
    context.initExtensionsDone = true;
    var GLctx = context.GLctx;
    // Detect the presence of a few extensions manually, since the GL interop
    // layer itself will need to know if they exist.
    // Extensions that are available in both WebGL 1 and WebGL 2
    webgl_enable_WEBGL_multi_draw(GLctx);
    webgl_enable_EXT_polygon_offset_clamp(GLctx);
    webgl_enable_EXT_clip_control(GLctx);
    webgl_enable_WEBGL_polygon_mode(GLctx);
    // Extensions that are only available in WebGL 1 (the calls will be no-ops
    // if called on a WebGL 2 context active)
    webgl_enable_ANGLE_instanced_arrays(GLctx);
    webgl_enable_OES_vertex_array_object(GLctx);
    webgl_enable_WEBGL_draw_buffers(GLctx);
    // Extensions that are available from WebGL >= 2 (no-op if called on a WebGL 1 context active)
    webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
    webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
    // On WebGL 2, EXT_disjoint_timer_query is replaced with an alternative
    // that's based on core APIs, and exposes only the queryCounterEXT()
    // entrypoint.
    if (context.version >= 2) {
      GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query_webgl2");
    }
    // However, Firefox exposes the WebGL 1 version on WebGL 2 as well and
    // thus we look for the WebGL 1 version again if the WebGL 2 version
    // isn't present. https://bugzil.la/1328882
    if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
      GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
    }
    for (var ext of getEmscriptenSupportedExtensions(GLctx)) {
      // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders
      // are not enabled by default.
      if (!ext.includes("lose_context") && !ext.includes("debug")) {
        // Call .getExtension() to enable that extension permanently.
        GLctx.getExtension(ext);
      }
    }
  }
};

function _eglCreateContext(display, config, hmm, contextAttribs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(26, 0, 1, display, config, hmm, contextAttribs);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  // EGL 1.4 spec says default EGL_CONTEXT_CLIENT_VERSION is GLES1, but this is not supported by Emscripten.
  // So user must pass EGL_CONTEXT_CLIENT_VERSION == 2 to initialize EGL.
  var glesContextVersion = 1;
  for (;;) {
    var param = (growMemViews(), HEAP32)[((contextAttribs) >> 2)];
    if (param == 12440) {
      glesContextVersion = (growMemViews(), HEAP32)[(((contextAttribs) + (4)) >> 2)];
    } else if (param == 12344) {
      break;
    } else {
      /* EGL1.4 specifies only EGL_CONTEXT_CLIENT_VERSION as supported attribute */ EGL.setErrorCode(12292);
      return 0;
    }
    contextAttribs += 8;
  }
  if (glesContextVersion < 2 || glesContextVersion > 3) {
    EGL.setErrorCode(12293);
    return 0;
  }
  EGL.contextAttributes.majorVersion = glesContextVersion - 1;
  // WebGL 1 is GLES 2, WebGL2 is GLES3
  EGL.contextAttributes.minorVersion = 0;
  EGL.context = GL.createContext(Browser.getCanvas(), EGL.contextAttributes);
  if (EGL.context != 0) {
    EGL.setErrorCode(12288);
    // Run callbacks so that GL emulation works
    GL.makeContextCurrent(EGL.context);
    Browser.useWebGL = true;
    Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
    // Note: This function only creates a context, but it shall not make it active.
    GL.makeContextCurrent(null);
    return 62004;
  } else {
    EGL.setErrorCode(12297);
    // By the EGL 1.4 spec, an implementation that does not support GLES2 (WebGL in this case), this error code is set.
    return 0;
  }
}

function _eglCreateWindowSurface(display, config, win, attrib_list) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(27, 0, 1, display, config, win, attrib_list);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  if (config != 62002) {
    EGL.setErrorCode(12293);
    return 0;
  }
  // TODO: Examine attrib_list! Parameters that can be present there are:
  // - EGL_RENDER_BUFFER (must be EGL_BACK_BUFFER)
  // - EGL_VG_COLORSPACE (can't be set)
  // - EGL_VG_ALPHA_FORMAT (can't be set)
  EGL.setErrorCode(12288);
  return 62006;
}

function _eglDestroyContext(display, context) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(28, 0, 1, display, context);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  if (context != 62004) {
    EGL.setErrorCode(12294);
    return 0;
  }
  GL.deleteContext(EGL.context);
  EGL.setErrorCode(12288);
  if (EGL.currentContext == context) {
    EGL.currentContext = 0;
  }
  return 1;
}

function _eglDestroySurface(display, surface) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(29, 0, 1, display, surface);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  if (surface != 62006) {
    EGL.setErrorCode(12301);
    return 1;
  }
  if (EGL.currentReadSurface == surface) {
    EGL.currentReadSurface = 0;
  }
  if (EGL.currentDrawSurface == surface) {
    EGL.currentDrawSurface = 0;
  }
  EGL.setErrorCode(12288);
  return 1;
}

function _eglGetConfigAttrib(display, config, attribute, value) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(30, 0, 1, display, config, attribute, value);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  if (config != 62002) {
    EGL.setErrorCode(12293);
    return 0;
  }
  if (!value) {
    EGL.setErrorCode(12300);
    return 0;
  }
  EGL.setErrorCode(12288);
  switch (attribute) {
   case 12320:
    // EGL_BUFFER_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = EGL.contextAttributes.alpha ? 32 : 24;
    return 1;

   case 12321:
    // EGL_ALPHA_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = EGL.contextAttributes.alpha ? 8 : 0;
    return 1;

   case 12322:
    // EGL_BLUE_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = 8;
    return 1;

   case 12323:
    // EGL_GREEN_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = 8;
    return 1;

   case 12324:
    // EGL_RED_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = 8;
    return 1;

   case 12325:
    // EGL_DEPTH_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = EGL.contextAttributes.depth ? 24 : 0;
    return 1;

   case 12326:
    // EGL_STENCIL_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = EGL.contextAttributes.stencil ? 8 : 0;
    return 1;

   case 12327:
    // EGL_CONFIG_CAVEAT
    // We can return here one of EGL_NONE (0x3038), EGL_SLOW_CONFIG (0x3050) or EGL_NON_CONFORMANT_CONFIG (0x3051).
    (growMemViews(), HEAP32)[((value) >> 2)] = 12344;
    return 1;

   case 12328:
    // EGL_CONFIG_ID
    (growMemViews(), HEAP32)[((value) >> 2)] = 62002;
    return 1;

   case 12329:
    // EGL_LEVEL
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   case 12330:
    // EGL_MAX_PBUFFER_HEIGHT
    (growMemViews(), HEAP32)[((value) >> 2)] = 4096;
    return 1;

   case 12331:
    // EGL_MAX_PBUFFER_PIXELS
    (growMemViews(), HEAP32)[((value) >> 2)] = 16777216;
    return 1;

   case 12332:
    // EGL_MAX_PBUFFER_WIDTH
    (growMemViews(), HEAP32)[((value) >> 2)] = 4096;
    return 1;

   case 12333:
    // EGL_NATIVE_RENDERABLE
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   case 12334:
    // EGL_NATIVE_VISUAL_ID
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   case 12335:
    // EGL_NATIVE_VISUAL_TYPE
    (growMemViews(), HEAP32)[((value) >> 2)] = 12344;
    return 1;

   case 12337:
    // EGL_SAMPLES
    (growMemViews(), HEAP32)[((value) >> 2)] = EGL.contextAttributes.antialias ? 4 : 0;
    return 1;

   case 12338:
    // EGL_SAMPLE_BUFFERS
    (growMemViews(), HEAP32)[((value) >> 2)] = EGL.contextAttributes.antialias ? 1 : 0;
    return 1;

   case 12339:
    // EGL_SURFACE_TYPE
    (growMemViews(), HEAP32)[((value) >> 2)] = 4;
    return 1;

   case 12340:
    // EGL_TRANSPARENT_TYPE
    // If this returns EGL_TRANSPARENT_RGB (0x3052), transparency is used through color-keying. No such thing applies to Emscripten canvas.
    (growMemViews(), HEAP32)[((value) >> 2)] = 12344;
    return 1;

   case 12341:
   // EGL_TRANSPARENT_BLUE_VALUE
    case 12342:
   // EGL_TRANSPARENT_GREEN_VALUE
    case 12343:
    // EGL_TRANSPARENT_RED_VALUE
    // "If EGL_TRANSPARENT_TYPE is EGL_NONE, then the values for EGL_TRANSPARENT_RED_VALUE, EGL_TRANSPARENT_GREEN_VALUE, and EGL_TRANSPARENT_BLUE_VALUE are undefined."
    (growMemViews(), HEAP32)[((value) >> 2)] = -1;
    return 1;

   case 12345:
   // EGL_BIND_TO_TEXTURE_RGB
    case 12346:
    // EGL_BIND_TO_TEXTURE_RGBA
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   case 12347:
    // EGL_MIN_SWAP_INTERVAL
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   case 12348:
    // EGL_MAX_SWAP_INTERVAL
    (growMemViews(), HEAP32)[((value) >> 2)] = 1;
    return 1;

   case 12349:
   // EGL_LUMINANCE_SIZE
    case 12350:
    // EGL_ALPHA_MASK_SIZE
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   case 12351:
    // EGL_COLOR_BUFFER_TYPE
    // EGL has two types of buffers: EGL_RGB_BUFFER and EGL_LUMINANCE_BUFFER.
    (growMemViews(), HEAP32)[((value) >> 2)] = 12430;
    return 1;

   case 12352:
    // EGL_RENDERABLE_TYPE
    // A bit combination of EGL_OPENGL_ES_BIT,EGL_OPENVG_BIT,EGL_OPENGL_ES2_BIT and EGL_OPENGL_BIT.
    (growMemViews(), HEAP32)[((value) >> 2)] = 4;
    return 1;

   case 12354:
    // EGL_CONFORMANT
    // "EGL_CONFORMANT is a mask indicating if a client API context created with respect to the corresponding EGLConfig will pass the required conformance tests for that API."
    (growMemViews(), HEAP32)[((value) >> 2)] = 0;
    return 1;

   default:
    EGL.setErrorCode(12292);
    return 0;
  }
}

function _eglGetDisplay(nativeDisplayType) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(31, 0, 1, nativeDisplayType);
  EGL.setErrorCode(12288);
  // Emscripten EGL implementation "emulates" X11, and eglGetDisplay is
  // expected to accept/receive a pointer to an X11 Display object (or
  // EGL_DEFAULT_DISPLAY).
  if (nativeDisplayType != 0 && nativeDisplayType != 1) {
    return 0;
  }
  return 62e3;
}

function _eglGetError() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(32, 0, 1);
  return EGL.errorCode;
}

function _eglInitialize(display, majorVersion, minorVersion) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(33, 0, 1, display, majorVersion, minorVersion);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  if (majorVersion) {
    (growMemViews(), HEAP32)[((majorVersion) >> 2)] = 1;
  }
  if (minorVersion) {
    (growMemViews(), HEAP32)[((minorVersion) >> 2)] = 4;
  }
  EGL.defaultDisplayInitialized = true;
  EGL.setErrorCode(12288);
  return 1;
}

function _eglMakeCurrent(display, draw, read, context) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(34, 0, 1, display, draw, read, context);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  //\todo An EGL_NOT_INITIALIZED error is generated if EGL is not initialized for dpy.
  if (context != 0 && context != 62004) {
    EGL.setErrorCode(12294);
    return 0;
  }
  if ((read != 0 && read != 62006) || (draw != 0 && draw != 62006)) {
    EGL.setErrorCode(12301);
    return 0;
  }
  GL.makeContextCurrent(context ? EGL.context : null);
  EGL.currentContext = context;
  EGL.currentDrawSurface = draw;
  EGL.currentReadSurface = read;
  EGL.setErrorCode(12288);
  return 1;
}

var stringToNewUTF8 = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8(str, ret, size);
  return ret;
};

function _eglQueryString(display, name) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(35, 0, 1, display, name);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  //\todo An EGL_NOT_INITIALIZED error is generated if EGL is not initialized for dpy.
  EGL.setErrorCode(12288);
  if (EGL.stringCache[name]) return EGL.stringCache[name];
  var ret;
  switch (name) {
   case 12371:
    ret = stringToNewUTF8("Emscripten");
    break;

   case 12372:
    ret = stringToNewUTF8("1.4 Emscripten EGL");
    break;

   case 12373:
    ret = stringToNewUTF8("");
    break;

   // Currently not supporting any EGL extensions.
    case 12429:
    ret = stringToNewUTF8("OpenGL_ES");
    break;

   default:
    EGL.setErrorCode(12300);
    return 0;
  }
  EGL.stringCache[name] = ret;
  return ret;
}

function _eglSwapBuffers(dpy, surface) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(36, 0, 1, dpy, surface);
  if (!EGL.defaultDisplayInitialized) {
    EGL.setErrorCode(12289);
  } else if (!GLctx) {
    EGL.setErrorCode(12290);
  } else if (GLctx.isContextLost()) {
    EGL.setErrorCode(12302);
  } else {
    // According to documentation this does an implicit flush.
    // Due to discussion at https://github.com/emscripten-core/emscripten/pull/1871
    // the flush was removed since this _may_ result in slowing code down.
    //_glFlush();
    EGL.setErrorCode(12288);
    return 1;
  }
  return 0;
}

/**
   * @param {number=} arg
   * @param {boolean=} noSetTiming
   */ var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
  assert(!MainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
  MainLoop.func = iterFunc;
  MainLoop.arg = arg;
  var thisMainLoopId = MainLoop.currentlyRunningMainloop;
  function checkIsRunning() {
    if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
      runtimeKeepalivePop();
      maybeExit();
      return false;
    }
    return true;
  }
  // We create the loop runner here but it is not actually running until
  // _emscripten_set_main_loop_timing is called (which might happen at a
  // later time).  This member signifies that the current runner has not
  // yet been started so that we can call runtimeKeepalivePush when it
  // gets its timing set for the first time.
  MainLoop.running = false;
  MainLoop.runner = function MainLoop_runner() {
    if (ABORT) return;
    if (MainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = MainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (MainLoop.remainingBlockers) {
        var remaining = MainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          MainLoop.remainingBlockers = next;
        } else {
          // not counted, but move the progress along a tiny bit
          next = next + .5;
          // do not steal all the next one's progress
          MainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      MainLoop.updateStatus();
      // catches pause/resume main loop from blocker execution
      if (!checkIsRunning()) return;
      setTimeout(MainLoop.runner, 0);
      return;
    }
    // catch pauses from non-main loop sources
    if (!checkIsRunning()) return;
    // Implement very basic swap interval control
    MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
    if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
      // Not the scheduled time to render this frame - skip.
      MainLoop.scheduler();
      return;
    } else if (MainLoop.timingMode == 0) {
      MainLoop.tickStartTime = _emscripten_get_now();
      if (Module["ctx"]) {
        warnOnce("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
      }
    }
    MainLoop.runIter(iterFunc);
    // catch pauses from the main loop itself
    if (!checkIsRunning()) return;
    MainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps > 0) {
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    } else {
      // Do rAF by rendering each frame (no decimating)
      _emscripten_set_main_loop_timing(1, 1);
    }
    MainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
};

var MainLoop = {
  running: false,
  scheduler: null,
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  preMainLoop: [],
  postMainLoop: [],
  pause() {
    MainLoop.scheduler = null;
    // Incrementing this signals the previous main loop that it's now become old, and it must return.
    MainLoop.currentlyRunningMainloop++;
  },
  resume() {
    MainLoop.currentlyRunningMainloop++;
    var timingMode = MainLoop.timingMode;
    var timingValue = MainLoop.timingValue;
    var func = MainLoop.func;
    MainLoop.func = null;
    // do not set timing and call scheduler, we will do it on the next lines
    setMainLoop(func, 0, false, MainLoop.arg, true);
    _emscripten_set_main_loop_timing(timingMode, timingValue);
    MainLoop.scheduler();
  },
  updateStatus() {
    if (Module["setStatus"]) {
      var message = Module["statusMessage"] || "Please wait...";
      var remaining = MainLoop.remainingBlockers ?? 0;
      var expected = MainLoop.expectedBlockers ?? 0;
      if (remaining) {
        if (remaining < expected) {
          Module["setStatus"](`{message} ({expected - remaining}/{expected})`);
        } else {
          Module["setStatus"](message);
        }
      } else {
        Module["setStatus"]("");
      }
    }
  },
  init() {
    Module["preMainLoop"] && MainLoop.preMainLoop.push(Module["preMainLoop"]);
    Module["postMainLoop"] && MainLoop.postMainLoop.push(Module["postMainLoop"]);
  },
  runIter(func) {
    if (ABORT) return;
    for (var pre of MainLoop.preMainLoop) {
      if (pre() === false) {
        return;
      }
    }
    callUserCallback(func);
    for (var post of MainLoop.postMainLoop) {
      post();
    }
    checkStackCookie();
  },
  nextRAF: 0,
  fakeRequestAnimationFrame(func) {
    // try to keep 60fps between calls to here
    var now = Date.now();
    if (MainLoop.nextRAF === 0) {
      MainLoop.nextRAF = now + 1e3 / 60;
    } else {
      while (now + 2 >= MainLoop.nextRAF) {
        // fudge a little, to avoid timer jitter causing us to do lots of delay:0
        MainLoop.nextRAF += 1e3 / 60;
      }
    }
    var delay = Math.max(MainLoop.nextRAF - now, 0);
    setTimeout(func, delay);
  },
  requestAnimationFrame(func) {
    if (globalThis.requestAnimationFrame) {
      requestAnimationFrame(func);
    } else {
      MainLoop.fakeRequestAnimationFrame(func);
    }
  }
};

var _emscripten_set_main_loop_timing = (mode, value) => {
  MainLoop.timingMode = mode;
  MainLoop.timingValue = value;
  if (!MainLoop.func) {
    err("emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.");
    return 1;
  }
  if (!MainLoop.running) {
    runtimeKeepalivePush();
    MainLoop.running = true;
  }
  if (mode == 0) {
    MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(MainLoop.runner, timeUntilNextTick);
    };
  } else if (mode == 1) {
    MainLoop.scheduler = function MainLoop_scheduler_rAF() {
      MainLoop.requestAnimationFrame(MainLoop.runner);
    };
  } else {
    assert(mode == 2);
    if (!MainLoop.setImmediate) {
      if (globalThis.setImmediate) {
        MainLoop.setImmediate = setImmediate;
      } else {
        // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
        var setImmediates = [];
        var emscriptenMainLoopMessageId = "setimmediate";
        /** @param {Event} event */ var MainLoop_setImmediate_messageHandler = event => {
          // When called in current thread or Worker, the main loop ID is structured slightly different to accommodate for --proxy-to-worker runtime listening to Worker events,
          // so check for both cases.
          if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
            event.stopPropagation();
            setImmediates.shift()();
          }
        };
        addEventListener("message", MainLoop_setImmediate_messageHandler, true);
        MainLoop.setImmediate = /** @type{function(function(): ?, ...?): number} */ (func => {
          setImmediates.push(func);
          if (ENVIRONMENT_IS_WORKER) {
            Module["setImmediates"] ??= [];
            Module["setImmediates"].push(func);
            postMessage({
              target: emscriptenMainLoopMessageId
            });
          } else postMessage(emscriptenMainLoopMessageId, "*");
        });
      }
    }
    MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
      MainLoop.setImmediate(MainLoop.runner);
    };
  }
  return 0;
};

function _eglSwapInterval(display, interval) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(37, 0, 1, display, interval);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  if (interval == 0) _emscripten_set_main_loop_timing(0, 0); else _emscripten_set_main_loop_timing(1, interval);
  EGL.setErrorCode(12288);
  return 1;
}

function _eglTerminate(display) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(38, 0, 1, display);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0;
  }
  EGL.currentContext = 0;
  EGL.currentReadSurface = 0;
  EGL.currentDrawSurface = 0;
  EGL.defaultDisplayInitialized = false;
  EGL.setErrorCode(12288);
  return 1;
}

function _eglWaitClient() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(39, 0, 1);
  EGL.setErrorCode(12288);
  return 1;
}

var _eglWaitGL = _eglWaitClient;

function _eglWaitNative(nativeEngineId) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(40, 0, 1, nativeEngineId);
  EGL.setErrorCode(12288);
  return 1;
}

var readEmAsmArgsArray = [];

var readEmAsmArgs = (sigPtr, buf) => {
  // Nobody should have mutated _readEmAsmArgsArray underneath us to be something else than an array.
  assert(Array.isArray(readEmAsmArgsArray));
  // The input buffer is allocated on the stack, so it must be stack-aligned.
  assert(buf % 16 == 0);
  readEmAsmArgsArray.length = 0;
  var ch;
  // Most arguments are i32s, so shift the buffer pointer so it is a plain
  // index into HEAP32.
  while (ch = (growMemViews(), HEAPU8)[sigPtr++]) {
    var chr = String.fromCharCode(ch);
    var validChars = [ "d", "f", "i", "p" ];
    // In WASM_BIGINT mode we support passing i64 values as bigint.
    validChars.push("j");
    assert(validChars.includes(chr), `Invalid character ${ch}("${chr}") in readEmAsmArgs! Use only [${validChars}], and do not specify "v" for void return argument.`);
    // Floats are always passed as doubles, so all types except for 'i'
    // are 8 bytes and require alignment.
    var wide = (ch != 105);
    wide &= (ch != 112);
    buf += wide && (buf % 8) ? 4 : 0;
    readEmAsmArgsArray.push(// Special case for pointers under wasm64 or CAN_ADDRESS_2GB mode.
    ch == 112 ? (growMemViews(), HEAPU32)[((buf) >> 2)] : ch == 106 ? (growMemViews(), 
    HEAP64)[((buf) >> 3)] : ch == 105 ? (growMemViews(), HEAP32)[((buf) >> 2)] : (growMemViews(), 
    HEAPF64)[((buf) >> 3)]);
    buf += wide ? 8 : 4;
  }
  return readEmAsmArgsArray;
};

var runEmAsmFunction = (code, sigPtr, argbuf) => {
  var args = readEmAsmArgs(sigPtr, argbuf);
  assert(ASM_CONSTS.hasOwnProperty(code), `No EM_ASM constant found at address ${code}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
  return ASM_CONSTS[code](...args);
};

var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);

var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
  var args = readEmAsmArgs(sigPtr, argbuf);
  if (ENVIRONMENT_IS_PTHREAD) {
    // EM_ASM functions are variadic, receiving the actual arguments as a buffer
    // in memory. the last parameter (argBuf) points to that data. We need to
    // always un-variadify that, *before proxying*, as in the async case this
    // is a stack allocation that LLVM made, which may go away before the main
    // thread gets the message. For that reason we handle proxying *after* the
    // call to readEmAsmArgs, and therefore we do that manually here instead
    // of using __proxy. (And for simplicity, do the same in the sync
    // case as well, even though it's not strictly necessary, to keep the two
    // code paths as similar as possible on both sides.)
    return proxyToMainThread(0, emAsmAddr, sync, ...args);
  }
  assert(ASM_CONSTS.hasOwnProperty(emAsmAddr), `No EM_ASM constant found at address ${emAsmAddr}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
  return ASM_CONSTS[emAsmAddr](...args);
};

var _emscripten_asm_const_int_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);

var _emscripten_asm_const_ptr_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);

var _emscripten_check_blocking_allowed = () => {
  if (ENVIRONMENT_IS_NODE) return;
  if (ENVIRONMENT_IS_WORKER) return;
  // Blocking in a worker/pthread is fine.
  warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");
};

var _emscripten_err = str => err(UTF8ToString(str));

var onExits = [];

var addOnExit = cb => onExits.push(cb);

var JSEvents = {
  removeAllEventListeners() {
    while (JSEvents.eventHandlers.length) {
      JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
    }
    JSEvents.deferredCalls = [];
  },
  inEventHandler: 0,
  deferredCalls: [],
  deferCall(targetFunction, precedence, argsList) {
    function arraysHaveEqualContent(arrA, arrB) {
      if (arrA.length != arrB.length) return false;
      for (var i in arrA) {
        if (arrA[i] != arrB[i]) return false;
      }
      return true;
    }
    // Test if the given call was already queued, and if so, don't add it again.
    for (var call of JSEvents.deferredCalls) {
      if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
        return;
      }
    }
    JSEvents.deferredCalls.push({
      targetFunction,
      precedence,
      argsList
    });
    JSEvents.deferredCalls.sort((x, y) => x.precedence - y.precedence);
  },
  removeDeferredCalls(targetFunction) {
    JSEvents.deferredCalls = JSEvents.deferredCalls.filter(call => call.targetFunction != targetFunction);
  },
  canPerformEventHandlerRequests() {
    if (navigator.userActivation) {
      // Verify against transient activation status from UserActivation API
      // whether it is possible to perform a request here without needing to defer. See
      // https://developer.mozilla.org/en-US/docs/Web/Security/User_activation#transient_activation
      // and https://caniuse.com/mdn-api_useractivation
      // At the time of writing, Firefox does not support this API: https://bugzil.la/1791079
      return navigator.userActivation.isActive;
    }
    return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
  },
  runDeferredCalls() {
    if (!JSEvents.canPerformEventHandlerRequests()) {
      return;
    }
    var deferredCalls = JSEvents.deferredCalls;
    JSEvents.deferredCalls = [];
    for (var call of deferredCalls) {
      call.targetFunction(...call.argsList);
    }
  },
  eventHandlers: [],
  removeAllHandlersOnTarget: (target, eventTypeString) => {
    for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
      if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
        JSEvents._removeHandler(i--);
      }
    }
  },
  _removeHandler(i) {
    var h = JSEvents.eventHandlers[i];
    h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
    JSEvents.eventHandlers.splice(i, 1);
  },
  registerOrRemoveHandler(eventHandler) {
    if (!eventHandler.target) {
      err("registerOrRemoveHandler: the target element for event handler registration does not exist, when processing the following event handler registration:");
      console.dir(eventHandler);
      return -4;
    }
    if (eventHandler.callbackfunc) {
      eventHandler.eventListenerFunc = function(event) {
        // Increment nesting count for the event handler.
        ++JSEvents.inEventHandler;
        JSEvents.currentEventHandler = eventHandler;
        // Process any old deferred calls the user has placed.
        JSEvents.runDeferredCalls();
        // Process the actual event, calls back to user C code handler.
        eventHandler.handlerFunc(event);
        // Process any new deferred calls that were placed right now from this event handler.
        JSEvents.runDeferredCalls();
        // Out of event handler - restore nesting count.
        --JSEvents.inEventHandler;
      };
      eventHandler.target.addEventListener(eventHandler.eventTypeString, eventHandler.eventListenerFunc, eventHandler.useCapture);
      JSEvents.eventHandlers.push(eventHandler);
    } else {
      for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
        if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
          JSEvents._removeHandler(i--);
        }
      }
    }
    return 0;
  },
  removeSingleHandler(eventHandler) {
    let success = false;
    for (let i = 0; i < JSEvents.eventHandlers.length; ++i) {
      const handler = JSEvents.eventHandlers[i];
      if (handler.target === eventHandler.target && handler.eventTypeId === eventHandler.eventTypeId && handler.callbackfunc === eventHandler.callbackfunc && handler.userData === eventHandler.userData) {
        // in some very rare cases (ex: Safari / fullscreen events), there is more than 1 handler (eventTypeString is different)
        JSEvents._removeHandler(i--);
        success = true;
      }
    }
    return success ? 0 : -5;
  },
  getTargetThreadForEventCallback(targetThread) {
    switch (targetThread) {
     case 1:
      // The event callback for the current event should be called on the
      // main browser thread. (0 == don't proxy)
      return 0;

     case 2:
      // The event callback for the current event should be backproxied to
      // the thread that is registering the event.
      // This can be 0 in the case that the caller uses
      // EM_CALLBACK_THREAD_CONTEXT_CALLING_THREAD but on the main thread
      // itself.
      return PThread.currentProxiedOperationCallerThread;

     default:
      // The event callback for the current event should be proxied to the
      // given specific thread.
      return targetThread;
    }
  },
  getNodeNameForTarget(target) {
    if (!target) return "";
    if (target == window) return "#window";
    if (target == screen) return "#screen";
    return target?.nodeName || "";
  },
  fullscreenEnabled() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled;
  }
};

/** @type {Object} */ var specialHTMLTargets = [ 0, globalThis.document ?? 0, globalThis.window ?? 0 ];

var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;

var findEventTarget = target => {
  target = maybeCStringToJsString(target);
  var domElement = specialHTMLTargets[target] || globalThis.document?.querySelector(target);
  return domElement;
};

var findCanvasEventTarget = findEventTarget;

var getCanvasSizeCallingThread = (target, width, height) => {
  var canvas = findCanvasEventTarget(target);
  if (!canvas) return -4;
  if (!canvas.controlTransferredOffscreen) {
    (growMemViews(), HEAP32)[((width) >> 2)] = canvas.width;
    (growMemViews(), HEAP32)[((height) >> 2)] = canvas.height;
  } else {
    return -4;
  }
  return 0;
};

function getCanvasSizeMainThread(target, width, height) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(42, 0, 1, target, width, height);
  return getCanvasSizeCallingThread(target, width, height);
}

var _emscripten_get_canvas_element_size = (target, width, height) => {
  var canvas = findCanvasEventTarget(target);
  if (canvas) {
    return getCanvasSizeCallingThread(target, width, height);
  }
  return getCanvasSizeMainThread(target, width, height);
};

var stringToUTF8OnStack = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
};

var getCanvasElementSize = target => {
  var sp = stackSave();
  var w = stackAlloc(8);
  var h = w + 4;
  var targetInt = stringToUTF8OnStack(target.id);
  var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
  var size = [ (growMemViews(), HEAP32)[((w) >> 2)], (growMemViews(), HEAP32)[((h) >> 2)] ];
  stackRestore(sp);
  return size;
};

var setCanvasElementSizeCallingThread = (target, width, height) => {
  var canvas = findCanvasEventTarget(target);
  if (!canvas) return -4;
  if (!canvas.controlTransferredOffscreen) {
    var autoResizeViewport = false;
    if (canvas.GLctxObject?.GLctx) {
      var prevViewport = canvas.GLctxObject.GLctx.getParameter(2978);
      // TODO: Perhaps autoResizeViewport should only be true if FBO 0 is currently active?
      autoResizeViewport = (prevViewport[0] === 0 && prevViewport[1] === 0 && prevViewport[2] === canvas.width && prevViewport[3] === canvas.height);
    }
    canvas.width = width;
    canvas.height = height;
    if (autoResizeViewport) {
      // TODO: Add -sCANVAS_RESIZE_SETS_GL_VIEWPORT=0/1 option (default=1). This is commonly done and several graphics engines depend on this,
      // but this can be quite disruptive.
      canvas.GLctxObject.GLctx.viewport(0, 0, width, height);
    }
  } else {
    return -4;
  }
  return 0;
};

function setCanvasElementSizeMainThread(target, width, height) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(43, 0, 1, target, width, height);
  return setCanvasElementSizeCallingThread(target, width, height);
}

var _emscripten_set_canvas_element_size = (target, width, height) => {
  var canvas = findCanvasEventTarget(target);
  if (canvas) {
    return setCanvasElementSizeCallingThread(target, width, height);
  }
  return setCanvasElementSizeMainThread(target, width, height);
};

var setCanvasElementSize = (target, width, height) => {
  if (!target.controlTransferredOffscreen) {
    target.width = width;
    target.height = height;
  } else {
    // This function is being called from high-level JavaScript code instead of asm.js/Wasm,
    // and it needs to synchronously proxy over to another thread, so marshal the string onto the heap to do the call.
    var sp = stackSave();
    var targetInt = stringToUTF8OnStack(target.id);
    _emscripten_set_canvas_element_size(targetInt, width, height);
    stackRestore(sp);
  }
};

var currentFullscreenStrategy = {};

var registerRestoreOldStyle = canvas => {
  var canvasSize = getCanvasElementSize(canvas);
  var oldWidth = canvasSize[0];
  var oldHeight = canvasSize[1];
  var oldCssWidth = canvas.style.width;
  var oldCssHeight = canvas.style.height;
  var oldBackgroundColor = canvas.style.backgroundColor;
  // Chrome reads color from here.
  var oldDocumentBackgroundColor = document.body.style.backgroundColor;
  // IE11 reads color from here.
  // Firefox always has black background color.
  var oldPaddingLeft = canvas.style.paddingLeft;
  // Chrome, FF, Safari
  var oldPaddingRight = canvas.style.paddingRight;
  var oldPaddingTop = canvas.style.paddingTop;
  var oldPaddingBottom = canvas.style.paddingBottom;
  var oldMarginLeft = canvas.style.marginLeft;
  // IE11
  var oldMarginRight = canvas.style.marginRight;
  var oldMarginTop = canvas.style.marginTop;
  var oldMarginBottom = canvas.style.marginBottom;
  var oldDocumentBodyMargin = document.body.style.margin;
  var oldDocumentOverflow = document.documentElement.style.overflow;
  // Chrome, Firefox
  var oldDocumentScroll = document.body.scroll;
  // IE
  var oldImageRendering = canvas.style.imageRendering;
  function restoreOldStyle() {
    if (!getFullscreenElement()) {
      document.removeEventListener("fullscreenchange", restoreOldStyle);
      // As of Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitfullscreenchange. TODO: revisit this check once Safari ships unprefixed version.
      document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
      setCanvasElementSize(canvas, oldWidth, oldHeight);
      canvas.style.width = oldCssWidth;
      canvas.style.height = oldCssHeight;
      canvas.style.backgroundColor = oldBackgroundColor;
      // Chrome
      // IE11 hack: assigning 'undefined' or an empty string to document.body.style.backgroundColor has no effect, so first assign back the default color
      // before setting the undefined value. Setting undefined value is also important, or otherwise we would later treat that as something that the user
      // had explicitly set so subsequent fullscreen transitions would not set background color properly.
      if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = "white";
      document.body.style.backgroundColor = oldDocumentBackgroundColor;
      // IE11
      canvas.style.paddingLeft = oldPaddingLeft;
      // Chrome, FF, Safari
      canvas.style.paddingRight = oldPaddingRight;
      canvas.style.paddingTop = oldPaddingTop;
      canvas.style.paddingBottom = oldPaddingBottom;
      canvas.style.marginLeft = oldMarginLeft;
      // IE11
      canvas.style.marginRight = oldMarginRight;
      canvas.style.marginTop = oldMarginTop;
      canvas.style.marginBottom = oldMarginBottom;
      document.body.style.margin = oldDocumentBodyMargin;
      document.documentElement.style.overflow = oldDocumentOverflow;
      // Chrome, Firefox
      document.body.scroll = oldDocumentScroll;
      // IE
      canvas.style.imageRendering = oldImageRendering;
      if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
      if (currentFullscreenStrategy.canvasResizedCallback) {
        if (currentFullscreenStrategy.canvasResizedCallbackTargetThread) __emscripten_run_callback_on_thread(currentFullscreenStrategy.canvasResizedCallbackTargetThread, currentFullscreenStrategy.canvasResizedCallback, 37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData); else ((a1, a2, a3) => dynCall_iiii(currentFullscreenStrategy.canvasResizedCallback, a1, a2, a3))(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData);
      }
    }
  }
  document.addEventListener("fullscreenchange", restoreOldStyle);
  // As of Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitfullscreenchange. TODO: revisit this check once Safari ships unprefixed version.
  document.addEventListener("webkitfullscreenchange", restoreOldStyle);
  return restoreOldStyle;
};

var setLetterbox = (element, topBottom, leftRight) => {
  // Cannot use margin to specify letterboxes in FF or Chrome, since those ignore margins in fullscreen mode.
  element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
  element.style.paddingTop = element.style.paddingBottom = topBottom + "px";
};

var getBoundingClientRect = e => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
  "left": 0,
  "top": 0
};

var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
  var restoreOldStyle = registerRestoreOldStyle(target);
  var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
  var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
  var rect = getBoundingClientRect(target);
  var windowedCssWidth = rect.width;
  var windowedCssHeight = rect.height;
  var canvasSize = getCanvasElementSize(target);
  var windowedRttWidth = canvasSize[0];
  var windowedRttHeight = canvasSize[1];
  if (strategy.scaleMode == 3) {
    setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
    cssWidth = windowedCssWidth;
    cssHeight = windowedCssHeight;
  } else if (strategy.scaleMode == 2) {
    if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
      var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
      setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
      cssHeight = desiredCssHeight;
    } else {
      var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
      setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
      cssWidth = desiredCssWidth;
    }
  }
  // If we are adding padding, must choose a background color or otherwise Chrome will give the
  // padding a default white color. Do it only if user has not customized their own background color.
  target.style.backgroundColor ||= "black";
  // IE11 does the same, but requires the color to be set in the document body.
  document.body.style.backgroundColor ||= "black";
  // IE11
  // Firefox always shows black letterboxes independent of style color.
  target.style.width = cssWidth + "px";
  target.style.height = cssHeight + "px";
  if (strategy.filteringMode == 1) {
    target.style.imageRendering = "optimizeSpeed";
    target.style.imageRendering = "-moz-crisp-edges";
    target.style.imageRendering = "-o-crisp-edges";
    target.style.imageRendering = "-webkit-optimize-contrast";
    target.style.imageRendering = "optimize-contrast";
    target.style.imageRendering = "crisp-edges";
    target.style.imageRendering = "pixelated";
  }
  var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? devicePixelRatio : 1;
  if (strategy.canvasResolutionScaleMode != 0) {
    var newWidth = (cssWidth * dpiScale) | 0;
    var newHeight = (cssHeight * dpiScale) | 0;
    setCanvasElementSize(target, newWidth, newHeight);
    if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
  }
  return restoreOldStyle;
};

var JSEvents_requestFullscreen = (target, strategy) => {
  // EMSCRIPTEN_FULLSCREEN_SCALE_DEFAULT + EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE is a mode where no extra logic is performed to the DOM elements.
  if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
    JSEvents_resizeCanvasForFullscreen(target, strategy);
  }
  if (target.requestFullscreen) {
    target.requestFullscreen();
  } else if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    return JSEvents.fullscreenEnabled() ? -3 : -1;
  }
  currentFullscreenStrategy = strategy;
  if (strategy.canvasResizedCallback) {
    if (strategy.canvasResizedCallbackTargetThread) __emscripten_run_callback_on_thread(strategy.canvasResizedCallbackTargetThread, strategy.canvasResizedCallback, 37, 0, strategy.canvasResizedCallbackUserData); else ((a1, a2, a3) => dynCall_iiii(strategy.canvasResizedCallback, a1, a2, a3))(37, 0, strategy.canvasResizedCallbackUserData);
  }
  return 0;
};

function _emscripten_exit_fullscreen() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(41, 0, 1);
  if (!JSEvents.fullscreenEnabled()) return -1;
  // Make sure no queued up calls will fire after this.
  JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
  var d = specialHTMLTargets[1];
  if (d.exitFullscreen) {
    d.fullscreenElement && d.exitFullscreen();
  } else if (d.webkitExitFullscreen) {
    d.webkitFullscreenElement && d.webkitExitFullscreen();
  } else {
    return -1;
  }
  return 0;
}

var requestPointerLock = target => {
  if (target.requestPointerLock) {
    target.requestPointerLock();
  } else {
    // document.body is known to accept pointer lock, so use that to differentiate if the user passed a bad element,
    // or if the whole browser just doesn't support the feature.
    if (document.body.requestPointerLock) {
      return -3;
    }
    return -1;
  }
  return 0;
};

function _emscripten_exit_pointerlock() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(44, 0, 1);
  // Make sure no queued up calls will fire after this.
  JSEvents.removeDeferredCalls(requestPointerLock);
  if (!document.exitPointerLock) return -1;
  document.exitPointerLock();
  return 0;
}

var _emscripten_exit_with_live_runtime = () => {
  runtimeKeepalivePush();
  throw "unwind";
};

function _emscripten_fetch_free(id) {
  if (Fetch.xhrs.has(id)) {
    var xhr = Fetch.xhrs.get(id);
    Fetch.xhrs.free(id);
    // check if fetch is still in progress and should be aborted
    if (xhr.readyState > 0 && xhr.readyState < 4) {
      xhr.abort();
    }
  }
}

function _emscripten_get_device_pixel_ratio() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(45, 0, 1);
  return globalThis.devicePixelRatio ?? 1;
}

function _emscripten_get_element_css_size(target, width, height) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(46, 0, 1, target, width, height);
  target = findEventTarget(target);
  if (!target) return -4;
  var rect = getBoundingClientRect(target);
  (growMemViews(), HEAPF64)[((width) >> 3)] = rect.width;
  (growMemViews(), HEAPF64)[((height) >> 3)] = rect.height;
  return 0;
}

var fillGamepadEventData = (eventStruct, e) => {
  (growMemViews(), HEAPF64)[((eventStruct) >> 3)] = e.timestamp;
  for (var i = 0; i < e.axes.length; ++i) {
    (growMemViews(), HEAPF64)[(((eventStruct + i * 8) + (16)) >> 3)] = e.axes[i];
  }
  for (var i = 0; i < e.buttons.length; ++i) {
    if (typeof e.buttons[i] == "object") {
      (growMemViews(), HEAPF64)[(((eventStruct + i * 8) + (528)) >> 3)] = e.buttons[i].value;
    } else {
      (growMemViews(), HEAPF64)[(((eventStruct + i * 8) + (528)) >> 3)] = e.buttons[i];
    }
  }
  for (var i = 0; i < e.buttons.length; ++i) {
    if (typeof e.buttons[i] == "object") {
      (growMemViews(), HEAP8)[(eventStruct + i) + (1040)] = e.buttons[i].pressed;
    } else {
      // Assigning a boolean to HEAP32, that's ok, but Closure would like to warn about it:
      /** @suppress {checkTypes} */ (growMemViews(), HEAP8)[(eventStruct + i) + (1040)] = e.buttons[i] == 1;
    }
  }
  (growMemViews(), HEAP8)[(eventStruct) + (1104)] = e.connected;
  (growMemViews(), HEAP32)[(((eventStruct) + (1108)) >> 2)] = e.index;
  (growMemViews(), HEAP32)[(((eventStruct) + (8)) >> 2)] = e.axes.length;
  (growMemViews(), HEAP32)[(((eventStruct) + (12)) >> 2)] = e.buttons.length;
  stringToUTF8(e.id, eventStruct + 1112, 64);
  stringToUTF8(e.mapping, eventStruct + 1176, 64);
};

function _emscripten_get_gamepad_status(index, gamepadState) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(47, 0, 1, index, gamepadState);
  assert(JSEvents.lastGamepadState, "emscripten_get_gamepad_status() can only be called after having first called emscripten_sample_gamepad_data() and that function has returned EMSCRIPTEN_RESULT_SUCCESS!");
  // INVALID_PARAM is returned on a Gamepad index that never was there.
  if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
  // NO_DATA is returned on a Gamepad index that was removed.
  // For previously disconnected gamepads there should be an empty slot (null/undefined/false) at the index.
  // This is because gamepads must keep their original position in the array.
  // For example, removing the first of two gamepads produces [null/undefined/false, gamepad].
  if (!JSEvents.lastGamepadState[index]) return -7;
  fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
  return 0;
}

function _emscripten_get_num_gamepads() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(48, 0, 1);
  assert(JSEvents.lastGamepadState, "emscripten_get_num_gamepads() can only be called after having first called emscripten_sample_gamepad_data() and that function has returned EMSCRIPTEN_RESULT_SUCCESS!");
  // N.B. Do not call emscripten_get_num_gamepads() unless having first called emscripten_sample_gamepad_data(), and that has returned EMSCRIPTEN_RESULT_SUCCESS.
  // Otherwise the following line will throw an exception.
  return JSEvents.lastGamepadState.length;
}

function _emscripten_get_screen_size(width, height) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(49, 0, 1, width, height);
  (growMemViews(), HEAP32)[((width) >> 2)] = screen.width;
  (growMemViews(), HEAP32)[((height) >> 2)] = screen.height;
}

var _emscripten_glActiveTexture = x0 => GLctx.activeTexture(x0);

var _emscripten_glAttachShader = (program, shader) => {
  GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
};

var _emscripten_glBeginQuery = (target, id) => {
  GLctx.beginQuery(target, GL.queries[id]);
};

var _emscripten_glBeginQueryEXT = (target, id) => {
  GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id]);
};

var _emscripten_glBeginTransformFeedback = x0 => GLctx.beginTransformFeedback(x0);

var _emscripten_glBindAttribLocation = (program, index, name) => {
  GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
};

var _emscripten_glBindBuffer = (target, buffer) => {
  // Calling glBindBuffer with an unknown buffer will implicitly create a
  // new one.  Here we bypass `GL.counter` and directly using the ID passed
  // in.
  if (buffer && !GL.buffers[buffer]) {
    var b = GLctx.createBuffer();
    b.name = buffer;
    GL.buffers[buffer] = b;
  }
  if (target == 34962) {
    GLctx.currentArrayBufferBinding = buffer;
  } else if (target == 34963) {
    GLctx.currentElementArrayBufferBinding = buffer;
  }
  if (target == 35051) {
    // In WebGL 2 glReadPixels entry point, we need to use a different WebGL 2
    // API function call when a buffer is bound to
    // GL_PIXEL_PACK_BUFFER_BINDING point, so must keep track whether that
    // binding point is non-null to know what is the proper API function to
    // call.
    GLctx.currentPixelPackBufferBinding = buffer;
  } else if (target == 35052) {
    // In WebGL 2 gl(Compressed)Tex(Sub)Image[23]D entry points, we need to
    // use a different WebGL 2 API function call when a buffer is bound to
    // GL_PIXEL_UNPACK_BUFFER_BINDING point, so must keep track whether that
    // binding point is non-null to know what is the proper API function to
    // call.
    GLctx.currentPixelUnpackBufferBinding = buffer;
  }
  GLctx.bindBuffer(target, GL.buffers[buffer]);
};

var _emscripten_glBindBufferBase = (target, index, buffer) => {
  GLctx.bindBufferBase(target, index, GL.buffers[buffer]);
};

var _emscripten_glBindBufferRange = (target, index, buffer, offset, ptrsize) => {
  GLctx.bindBufferRange(target, index, GL.buffers[buffer], offset, ptrsize);
};

var _emscripten_glBindFramebuffer = (target, framebuffer) => {
  GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
};

var _emscripten_glBindRenderbuffer = (target, renderbuffer) => {
  GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
};

var _emscripten_glBindSampler = (unit, sampler) => {
  GLctx.bindSampler(unit, GL.samplers[sampler]);
};

var _emscripten_glBindTexture = (target, texture) => {
  GLctx.bindTexture(target, GL.textures[texture]);
};

var _emscripten_glBindTransformFeedback = (target, id) => {
  GLctx.bindTransformFeedback(target, GL.transformFeedbacks[id]);
};

var _emscripten_glBindVertexArray = vao => {
  GLctx.bindVertexArray(GL.vaos[vao]);
  var ibo = GLctx.getParameter(34965);
  GLctx.currentElementArrayBufferBinding = ibo ? (ibo.name | 0) : 0;
};

var _glBindVertexArray = _emscripten_glBindVertexArray;

var _emscripten_glBindVertexArrayOES = _glBindVertexArray;

var _emscripten_glBlendColor = (x0, x1, x2, x3) => GLctx.blendColor(x0, x1, x2, x3);

var _emscripten_glBlendEquation = x0 => GLctx.blendEquation(x0);

var _emscripten_glBlendEquationSeparate = (x0, x1) => GLctx.blendEquationSeparate(x0, x1);

var _emscripten_glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);

var _emscripten_glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);

var _emscripten_glBlitFramebuffer = (x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) => GLctx.blitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);

var _emscripten_glBufferData = (target, size, data, usage) => {
  if (GL.currentContext.version >= 2) {
    // If size is zero, WebGL would interpret uploading the whole input
    // arraybuffer (starting from given offset), which would not make sense in
    // WebAssembly, so avoid uploading if size is zero. However we must still
    // call bufferData to establish a backing storage of zero bytes.
    if (data && size) {
      GLctx.bufferData(target, (growMemViews(), HEAPU8), usage, data, size);
    } else {
      GLctx.bufferData(target, size, usage);
    }
    return;
  }
  // N.b. here first form specifies a heap subarray, second form an integer
  // size, so the ?: code here is polymorphic. It is advised to avoid
  // randomly mixing both uses in calling code, to avoid any potential JS
  // engine JIT issues.
  GLctx.bufferData(target, data ? (growMemViews(), HEAPU8).subarray(data, data + size) : size, usage);
};

var _emscripten_glBufferSubData = (target, offset, size, data) => {
  if (GL.currentContext.version >= 2) {
    size && GLctx.bufferSubData(target, offset, (growMemViews(), HEAPU8), data, size);
    return;
  }
  GLctx.bufferSubData(target, offset, (growMemViews(), HEAPU8).subarray(data, data + size));
};

var _emscripten_glCheckFramebufferStatus = x0 => GLctx.checkFramebufferStatus(x0);

var _emscripten_glClear = x0 => GLctx.clear(x0);

var _emscripten_glClearBufferfi = (x0, x1, x2, x3) => GLctx.clearBufferfi(x0, x1, x2, x3);

var _emscripten_glClearBufferfv = (buffer, drawbuffer, value) => {
  GLctx.clearBufferfv(buffer, drawbuffer, (growMemViews(), HEAPF32), ((value) >> 2));
};

var _emscripten_glClearBufferiv = (buffer, drawbuffer, value) => {
  GLctx.clearBufferiv(buffer, drawbuffer, (growMemViews(), HEAP32), ((value) >> 2));
};

var _emscripten_glClearBufferuiv = (buffer, drawbuffer, value) => {
  GLctx.clearBufferuiv(buffer, drawbuffer, (growMemViews(), HEAPU32), ((value) >> 2));
};

var _emscripten_glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);

var _emscripten_glClearDepthf = x0 => GLctx.clearDepth(x0);

var _emscripten_glClearStencil = x0 => GLctx.clearStencil(x0);

var _emscripten_glClientWaitSync = (sync, flags, timeout) => {
  // WebGL2 vs GLES3 differences: in GLES3, the timeout parameter is a uint64, where 0xFFFFFFFFFFFFFFFFULL means GL_TIMEOUT_IGNORED.
  // In JS, there's no 64-bit value types, so instead timeout is taken to be signed, and GL_TIMEOUT_IGNORED is given value -1.
  // Inherently the value accepted in the timeout is lossy, and can't take in arbitrary u64 bit pattern (but most likely doesn't matter)
  // See https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15
  timeout = Number(timeout);
  return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
};

var _emscripten_glClipControlEXT = (origin, depth) => {
  GLctx.extClipControl["clipControlEXT"](origin, depth);
};

var _emscripten_glColorMask = (red, green, blue, alpha) => {
  GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
};

var _emscripten_glCompileShader = shader => {
  GLctx.compileShader(GL.shaders[shader]);
};

var _emscripten_glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
  // `data` may be null here, which means "allocate uninitialized space but
  // don't upload" in GLES parlance, but `compressedTexImage2D` requires the
  // final data parameter, so we simply pass a heap view starting at zero
  // effectively uploading whatever happens to be near address zero.  See
  // https://github.com/emscripten-core/emscripten/issues/19300.
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
      GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data);
      return;
    }
    GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, (growMemViews(), 
    HEAPU8), data, imageSize);
    return;
  }
  GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, (growMemViews(), 
  HEAPU8).subarray((data), data + imageSize));
};

var _emscripten_glCompressedTexImage3D = (target, level, internalFormat, width, height, depth, border, imageSize, data) => {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data);
  } else {
    GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, (growMemViews(), 
    HEAPU8), data, imageSize);
  }
};

var _emscripten_glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
      GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data);
      return;
    }
    GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, (growMemViews(), 
    HEAPU8), data, imageSize);
    return;
  }
  GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, (growMemViews(), 
  HEAPU8).subarray((data), data + imageSize));
};

var _emscripten_glCompressedTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) => {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data);
  } else {
    GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, (growMemViews(), 
    HEAPU8), data, imageSize);
  }
};

var _emscripten_glCopyBufferSubData = (x0, x1, x2, x3, x4) => GLctx.copyBufferSubData(x0, x1, x2, x3, x4);

var _emscripten_glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);

var _emscripten_glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);

var _emscripten_glCopyTexSubImage3D = (x0, x1, x2, x3, x4, x5, x6, x7, x8) => GLctx.copyTexSubImage3D(x0, x1, x2, x3, x4, x5, x6, x7, x8);

var _emscripten_glCreateProgram = () => {
  var id = GL.getNewId(GL.programs);
  var program = GLctx.createProgram();
  // Store additional information needed for each shader program:
  program.name = id;
  // Lazy cache results of
  // glGetProgramiv(GL_ACTIVE_UNIFORM_MAX_LENGTH/GL_ACTIVE_ATTRIBUTE_MAX_LENGTH/GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH)
  program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
  program.uniformIdCounter = 1;
  GL.programs[id] = program;
  return id;
};

var _emscripten_glCreateShader = shaderType => {
  var id = GL.getNewId(GL.shaders);
  GL.shaders[id] = GLctx.createShader(shaderType);
  return id;
};

var _emscripten_glCullFace = x0 => GLctx.cullFace(x0);

var _emscripten_glDeleteBuffers = (n, buffers) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((buffers) + (i * 4)) >> 2)];
    var buffer = GL.buffers[id];
    // From spec: "glDeleteBuffers silently ignores 0's and names that do not
    // correspond to existing buffer objects."
    if (!buffer) continue;
    GLctx.deleteBuffer(buffer);
    buffer.name = 0;
    GL.buffers[id] = null;
    if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
    if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
    if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
    if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
  }
};

var _emscripten_glDeleteFramebuffers = (n, framebuffers) => {
  for (var i = 0; i < n; ++i) {
    var id = (growMemViews(), HEAP32)[(((framebuffers) + (i * 4)) >> 2)];
    var framebuffer = GL.framebuffers[id];
    if (!framebuffer) continue;
    // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
    GLctx.deleteFramebuffer(framebuffer);
    framebuffer.name = 0;
    GL.framebuffers[id] = null;
  }
};

var _emscripten_glDeleteProgram = id => {
  if (!id) return;
  var program = GL.programs[id];
  if (!program) {
    // glDeleteProgram actually signals an error when deleting a nonexisting
    // object, unlike some other GL delete functions.
    GL.recordError(1281);
    return;
  }
  GLctx.deleteProgram(program);
  program.name = 0;
  GL.programs[id] = null;
};

var _emscripten_glDeleteQueries = (n, ids) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((ids) + (i * 4)) >> 2)];
    var query = GL.queries[id];
    if (!query) continue;
    // GL spec: "unused names in ids are ignored, as is the name zero."
    GLctx.deleteQuery(query);
    GL.queries[id] = null;
  }
};

var _emscripten_glDeleteQueriesEXT = (n, ids) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((ids) + (i * 4)) >> 2)];
    var query = GL.queries[id];
    if (!query) continue;
    // GL spec: "unused names in ids are ignored, as is the name zero."
    GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
    GL.queries[id] = null;
  }
};

var _emscripten_glDeleteRenderbuffers = (n, renderbuffers) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((renderbuffers) + (i * 4)) >> 2)];
    var renderbuffer = GL.renderbuffers[id];
    if (!renderbuffer) continue;
    // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
    GLctx.deleteRenderbuffer(renderbuffer);
    renderbuffer.name = 0;
    GL.renderbuffers[id] = null;
  }
};

var _emscripten_glDeleteSamplers = (n, samplers) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((samplers) + (i * 4)) >> 2)];
    var sampler = GL.samplers[id];
    if (!sampler) continue;
    GLctx.deleteSampler(sampler);
    sampler.name = 0;
    GL.samplers[id] = null;
  }
};

var _emscripten_glDeleteShader = id => {
  if (!id) return;
  var shader = GL.shaders[id];
  if (!shader) {
    // glDeleteShader actually signals an error when deleting a nonexisting
    // object, unlike some other GL delete functions.
    GL.recordError(1281);
    return;
  }
  GLctx.deleteShader(shader);
  GL.shaders[id] = null;
};

var _emscripten_glDeleteSync = id => {
  if (!id) return;
  var sync = GL.syncs[id];
  if (!sync) {
    // glDeleteSync signals an error when deleting a nonexisting object, unlike some other GL delete functions.
    GL.recordError(1281);
    return;
  }
  GLctx.deleteSync(sync);
  sync.name = 0;
  GL.syncs[id] = null;
};

var _emscripten_glDeleteTextures = (n, textures) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((textures) + (i * 4)) >> 2)];
    var texture = GL.textures[id];
    // GL spec: "glDeleteTextures silently ignores 0s and names that do not
    // correspond to existing textures".
    if (!texture) continue;
    GLctx.deleteTexture(texture);
    texture.name = 0;
    GL.textures[id] = null;
  }
};

var _emscripten_glDeleteTransformFeedbacks = (n, ids) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((ids) + (i * 4)) >> 2)];
    var transformFeedback = GL.transformFeedbacks[id];
    if (!transformFeedback) continue;
    // GL spec: "unused names in ids are ignored, as is the name zero."
    GLctx.deleteTransformFeedback(transformFeedback);
    transformFeedback.name = 0;
    GL.transformFeedbacks[id] = null;
  }
};

var _emscripten_glDeleteVertexArrays = (n, vaos) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((vaos) + (i * 4)) >> 2)];
    GLctx.deleteVertexArray(GL.vaos[id]);
    GL.vaos[id] = null;
  }
};

var _glDeleteVertexArrays = _emscripten_glDeleteVertexArrays;

var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArrays;

var _emscripten_glDepthFunc = x0 => GLctx.depthFunc(x0);

var _emscripten_glDepthMask = flag => {
  GLctx.depthMask(!!flag);
};

var _emscripten_glDepthRangef = (x0, x1) => GLctx.depthRange(x0, x1);

var _emscripten_glDetachShader = (program, shader) => {
  GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
};

var _emscripten_glDisable = x0 => GLctx.disable(x0);

var _emscripten_glDisableVertexAttribArray = index => {
  var cb = GL.currentContext.clientBuffers[index];
  cb.enabled = false;
  GLctx.disableVertexAttribArray(index);
};

var _emscripten_glDrawArrays = (mode, first, count) => {
  // bind any client-side buffers
  GL.preDrawHandleClientVertexAttribBindings(first + count);
  GLctx.drawArrays(mode, first, count);
  GL.postDrawHandleClientVertexAttribBindings();
};

var _emscripten_glDrawArraysInstanced = (mode, first, count, primcount) => {
  GLctx.drawArraysInstanced(mode, first, count, primcount);
};

var _glDrawArraysInstanced = _emscripten_glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedARB = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedEXT = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedNV = _glDrawArraysInstanced;

var tempFixedLengthArray = [];

var _emscripten_glDrawBuffers = (n, bufs) => {
  var bufArray = tempFixedLengthArray[n];
  for (var i = 0; i < n; i++) {
    bufArray[i] = (growMemViews(), HEAP32)[(((bufs) + (i * 4)) >> 2)];
  }
  GLctx.drawBuffers(bufArray);
};

var _glDrawBuffers = _emscripten_glDrawBuffers;

var _emscripten_glDrawBuffersEXT = _glDrawBuffers;

var _emscripten_glDrawBuffersWEBGL = _glDrawBuffers;

var _emscripten_glDrawElements = (mode, count, type, indices) => {
  var buf;
  var vertexes = 0;
  if (!GLctx.currentElementArrayBufferBinding) {
    var size = GL.calcBufLength(1, type, 0, count);
    buf = GL.getTempIndexBuffer(size);
    GLctx.bindBuffer(34963, buf);
    GLctx.bufferSubData(34963, 0, (growMemViews(), HEAPU8).subarray(indices, indices + size));
    // Calculating vertex count if shader's attribute data is on client side
    if (count > 0) {
      for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
        var cb = GL.currentContext.clientBuffers[i];
        if (cb.clientside && cb.enabled) {
          let arrayClass;
          switch (type) {
           case 5121:
            arrayClass = Uint8Array;
            break;

           case 5123:
            arrayClass = Uint16Array;
            break;

           case 5125:
            arrayClass = Uint32Array;
            break;

           default:
            GL.recordError(1282);
            return;
          }
          vertexes = new arrayClass((growMemViews(), HEAPU8).buffer, indices, count).reduce((max, current) => Math.max(max, current)) + 1;
          break;
        }
      }
    }
    // the index is now 0
    indices = 0;
  }
  // bind any client-side buffers
  GL.preDrawHandleClientVertexAttribBindings(vertexes);
  GLctx.drawElements(mode, count, type, indices);
  GL.postDrawHandleClientVertexAttribBindings(count);
  if (!GLctx.currentElementArrayBufferBinding) {
    GLctx.bindBuffer(34963, null);
  }
};

var _emscripten_glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
  GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
};

var _glDrawElementsInstanced = _emscripten_glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedARB = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedEXT = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedNV = _glDrawElementsInstanced;

var _glDrawElements = _emscripten_glDrawElements;

var _emscripten_glDrawRangeElements = (mode, start, end, count, type, indices) => {
  // TODO: This should be a trivial pass-through function registered at the bottom of this page as
  // glFuncs[6][1] += ' drawRangeElements';
  // but due to https://bugzil.la/1202427,
  // we work around by ignoring the range.
  _glDrawElements(mode, count, type, indices);
};

var _emscripten_glEnable = x0 => GLctx.enable(x0);

var _emscripten_glEnableVertexAttribArray = index => {
  var cb = GL.currentContext.clientBuffers[index];
  cb.enabled = true;
  GLctx.enableVertexAttribArray(index);
};

var _emscripten_glEndQuery = x0 => GLctx.endQuery(x0);

var _emscripten_glEndQueryEXT = target => {
  GLctx.disjointTimerQueryExt["endQueryEXT"](target);
};

var _emscripten_glEndTransformFeedback = () => GLctx.endTransformFeedback();

var _emscripten_glFenceSync = (condition, flags) => {
  var sync = GLctx.fenceSync(condition, flags);
  if (sync) {
    var id = GL.getNewId(GL.syncs);
    sync.name = id;
    GL.syncs[id] = sync;
    return id;
  }
  return 0;
};

var _emscripten_glFinish = () => GLctx.finish();

var _emscripten_glFlush = () => GLctx.flush();

var emscriptenWebGLGetBufferBinding = target => {
  switch (target) {
   case 34962:
    target = 34964;
    break;

   case 34963:
    target = 34965;
    break;

   case 35051:
    target = 35053;
    break;

   case 35052:
    target = 35055;
    break;

   case 35982:
    target = 35983;
    break;

   case 36662:
    target = 36662;
    break;

   case 36663:
    target = 36663;
    break;

   case 35345:
    target = 35368;
    break;
  }
  var buffer = GLctx.getParameter(target);
  if (buffer) return buffer.name | 0; else return 0;
};

var emscriptenWebGLValidateMapBufferTarget = target => {
  switch (target) {
   case 34962:
   // GL_ARRAY_BUFFER
    case 34963:
   // GL_ELEMENT_ARRAY_BUFFER
    case 36662:
   // GL_COPY_READ_BUFFER
    case 36663:
   // GL_COPY_WRITE_BUFFER
    case 35051:
   // GL_PIXEL_PACK_BUFFER
    case 35052:
   // GL_PIXEL_UNPACK_BUFFER
    case 35882:
   // GL_TEXTURE_BUFFER
    case 35982:
   // GL_TRANSFORM_FEEDBACK_BUFFER
    case 35345:
    // GL_UNIFORM_BUFFER
    return true;

   default:
    return false;
  }
};

var _emscripten_glFlushMappedBufferRange = (target, offset, length) => {
  if (!emscriptenWebGLValidateMapBufferTarget(target)) {
    GL.recordError(1280);
    err("GL_INVALID_ENUM in glFlushMappedBufferRange");
    return;
  }
  var mapping = GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)];
  if (!mapping) {
    GL.recordError(1282);
    err("buffer was never mapped in glFlushMappedBufferRange");
    return;
  }
  if (!(mapping.access & 16)) {
    GL.recordError(1282);
    err("buffer was not mapped with GL_MAP_FLUSH_EXPLICIT_BIT in glFlushMappedBufferRange");
    return;
  }
  if (offset < 0 || length < 0 || offset + length > mapping.length) {
    GL.recordError(1281);
    err("invalid range in glFlushMappedBufferRange");
    return;
  }
  GLctx.bufferSubData(target, mapping.offset, (growMemViews(), HEAPU8).subarray(mapping.mem + offset, mapping.mem + offset + length));
};

var _emscripten_glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
  GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
};

var _emscripten_glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
  GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
};

var _emscripten_glFramebufferTextureLayer = (target, attachment, texture, level, layer) => {
  GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer);
};

var _emscripten_glFrontFace = x0 => GLctx.frontFace(x0);

var _emscripten_glGenBuffers = (n, buffers) => {
  GL.genObject(n, buffers, "createBuffer", GL.buffers);
};

var _emscripten_glGenFramebuffers = (n, ids) => {
  GL.genObject(n, ids, "createFramebuffer", GL.framebuffers);
};

var _emscripten_glGenQueries = (n, ids) => {
  GL.genObject(n, ids, "createQuery", GL.queries);
};

var _emscripten_glGenQueriesEXT = (n, ids) => {
  for (var i = 0; i < n; i++) {
    var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
    if (!query) {
      GL.recordError(1282);
      while (i < n) (growMemViews(), HEAP32)[(((ids) + (i++ * 4)) >> 2)] = 0;
      return;
    }
    var id = GL.getNewId(GL.queries);
    query.name = id;
    GL.queries[id] = query;
    (growMemViews(), HEAP32)[(((ids) + (i * 4)) >> 2)] = id;
  }
};

var _emscripten_glGenRenderbuffers = (n, renderbuffers) => {
  GL.genObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
};

var _emscripten_glGenSamplers = (n, samplers) => {
  GL.genObject(n, samplers, "createSampler", GL.samplers);
};

var _emscripten_glGenTextures = (n, textures) => {
  GL.genObject(n, textures, "createTexture", GL.textures);
};

var _emscripten_glGenTransformFeedbacks = (n, ids) => {
  GL.genObject(n, ids, "createTransformFeedback", GL.transformFeedbacks);
};

var _emscripten_glGenVertexArrays = (n, arrays) => {
  GL.genObject(n, arrays, "createVertexArray", GL.vaos);
};

var _glGenVertexArrays = _emscripten_glGenVertexArrays;

var _emscripten_glGenVertexArraysOES = _glGenVertexArrays;

var _emscripten_glGenerateMipmap = x0 => GLctx.generateMipmap(x0);

var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
  program = GL.programs[program];
  var info = GLctx[funcName](program, index);
  if (info) {
    // If an error occurs, nothing will be written to length, size and type and name.
    var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
    if (size) (growMemViews(), HEAP32)[((size) >> 2)] = info.size;
    if (type) (growMemViews(), HEAP32)[((type) >> 2)] = info.type;
  }
};

var _emscripten_glGetActiveAttrib = (program, index, bufSize, length, size, type, name) => __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name);

var _emscripten_glGetActiveUniform = (program, index, bufSize, length, size, type, name) => __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name);

var _emscripten_glGetActiveUniformBlockName = (program, uniformBlockIndex, bufSize, length, uniformBlockName) => {
  program = GL.programs[program];
  var result = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
  if (!result) return;
  // If an error occurs, nothing will be written to uniformBlockName or length.
  if (uniformBlockName && bufSize > 0) {
    var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
  } else {
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = 0;
  }
};

var _emscripten_glGetActiveUniformBlockiv = (program, uniformBlockIndex, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if params == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  if (pname == 35393) {
    var name = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
    (growMemViews(), HEAP32)[((params) >> 2)] = name.length + 1;
    return;
  }
  var result = GLctx.getActiveUniformBlockParameter(program, uniformBlockIndex, pname);
  if (result === null) return;
  // If an error occurs, nothing should be written to params.
  if (pname == 35395) {
    for (var i = 0; i < result.length; i++) {
      (growMemViews(), HEAP32)[(((params) + (i * 4)) >> 2)] = result[i];
    }
  } else {
    (growMemViews(), HEAP32)[((params) >> 2)] = result;
  }
};

var _emscripten_glGetActiveUniformsiv = (program, uniformCount, uniformIndices, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if params == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (uniformCount > 0 && uniformIndices == 0) {
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  var ids = [];
  for (var i = 0; i < uniformCount; i++) {
    ids.push((growMemViews(), HEAP32)[(((uniformIndices) + (i * 4)) >> 2)]);
  }
  var result = GLctx.getActiveUniforms(program, ids, pname);
  if (!result) return;
  // GL spec: If an error is generated, nothing is written out to params.
  var len = result.length;
  for (var i = 0; i < len; i++) {
    (growMemViews(), HEAP32)[(((params) + (i * 4)) >> 2)] = result[i];
  }
};

var _emscripten_glGetAttachedShaders = (program, maxCount, count, shaders) => {
  var result = GLctx.getAttachedShaders(GL.programs[program]);
  var len = result.length;
  if (len > maxCount) {
    len = maxCount;
  }
  (growMemViews(), HEAP32)[((count) >> 2)] = len;
  for (var i = 0; i < len; ++i) {
    var id = GL.shaders.indexOf(result[i]);
    (growMemViews(), HEAP32)[(((shaders) + (i * 4)) >> 2)] = id;
  }
};

var _emscripten_glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));

var readI53FromI64 = ptr => (growMemViews(), HEAPU32)[((ptr) >> 2)] + (growMemViews(), 
HEAP32)[(((ptr) + (4)) >> 2)] * 4294967296;

var readI53FromU64 = ptr => (growMemViews(), HEAPU32)[((ptr) >> 2)] + (growMemViews(), 
HEAPU32)[(((ptr) + (4)) >> 2)] * 4294967296;

var writeI53ToI64 = (ptr, num) => {
  (growMemViews(), HEAPU32)[((ptr) >> 2)] = num;
  var lower = (growMemViews(), HEAPU32)[((ptr) >> 2)];
  (growMemViews(), HEAPU32)[(((ptr) + (4)) >> 2)] = (num - lower) / 4294967296;
  var deserialized = (num >= 0) ? readI53FromU64(ptr) : readI53FromI64(ptr);
  var offset = ((ptr) >> 2);
  if (deserialized != num) warnOnce(`writeI53ToI64() out of range: serialized JS Number ${num} to Wasm heap as bytes lo=${ptrToString((growMemViews(), 
  HEAPU32)[offset])}, hi=${ptrToString((growMemViews(), HEAPU32)[offset + 1])}, which deserializes back to ${deserialized} instead!`);
};

var webglGetExtensions = () => {
  var exts = getEmscriptenSupportedExtensions(GLctx);
  exts = exts.concat(exts.map(e => "GL_" + e));
  return exts;
};

var emscriptenWebGLGet = (name_, p, type) => {
  // Guard against user passing a null pointer.
  // Note that GLES2 spec does not say anything about how passing a null
  // pointer should be treated.  Testing on desktop core GL 3, the application
  // crashes on glGetIntegerv to a null pointer, but better to report an error
  // instead of doing anything random.
  if (!p) {
    GL.recordError(1281);
    return;
  }
  var ret = undefined;
  switch (name_) {
   // Handle a few trivial GLES values
    case 36346:
    // GL_SHADER_COMPILER
    ret = 1;
    break;

   case 36344:
    // GL_SHADER_BINARY_FORMATS
    if (type != 0 && type != 1) {
      GL.recordError(1280);
    }
    // Do not write anything to the out pointer, since no binary formats are
    // supported.
    return;

   case 34814:
   // GL_NUM_PROGRAM_BINARY_FORMATS
    case 36345:
    // GL_NUM_SHADER_BINARY_FORMATS
    ret = 0;
    break;

   case 34466:
    // GL_NUM_COMPRESSED_TEXTURE_FORMATS
    // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete
    // since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be
    // queried for length), so implement it ourselves to allow C++ GLES2
    // code to get the length.
    var formats = GLctx.getParameter(34467);
    ret = formats ? formats.length : 0;
    break;

   case 33309:
    // GL_NUM_EXTENSIONS
    if (GL.currentContext.version < 2) {
      // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
      GL.recordError(1282);
      return;
    }
    ret = webglGetExtensions().length;
    break;

   case 33307:
   // GL_MAJOR_VERSION
    case 33308:
    // GL_MINOR_VERSION
    if (GL.currentContext.version < 2) {
      GL.recordError(1280);
      // GL_INVALID_ENUM
      return;
    }
    ret = name_ == 33307 ? 3 : 0;
    // return version 3.0
    break;
  }
  if (ret === undefined) {
    var result = GLctx.getParameter(name_);
    switch (typeof result) {
     case "number":
      ret = result;
      break;

     case "boolean":
      ret = result ? 1 : 0;
      break;

     case "string":
      GL.recordError(1280);
      // GL_INVALID_ENUM
      return;

     case "object":
      if (result === null) {
        // null is a valid result for some (e.g., which buffer is bound -
        // perhaps nothing is bound), but otherwise can mean an invalid
        // name_, which we need to report as an error
        switch (name_) {
         case 34964:
         // ARRAY_BUFFER_BINDING
          case 35725:
         // CURRENT_PROGRAM
          case 34965:
         // ELEMENT_ARRAY_BUFFER_BINDING
          case 36006:
         // FRAMEBUFFER_BINDING or DRAW_FRAMEBUFFER_BINDING
          case 36007:
         // RENDERBUFFER_BINDING
          case 32873:
         // TEXTURE_BINDING_2D
          case 34229:
         // WebGL 2 GL_VERTEX_ARRAY_BINDING, or WebGL 1 extension OES_vertex_array_object GL_VERTEX_ARRAY_BINDING_OES
          case 36662:
         // COPY_READ_BUFFER_BINDING or COPY_READ_BUFFER
          case 36663:
         // COPY_WRITE_BUFFER_BINDING or COPY_WRITE_BUFFER
          case 35053:
         // PIXEL_PACK_BUFFER_BINDING
          case 35055:
         // PIXEL_UNPACK_BUFFER_BINDING
          case 36010:
         // READ_FRAMEBUFFER_BINDING
          case 35097:
         // SAMPLER_BINDING
          case 35869:
         // TEXTURE_BINDING_2D_ARRAY
          case 32874:
         // TEXTURE_BINDING_3D
          case 36389:
         // TRANSFORM_FEEDBACK_BINDING
          case 35983:
         // TRANSFORM_FEEDBACK_BUFFER_BINDING
          case 35368:
         // UNIFORM_BUFFER_BINDING
          case 34068:
          {
            // TEXTURE_BINDING_CUBE_MAP
            ret = 0;
            break;
          }

         default:
          {
            GL.recordError(1280);
            // GL_INVALID_ENUM
            return;
          }
        }
      } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
        for (var i = 0; i < result.length; ++i) {
          switch (type) {
           case 0:
            (growMemViews(), HEAP32)[(((p) + (i * 4)) >> 2)] = result[i];
            break;

           case 2:
            (growMemViews(), HEAPF32)[(((p) + (i * 4)) >> 2)] = result[i];
            break;

           case 4:
            (growMemViews(), HEAP8)[(p) + (i)] = result[i] ? 1 : 0;
            break;
          }
        }
        return;
      } else {
        try {
          ret = result.name | 0;
        } catch (e) {
          GL.recordError(1280);
          // GL_INVALID_ENUM
          err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
          return;
        }
      }
      break;

     default:
      GL.recordError(1280);
      // GL_INVALID_ENUM
      err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof (result)}!`);
      return;
    }
  }
  switch (type) {
   case 1:
    writeI53ToI64(p, ret);
    break;

   case 0:
    (growMemViews(), HEAP32)[((p) >> 2)] = ret;
    break;

   case 2:
    (growMemViews(), HEAPF32)[((p) >> 2)] = ret;
    break;

   case 4:
    (growMemViews(), HEAP8)[p] = ret ? 1 : 0;
    break;
  }
};

var _emscripten_glGetBooleanv = (name_, p) => emscriptenWebGLGet(name_, p, 4);

var _emscripten_glGetBufferParameteri64v = (target, value, data) => {
  if (!data) {
    // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
    // if data == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  writeI53ToI64(data, GLctx.getBufferParameter(target, value));
};

var _emscripten_glGetBufferParameteriv = (target, value, data) => {
  if (!data) {
    // GLES2 specification does not specify how to behave if data is a null
    // pointer. Since calling this function does not make sense if data ==
    // null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAP32)[((data) >> 2)] = GLctx.getBufferParameter(target, value);
};

var _emscripten_glGetBufferPointerv = (target, pname, params) => {
  if (pname == 35005) {
    var ptr = 0;
    var mappedBuffer = GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)];
    if (mappedBuffer) {
      ptr = mappedBuffer.mem;
    }
    (growMemViews(), HEAP32)[((params) >> 2)] = ptr;
  } else {
    GL.recordError(1280);
    err("GL_INVALID_ENUM in glGetBufferPointerv");
  }
};

var _emscripten_glGetError = () => {
  var error = GLctx.getError() || GL.lastError;
  GL.lastError = 0;
  return error;
};

var _emscripten_glGetFloatv = (name_, p) => emscriptenWebGLGet(name_, p, 2);

var _emscripten_glGetFragDataLocation = (program, name) => GLctx.getFragDataLocation(GL.programs[program], UTF8ToString(name));

var _emscripten_glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
  var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
  if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
    result = result.name | 0;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = result;
};

var emscriptenWebGLGetIndexed = (target, index, data, type) => {
  if (!data) {
    // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
    // if data == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  var result = GLctx.getIndexedParameter(target, index);
  var ret;
  switch (typeof result) {
   case "boolean":
    ret = result ? 1 : 0;
    break;

   case "number":
    ret = result;
    break;

   case "object":
    if (result === null) {
      switch (target) {
       case 35983:
       // TRANSFORM_FEEDBACK_BUFFER_BINDING
        case 35368:
        // UNIFORM_BUFFER_BINDING
        ret = 0;
        break;

       default:
        {
          GL.recordError(1280);
          // GL_INVALID_ENUM
          return;
        }
      }
    } else if (result instanceof WebGLBuffer) {
      ret = result.name | 0;
    } else {
      GL.recordError(1280);
      // GL_INVALID_ENUM
      return;
    }
    break;

   default:
    GL.recordError(1280);
    // GL_INVALID_ENUM
    return;
  }
  switch (type) {
   case 1:
    writeI53ToI64(data, ret);
    break;

   case 0:
    (growMemViews(), HEAP32)[((data) >> 2)] = ret;
    break;

   case 2:
    (growMemViews(), HEAPF32)[((data) >> 2)] = ret;
    break;

   case 4:
    (growMemViews(), HEAP8)[data] = ret ? 1 : 0;
    break;

   default:
    abort("internal emscriptenWebGLGetIndexed() error, bad type: " + type);
  }
};

var _emscripten_glGetInteger64i_v = (target, index, data) => emscriptenWebGLGetIndexed(target, index, data, 1);

var _emscripten_glGetInteger64v = (name_, p) => {
  emscriptenWebGLGet(name_, p, 1);
};

var _emscripten_glGetIntegeri_v = (target, index, data) => emscriptenWebGLGetIndexed(target, index, data, 0);

var _emscripten_glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);

var _emscripten_glGetInternalformativ = (target, internalformat, pname, bufSize, params) => {
  if (bufSize < 0) {
    GL.recordError(1281);
    return;
  }
  if (!params) {
    // GLES3 specification does not specify how to behave if values is a null pointer. Since calling this function does not make sense
    // if values == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  var ret = GLctx.getInternalformatParameter(target, internalformat, pname);
  if (ret === null) return;
  for (var i = 0; i < ret.length && i < bufSize; ++i) {
    (growMemViews(), HEAP32)[(((params) + (i * 4)) >> 2)] = ret[i];
  }
};

var _emscripten_glGetProgramBinary = (program, bufSize, length, binaryFormat, binary) => {
  GL.recordError(1282);
};

var _emscripten_glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) log = "(unknown error)";
  var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
};

var _emscripten_glGetProgramiv = (program, pname, p) => {
  if (!p) {
    // GLES2 specification does not specify how to behave if p is a null
    // pointer. Since calling this function does not make sense if p == null,
    // issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (program >= GL.counter) {
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  if (pname == 35716) {
    // GL_INFO_LOG_LENGTH
    var log = GLctx.getProgramInfoLog(program);
    if (log === null) log = "(unknown error)";
    (growMemViews(), HEAP32)[((p) >> 2)] = log.length + 1;
  } else if (pname == 35719) {
    if (!program.maxUniformLength) {
      var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
      for (var i = 0; i < numActiveUniforms; ++i) {
        program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1);
      }
    }
    (growMemViews(), HEAP32)[((p) >> 2)] = program.maxUniformLength;
  } else if (pname == 35722) {
    if (!program.maxAttributeLength) {
      var numActiveAttributes = GLctx.getProgramParameter(program, 35721);
      for (var i = 0; i < numActiveAttributes; ++i) {
        program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1);
      }
    }
    (growMemViews(), HEAP32)[((p) >> 2)] = program.maxAttributeLength;
  } else if (pname == 35381) {
    if (!program.maxUniformBlockNameLength) {
      var numActiveUniformBlocks = GLctx.getProgramParameter(program, 35382);
      for (var i = 0; i < numActiveUniformBlocks; ++i) {
        program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1);
      }
    }
    (growMemViews(), HEAP32)[((p) >> 2)] = program.maxUniformBlockNameLength;
  } else {
    (growMemViews(), HEAP32)[((p) >> 2)] = GLctx.getProgramParameter(program, pname);
  }
};

var _emscripten_glGetQueryObjecti64vEXT = (id, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  var query = GL.queries[id];
  var param;
  if (GL.currentContext.version < 2) {
    param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
  } else {
    param = GLctx.getQueryParameter(query, pname);
  }
  var ret;
  if (typeof param == "boolean") {
    ret = param ? 1 : 0;
  } else {
    ret = param;
  }
  writeI53ToI64(params, ret);
};

var _emscripten_glGetQueryObjectivEXT = (id, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  var query = GL.queries[id];
  var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
  var ret;
  if (typeof param == "boolean") {
    ret = param ? 1 : 0;
  } else {
    ret = param;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = ret;
};

var _glGetQueryObjecti64vEXT = _emscripten_glGetQueryObjecti64vEXT;

var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;

var _emscripten_glGetQueryObjectuiv = (id, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  var query = GL.queries[id];
  var param = GLctx.getQueryParameter(query, pname);
  var ret;
  if (typeof param == "boolean") {
    ret = param ? 1 : 0;
  } else {
    ret = param;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = ret;
};

var _glGetQueryObjectivEXT = _emscripten_glGetQueryObjectivEXT;

var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;

var _emscripten_glGetQueryiv = (target, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = GLctx.getQuery(target, pname);
};

var _emscripten_glGetQueryivEXT = (target, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname);
};

var _emscripten_glGetRenderbufferParameteriv = (target, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if params == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = GLctx.getRenderbufferParameter(target, pname);
};

var _emscripten_glGetSamplerParameterfv = (sampler, pname, params) => {
  if (!params) {
    // GLES3 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAPF32)[((params) >> 2)] = GLctx.getSamplerParameter(GL.samplers[sampler], pname);
};

var _emscripten_glGetSamplerParameteriv = (sampler, pname, params) => {
  if (!params) {
    // GLES3 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
    // if p == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = GLctx.getSamplerParameter(GL.samplers[sampler], pname);
};

var _emscripten_glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
};

var _emscripten_glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
  var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
  (growMemViews(), HEAP32)[((range) >> 2)] = result.rangeMin;
  (growMemViews(), HEAP32)[(((range) + (4)) >> 2)] = result.rangeMax;
  (growMemViews(), HEAP32)[((precision) >> 2)] = result.precision;
};

var _emscripten_glGetShaderSource = (shader, bufSize, length, source) => {
  var result = GLctx.getShaderSource(GL.shaders[shader]);
  if (!result) return;
  // If an error occurs, nothing will be written to length or source.
  var numBytesWrittenExclNull = (bufSize > 0 && source) ? stringToUTF8(result, source, bufSize) : 0;
  if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
};

var _emscripten_glGetShaderiv = (shader, pname, p) => {
  if (!p) {
    // GLES2 specification does not specify how to behave if p is a null
    // pointer. Since calling this function does not make sense if p == null,
    // issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (pname == 35716) {
    // GL_INFO_LOG_LENGTH
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    // The GLES2 specification says that if the shader has an empty info log,
    // a value of 0 is returned. Otherwise the log has a null char appended.
    // (An empty string is falsey, so we can just check that instead of
    // looking at log.length.)
    var logLength = log ? log.length + 1 : 0;
    (growMemViews(), HEAP32)[((p) >> 2)] = logLength;
  } else if (pname == 35720) {
    // GL_SHADER_SOURCE_LENGTH
    var source = GLctx.getShaderSource(GL.shaders[shader]);
    // source may be a null, or the empty string, both of which are falsey
    // values that we report a 0 length for.
    var sourceLength = source ? source.length + 1 : 0;
    (growMemViews(), HEAP32)[((p) >> 2)] = sourceLength;
  } else {
    (growMemViews(), HEAP32)[((p) >> 2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
  }
};

var _emscripten_glGetString = name_ => {
  var ret = GL.stringCache[name_];
  if (!ret) {
    switch (name_) {
     case 7939:
      ret = stringToNewUTF8(webglGetExtensions().join(" "));
      break;

     case 7936:
     case 7937:
     case 37445:
     case 37446:
      var s = GLctx.getParameter(name_);
      if (!s) {
        GL.recordError(1280);
      }
      ret = s ? stringToNewUTF8(s) : 0;
      break;

     case 7938:
      var webGLVersion = GLctx.getParameter(7938);
      // return GLES version string corresponding to the version of the WebGL context
      var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
      if (GL.currentContext.version >= 2) glVersion = `OpenGL ES 3.0 (${webGLVersion})`;
      ret = stringToNewUTF8(glVersion);
      break;

     case 35724:
      var glslVersion = GLctx.getParameter(35724);
      // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
      var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
      var ver_num = glslVersion.match(ver_re);
      if (ver_num !== null) {
        if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
        // ensure minor version has 2 digits
        glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
      }
      ret = stringToNewUTF8(glslVersion);
      break;

     default:
      GL.recordError(1280);
    }
    GL.stringCache[name_] = ret;
  }
  return ret;
};

var _emscripten_glGetStringi = (name, index) => {
  if (GL.currentContext.version < 2) {
    GL.recordError(1282);
    // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
    return 0;
  }
  var stringiCache = GL.stringiCache[name];
  if (stringiCache) {
    if (index < 0 || index >= stringiCache.length) {
      GL.recordError(1281);
      return 0;
    }
    return stringiCache[index];
  }
  switch (name) {
   case 7939:
    var exts = webglGetExtensions().map(stringToNewUTF8);
    stringiCache = GL.stringiCache[name] = exts;
    if (index < 0 || index >= stringiCache.length) {
      GL.recordError(1281);
      return 0;
    }
    return stringiCache[index];

   default:
    GL.recordError(1280);
    return 0;
  }
};

var _emscripten_glGetSynciv = (sync, pname, bufSize, length, values) => {
  if (bufSize < 0) {
    // GLES3 specification does not specify how to behave if bufSize < 0, however in the spec wording for glGetInternalformativ, it does say that GL_INVALID_VALUE should be raised,
    // so raise GL_INVALID_VALUE here as well.
    GL.recordError(1281);
    return;
  }
  if (!values) {
    // GLES3 specification does not specify how to behave if values is a null pointer. Since calling this function does not make sense
    // if values == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  var ret = GLctx.getSyncParameter(GL.syncs[sync], pname);
  if (ret !== null) {
    (growMemViews(), HEAP32)[((values) >> 2)] = ret;
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = 1;
  }
};

var _emscripten_glGetTexParameterfv = (target, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null
    // pointer. Since calling this function does not make sense if p == null,
    // issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAPF32)[((params) >> 2)] = GLctx.getTexParameter(target, pname);
};

var _emscripten_glGetTexParameteriv = (target, pname, params) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null
    // pointer. Since calling this function does not make sense if p == null,
    // issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  (growMemViews(), HEAP32)[((params) >> 2)] = GLctx.getTexParameter(target, pname);
};

var _emscripten_glGetTransformFeedbackVarying = (program, index, bufSize, length, size, type, name) => {
  program = GL.programs[program];
  var info = GLctx.getTransformFeedbackVarying(program, index);
  if (!info) return;
  // If an error occurred, the return parameters length, size, type and name will be unmodified.
  if (name && bufSize > 0) {
    var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
  } else {
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = 0;
  }
  if (size) (growMemViews(), HEAP32)[((size) >> 2)] = info.size;
  if (type) (growMemViews(), HEAP32)[((type) >> 2)] = info.type;
};

var _emscripten_glGetUniformBlockIndex = (program, uniformBlockName) => GLctx.getUniformBlockIndex(GL.programs[program], UTF8ToString(uniformBlockName));

var _emscripten_glGetUniformIndices = (program, uniformCount, uniformNames, uniformIndices) => {
  if (!uniformIndices) {
    // GLES2 specification does not specify how to behave if uniformIndices is a null pointer. Since calling this function does not make sense
    // if uniformIndices == null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  var names = [];
  for (var i = 0; i < uniformCount; i++) names.push(UTF8ToString((growMemViews(), 
  HEAPU32)[(((uniformNames) + (i * 4)) >> 2)]));
  var result = GLctx.getUniformIndices(program, names);
  if (!result) return;
  // GL spec: If an error is generated, nothing is written out to uniformIndices.
  var len = result.length;
  for (var i = 0; i < len; i++) {
    (growMemViews(), HEAP32)[(((uniformIndices) + (i * 4)) >> 2)] = result[i];
  }
};

/** @suppress {checkTypes} */ var jstoi_q = str => parseInt(str);

/** @noinline */ var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");

var webglPrepareUniformLocationsBeforeFirstUse = program => {
  var uniformLocsById = program.uniformLocsById, // Maps GLuint -> WebGLUniformLocation
  uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, // Maps name -> [uniform array length, GLuint]
  i, j;
  // On the first time invocation of glGetUniformLocation on this shader program:
  // initialize cache data structures and discover which uniforms are arrays.
  if (!uniformLocsById) {
    // maps GLint integer locations to WebGLUniformLocations
    program.uniformLocsById = uniformLocsById = {};
    // maps integer locations back to uniform name strings, so that we can lazily fetch uniform array locations
    program.uniformArrayNamesById = {};
    var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
    for (i = 0; i < numActiveUniforms; ++i) {
      var u = GLctx.getActiveUniform(program, i);
      var nm = u.name;
      var sz = u.size;
      var lb = webglGetLeftBracePos(nm);
      var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
      // Assign a new location.
      var id = program.uniformIdCounter;
      program.uniformIdCounter += sz;
      // Eagerly get the location of the uniformArray[0] base element.
      // The remaining indices >0 will be left for lazy evaluation to
      // improve performance. Those may never be needed to fetch, if the
      // application fills arrays always in full starting from the first
      // element of the array.
      uniformSizeAndIdsByName[arrayName] = [ sz, id ];
      // Store placeholder integers in place that highlight that these
      // >0 index locations are array indices pending population.
      for (j = 0; j < sz; ++j) {
        uniformLocsById[id] = j;
        program.uniformArrayNamesById[id++] = arrayName;
      }
    }
  }
};

var _emscripten_glGetUniformLocation = (program, name) => {
  name = UTF8ToString(name);
  if (program = GL.programs[program]) {
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var uniformLocsById = program.uniformLocsById;
    // Maps GLuint -> WebGLUniformLocation
    var arrayIndex = 0;
    var uniformBaseName = name;
    // Invariant: when populating integer IDs for uniform locations, we must
    // maintain the precondition that arrays reside in contiguous addresses,
    // i.e. for a 'vec4 colors[10];', colors[4] must be at location
    // colors[0]+4.  However, user might call glGetUniformLocation(program,
    // "colors") for an array, so we cannot discover based on the user input
    // arguments whether the uniform we are dealing with is an array. The only
    // way to discover which uniforms are arrays is to enumerate over all the
    // active uniforms in the program.
    var leftBrace = webglGetLeftBracePos(name);
    // If user passed an array accessor "[index]", parse the array index off the accessor.
    if (leftBrace > 0) {
      arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
      // "index]", coerce parseInt(']') with >>>0 to treat "foo[]" as "foo[0]" and foo[-1] as unsigned out-of-bounds.
      uniformBaseName = name.slice(0, leftBrace);
    }
    // Have we cached the location of this uniform before?
    // A pair [array length, GLint of the uniform location]
    var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
    // If a uniform with this name exists, and if its index is within the
    // array limits (if it's even an array), query the WebGLlocation, or
    // return an existing cached location.
    if (sizeAndId && arrayIndex < sizeAndId[0]) {
      arrayIndex += sizeAndId[1];
      // Add the base location of the uniform to the array index offset.
      if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
        return arrayIndex;
      }
    }
  } else {
    // N.b. we are currently unable to distinguish between GL program IDs that
    // never existed vs GL program IDs that have been deleted, so report
    // GL_INVALID_VALUE in both cases.
    GL.recordError(1281);
  }
  return -1;
};

var webglGetUniformLocation = location => {
  var p = GLctx.currentProgram;
  if (p) {
    var webglLoc = p.uniformLocsById[location];
    // p.uniformLocsById[location] stores either an integer, or a
    // WebGLUniformLocation.
    // If an integer, we have not yet bound the location, so do it now. The
    // integer value specifies the array index we should bind to.
    if (typeof webglLoc == "number") {
      p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ""));
    }
    // Else an already cached WebGLUniformLocation, return it.
    return webglLoc;
  } else {
    GL.recordError(1282);
  }
};

/** @suppress{checkTypes} */ var emscriptenWebGLGetUniform = (program, location, params, type) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null
    // pointer. Since calling this function does not make sense if params ==
    // null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  webglPrepareUniformLocationsBeforeFirstUse(program);
  var data = GLctx.getUniform(program, webglGetUniformLocation(location));
  if (typeof data == "number" || typeof data == "boolean") {
    switch (type) {
     case 0:
      (growMemViews(), HEAP32)[((params) >> 2)] = data;
      break;

     case 2:
      (growMemViews(), HEAPF32)[((params) >> 2)] = data;
      break;
    }
  } else {
    for (var i = 0; i < data.length; i++) {
      switch (type) {
       case 0:
        (growMemViews(), HEAP32)[(((params) + (i * 4)) >> 2)] = data[i];
        break;

       case 2:
        (growMemViews(), HEAPF32)[(((params) + (i * 4)) >> 2)] = data[i];
        break;
      }
    }
  }
};

var _emscripten_glGetUniformfv = (program, location, params) => {
  emscriptenWebGLGetUniform(program, location, params, 2);
};

var _emscripten_glGetUniformiv = (program, location, params) => {
  emscriptenWebGLGetUniform(program, location, params, 0);
};

var _emscripten_glGetUniformuiv = (program, location, params) => emscriptenWebGLGetUniform(program, location, params, 0);

/** @suppress{checkTypes} */ var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
  if (!params) {
    // GLES2 specification does not specify how to behave if params is a null
    // pointer. Since calling this function does not make sense if params ==
    // null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (GL.currentContext.clientBuffers[index].enabled) {
    err("glGetVertexAttrib*v on client-side array: not supported, bad data returned");
  }
  var data = GLctx.getVertexAttrib(index, pname);
  if (pname == 34975) {
    (growMemViews(), HEAP32)[((params) >> 2)] = data && data["name"];
  } else if (typeof data == "number" || typeof data == "boolean") {
    switch (type) {
     case 0:
      (growMemViews(), HEAP32)[((params) >> 2)] = data;
      break;

     case 2:
      (growMemViews(), HEAPF32)[((params) >> 2)] = data;
      break;

     case 5:
      (growMemViews(), HEAP32)[((params) >> 2)] = Math.fround(data);
      break;
    }
  } else {
    for (var i = 0; i < data.length; i++) {
      switch (type) {
       case 0:
        (growMemViews(), HEAP32)[(((params) + (i * 4)) >> 2)] = data[i];
        break;

       case 2:
        (growMemViews(), HEAPF32)[(((params) + (i * 4)) >> 2)] = data[i];
        break;

       case 5:
        (growMemViews(), HEAP32)[(((params) + (i * 4)) >> 2)] = Math.fround(data[i]);
        break;
      }
    }
  }
};

var _emscripten_glGetVertexAttribIiv = (index, pname, params) => {
  // N.B. This function may only be called if the vertex attribute was specified using the function glVertexAttribI4iv(),
  // otherwise the results are undefined. (GLES3 spec 6.1.12)
  emscriptenWebGLGetVertexAttrib(index, pname, params, 0);
};

var _glGetVertexAttribIiv = _emscripten_glGetVertexAttribIiv;

var _emscripten_glGetVertexAttribIuiv = _glGetVertexAttribIiv;

var _emscripten_glGetVertexAttribPointerv = (index, pname, pointer) => {
  if (!pointer) {
    // GLES2 specification does not specify how to behave if pointer is a null
    // pointer. Since calling this function does not make sense if pointer ==
    // null, issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (GL.currentContext.clientBuffers[index].enabled) {
    err("glGetVertexAttribPointer on client-side array: not supported, bad data returned");
  }
  (growMemViews(), HEAP32)[((pointer) >> 2)] = GLctx.getVertexAttribOffset(index, pname);
};

var _emscripten_glGetVertexAttribfv = (index, pname, params) => {
  // N.B. This function may only be called if the vertex attribute was
  // specified using the function glVertexAttrib*f(), otherwise the results
  // are undefined. (GLES3 spec 6.1.12)
  emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
};

var _emscripten_glGetVertexAttribiv = (index, pname, params) => {
  // N.B. This function may only be called if the vertex attribute was
  // specified using the function glVertexAttrib*f(), otherwise the results
  // are undefined. (GLES3 spec 6.1.12)
  emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
};

var _emscripten_glHint = (x0, x1) => GLctx.hint(x0, x1);

var _emscripten_glInvalidateFramebuffer = (target, numAttachments, attachments) => {
  var list = tempFixedLengthArray[numAttachments];
  for (var i = 0; i < numAttachments; i++) {
    list[i] = (growMemViews(), HEAP32)[(((attachments) + (i * 4)) >> 2)];
  }
  GLctx.invalidateFramebuffer(target, list);
};

var _emscripten_glInvalidateSubFramebuffer = (target, numAttachments, attachments, x, y, width, height) => {
  var list = tempFixedLengthArray[numAttachments];
  for (var i = 0; i < numAttachments; i++) {
    list[i] = (growMemViews(), HEAP32)[(((attachments) + (i * 4)) >> 2)];
  }
  GLctx.invalidateSubFramebuffer(target, list, x, y, width, height);
};

var _emscripten_glIsBuffer = buffer => {
  var b = GL.buffers[buffer];
  if (!b) return 0;
  return GLctx.isBuffer(b);
};

var _emscripten_glIsEnabled = x0 => GLctx.isEnabled(x0);

var _emscripten_glIsFramebuffer = framebuffer => {
  var fb = GL.framebuffers[framebuffer];
  if (!fb) return 0;
  return GLctx.isFramebuffer(fb);
};

var _emscripten_glIsProgram = program => {
  program = GL.programs[program];
  if (!program) return 0;
  return GLctx.isProgram(program);
};

var _emscripten_glIsQuery = id => {
  var query = GL.queries[id];
  if (!query) return 0;
  return GLctx.isQuery(query);
};

var _emscripten_glIsQueryEXT = id => {
  var query = GL.queries[id];
  if (!query) return 0;
  return GLctx.disjointTimerQueryExt["isQueryEXT"](query);
};

var _emscripten_glIsRenderbuffer = renderbuffer => {
  var rb = GL.renderbuffers[renderbuffer];
  if (!rb) return 0;
  return GLctx.isRenderbuffer(rb);
};

var _emscripten_glIsSampler = id => {
  var sampler = GL.samplers[id];
  if (!sampler) return 0;
  return GLctx.isSampler(sampler);
};

var _emscripten_glIsShader = shader => {
  var s = GL.shaders[shader];
  if (!s) return 0;
  return GLctx.isShader(s);
};

var _emscripten_glIsSync = sync => GLctx.isSync(GL.syncs[sync]);

var _emscripten_glIsTexture = id => {
  var texture = GL.textures[id];
  if (!texture) return 0;
  return GLctx.isTexture(texture);
};

var _emscripten_glIsTransformFeedback = id => GLctx.isTransformFeedback(GL.transformFeedbacks[id]);

var _emscripten_glIsVertexArray = array => {
  var vao = GL.vaos[array];
  if (!vao) return 0;
  return GLctx.isVertexArray(vao);
};

var _glIsVertexArray = _emscripten_glIsVertexArray;

var _emscripten_glIsVertexArrayOES = _glIsVertexArray;

var _emscripten_glLineWidth = x0 => GLctx.lineWidth(x0);

var _emscripten_glLinkProgram = program => {
  program = GL.programs[program];
  GLctx.linkProgram(program);
  // Invalidate earlier computed uniform->ID mappings, those have now become stale
  program.uniformLocsById = 0;
  // Mark as null-like so that glGetUniformLocation() knows to populate this again.
  program.uniformSizeAndIdsByName = {};
};

var _emscripten_glMapBufferRange = (target, offset, length, access) => {
  if ((access & (1 | 32)) != 0) {
    err("glMapBufferRange access does not support MAP_READ or MAP_UNSYNCHRONIZED");
    return 0;
  }
  if ((access & 2) == 0) {
    err("glMapBufferRange access must include MAP_WRITE");
    return 0;
  }
  if ((access & (4 | 8)) == 0) {
    err("glMapBufferRange access must include INVALIDATE_BUFFER or INVALIDATE_RANGE");
    return 0;
  }
  if (!emscriptenWebGLValidateMapBufferTarget(target)) {
    GL.recordError(1280);
    err("GL_INVALID_ENUM in glMapBufferRange");
    return 0;
  }
  var mem = _malloc(length), binding = emscriptenWebGLGetBufferBinding(target);
  if (!mem) return 0;
  binding = GL.mappedBuffers[binding] ??= {};
  binding.offset = offset;
  binding.length = length;
  binding.mem = mem;
  binding.access = access;
  return mem;
};

var _emscripten_glPauseTransformFeedback = () => GLctx.pauseTransformFeedback();

var _emscripten_glPixelStorei = (pname, param) => {
  if (pname == 3317) {
    GL.unpackAlignment = param;
  } else if (pname == 3314) {
    GL.unpackRowLength = param;
  }
  GLctx.pixelStorei(pname, param);
};

var _emscripten_glPolygonModeWEBGL = (face, mode) => {
  GLctx.webglPolygonMode["polygonModeWEBGL"](face, mode);
};

var _emscripten_glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);

var _emscripten_glPolygonOffsetClampEXT = (factor, units, clamp) => {
  GLctx.extPolygonOffsetClamp["polygonOffsetClampEXT"](factor, units, clamp);
};

var _emscripten_glProgramBinary = (program, binaryFormat, binary, length) => {
  GL.recordError(1280);
};

var _emscripten_glProgramParameteri = (program, pname, value) => {
  GL.recordError(1280);
};

var _emscripten_glQueryCounterEXT = (id, target) => {
  GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target);
};

var _emscripten_glReadBuffer = x0 => GLctx.readBuffer(x0);

var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
  function roundedToNextMultipleOf(x, y) {
    return (x + y - 1) & -y;
  }
  var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
  var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
  return height * alignedRowSize;
};

var colorChannelsInGlTextureFormat = format => {
  // Micro-optimizations for size: map format to size by subtracting smallest
  // enum value (0x1902) from all values first.  Also omit the most common
  // size value (1) from the list, which is assumed by formats not on the
  // list.
  var colorChannels = {
    // 0x1902 /* GL_DEPTH_COMPONENT */ - 0x1902: 1,
    // 0x1906 /* GL_ALPHA */ - 0x1902: 1,
    5: 3,
    6: 4,
    // 0x1909 /* GL_LUMINANCE */ - 0x1902: 1,
    8: 2,
    29502: 3,
    29504: 4,
    // 0x1903 /* GL_RED */ - 0x1902: 1,
    26917: 2,
    26918: 2,
    // 0x8D94 /* GL_RED_INTEGER */ - 0x1902: 1,
    29846: 3,
    29847: 4
  };
  return colorChannels[format - 6402] || 1;
};

var heapObjectForWebGLType = type => {
  // Micro-optimization for size: Subtract lowest GL enum number (0x1400/* GL_BYTE */) from type to compare
  // smaller values for the heap, for shorter generated code size.
  // Also the type HEAPU16 is not tested for explicitly, but any unrecognized type will return out HEAPU16.
  // (since most types are HEAPU16)
  type -= 5120;
  if (type == 0) return (growMemViews(), HEAP8);
  if (type == 1) return (growMemViews(), HEAPU8);
  if (type == 2) return (growMemViews(), HEAP16);
  if (type == 4) return (growMemViews(), HEAP32);
  if (type == 6) return (growMemViews(), HEAPF32);
  if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return (growMemViews(), 
  HEAPU32);
  return (growMemViews(), HEAPU16);
};

var toTypedArrayIndex = (pointer, heap) => pointer >>> (31 - Math.clz32(heap.BYTES_PER_ELEMENT));

var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
  var heap = heapObjectForWebGLType(type);
  var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
  var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
  return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
};

var _emscripten_glReadPixels = (x, y, width, height, format, type, pixels) => {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelPackBufferBinding) {
      GLctx.readPixels(x, y, width, height, format, type, pixels);
      return;
    }
    var heap = heapObjectForWebGLType(type);
    var target = toTypedArrayIndex(pixels, heap);
    GLctx.readPixels(x, y, width, height, format, type, heap, target);
    return;
  }
  var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
  if (!pixelData) {
    GL.recordError(1280);
    return;
  }
  GLctx.readPixels(x, y, width, height, format, type, pixelData);
};

var _emscripten_glReleaseShaderCompiler = () => {};

var _emscripten_glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);

var _emscripten_glRenderbufferStorageMultisample = (x0, x1, x2, x3, x4) => GLctx.renderbufferStorageMultisample(x0, x1, x2, x3, x4);

var _emscripten_glResumeTransformFeedback = () => GLctx.resumeTransformFeedback();

var _emscripten_glSampleCoverage = (value, invert) => {
  GLctx.sampleCoverage(value, !!invert);
};

var _emscripten_glSamplerParameterf = (sampler, pname, param) => {
  GLctx.samplerParameterf(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameterfv = (sampler, pname, params) => {
  var param = (growMemViews(), HEAPF32)[((params) >> 2)];
  GLctx.samplerParameterf(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameteri = (sampler, pname, param) => {
  GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameteriv = (sampler, pname, params) => {
  var param = (growMemViews(), HEAP32)[((params) >> 2)];
  GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
};

var _emscripten_glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);

var _emscripten_glShaderBinary = (count, shaders, binaryformat, binary, length) => {
  GL.recordError(1280);
};

var _emscripten_glShaderSource = (shader, count, string, length) => {
  var source = GL.getSource(shader, count, string, length);
  GLctx.shaderSource(GL.shaders[shader], source);
};

var _emscripten_glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);

var _emscripten_glStencilFuncSeparate = (x0, x1, x2, x3) => GLctx.stencilFuncSeparate(x0, x1, x2, x3);

var _emscripten_glStencilMask = x0 => GLctx.stencilMask(x0);

var _emscripten_glStencilMaskSeparate = (x0, x1) => GLctx.stencilMaskSeparate(x0, x1);

var _emscripten_glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);

var _emscripten_glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);

var _emscripten_glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
      return;
    }
    if (pixels) {
      var heap = heapObjectForWebGLType(type);
      var index = toTypedArrayIndex(pixels, heap);
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, index);
      return;
    }
  }
  var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null;
  GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
};

var _emscripten_glTexImage3D = (target, level, internalFormat, width, height, depth, border, format, type, pixels) => {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels);
  } else if (pixels) {
    var heap = heapObjectForWebGLType(type);
    GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, heap, toTypedArrayIndex(pixels, heap));
  } else {
    GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, null);
  }
};

var _emscripten_glTexParameterf = (x0, x1, x2) => GLctx.texParameterf(x0, x1, x2);

var _emscripten_glTexParameterfv = (target, pname, params) => {
  var param = (growMemViews(), HEAPF32)[((params) >> 2)];
  GLctx.texParameterf(target, pname, param);
};

var _emscripten_glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);

var _emscripten_glTexParameteriv = (target, pname, params) => {
  var param = (growMemViews(), HEAP32)[((params) >> 2)];
  GLctx.texParameteri(target, pname, param);
};

var _emscripten_glTexStorage2D = (x0, x1, x2, x3, x4) => GLctx.texStorage2D(x0, x1, x2, x3, x4);

var _emscripten_glTexStorage3D = (x0, x1, x2, x3, x4, x5) => GLctx.texStorage3D(x0, x1, x2, x3, x4, x5);

var _emscripten_glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
      return;
    }
    if (pixels) {
      var heap = heapObjectForWebGLType(type);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, toTypedArrayIndex(pixels, heap));
      return;
    }
  }
  var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0) : null;
  GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
};

var _emscripten_glTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) => {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
  } else if (pixels) {
    var heap = heapObjectForWebGLType(type);
    GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, toTypedArrayIndex(pixels, heap));
  } else {
    GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
  }
};

var _emscripten_glTransformFeedbackVaryings = (program, count, varyings, bufferMode) => {
  program = GL.programs[program];
  var vars = [];
  for (var i = 0; i < count; i++) vars.push(UTF8ToString((growMemViews(), HEAPU32)[(((varyings) + (i * 4)) >> 2)]));
  GLctx.transformFeedbackVaryings(program, vars, bufferMode);
};

var _emscripten_glUniform1f = (location, v0) => {
  GLctx.uniform1f(webglGetUniformLocation(location), v0);
};

var miniTempWebGLFloatBuffers = [];

var _emscripten_glUniform1fv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform1fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count);
    return;
  }
  if (count <= 288) {
    // avoid allocation when uploading few enough uniforms
    var view = miniTempWebGLFloatBuffers[count];
    for (var i = 0; i < count; ++i) {
      view[i] = (growMemViews(), HEAPF32)[(((value) + (4 * i)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 4) >> 2));
  }
  GLctx.uniform1fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform1i = (location, v0) => {
  GLctx.uniform1i(webglGetUniformLocation(location), v0);
};

var miniTempWebGLIntBuffers = [];

var _emscripten_glUniform1iv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform1iv(webglGetUniformLocation(location), (growMemViews(), HEAP32), ((value) >> 2), count);
    return;
  }
  if (count <= 288) {
    // avoid allocation when uploading few enough uniforms
    var view = miniTempWebGLIntBuffers[count];
    for (var i = 0; i < count; ++i) {
      view[i] = (growMemViews(), HEAP32)[(((value) + (4 * i)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAP32).subarray((((value) >> 2)), ((value + count * 4) >> 2));
  }
  GLctx.uniform1iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform1ui = (location, v0) => {
  GLctx.uniform1ui(webglGetUniformLocation(location), v0);
};

var _emscripten_glUniform1uiv = (location, count, value) => {
  count && GLctx.uniform1uiv(webglGetUniformLocation(location), (growMemViews(), HEAPU32), ((value) >> 2), count);
};

var _emscripten_glUniform2f = (location, v0, v1) => {
  GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
};

var _emscripten_glUniform2fv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform2fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count * 2);
    return;
  }
  if (count <= 144) {
    // avoid allocation when uploading few enough uniforms
    count *= 2;
    var view = miniTempWebGLFloatBuffers[count];
    for (var i = 0; i < count; i += 2) {
      view[i] = (growMemViews(), HEAPF32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 4)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 8) >> 2));
  }
  GLctx.uniform2fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform2i = (location, v0, v1) => {
  GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
};

var _emscripten_glUniform2iv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform2iv(webglGetUniformLocation(location), (growMemViews(), HEAP32), ((value) >> 2), count * 2);
    return;
  }
  if (count <= 144) {
    // avoid allocation when uploading few enough uniforms
    count *= 2;
    var view = miniTempWebGLIntBuffers[count];
    for (var i = 0; i < count; i += 2) {
      view[i] = (growMemViews(), HEAP32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAP32)[(((value) + (4 * i + 4)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAP32).subarray((((value) >> 2)), ((value + count * 8) >> 2));
  }
  GLctx.uniform2iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform2ui = (location, v0, v1) => {
  GLctx.uniform2ui(webglGetUniformLocation(location), v0, v1);
};

var _emscripten_glUniform2uiv = (location, count, value) => {
  count && GLctx.uniform2uiv(webglGetUniformLocation(location), (growMemViews(), HEAPU32), ((value) >> 2), count * 2);
};

var _emscripten_glUniform3f = (location, v0, v1, v2) => {
  GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
};

var _emscripten_glUniform3fv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform3fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count * 3);
    return;
  }
  if (count <= 96) {
    // avoid allocation when uploading few enough uniforms
    count *= 3;
    var view = miniTempWebGLFloatBuffers[count];
    for (var i = 0; i < count; i += 3) {
      view[i] = (growMemViews(), HEAPF32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 4)) >> 2)];
      view[i + 2] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 8)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 12) >> 2));
  }
  GLctx.uniform3fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform3i = (location, v0, v1, v2) => {
  GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
};

var _emscripten_glUniform3iv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform3iv(webglGetUniformLocation(location), (growMemViews(), HEAP32), ((value) >> 2), count * 3);
    return;
  }
  if (count <= 96) {
    // avoid allocation when uploading few enough uniforms
    count *= 3;
    var view = miniTempWebGLIntBuffers[count];
    for (var i = 0; i < count; i += 3) {
      view[i] = (growMemViews(), HEAP32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAP32)[(((value) + (4 * i + 4)) >> 2)];
      view[i + 2] = (growMemViews(), HEAP32)[(((value) + (4 * i + 8)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAP32).subarray((((value) >> 2)), ((value + count * 12) >> 2));
  }
  GLctx.uniform3iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform3ui = (location, v0, v1, v2) => {
  GLctx.uniform3ui(webglGetUniformLocation(location), v0, v1, v2);
};

var _emscripten_glUniform3uiv = (location, count, value) => {
  count && GLctx.uniform3uiv(webglGetUniformLocation(location), (growMemViews(), HEAPU32), ((value) >> 2), count * 3);
};

var _emscripten_glUniform4f = (location, v0, v1, v2, v3) => {
  GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var _emscripten_glUniform4fv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform4fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count * 4);
    return;
  }
  if (count <= 72) {
    // avoid allocation when uploading few enough uniforms
    var view = miniTempWebGLFloatBuffers[4 * count];
    // hoist the heap out of the loop for size and for pthreads+growth.
    var heap = (growMemViews(), HEAPF32);
    value = ((value) >> 2);
    count *= 4;
    for (var i = 0; i < count; i += 4) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 16) >> 2));
  }
  GLctx.uniform4fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform4i = (location, v0, v1, v2, v3) => {
  GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var _emscripten_glUniform4iv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform4iv(webglGetUniformLocation(location), (growMemViews(), HEAP32), ((value) >> 2), count * 4);
    return;
  }
  if (count <= 72) {
    // avoid allocation when uploading few enough uniforms
    count *= 4;
    var view = miniTempWebGLIntBuffers[count];
    for (var i = 0; i < count; i += 4) {
      view[i] = (growMemViews(), HEAP32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAP32)[(((value) + (4 * i + 4)) >> 2)];
      view[i + 2] = (growMemViews(), HEAP32)[(((value) + (4 * i + 8)) >> 2)];
      view[i + 3] = (growMemViews(), HEAP32)[(((value) + (4 * i + 12)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAP32).subarray((((value) >> 2)), ((value + count * 16) >> 2));
  }
  GLctx.uniform4iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform4ui = (location, v0, v1, v2, v3) => {
  GLctx.uniform4ui(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var _emscripten_glUniform4uiv = (location, count, value) => {
  count && GLctx.uniform4uiv(webglGetUniformLocation(location), (growMemViews(), HEAPU32), ((value) >> 2), count * 4);
};

var _emscripten_glUniformBlockBinding = (program, uniformBlockIndex, uniformBlockBinding) => {
  program = GL.programs[program];
  GLctx.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
};

var _emscripten_glUniformMatrix2fv = (location, count, transpose, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
    HEAPF32), ((value) >> 2), count * 4);
    return;
  }
  if (count <= 72) {
    // avoid allocation when uploading few enough uniforms
    count *= 4;
    var view = miniTempWebGLFloatBuffers[count];
    for (var i = 0; i < count; i += 4) {
      view[i] = (growMemViews(), HEAPF32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 4)) >> 2)];
      view[i + 2] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 8)) >> 2)];
      view[i + 3] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 12)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 16) >> 2));
  }
  GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view);
};

var _emscripten_glUniformMatrix2x3fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix2x3fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 6);
};

var _emscripten_glUniformMatrix2x4fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix2x4fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 8);
};

var _emscripten_glUniformMatrix3fv = (location, count, transpose, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
    HEAPF32), ((value) >> 2), count * 9);
    return;
  }
  if (count <= 32) {
    // avoid allocation when uploading few enough uniforms
    count *= 9;
    var view = miniTempWebGLFloatBuffers[count];
    for (var i = 0; i < count; i += 9) {
      view[i] = (growMemViews(), HEAPF32)[(((value) + (4 * i)) >> 2)];
      view[i + 1] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 4)) >> 2)];
      view[i + 2] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 8)) >> 2)];
      view[i + 3] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 12)) >> 2)];
      view[i + 4] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 16)) >> 2)];
      view[i + 5] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 20)) >> 2)];
      view[i + 6] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 24)) >> 2)];
      view[i + 7] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 28)) >> 2)];
      view[i + 8] = (growMemViews(), HEAPF32)[(((value) + (4 * i + 32)) >> 2)];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 36) >> 2));
  }
  GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
};

var _emscripten_glUniformMatrix3x2fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix3x2fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 6);
};

var _emscripten_glUniformMatrix3x4fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix3x4fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 12);
};

var _emscripten_glUniformMatrix4fv = (location, count, transpose, value) => {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
    HEAPF32), ((value) >> 2), count * 16);
    return;
  }
  if (count <= 18) {
    // avoid allocation when uploading few enough uniforms
    var view = miniTempWebGLFloatBuffers[16 * count];
    // hoist the heap out of the loop for size and for pthreads+growth.
    var heap = (growMemViews(), HEAPF32);
    value = ((value) >> 2);
    count *= 16;
    for (var i = 0; i < count; i += 16) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3];
      view[i + 4] = heap[dst + 4];
      view[i + 5] = heap[dst + 5];
      view[i + 6] = heap[dst + 6];
      view[i + 7] = heap[dst + 7];
      view[i + 8] = heap[dst + 8];
      view[i + 9] = heap[dst + 9];
      view[i + 10] = heap[dst + 10];
      view[i + 11] = heap[dst + 11];
      view[i + 12] = heap[dst + 12];
      view[i + 13] = heap[dst + 13];
      view[i + 14] = heap[dst + 14];
      view[i + 15] = heap[dst + 15];
    }
  } else {
    var view = (growMemViews(), HEAPF32).subarray((((value) >> 2)), ((value + count * 64) >> 2));
  }
  GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
};

var _emscripten_glUniformMatrix4x2fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix4x2fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 8);
};

var _emscripten_glUniformMatrix4x3fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix4x3fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 12);
};

var _emscripten_glUnmapBuffer = target => {
  if (!emscriptenWebGLValidateMapBufferTarget(target)) {
    GL.recordError(1280);
    err("GL_INVALID_ENUM in glUnmapBuffer");
    return 0;
  }
  var buffer = emscriptenWebGLGetBufferBinding(target);
  var mapping = GL.mappedBuffers[buffer];
  if (!mapping || !mapping.mem) {
    GL.recordError(1282);
    err("buffer was never mapped in glUnmapBuffer");
    return 0;
  }
  if (!(mapping.access & 16)) {
    /* GL_MAP_FLUSH_EXPLICIT_BIT */ if (GL.currentContext.version >= 2) {
      GLctx.bufferSubData(target, mapping.offset, (growMemViews(), HEAPU8), mapping.mem, mapping.length);
    } else GLctx.bufferSubData(target, mapping.offset, (growMemViews(), HEAPU8).subarray(mapping.mem, mapping.mem + mapping.length));
  }
  _free(mapping.mem);
  mapping.mem = 0;
  return 1;
};

var _emscripten_glUseProgram = program => {
  program = GL.programs[program];
  GLctx.useProgram(program);
  // Record the currently active program so that we can access the uniform
  // mapping table of that program.
  GLctx.currentProgram = program;
};

var _emscripten_glValidateProgram = program => {
  GLctx.validateProgram(GL.programs[program]);
};

var _emscripten_glVertexAttrib1f = (x0, x1) => GLctx.vertexAttrib1f(x0, x1);

var _emscripten_glVertexAttrib1fv = (index, v) => {
  GLctx.vertexAttrib1f(index, (growMemViews(), HEAPF32)[v >> 2]);
};

var _emscripten_glVertexAttrib2f = (x0, x1, x2) => GLctx.vertexAttrib2f(x0, x1, x2);

var _emscripten_glVertexAttrib2fv = (index, v) => {
  GLctx.vertexAttrib2f(index, (growMemViews(), HEAPF32)[v >> 2], (growMemViews(), 
  HEAPF32)[v + 4 >> 2]);
};

var _emscripten_glVertexAttrib3f = (x0, x1, x2, x3) => GLctx.vertexAttrib3f(x0, x1, x2, x3);

var _emscripten_glVertexAttrib3fv = (index, v) => {
  GLctx.vertexAttrib3f(index, (growMemViews(), HEAPF32)[v >> 2], (growMemViews(), 
  HEAPF32)[v + 4 >> 2], (growMemViews(), HEAPF32)[v + 8 >> 2]);
};

var _emscripten_glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);

var _emscripten_glVertexAttrib4fv = (index, v) => {
  GLctx.vertexAttrib4f(index, (growMemViews(), HEAPF32)[v >> 2], (growMemViews(), 
  HEAPF32)[v + 4 >> 2], (growMemViews(), HEAPF32)[v + 8 >> 2], (growMemViews(), HEAPF32)[v + 12 >> 2]);
};

var _emscripten_glVertexAttribDivisor = (index, divisor) => {
  GLctx.vertexAttribDivisor(index, divisor);
};

var _glVertexAttribDivisor = _emscripten_glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorARB = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorEXT = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorNV = _glVertexAttribDivisor;

var _emscripten_glVertexAttribI4i = (x0, x1, x2, x3, x4) => GLctx.vertexAttribI4i(x0, x1, x2, x3, x4);

var _emscripten_glVertexAttribI4iv = (index, v) => {
  GLctx.vertexAttribI4i(index, (growMemViews(), HEAP32)[v >> 2], (growMemViews(), 
  HEAP32)[v + 4 >> 2], (growMemViews(), HEAP32)[v + 8 >> 2], (growMemViews(), HEAP32)[v + 12 >> 2]);
};

var _emscripten_glVertexAttribI4ui = (x0, x1, x2, x3, x4) => GLctx.vertexAttribI4ui(x0, x1, x2, x3, x4);

var _emscripten_glVertexAttribI4uiv = (index, v) => {
  GLctx.vertexAttribI4ui(index, (growMemViews(), HEAPU32)[v >> 2], (growMemViews(), 
  HEAPU32)[v + 4 >> 2], (growMemViews(), HEAPU32)[v + 8 >> 2], (growMemViews(), HEAPU32)[v + 12 >> 2]);
};

var _emscripten_glVertexAttribIPointer = (index, size, type, stride, ptr) => {
  var cb = GL.currentContext.clientBuffers[index];
  if (!GLctx.currentArrayBufferBinding) {
    cb.size = size;
    cb.type = type;
    cb.normalized = false;
    cb.stride = stride;
    cb.ptr = ptr;
    cb.clientside = true;
    cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
      this.vertexAttribIPointer(index, size, type, stride, ptr);
    };
    return;
  }
  cb.clientside = false;
  GLctx.vertexAttribIPointer(index, size, type, stride, ptr);
};

var _emscripten_glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
  var cb = GL.currentContext.clientBuffers[index];
  if (!GLctx.currentArrayBufferBinding) {
    cb.size = size;
    cb.type = type;
    cb.normalized = normalized;
    cb.stride = stride;
    cb.ptr = ptr;
    cb.clientside = true;
    cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
      this.vertexAttribPointer(index, size, type, normalized, stride, ptr);
    };
    return;
  }
  cb.clientside = false;
  GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
};

var _emscripten_glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);

var _emscripten_glWaitSync = (sync, flags, timeout) => {
  // See WebGL2 vs GLES3 difference on GL_TIMEOUT_IGNORED above (https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15)
  timeout = Number(timeout);
  GLctx.waitSync(GL.syncs[sync], flags, timeout);
};

var _emscripten_has_asyncify = () => 1;

var doRequestFullscreen = (target, strategy) => {
  if (!JSEvents.fullscreenEnabled()) return -1;
  target = findEventTarget(target);
  if (!target) return -4;
  if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
    return -3;
  }
  // Queue this function call if we're not currently in an event handler and
  // the user saw it appropriate to do so.
  if (!JSEvents.canPerformEventHandlerRequests()) {
    if (strategy.deferUntilInEventHandler) {
      JSEvents.deferCall(JSEvents_requestFullscreen, 1, [ target, strategy ]);
      return 1;
    }
    return -2;
  }
  return JSEvents_requestFullscreen(target, strategy);
};

function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(50, 0, 1, target, deferUntilInEventHandler, fullscreenStrategy);
  var strategy = {
    scaleMode: (growMemViews(), HEAP32)[((fullscreenStrategy) >> 2)],
    canvasResolutionScaleMode: (growMemViews(), HEAP32)[(((fullscreenStrategy) + (4)) >> 2)],
    filteringMode: (growMemViews(), HEAP32)[(((fullscreenStrategy) + (8)) >> 2)],
    deferUntilInEventHandler,
    canvasResizedCallbackTargetThread: (growMemViews(), HEAP32)[(((fullscreenStrategy) + (20)) >> 2)],
    canvasResizedCallback: (growMemViews(), HEAP32)[(((fullscreenStrategy) + (12)) >> 2)],
    canvasResizedCallbackUserData: (growMemViews(), HEAP32)[(((fullscreenStrategy) + (16)) >> 2)]
  };
  return doRequestFullscreen(target, strategy);
}

function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(51, 0, 1, target, deferUntilInEventHandler);
  target = findEventTarget(target);
  if (!target) return -4;
  if (!target.requestPointerLock) {
    return -1;
  }
  // Queue this function call if we're not currently in an event handler and
  // the user saw it appropriate to do so.
  if (!JSEvents.canPerformEventHandlerRequests()) {
    if (deferUntilInEventHandler) {
      JSEvents.deferCall(requestPointerLock, 2, [ target ]);
      return 1;
    }
    return -2;
  }
  return requestPointerLock(target);
}

var getHeapMax = () => // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
// full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
// for any code that deals with heap sizes, which would require special
// casing all heap size related code to treat 0 specially.
2147483648;

var growMemory = size => {
  var oldHeapSize = wasmMemory.buffer.byteLength;
  var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
  try {
    // round size grow request up to wasm page size (fixed 64KB per spec)
    wasmMemory.grow(pages);
    // .grow() takes a delta compared to the previous size
    updateMemoryViews();
    return 1;
  } catch (e) {
    err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
  }
};

var _emscripten_resize_heap = requestedSize => {
  var oldSize = (growMemViews(), HEAPU8).length;
  // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
  requestedSize >>>= 0;
  // With multithreaded builds, races can happen (another thread might increase the size
  // in between), so return a failure, and let the caller retry.
  if (requestedSize <= oldSize) {
    return false;
  }
  // Memory resize rules:
  // 1.  Always increase heap size to at least the requested size, rounded up
  //     to next page multiple.
  // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
  //     geometrically: increase the heap size according to
  //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
  //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
  // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
  //     linearly: increase the heap size by at least
  //     MEMORY_GROWTH_LINEAR_STEP bytes.
  // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
  //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
  // 4.  If we were unable to allocate as much memory, it may be due to
  //     over-eager decision to excessively reserve due to (3) above.
  //     Hence if an allocation fails, cut down on the amount of excess
  //     growth, in an attempt to succeed to perform a smaller allocation.
  // A limit is set for how much we can grow. We should not exceed that
  // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
    return false;
  }
  // Loop through potential heap size increases. If we attempt a too eager
  // reservation that fails, cut down on the attempted size and reserve a
  // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    // ensure geometric growth
    // but limit overreserving (default to capping at +96MB overgrowth at most)
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
  return false;
};

var _emscripten_run_script = ptr => {
  eval(UTF8ToString(ptr));
};

/** @suppress {checkTypes} */ function _emscripten_sample_gamepad_data() {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(52, 0, 1);
  try {
    if (navigator.getGamepads) return (JSEvents.lastGamepadState = navigator.getGamepads()) ? 0 : -1;
  } catch (e) {
    err(`navigator.getGamepads() exists, but failed to execute with exception ${e}. Disabling Gamepad access.`);
    navigator.getGamepads = null;
  }
  return -1;
}

var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
  var beforeUnloadEventHandlerFunc = e => {
    // Note: This is always called on the main browser thread, since it needs synchronously return a value!
    var confirmationMessage = ((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, 0, userData);
    if (confirmationMessage) {
      confirmationMessage = UTF8ToString(confirmationMessage);
    }
    if (confirmationMessage) {
      e.preventDefault();
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  };
  var eventHandler = {
    target: findEventTarget(target),
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: beforeUnloadEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(53, 0, 1, userData, callbackfunc, targetThread);
  if (typeof onbeforeunload == "undefined") return -1;
  // beforeunload callback can only be registered on the main browser thread, because the page will go away immediately after returning from the handler,
  // and there is no time to start proxying it anywhere.
  if (targetThread !== 1) return -5;
  return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload");
}

var registerFocusEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 256;
  JSEvents.focusEvent ||= _malloc(eventSize);
  var focusEventHandlerFunc = e => {
    var nodeName = JSEvents.getNodeNameForTarget(e.target);
    var id = e.target.id ? e.target.id : "";
    var focusEvent = JSEvents.focusEvent;
    stringToUTF8(nodeName, focusEvent + 0, 128);
    stringToUTF8(id, focusEvent + 128, 128);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, focusEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, focusEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target: findEventTarget(target),
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: focusEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(54, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
}

function _emscripten_set_element_css_size(target, width, height) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(55, 0, 1, target, width, height);
  target = findEventTarget(target);
  if (!target) return -4;
  target.style.width = width + "px";
  target.style.height = height + "px";
  return 0;
}

function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(56, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
}

var fillFullscreenChangeEventData = eventStruct => {
  var fullscreenElement = getFullscreenElement();
  var isFullscreen = !!fullscreenElement;
  // Assigning a boolean to HEAP32 with expected type coercion.
  /** @suppress{checkTypes} */ (growMemViews(), HEAP8)[eventStruct] = isFullscreen;
  (growMemViews(), HEAP8)[(eventStruct) + (1)] = JSEvents.fullscreenEnabled();
  // If transitioning to fullscreen, report info about the element that is now fullscreen.
  // If transitioning to windowed mode, report info about the element that just was fullscreen.
  var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
  var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
  var id = reportedElement?.id || "";
  stringToUTF8(nodeName, eventStruct + 2, 128);
  stringToUTF8(id, eventStruct + 130, 128);
  (growMemViews(), HEAP32)[(((eventStruct) + (260)) >> 2)] = reportedElement ? reportedElement.clientWidth : 0;
  (growMemViews(), HEAP32)[(((eventStruct) + (264)) >> 2)] = reportedElement ? reportedElement.clientHeight : 0;
  (growMemViews(), HEAP32)[(((eventStruct) + (268)) >> 2)] = screen.width;
  (growMemViews(), HEAP32)[(((eventStruct) + (272)) >> 2)] = screen.height;
  if (isFullscreen) {
    JSEvents.previousFullscreenElement = fullscreenElement;
  }
};

var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 276;
  JSEvents.fullscreenChangeEvent ||= _malloc(eventSize);
  var fullscreenChangeEventHandlerFunc = e => {
    var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
    fillFullscreenChangeEventData(fullscreenChangeEvent);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, fullscreenChangeEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: fullscreenChangeEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(57, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  if (!JSEvents.fullscreenEnabled()) return -1;
  target = findEventTarget(target);
  if (!target) return -4;
  // As of Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitfullscreenchange. TODO: revisit this check once Safari ships unprefixed version.
  // TODO: When this block is removed, also change test/test_html5_remove_event_listener.c test expectation on emscripten_set_fullscreenchange_callback().
  registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
  return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
}

var registerGamepadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 1240;
  JSEvents.gamepadEvent ||= _malloc(eventSize);
  var gamepadEventHandlerFunc = e => {
    var gamepadEvent = JSEvents.gamepadEvent;
    fillGamepadEventData(gamepadEvent, e["gamepad"]);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, gamepadEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, gamepadEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target: findEventTarget(target),
    allowsDeferredCalls: true,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: gamepadEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(58, 0, 1, userData, useCapture, callbackfunc, targetThread);
  if (_emscripten_sample_gamepad_data()) return -1;
  return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
}

function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(59, 0, 1, userData, useCapture, callbackfunc, targetThread);
  if (_emscripten_sample_gamepad_data()) return -1;
  return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
}

var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 160;
  JSEvents.keyEvent ||= _malloc(eventSize);
  var keyEventHandlerFunc = e => {
    assert(e);
    var keyEventData = JSEvents.keyEvent;
    (growMemViews(), HEAPF64)[((keyEventData) >> 3)] = e.timeStamp;
    var idx = ((keyEventData) >> 2);
    (growMemViews(), HEAP32)[idx + 2] = e.location;
    (growMemViews(), HEAP8)[keyEventData + 12] = e.ctrlKey;
    (growMemViews(), HEAP8)[keyEventData + 13] = e.shiftKey;
    (growMemViews(), HEAP8)[keyEventData + 14] = e.altKey;
    (growMemViews(), HEAP8)[keyEventData + 15] = e.metaKey;
    (growMemViews(), HEAP8)[keyEventData + 16] = e.repeat;
    (growMemViews(), HEAP32)[idx + 5] = e.charCode;
    (growMemViews(), HEAP32)[idx + 6] = e.keyCode;
    (growMemViews(), HEAP32)[idx + 7] = e.which;
    stringToUTF8(e.key || "", keyEventData + 32, 32);
    stringToUTF8(e.code || "", keyEventData + 64, 32);
    stringToUTF8(e.char || "", keyEventData + 96, 32);
    stringToUTF8(e.locale || "", keyEventData + 128, 32);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, keyEventData, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, keyEventData, userData)) e.preventDefault();
  };
  var eventHandler = {
    target: findEventTarget(target),
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: keyEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(60, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
}

function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(61, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
}

function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(62, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
}

var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
  var iterFunc = (() => dynCall_v(func));
  setMainLoop(iterFunc, fps, simulateInfiniteLoop);
};

var fillMouseEventData = (eventStruct, e, target) => {
  assert(eventStruct % 4 == 0);
  (growMemViews(), HEAPF64)[((eventStruct) >> 3)] = e.timeStamp;
  var idx = ((eventStruct) >> 2);
  (growMemViews(), HEAP32)[idx + 2] = e.screenX;
  (growMemViews(), HEAP32)[idx + 3] = e.screenY;
  (growMemViews(), HEAP32)[idx + 4] = e.clientX;
  (growMemViews(), HEAP32)[idx + 5] = e.clientY;
  (growMemViews(), HEAP8)[eventStruct + 24] = e.ctrlKey;
  (growMemViews(), HEAP8)[eventStruct + 25] = e.shiftKey;
  (growMemViews(), HEAP8)[eventStruct + 26] = e.altKey;
  (growMemViews(), HEAP8)[eventStruct + 27] = e.metaKey;
  (growMemViews(), HEAP16)[idx * 2 + 14] = e.button;
  (growMemViews(), HEAP16)[idx * 2 + 15] = e.buttons;
  (growMemViews(), HEAP32)[idx + 8] = e["movementX"];
  (growMemViews(), HEAP32)[idx + 9] = e["movementY"];
  // Note: rect contains doubles (truncated to placate SAFE_HEAP, which is the same behaviour when writing to HEAP32 anyway)
  var rect = getBoundingClientRect(target);
  (growMemViews(), HEAP32)[idx + 10] = e.clientX - (rect.left | 0);
  (growMemViews(), HEAP32)[idx + 11] = e.clientY - (rect.top | 0);
};

var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 64;
  JSEvents.mouseEvent ||= _malloc(eventSize);
  target = findEventTarget(target);
  var mouseEventHandlerFunc = e => {
    // TODO: Make this access thread safe, or this could update live while app is reading it.
    fillMouseEventData(JSEvents.mouseEvent, e, target);
    if (targetThread) {
      __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, JSEvents.mouseEvent, eventSize, userData);
    } else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
    // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: mouseEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(63, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
}

function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(64, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread);
}

function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(65, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
}

function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(66, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
}

function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(67, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
}

var fillPointerlockChangeEventData = eventStruct => {
  var pointerLockElement = document.pointerLockElement;
  var isPointerlocked = !!pointerLockElement;
  // Assigning a boolean to HEAP32 with expected type coercion.
  /** @suppress{checkTypes} */ (growMemViews(), HEAP8)[eventStruct] = isPointerlocked;
  var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
  var id = pointerLockElement?.id || "";
  stringToUTF8(nodeName, eventStruct + 1, 128);
  stringToUTF8(id, eventStruct + 129, 128);
};

var registerPointerlockChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 257;
  JSEvents.pointerlockChangeEvent ||= _malloc(eventSize);
  var pointerlockChangeEventHandlerFunc = e => {
    var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
    fillPointerlockChangeEventData(pointerlockChangeEvent);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, pointerlockChangeEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: pointerlockChangeEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(68, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  if (!document.body?.requestPointerLock) {
    return -1;
  }
  target = findEventTarget(target);
  if (!target) return -4;
  return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread);
}

var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 36;
  JSEvents.uiEvent ||= _malloc(eventSize);
  target = findEventTarget(target);
  var uiEventHandlerFunc = e => {
    if (e.target != target) {
      // Never take ui events such as scroll via a 'bubbled' route, but always from the direct element that
      // was targeted. Otherwise e.g. if app logs a message in response to a page scroll, the Emscripten log
      // message box could cause to scroll, generating a new (bubbled) scroll message, causing a new log print,
      // causing a new scroll, etc..
      return;
    }
    var b = document.body;
    // Take document.body to a variable, Closure compiler does not outline access to it on its own.
    if (!b) {
      // During a page unload 'body' can be null, with "Cannot read property 'clientWidth' of null" being thrown
      return;
    }
    var uiEvent = JSEvents.uiEvent;
    (growMemViews(), HEAP32)[((uiEvent) >> 2)] = 0;
    // always zero for resize and scroll
    (growMemViews(), HEAP32)[(((uiEvent) + (4)) >> 2)] = b.clientWidth;
    (growMemViews(), HEAP32)[(((uiEvent) + (8)) >> 2)] = b.clientHeight;
    (growMemViews(), HEAP32)[(((uiEvent) + (12)) >> 2)] = innerWidth;
    (growMemViews(), HEAP32)[(((uiEvent) + (16)) >> 2)] = innerHeight;
    (growMemViews(), HEAP32)[(((uiEvent) + (20)) >> 2)] = outerWidth;
    (growMemViews(), HEAP32)[(((uiEvent) + (24)) >> 2)] = outerHeight;
    (growMemViews(), HEAP32)[(((uiEvent) + (28)) >> 2)] = pageXOffset | 0;
    // scroll offsets are float
    (growMemViews(), HEAP32)[(((uiEvent) + (32)) >> 2)] = pageYOffset | 0;
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, uiEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, uiEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: uiEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(69, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
}

var registerTouchEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 1552;
  JSEvents.touchEvent ||= _malloc(eventSize);
  target = findEventTarget(target);
  var touchEventHandlerFunc = e => {
    assert(e);
    var t, touches = {}, et = e.touches;
    // To ease marshalling different kinds of touches that browser reports (all touches are listed in e.touches,
    // only changed touches in e.changedTouches, and touches on target at a.targetTouches), mark a boolean in
    // each Touch object so that we can later loop only once over all touches we see to marshall over to Wasm.
    for (let t of et) {
      // Browser might recycle the generated Touch objects between each frame (Firefox on Android), so reset any
      // changed/target states we may have set from previous frame.
      t.isChanged = t.onTarget = 0;
      touches[t.identifier] = t;
    }
    // Mark which touches are part of the changedTouches list.
    for (let t of e.changedTouches) {
      t.isChanged = 1;
      touches[t.identifier] = t;
    }
    // Mark which touches are part of the targetTouches list.
    for (let t of e.targetTouches) {
      touches[t.identifier].onTarget = 1;
    }
    var touchEvent = JSEvents.touchEvent;
    (growMemViews(), HEAPF64)[((touchEvent) >> 3)] = e.timeStamp;
    (growMemViews(), HEAP8)[touchEvent + 12] = e.ctrlKey;
    (growMemViews(), HEAP8)[touchEvent + 13] = e.shiftKey;
    (growMemViews(), HEAP8)[touchEvent + 14] = e.altKey;
    (growMemViews(), HEAP8)[touchEvent + 15] = e.metaKey;
    var idx = touchEvent + 16;
    var targetRect = getBoundingClientRect(target);
    var numTouches = 0;
    for (let t of Object.values(touches)) {
      var idx32 = ((idx) >> 2);
      // Pre-shift the ptr to index to HEAP32 to save code size
      (growMemViews(), HEAP32)[idx32 + 0] = t.identifier;
      (growMemViews(), HEAP32)[idx32 + 1] = t.screenX;
      (growMemViews(), HEAP32)[idx32 + 2] = t.screenY;
      (growMemViews(), HEAP32)[idx32 + 3] = t.clientX;
      (growMemViews(), HEAP32)[idx32 + 4] = t.clientY;
      (growMemViews(), HEAP32)[idx32 + 5] = t.pageX;
      (growMemViews(), HEAP32)[idx32 + 6] = t.pageY;
      (growMemViews(), HEAP8)[idx + 28] = t.isChanged;
      (growMemViews(), HEAP8)[idx + 29] = t.onTarget;
      (growMemViews(), HEAP32)[idx32 + 8] = t.clientX - (targetRect.left | 0);
      (growMemViews(), HEAP32)[idx32 + 9] = t.clientY - (targetRect.top | 0);
      idx += 48;
      if (++numTouches > 31) {
        break;
      }
    }
    (growMemViews(), HEAP32)[(((touchEvent) + (8)) >> 2)] = numTouches;
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, touchEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, touchEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: touchEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(70, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
}

function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(71, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
}

function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(72, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
}

function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(73, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
}

var fillVisibilityChangeEventData = eventStruct => {
  var visibilityStates = [ "hidden", "visible", "prerender", "unloaded" ];
  var visibilityState = visibilityStates.indexOf(document.visibilityState);
  // Assigning a boolean to HEAP32 with expected type coercion.
  /** @suppress{checkTypes} */ (growMemViews(), HEAP8)[eventStruct] = document.hidden;
  (growMemViews(), HEAP32)[(((eventStruct) + (4)) >> 2)] = visibilityState;
};

var registerVisibilityChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 8;
  JSEvents.visibilityChangeEvent ||= _malloc(eventSize);
  var visibilityChangeEventHandlerFunc = e => {
    var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
    fillVisibilityChangeEventData(visibilityChangeEvent);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, visibilityChangeEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: visibilityChangeEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(74, 0, 1, userData, useCapture, callbackfunc, targetThread);
  if (!specialHTMLTargets[1]) {
    return -4;
  }
  return registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
}

var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 96;
  JSEvents.wheelEvent ||= _malloc(eventSize);
  // The DOM Level 3 events spec event 'wheel'
  var wheelHandlerFunc = e => {
    var wheelEvent = JSEvents.wheelEvent;
    fillMouseEventData(wheelEvent, e, target);
    (growMemViews(), HEAPF64)[(((wheelEvent) + (64)) >> 3)] = e["deltaX"];
    (growMemViews(), HEAPF64)[(((wheelEvent) + (72)) >> 3)] = e["deltaY"];
    (growMemViews(), HEAPF64)[(((wheelEvent) + (80)) >> 3)] = e["deltaZ"];
    (growMemViews(), HEAP32)[(((wheelEvent) + (88)) >> 2)] = e["deltaMode"];
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, wheelEvent, eventSize, userData); else if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, wheelEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    allowsDeferredCalls: true,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: wheelHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(75, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target = findEventTarget(target);
  if (!target) return -4;
  if (typeof target.onwheel != "undefined") {
    return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
  } else {
    return -1;
  }
}

function _emscripten_set_window_title(title) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(76, 0, 1, title);
  return document.title = UTF8ToString(title);
}

var _emscripten_sleep = function(ms) {
  let innerFunc = () => new Promise(resolve => setTimeout(resolve, ms));
  return Asyncify.handleAsync(innerFunc);
};

_emscripten_sleep.isAsync = true;

class HandleAllocator {
  allocated=[ undefined ];
  freelist=[];
  get(id) {
    assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
    return this.allocated[id];
  }
  has(id) {
    return this.allocated[id] !== undefined;
  }
  allocate(handle) {
    var id = this.freelist.pop() || this.allocated.length;
    this.allocated[id] = handle;
    return id;
  }
  free(id) {
    assert(this.allocated[id] !== undefined);
    // Set the slot to `undefined` rather than using `delete` here since
    // apparently arrays with holes in them can be less efficient.
    this.allocated[id] = undefined;
    this.freelist.push(id);
  }
}

var Fetch = {
  async openDatabase(dbname, dbversion) {
    return new Promise((resolve, reject) => {
      try {
        var openRequest = indexedDB.open(dbname, dbversion);
      } catch (e) {
        return reject(e);
      }
      openRequest.onupgradeneeded = event => {
        var db = /** @type {IDBDatabase} */ (event.target.result);
        if (db.objectStoreNames.contains("FILES")) {
          db.deleteObjectStore("FILES");
        }
        db.createObjectStore("FILES");
      };
      openRequest.onsuccess = event => resolve(event.target.result);
      openRequest.onerror = reject;
    });
  },
  async init() {
    Fetch.xhrs = new HandleAllocator;
    if (ENVIRONMENT_IS_PTHREAD) return;
    addRunDependency("library_fetch_init");
    try {
      var db = await Fetch.openDatabase("emscripten_filesystem", 1);
      Fetch.dbInstance = db;
    } catch (e) {
      Fetch.dbInstance = false;
    } finally {
      removeRunDependency("library_fetch_init");
    }
  }
};

function fetchXHR(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
  var url = (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  if (!url) {
    onerror(fetch, "no url specified!");
    return;
  }
  var url_ = UTF8ToString(url);
  var fetch_attr = fetch + 108;
  var requestMethod = UTF8ToString(fetch_attr + 0);
  requestMethod ||= "GET";
  var timeoutMsecs = (growMemViews(), HEAPU32)[(((fetch_attr) + (56)) >> 2)];
  var userName = (growMemViews(), HEAPU32)[(((fetch_attr) + (68)) >> 2)];
  var password = (growMemViews(), HEAPU32)[(((fetch_attr) + (72)) >> 2)];
  var requestHeaders = (growMemViews(), HEAPU32)[(((fetch_attr) + (76)) >> 2)];
  var overriddenMimeType = (growMemViews(), HEAPU32)[(((fetch_attr) + (80)) >> 2)];
  var dataPtr = (growMemViews(), HEAPU32)[(((fetch_attr) + (84)) >> 2)];
  var dataLength = (growMemViews(), HEAPU32)[(((fetch_attr) + (88)) >> 2)];
  var fetchAttributes = (growMemViews(), HEAPU32)[(((fetch_attr) + (52)) >> 2)];
  var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
  var fetchAttrStreamData = !!(fetchAttributes & 2);
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  var userNameStr = userName ? UTF8ToString(userName) : undefined;
  var passwordStr = password ? UTF8ToString(password) : undefined;
  var xhr = new XMLHttpRequest;
  xhr.withCredentials = !!(growMemViews(), HEAPU8)[(fetch_attr) + (60)];
  xhr._streamData = fetchAttrStreamData;
  xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
  if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs;
  // XHR timeout field is only accessible in async XHRs, and must be set after .open() but before .send().
  xhr.url_ = url_;
  // Save the url for debugging purposes (and for comparing to the responseURL that server side advertised)
  assert(!fetchAttrStreamData, "Streaming is only supported when FETCH_STREAMING is enabled.");
  xhr.responseType = "arraybuffer";
  if (overriddenMimeType) {
    var overriddenMimeTypeStr = UTF8ToString(overriddenMimeType);
    xhr.overrideMimeType(overriddenMimeTypeStr);
  }
  if (requestHeaders) {
    for (;;) {
      var key = (growMemViews(), HEAPU32)[((requestHeaders) >> 2)];
      if (!key) break;
      var value = (growMemViews(), HEAPU32)[(((requestHeaders) + (4)) >> 2)];
      if (!value) break;
      requestHeaders += 8;
      var keyStr = UTF8ToString(key);
      var valueStr = UTF8ToString(value);
      xhr.setRequestHeader(keyStr, valueStr);
    }
  }
  var id = Fetch.xhrs.allocate(xhr);
  (growMemViews(), HEAPU32)[((fetch) >> 2)] = id;
  var data = (dataPtr && dataLength) ? (growMemViews(), HEAPU8).slice(dataPtr, dataPtr + dataLength) : null;
  // TODO: Support specifying custom headers to the request.
  // Share the code to save the response, as we need to do so both on success
  // and on error (despite an error, there may be a response, like a 404 page).
  // This receives a condition, which determines whether to save the xhr's
  // response, or just 0.
  function saveResponseAndStatus() {
    var ptr = 0;
    var ptrLen = 0;
    if (xhr.response && fetchAttrLoadToMemory && (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] === 0) {
      ptrLen = xhr.response.byteLength;
    }
    if (ptrLen > 0) {
      // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      ptr = _realloc((growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)], ptrLen);
      (growMemViews(), HEAPU8).set(new Uint8Array(/** @type{Array<number>} */ (xhr.response)), ptr);
    }
    (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, 0);
    var len = xhr.response ? xhr.response.byteLength : 0;
    if (len) {
      // If the final XHR.onload handler receives the bytedata to compute total length, report that,
      // otherwise don't write anything out here, which will retain the latest byte size reported in
      // the most recent XHR.onprogress handler.
      writeI53ToI64(fetch + 32, len);
    }
    (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = xhr.readyState;
    (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = xhr.status;
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
    if (fetchAttrSynchronous) {
      // The response url pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      var ruPtr = stringToNewUTF8(xhr.responseURL);
      (growMemViews(), HEAPU32)[(((fetch) + (200)) >> 2)] = ruPtr;
    }
  }
  xhr.onload = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    saveResponseAndStatus();
    if (xhr.status >= 200 && xhr.status < 300) {
      if (fetchAttrStreamData) {
        assert(xhr.response === null);
      }
      onsuccess(fetch, xhr, e);
    } else {
      onerror(fetch, e);
    }
  };
  xhr.onerror = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    saveResponseAndStatus();
    onerror(fetch, e);
  };
  xhr.ontimeout = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    onerror(fetch, e);
  };
  xhr.onprogress = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    var ptrLen = (fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response) ? xhr.response.byteLength : 0;
    var ptr = 0;
    if (ptrLen > 0 && fetchAttrLoadToMemory && fetchAttrStreamData) {
      assert(onprogress, "When doing a streaming fetch, you should have an onprogress handler registered to receive the chunks!");
      // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      ptr = _realloc((growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)], ptrLen);
      (growMemViews(), HEAPU8).set(new Uint8Array(/** @type{Array<number>} */ (xhr.response)), ptr);
    }
    (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, e.loaded - ptrLen);
    writeI53ToI64(fetch + 32, e.total);
    (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = xhr.readyState;
    var status = xhr.status;
    // If loading files from a source that does not give HTTP status code, assume success if we get data bytes
    if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0) status = 200;
    (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = status;
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
    onprogress(fetch, e);
  };
  xhr.onreadystatechange = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      runtimeKeepalivePop();
      return;
    }
    (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = xhr.readyState;
    if (xhr.readyState >= 2) {
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = xhr.status;
    }
    if (!fetchAttrSynchronous && (xhr.readyState === 2 && xhr.responseURL.length > 0)) {
      // The response url pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      var ruPtr = stringToNewUTF8(xhr.responseURL);
      (growMemViews(), HEAPU32)[(((fetch) + (200)) >> 2)] = ruPtr;
    }
    onreadystatechange(fetch, e);
  };
  try {
    xhr.send(data);
  } catch (e) {
    onerror(fetch, e);
  }
}

function fetchCacheData(/** @type {IDBDatabase} */ db, fetch, data, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 108;
  var destinationPath = (growMemViews(), HEAPU32)[(((fetch_attr) + (64)) >> 2)];
  destinationPath ||= (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  var destinationPathStr = UTF8ToString(destinationPath);
  try {
    var transaction = db.transaction([ "FILES" ], "readwrite");
    var packages = transaction.objectStore("FILES");
    var putRequest = packages.put(data, destinationPathStr);
    putRequest.onsuccess = event => {
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 200;
      // Mimic XHR HTTP status code 200 "OK"
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, destinationPathStr);
    };
    putRequest.onerror = error => {
      // Most likely we got an error if IndexedDB is unwilling to store any more data for this page.
      // TODO: Can we identify and break down different IndexedDB-provided errors and convert those
      // to more HTTP status codes for more information?
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 413;
      // Mimic XHR HTTP status code 413 "Payload Too Large"
      stringToUTF8("Payload Too Large", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}

function fetchLoadCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 108;
  var path = (growMemViews(), HEAPU32)[(((fetch_attr) + (64)) >> 2)];
  path ||= (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction([ "FILES" ], "readonly");
    var packages = transaction.objectStore("FILES");
    var getRequest = packages.get(pathStr);
    getRequest.onsuccess = event => {
      if (event.target.result) {
        var value = event.target.result;
        var len = value.byteLength || value.length;
        // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
        // freed when emscripten_fetch_close() is called.
        var ptr = _malloc(len);
        (growMemViews(), HEAPU8).set(new Uint8Array(value), ptr);
        (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = ptr;
        writeI53ToI64(fetch + 16, len);
        writeI53ToI64(fetch + 24, 0);
        writeI53ToI64(fetch + 32, len);
        (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
        // Mimic XHR readyState 4 === 'DONE: The operation is complete'
        (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 200;
        // Mimic XHR HTTP status code 200 "OK"
        stringToUTF8("OK", fetch + 44, 64);
        onsuccess(fetch, 0, value);
      } else {
        // Succeeded to load, but the load came back with the value of undefined, treat that as an error since we never store undefined in db.
        (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
        // Mimic XHR readyState 4 === 'DONE: The operation is complete'
        (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 404;
        // Mimic XHR HTTP status code 404 "Not Found"
        stringToUTF8("Not Found", fetch + 44, 64);
        onerror(fetch, 0, "no data");
      }
    };
    getRequest.onerror = error => {
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 404;
      // Mimic XHR HTTP status code 404 "Not Found"
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}

function fetchDeleteCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 108;
  var path = (growMemViews(), HEAPU32)[(((fetch_attr) + (64)) >> 2)];
  path ||= (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction([ "FILES" ], "readwrite");
    var packages = transaction.objectStore("FILES");
    var request = packages.delete(pathStr);
    request.onsuccess = event => {
      var value = event.target.result;
      (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = 0;
      writeI53ToI64(fetch + 16, 0);
      writeI53ToI64(fetch + 24, 0);
      writeI53ToI64(fetch + 32, 0);
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      // Mimic XHR HTTP status code 200 "OK"
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 200;
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, value);
    };
    request.onerror = error => {
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 404;
      // Mimic XHR HTTP status code 404 "Not Found"
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}

function _emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
  // Avoid shutting down the runtime since we want to wait for the async
  // response.
  runtimeKeepalivePush();
  var fetch_attr = fetch + 108;
  var onsuccess = (growMemViews(), HEAPU32)[(((fetch_attr) + (36)) >> 2)];
  var onerror = (growMemViews(), HEAPU32)[(((fetch_attr) + (40)) >> 2)];
  var onprogress = (growMemViews(), HEAPU32)[(((fetch_attr) + (44)) >> 2)];
  var onreadystatechange = (growMemViews(), HEAPU32)[(((fetch_attr) + (48)) >> 2)];
  var fetchAttributes = (growMemViews(), HEAPU32)[(((fetch_attr) + (52)) >> 2)];
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  function doCallback(f) {
    if (fetchAttrSynchronous) {
      f();
    } else {
      callUserCallback(f);
    }
  }
  var reportSuccess = (fetch, xhr, e) => {
    runtimeKeepalivePop();
    doCallback(() => {
      if (onsuccess) (a1 => dynCall_vi(onsuccess, a1))(fetch); else successcb?.(fetch);
    });
  };
  var reportProgress = (fetch, e) => {
    doCallback(() => {
      if (onprogress) (a1 => dynCall_vi(onprogress, a1))(fetch); else progresscb?.(fetch);
    });
  };
  var reportError = (fetch, e) => {
    runtimeKeepalivePop();
    doCallback(() => {
      if (onerror) (a1 => dynCall_vi(onerror, a1))(fetch); else errorcb?.(fetch);
    });
  };
  var reportReadyStateChange = (fetch, e) => {
    doCallback(() => {
      if (onreadystatechange) (a1 => dynCall_vi(onreadystatechange, a1))(fetch); else readystatechangecb?.(fetch);
    });
  };
  var performUncachedXhr = (fetch, xhr, e) => {
    fetchXHR(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange);
  };
  var cacheResultAndReportSuccess = (fetch, xhr, e) => {
    var storeSuccess = (fetch, xhr, e) => {
      runtimeKeepalivePop();
      doCallback(() => {
        if (onsuccess) (a1 => dynCall_vi(onsuccess, a1))(fetch); else successcb?.(fetch);
      });
    };
    var storeError = (fetch, xhr, e) => {
      runtimeKeepalivePop();
      doCallback(() => {
        if (onsuccess) (a1 => dynCall_vi(onsuccess, a1))(fetch); else successcb?.(fetch);
      });
    };
    fetchCacheData(Fetch.dbInstance, fetch, xhr.response, storeSuccess, storeError);
  };
  var performCachedXhr = (fetch, xhr, e) => {
    fetchXHR(fetch, cacheResultAndReportSuccess, reportError, reportProgress, reportReadyStateChange);
  };
  var requestMethod = UTF8ToString(fetch_attr + 0);
  var fetchAttrReplace = !!(fetchAttributes & 16);
  var fetchAttrPersistFile = !!(fetchAttributes & 4);
  var fetchAttrNoDownload = !!(fetchAttributes & 32);
  if (requestMethod === "EM_IDB_STORE") {
    // TODO(?): Here we perform a clone of the data, because storing shared typed arrays to IndexedDB does not seem to be allowed.
    var ptr = (growMemViews(), HEAPU32)[(((fetch_attr) + (84)) >> 2)];
    var size = (growMemViews(), HEAPU32)[(((fetch_attr) + (88)) >> 2)];
    fetchCacheData(Fetch.dbInstance, fetch, (growMemViews(), HEAPU8).slice(ptr, ptr + size), reportSuccess, reportError);
  } else if (requestMethod === "EM_IDB_DELETE") {
    fetchDeleteCachedData(Fetch.dbInstance, fetch, reportSuccess, reportError);
  } else if (!fetchAttrReplace) {
    fetchLoadCachedData(Fetch.dbInstance, fetch, reportSuccess, fetchAttrNoDownload ? reportError : (fetchAttrPersistFile ? performCachedXhr : performUncachedXhr));
  } else if (!fetchAttrNoDownload) {
    fetchXHR(fetch, fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess, reportError, reportProgress, reportReadyStateChange);
  } else {
    return 0;
  }
  return fetch;
}

var ENV = {};

var getExecutableName = () => thisProgram || "./this.program";

var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    // Default values.
    // Browser language detection #8751
    var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    // Apply the user-provided values, if any.
    for (var x in ENV) {
      // x is a key in ENV; if ENV[x] is undefined, that means it was
      // explicitly set to be so. We allow user code to do that to
      // force variables with default values to remain unset.
      if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};

function _environ_get(__environ, environ_buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(77, 0, 1, __environ, environ_buf);
  var bufSize = 0;
  var envp = 0;
  for (var string of getEnvStrings()) {
    var ptr = environ_buf + bufSize;
    (growMemViews(), HEAPU32)[(((__environ) + (envp)) >> 2)] = ptr;
    bufSize += stringToUTF8(string, ptr, Infinity) + 1;
    envp += 4;
  }
  return 0;
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(78, 0, 1, penviron_count, penviron_buf_size);
  var strings = getEnvStrings();
  (growMemViews(), HEAPU32)[((penviron_count) >> 2)] = strings.length;
  var bufSize = 0;
  for (var string of strings) {
    bufSize += lengthBytesUTF8(string) + 1;
  }
  (growMemViews(), HEAPU32)[((penviron_buf_size) >> 2)] = bufSize;
  return 0;
}

function _fd_close(fd) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(79, 0, 1, fd);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

/** @param {number=} offset */ var doReadv = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = (growMemViews(), HEAPU32)[((iov) >> 2)];
    var len = (growMemViews(), HEAPU32)[(((iov) + (4)) >> 2)];
    iov += 8;
    var curr = FS.read(stream, (growMemViews(), HEAP8), ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) break;
    // nothing more to read
    if (typeof offset != "undefined") {
      offset += curr;
    }
  }
  return ret;
};

function _fd_read(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(80, 0, 1, fd, iov, iovcnt, pnum);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doReadv(stream, iov, iovcnt);
    (growMemViews(), HEAPU32)[((pnum) >> 2)] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

function _fd_seek(fd, offset, whence, newOffset) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(81, 0, 1, fd, offset, whence, newOffset);
  offset = bigintToI53Checked(offset);
  try {
    if (isNaN(offset)) return 61;
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.llseek(stream, offset, whence);
    (growMemViews(), HEAP64)[((newOffset) >> 3)] = BigInt(stream.position);
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    // reset readdir state
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

/** @param {number=} offset */ var doWritev = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = (growMemViews(), HEAPU32)[((iov) >> 2)];
    var len = (growMemViews(), HEAPU32)[(((iov) + (4)) >> 2)];
    iov += 8;
    var curr = FS.write(stream, (growMemViews(), HEAP8), ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) {
      // No more space to write.
      break;
    }
    if (typeof offset != "undefined") {
      offset += curr;
    }
  }
  return ret;
};

function _fd_write(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(82, 0, 1, fd, iov, iovcnt, pnum);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doWritev(stream, iov, iovcnt);
    (growMemViews(), HEAPU32)[((pnum) >> 2)] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

var _glActiveTexture = _emscripten_glActiveTexture;

var _glAttachShader = _emscripten_glAttachShader;

var _glBindAttribLocation = _emscripten_glBindAttribLocation;

var _glBindBuffer = _emscripten_glBindBuffer;

var _glBindFramebuffer = _emscripten_glBindFramebuffer;

var _glBindRenderbuffer = _emscripten_glBindRenderbuffer;

var _glBindTexture = _emscripten_glBindTexture;

var _glBlendFunc = _emscripten_glBlendFunc;

var _glBlendFuncSeparate = _emscripten_glBlendFuncSeparate;

var _glBlitFramebuffer = _emscripten_glBlitFramebuffer;

var _glBufferData = _emscripten_glBufferData;

var _glBufferSubData = _emscripten_glBufferSubData;

var _glCheckFramebufferStatus = _emscripten_glCheckFramebufferStatus;

var _glClear = _emscripten_glClear;

var _glClearColor = _emscripten_glClearColor;

var _glClearDepthf = _emscripten_glClearDepthf;

var _glClearStencil = _emscripten_glClearStencil;

var _glColorMask = _emscripten_glColorMask;

var _glCompileShader = _emscripten_glCompileShader;

var _glCompressedTexImage2D = _emscripten_glCompressedTexImage2D;

var _glCompressedTexSubImage2D = _emscripten_glCompressedTexSubImage2D;

var _glCopyTexSubImage2D = _emscripten_glCopyTexSubImage2D;

var _glCreateProgram = _emscripten_glCreateProgram;

var _glCreateShader = _emscripten_glCreateShader;

var _glCullFace = _emscripten_glCullFace;

var _glDeleteBuffers = _emscripten_glDeleteBuffers;

var _glDeleteFramebuffers = _emscripten_glDeleteFramebuffers;

var _glDeleteProgram = _emscripten_glDeleteProgram;

var _glDeleteRenderbuffers = _emscripten_glDeleteRenderbuffers;

var _glDeleteShader = _emscripten_glDeleteShader;

var _glDeleteTextures = _emscripten_glDeleteTextures;

var _glDepthFunc = _emscripten_glDepthFunc;

var _glDepthMask = _emscripten_glDepthMask;

var _glDisable = _emscripten_glDisable;

var _glDisableVertexAttribArray = _emscripten_glDisableVertexAttribArray;

var _glDrawArrays = _emscripten_glDrawArrays;

var _glEnable = _emscripten_glEnable;

var _glEnableVertexAttribArray = _emscripten_glEnableVertexAttribArray;

var _glFramebufferRenderbuffer = _emscripten_glFramebufferRenderbuffer;

var _glFramebufferTexture2D = _emscripten_glFramebufferTexture2D;

var _glGenBuffers = _emscripten_glGenBuffers;

var _glGenFramebuffers = _emscripten_glGenFramebuffers;

var _glGenRenderbuffers = _emscripten_glGenRenderbuffers;

var _glGenTextures = _emscripten_glGenTextures;

var _glGenerateMipmap = _emscripten_glGenerateMipmap;

var _glGetActiveUniform = _emscripten_glGetActiveUniform;

var _glGetIntegerv = _emscripten_glGetIntegerv;

var _glGetProgramInfoLog = _emscripten_glGetProgramInfoLog;

var _glGetProgramiv = _emscripten_glGetProgramiv;

var _glGetShaderInfoLog = _emscripten_glGetShaderInfoLog;

var _glGetShaderiv = _emscripten_glGetShaderiv;

var _glGetString = _emscripten_glGetString;

var _glGetUniformLocation = _emscripten_glGetUniformLocation;

var _glInvalidateFramebuffer = _emscripten_glInvalidateFramebuffer;

var _glLinkProgram = _emscripten_glLinkProgram;

var _glMapBufferRange = _emscripten_glMapBufferRange;

var _glPixelStorei = _emscripten_glPixelStorei;

var _glPolygonOffset = _emscripten_glPolygonOffset;

var _glReadPixels = _emscripten_glReadPixels;

var _glRenderbufferStorage = _emscripten_glRenderbufferStorage;

var _glRenderbufferStorageMultisample = _emscripten_glRenderbufferStorageMultisample;

var _glShaderSource = _emscripten_glShaderSource;

var _glStencilFunc = _emscripten_glStencilFunc;

var _glStencilMask = _emscripten_glStencilMask;

var _glStencilOp = _emscripten_glStencilOp;

var _glStencilOpSeparate = _emscripten_glStencilOpSeparate;

var _glTexImage2D = _emscripten_glTexImage2D;

var _glTexImage3D = _emscripten_glTexImage3D;

var _glTexParameteri = _emscripten_glTexParameteri;

var _glTexStorage2D = _emscripten_glTexStorage2D;

var _glTexStorage3D = _emscripten_glTexStorage3D;

var _glTexSubImage2D = _emscripten_glTexSubImage2D;

var _glTexSubImage3D = _emscripten_glTexSubImage3D;

var _glUniform1fv = _emscripten_glUniform1fv;

var _glUniform1i = _emscripten_glUniform1i;

var _glUniform2fv = _emscripten_glUniform2fv;

var _glUniform3fv = _emscripten_glUniform3fv;

var _glUniform4fv = _emscripten_glUniform4fv;

var _glUniformMatrix4fv = _emscripten_glUniformMatrix4fv;

var _glUnmapBuffer = _emscripten_glUnmapBuffer;

var _glUseProgram = _emscripten_glUseProgram;

var _glVertexAttribPointer = _emscripten_glVertexAttribPointer;

var _glViewport = _emscripten_glViewport;

var _llvm_eh_typeid_for = type => type;

function _random_get(buffer, size) {
  try {
    randomFill((growMemViews(), HEAPU8).subarray(buffer, buffer + size));
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

var autoResumeAudioContext = ctx => {
  for (var event of [ "keydown", "mousedown", "touchstart" ]) {
    for (var element of [ document, document.getElementById("canvas") ]) {
      element?.addEventListener(event, () => {
        if (ctx.state === "suspended") ctx.resume();
      }, {
        "once": true
      });
    }
  }
};

var wasmTableMirror = [];

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    /** @suppress {checkTypes} */ wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  /** @suppress {checkTypes} */ assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
  return func;
};

var runAndAbortIfError = func => {
  try {
    return func();
  } catch (e) {
    abort(e);
  }
};

var Asyncify = {
  instrumentWasmImports(imports) {
    var importPattern = /^(invoke_.*|__asyncjs__.*)$/;
    for (let [x, original] of Object.entries(imports)) {
      if (typeof original == "function") {
        let isAsyncifyImport = original.isAsync || importPattern.test(x);
        imports[x] = (...args) => {
          var originalAsyncifyState = Asyncify.state;
          try {
            return original(...args);
          } finally {
            // Only asyncify-declared imports are allowed to change the
            // state.
            // Changing the state from normal to disabled is allowed (in any
            // function) as that is what shutdown does (and we don't have an
            // explicit list of shutdown imports).
            var changedToDisabled = originalAsyncifyState === Asyncify.State.Normal && Asyncify.state === Asyncify.State.Disabled;
            // invoke_* functions are allowed to change the state if we do
            // not ignore indirect calls.
            var ignoredInvoke = x.startsWith("invoke_") && true;
            if (Asyncify.state !== originalAsyncifyState && !isAsyncifyImport && !changedToDisabled && !ignoredInvoke) {
              abort(`import ${x} was not in ASYNCIFY_IMPORTS, but changed the state`);
            }
          }
        };
      }
    }
  },
  instrumentFunction(original) {
    var wrapper = (...args) => {
      Asyncify.exportCallStack.push(original);
      try {
        return original(...args);
      } finally {
        if (!ABORT) {
          var top = Asyncify.exportCallStack.pop();
          assert(top === original);
          Asyncify.maybeStopUnwind();
        }
      }
    };
    Asyncify.funcWrappers.set(original, wrapper);
    wrapper = createNamedFunction(`__asyncify_wrapper_${original.name}`, wrapper);
    return wrapper;
  },
  instrumentWasmExports(exports) {
    var ret = {};
    for (let [x, original] of Object.entries(exports)) {
      if (typeof original == "function") {
        var wrapper = Asyncify.instrumentFunction(original);
        ret[x] = wrapper;
      } else {
        ret[x] = original;
      }
    }
    return ret;
  },
  State: {
    Normal: 0,
    Unwinding: 1,
    Rewinding: 2,
    Disabled: 3
  },
  state: 0,
  StackSize: 4096,
  currData: null,
  handleSleepReturnValue: 0,
  exportCallStack: [],
  callstackFuncToId: new Map,
  callStackIdToFunc: new Map,
  funcWrappers: new Map,
  callStackId: 0,
  asyncPromiseHandlers: null,
  sleepCallbacks: [],
  getCallStackId(func) {
    assert(func);
    if (!Asyncify.callstackFuncToId.has(func)) {
      var id = Asyncify.callStackId++;
      Asyncify.callstackFuncToId.set(func, id);
      Asyncify.callStackIdToFunc.set(id, func);
    }
    return Asyncify.callstackFuncToId.get(func);
  },
  maybeStopUnwind() {
    if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
      // We just finished unwinding.
      // Be sure to set the state before calling any other functions to avoid
      // possible infinite recursion here (For example in debug pthread builds
      // the dbg() function itself can call back into WebAssembly to get the
      // current pthread_self() pointer).
      Asyncify.state = Asyncify.State.Normal;
      runtimeKeepalivePush();
      // Keep the runtime alive so that a re-wind can be done later.
      runAndAbortIfError(_asyncify_stop_unwind);
      if (typeof Fibers != "undefined") {
        Fibers.trampoline();
      }
    }
  },
  whenDone() {
    assert(Asyncify.currData, "Tried to wait for an async operation when none is in progress.");
    assert(!Asyncify.asyncPromiseHandlers, "Cannot have multiple async operations in flight at once");
    return new Promise((resolve, reject) => {
      Asyncify.asyncPromiseHandlers = {
        resolve,
        reject
      };
    });
  },
  allocateData() {
    // An asyncify data structure has three fields:
    //  0  current stack pos
    //  4  max stack pos
    //  8  id of function at bottom of the call stack (callStackIdToFunc[id] == wasm func)
    // The Asyncify ABI only interprets the first two fields, the rest is for the runtime.
    // We also embed a stack in the same memory region here, right next to the structure.
    // This struct is also defined as asyncify_data_t in emscripten/fiber.h
    var ptr = _malloc(12 + Asyncify.StackSize);
    Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
    Asyncify.setDataRewindFunc(ptr);
    return ptr;
  },
  setDataHeader(ptr, stack, stackSize) {
    (growMemViews(), HEAPU32)[((ptr) >> 2)] = stack;
    (growMemViews(), HEAPU32)[(((ptr) + (4)) >> 2)] = stack + stackSize;
  },
  setDataRewindFunc(ptr) {
    var bottomOfCallStack = Asyncify.exportCallStack[0];
    assert(bottomOfCallStack, "exportCallStack is empty");
    var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
    (growMemViews(), HEAP32)[(((ptr) + (8)) >> 2)] = rewindId;
  },
  getDataRewindFunc(ptr) {
    var id = (growMemViews(), HEAP32)[(((ptr) + (8)) >> 2)];
    var func = Asyncify.callStackIdToFunc.get(id);
    assert(func, `id ${id} not found in callStackIdToFunc`);
    return func;
  },
  doRewind(ptr) {
    var original = Asyncify.getDataRewindFunc(ptr);
    var func = Asyncify.funcWrappers.get(original);
    assert(original);
    assert(func);
    // Once we have rewound and the stack we no longer need to artificially
    // keep the runtime alive.
    runtimeKeepalivePop();
    return callUserCallback(func);
  },
  handleSleep(startAsync) {
    assert(Asyncify.state !== Asyncify.State.Disabled, "Asyncify cannot be done during or after the runtime exits");
    if (ABORT) return;
    if (Asyncify.state === Asyncify.State.Normal) {
      // Prepare to sleep. Call startAsync, and see what happens:
      // if the code decided to call our callback synchronously,
      // then no async operation was in fact begun, and we don't
      // need to do anything.
      var reachedCallback = false;
      var reachedAfterCallback = false;
      startAsync((handleSleepReturnValue = 0) => {
        // old emterpretify API supported other stuff
        assert([ "undefined", "number", "boolean", "bigint" ].includes(typeof handleSleepReturnValue), `invalid type for handleSleepReturnValue: '${typeof handleSleepReturnValue}'`);
        if (ABORT) return;
        Asyncify.handleSleepReturnValue = handleSleepReturnValue;
        reachedCallback = true;
        if (!reachedAfterCallback) {
          // We are happening synchronously, so no need for async.
          return;
        }
        // This async operation did not happen synchronously, so we did
        // unwind. In that case there can be no compiled code on the stack,
        // as it might break later operations (we can rewind ok now, but if
        // we unwind again, we would unwind through the extra compiled code
        // too).
        assert(!Asyncify.exportCallStack.length, "Waking up (starting to rewind) must be done from JS, without compiled code on the stack.");
        Asyncify.state = Asyncify.State.Rewinding;
        runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
        if (typeof MainLoop != "undefined" && MainLoop.func) {
          MainLoop.resume();
        }
        var asyncWasmReturnValue, isError = false;
        try {
          asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
        } catch (err) {
          asyncWasmReturnValue = err;
          isError = true;
        }
        // Track whether the return value was handled by any promise handlers.
        var handled = false;
        if (!Asyncify.currData) {
          // All asynchronous execution has finished.
          // `asyncWasmReturnValue` now contains the final
          // return value of the exported async WASM function.
          // Note: `asyncWasmReturnValue` is distinct from
          // `Asyncify.handleSleepReturnValue`.
          // `Asyncify.handleSleepReturnValue` contains the return
          // value of the last C function to have executed
          // `Asyncify.handleSleep()`, whereas `asyncWasmReturnValue`
          // contains the return value of the exported WASM function
          // that may have called C functions that
          // call `Asyncify.handleSleep()`.
          var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
          if (asyncPromiseHandlers) {
            Asyncify.asyncPromiseHandlers = null;
            (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
            handled = true;
          }
        }
        if (isError && !handled) {
          // If there was an error and it was not handled by now, we have no choice but to
          // rethrow that error into the global scope where it can be caught only by
          // `onerror` or `onunhandledpromiserejection`.
          throw asyncWasmReturnValue;
        }
      });
      reachedAfterCallback = true;
      if (!reachedCallback) {
        // A true async operation was begun; start a sleep.
        Asyncify.state = Asyncify.State.Unwinding;
        // TODO: reuse, don't alloc/free every sleep
        Asyncify.currData = Asyncify.allocateData();
        if (typeof MainLoop != "undefined" && MainLoop.func) {
          MainLoop.pause();
        }
        runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
      }
    } else if (Asyncify.state === Asyncify.State.Rewinding) {
      // Stop a resume.
      Asyncify.state = Asyncify.State.Normal;
      runAndAbortIfError(_asyncify_stop_rewind);
      _free(Asyncify.currData);
      Asyncify.currData = null;
      // Call all sleep callbacks now that the sleep-resume is all done.
      Asyncify.sleepCallbacks.forEach(callUserCallback);
    } else {
      abort(`invalid state: ${Asyncify.state}`);
    }
    return Asyncify.handleSleepReturnValue;
  },
  handleAsync: startAsync => Asyncify.handleSleep(async wakeUp => {
    // TODO: add error handling as a second param when handleSleep implements it.
    wakeUp(await startAsync());
  })
};

var getCFunc = ident => {
  var func = Module["_" + ident];
  // closure exported function
  assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
  return func;
};

var writeArrayToMemory = (array, buffer) => {
  assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
  (growMemViews(), HEAP8).set(array, buffer);
};

/**
   * @param {string|null=} returnType
   * @param {Array=} argTypes
   * @param {Array=} args
   * @param {Object=} opts
   */ var ccall = (ident, returnType, argTypes, args, opts) => {
  // For fast lookup of conversion functions
  var toC = {
    "string": str => {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        // null string
        ret = stringToUTF8OnStack(str);
      }
      return ret;
    },
    "array": arr => {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret);
    }
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== "array", 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  // Data for a previous async operation that was in flight before us.
  var previousAsync = Asyncify.currData;
  var ret = func(...cArgs);
  function onDone(ret) {
    runtimeKeepalivePop();
    if (stack !== 0) stackRestore(stack);
    return convertReturnValue(ret);
  }
  var asyncMode = opts?.async;
  // Keep the runtime alive through all calls. Note that this call might not be
  // async, but for simplicity we push and pop in all calls.
  runtimeKeepalivePush();
  if (Asyncify.currData != previousAsync) {
    // A change in async operation happened. If there was already an async
    // operation in flight before us, that is an error: we should not start
    // another async operation while one is active, and we should not stop one
    // either. The only valid combination is to have no change in the async
    // data (so we either had one in flight and left it alone, or we didn't have
    // one), or to have nothing in flight and to start one.
    assert(!(previousAsync && Asyncify.currData), "We cannot start an async operation when one is already in flight");
    assert(!(previousAsync && !Asyncify.currData), "We cannot stop an async operation in flight");
    // This is a new async operation. The wasm is paused and has unwound its stack.
    // We need to return a Promise that resolves the return value
    // once the stack is rewound and execution finishes.
    assert(asyncMode, "The call to " + ident + " is running asynchronously. If this was intended, add the async option to the ccall/cwrap call.");
    return Asyncify.whenDone().then(onDone);
  }
  ret = onDone(ret);
  // If this is an async ccall, ensure we return a promise
  if (asyncMode) return Promise.resolve(ret);
  return ret;
};

/**
   * @param {string=} returnType
   * @param {Array=} argTypes
   * @param {Object=} opts
   */ var cwrap = (ident, returnType, argTypes, opts) => (...args) => ccall(ident, returnType, argTypes, args, opts);

var FS_createPath = (...args) => FS.createPath(...args);

var FS_unlink = (...args) => FS.unlink(...args);

var FS_createLazyFile = (...args) => FS.createLazyFile(...args);

var FS_createDevice = (...args) => FS.createDevice(...args);

var createContext = Browser.createContext;

PThread.init();

FS.createPreloadedFile = FS_createPreloadedFile;

FS.preloadFile = FS_preloadFile;

FS.staticInit();

assert(emval_handles.length === 5 * 2);

// Signal GL rendering layer that processing of a new frame is about to
// start. This helps it optimize VBO double-buffering and reduce GPU stalls.
registerPreMainLoop(() => GL.newRenderingFrameStarted());

Module["requestAnimationFrame"] = MainLoop.requestAnimationFrame;

Module["pauseMainLoop"] = MainLoop.pause;

Module["resumeMainLoop"] = MainLoop.resume;

MainLoop.init();

for (let i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));

var miniTempWebGLFloatBuffersStorage = new Float32Array(288);

// Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
for (/**@suppress{duplicate}*/ var i = 0; i <= 288; ++i) {
  miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i);
}

var miniTempWebGLIntBuffersStorage = new Int32Array(288);

// Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
for (/**@suppress{duplicate}*/ var i = 0; i <= 288; ++i) {
  miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i);
}

Fetch.init();

// End JS library code
// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.
{
  // With WASM_ESM_INTEGRATION this has to happen at the top level and not
  // delayed until processModuleArgs.
  initMemory();
  // Begin ATMODULES hooks
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  if (Module["preloadPlugins"]) preloadPlugins = Module["preloadPlugins"];
  if (Module["print"]) out = Module["print"];
  if (Module["printErr"]) err = Module["printErr"];
  if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
  // End ATMODULES hooks
  checkIncomingModuleAPI();
  if (Module["arguments"]) arguments_ = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["read"] == "undefined", "Module.read option was removed");
  assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
  assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
  assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
  assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
  assert(typeof Module["ENVIRONMENT"] == "undefined", "Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
  assert(typeof Module["STACK_SIZE"] == "undefined", "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
  if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
    while (Module["preInit"].length > 0) {
      Module["preInit"].shift()();
    }
  }
  consumedModuleProp("preInit");
}

// Begin runtime exports
Module["addRunDependency"] = addRunDependency;

Module["removeRunDependency"] = removeRunDependency;

Module["ccall"] = ccall;

Module["cwrap"] = cwrap;

Module["setValue"] = setValue;

Module["getValue"] = getValue;

Module["createContext"] = createContext;

Module["FS_preloadFile"] = FS_preloadFile;

Module["FS_unlink"] = FS_unlink;

Module["FS_createPath"] = FS_createPath;

Module["FS_createDevice"] = FS_createDevice;

Module["FS_createDataFile"] = FS_createDataFile;

Module["FS_createLazyFile"] = FS_createLazyFile;

var missingLibrarySymbols = [ "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getTempRet0", "withStackSave", "getDynCaller", "asmjsMangle", "addOnInit", "addOnPostCtor", "addOnPreMain", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "intArrayToString", "stringToAscii", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "hideEverythingExceptGivenElement", "restoreHiddenElements", "softFullscreenResizeWebGLRenderTarget", "registerPointerlockErrorEventCallback", "fillBatteryEventData", "registerBatteryEventCallback", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "setImmediateWrapped", "safeRequestAnimationFrame", "clearImmediateWrapped", "registerPostMainLoop", "getPromise", "makePromise", "idsToPromises", "makePromiseCallback", "Browser_asyncPrepareDataCounter", "arraySum", "addDays", "FS_mkdirTree", "_setNetworkCallback", "writeGLArray", "emscripten_webgl_destroy_context_before_on_calling_thread", "registerWebGlEventCallback", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "allocateUTF8", "allocateUTF8OnStack", "demangle", "stackTrace", "getNativeTypeSize", "throwInternalError", "whenDependentTypesAreResolved", "getFunctionName", "getFunctionArgsName", "heap32VectorToArray", "usesDestructorStack", "createJsInvokerSignature", "checkArgCount", "getEnumValueType", "getRequiredArgCount", "createJsInvoker", "UnboundTypeError", "PureVirtualError", "throwUnboundTypeError", "ensureOverloadTable", "exposePublicSymbol", "replacePublicSymbol", "getBasestPointer", "registerInheritedInstance", "unregisterInheritedInstance", "getInheritedInstance", "getInheritedInstanceCount", "getLiveInheritedInstances", "enumReadValueFromPointer", "installIndexedIterator", "craftInvokerFunction", "embind__requireFunction", "genericPointerToWireType", "constNoSmartPtrRawPointerToWireType", "nonConstNoSmartPtrRawPointerToWireType", "init_RegisteredPointer", "RegisteredPointer", "RegisteredPointer_fromWireType", "runDestructor", "releaseClassHandle", "detachFinalizer", "attachFinalizer", "makeClassHandle", "init_ClassHandle", "ClassHandle", "throwInstanceAlreadyDeleted", "flushPendingDeletes", "setDelayFunction", "RegisteredClass", "shallowCopyInternalPointer", "downcastPointer", "upcastPointer", "validateThis", "char_0", "char_9", "makeLegalFunctionName", "count_emval_handles" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var unexportedSymbols = [ "run", "out", "err", "callMain", "abort", "wasmExports", "writeStackCookie", "checkStackCookie", "writeI53ToI64", "readI53FromI64", "readI53FromU64", "INT53_MAX", "INT53_MIN", "bigintToI53Checked", "HEAP8", "HEAPU8", "HEAP16", "HEAPU16", "HEAP32", "HEAPU32", "HEAPF32", "HEAPF64", "HEAP64", "HEAPU64", "stackSave", "stackRestore", "stackAlloc", "setTempRet0", "createNamedFunction", "ptrToString", "zeroMemory", "exitJS", "getHeapMax", "growMemory", "ENV", "ERRNO_CODES", "strError", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "readEmAsmArgsArray", "readEmAsmArgs", "runEmAsmFunction", "runMainThreadEmAsm", "jstoi_q", "getExecutableName", "autoResumeAudioContext", "dynCallLegacy", "dynCall", "handleException", "keepRuntimeAlive", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "asyncLoad", "alignMemory", "mmapAlloc", "HandleAllocator", "wasmTable", "wasmMemory", "getUniqueRunDependency", "noExitRuntime", "addOnPreRun", "addOnExit", "addOnPostRun", "freeTableIndexes", "functionsInTableMap", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "intArrayFromString", "AsciiToString", "UTF16Decoder", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "stringToNewUTF8", "stringToUTF8OnStack", "writeArrayToMemory", "JSEvents", "registerKeyEventCallback", "specialHTMLTargets", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "setLetterbox", "currentFullscreenStrategy", "restoreOldWindowedStyle", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "setCanvasElementSizeCallingThread", "setCanvasElementSizeMainThread", "setCanvasElementSize", "getCanvasSizeCallingThread", "getCanvasSizeMainThread", "getCanvasElementSize", "UNWIND_CACHE", "ExitStatus", "getEnvStrings", "checkWasiClock", "doReadv", "doWritev", "initRandomFill", "randomFill", "safeSetTimeout", "emSetImmediate", "emClearImmediate_deps", "emClearImmediate", "registerPreMainLoop", "promiseMap", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "ExceptionInfo", "findMatchingCatch", "getExceptionMessageCommon", "exnToPtr", "incrementExceptionRefcount", "decrementExceptionRefcount", "getExceptionMessage", "Browser", "requestFullscreen", "requestFullScreen", "setCanvasSize", "getUserMedia", "getPreloadedImageData__data", "wget", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "isLeapYear", "ydayFromDate", "SYSCALLS", "getSocketFromFD", "getSocketAddress", "preloadPlugins", "FS_createPreloadedFile", "FS_modeStringToFlags", "FS_getMode", "FS_fileDataToTypedArray", "FS_stdin_getChar_buffer", "FS_stdin_getChar", "FS_readFile", "FS", "FS_root", "FS_mounts", "FS_devices", "FS_streams", "FS_nextInode", "FS_nameTable", "FS_currentPath", "FS_initialized", "FS_ignorePermissions", "FS_filesystems", "FS_syncFSRequests", "FS_lookupPath", "FS_getPath", "FS_hashName", "FS_hashAddNode", "FS_hashRemoveNode", "FS_lookupNode", "FS_createNode", "FS_destroyNode", "FS_isRoot", "FS_isMountpoint", "FS_isFile", "FS_isDir", "FS_isLink", "FS_isChrdev", "FS_isBlkdev", "FS_isFIFO", "FS_isSocket", "FS_flagsToPermissionString", "FS_nodePermissions", "FS_mayLookup", "FS_mayCreate", "FS_mayDelete", "FS_mayOpen", "FS_checkOpExists", "FS_nextfd", "FS_getStreamChecked", "FS_getStream", "FS_createStream", "FS_closeStream", "FS_dupStream", "FS_doSetAttr", "FS_chrdev_stream_ops", "FS_major", "FS_minor", "FS_makedev", "FS_registerDevice", "FS_getDevice", "FS_getMounts", "FS_syncfs", "FS_mount", "FS_unmount", "FS_lookup", "FS_mknod", "FS_statfs", "FS_statfsStream", "FS_statfsNode", "FS_create", "FS_mkdir", "FS_mkdev", "FS_symlink", "FS_rename", "FS_rmdir", "FS_readdir", "FS_readlink", "FS_stat", "FS_fstat", "FS_lstat", "FS_doChmod", "FS_chmod", "FS_lchmod", "FS_fchmod", "FS_doChown", "FS_chown", "FS_lchown", "FS_fchown", "FS_doTruncate", "FS_truncate", "FS_ftruncate", "FS_utime", "FS_open", "FS_close", "FS_isClosed", "FS_llseek", "FS_read", "FS_write", "FS_mmap", "FS_msync", "FS_ioctl", "FS_writeFile", "FS_cwd", "FS_chdir", "FS_createDefaultDirectories", "FS_createDefaultDevices", "FS_createSpecialDirectories", "FS_createStandardStreams", "FS_staticInit", "FS_init", "FS_quit", "FS_findObject", "FS_analyzePath", "FS_createFile", "FS_forceLoadFile", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "webgl_enable_EXT_polygon_offset_clamp", "webgl_enable_EXT_clip_control", "webgl_enable_WEBGL_polygon_mode", "GL", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "emscriptenWebGLGetBufferBinding", "emscriptenWebGLValidateMapBufferTarget", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "runAndAbortIfError", "Asyncify", "Fibers", "waitAsyncPolyfilled", "emscriptenWebGLGetIndexed", "webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance", "webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance", "print", "printErr", "jstoi_s", "PThread", "terminateWorker", "cleanupThread", "registerTLSInit", "spawnThread", "exitOnMainThread", "proxyToMainThread", "proxiedJSCallArgs", "invokeEntryPoint", "checkMailbox", "InternalError", "BindingError", "throwBindingError", "registeredTypes", "awaitingDependencies", "typeDependencies", "tupleRegistrations", "structRegistrations", "sharedRegisterType", "getTypeName", "requireRegisteredType", "EmValType", "EmValOptionalType", "embindRepr", "registeredInstances", "registeredPointers", "registerType", "integerReadValueFromPointer", "floatReadValueFromPointer", "assertIntegerRange", "readPointer", "runDestructors", "finalizationRegistry", "detachFinalizer_deps", "deletionQueue", "delayFunction", "emval_freelist", "emval_handles", "emval_symbols", "getStringOrSymbol", "Emval", "emval_returnValue", "emval_lookupTypes", "emval_methodCallers", "emval_addMethodCaller", "Fetch", "fetchDeleteCachedData", "fetchLoadCachedData", "fetchCacheData", "fetchXHR" ];

unexportedSymbols.forEach(unexportedRuntimeSymbol);

// End runtime exports
// Begin JS library exports
// End JS library exports
// end include: postlibrary.js
// proxiedFunctionTable specifies the list of functions that can be called
// either synchronously or asynchronously from other threads in postMessage()d
// or internally queued events. This way a pthread in a Worker can synchronously
// access e.g. the DOM on the main thread.
var proxiedFunctionTable = [ _proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_bind, ___syscall_dup3, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_getcwd, ___syscall_getdents64, ___syscall_getsockname, ___syscall_getsockopt, ___syscall_ioctl, ___syscall_lstat64, ___syscall_mkdirat, ___syscall_newfstatat, ___syscall_openat, ___syscall_recvfrom, ___syscall_rmdir, ___syscall_sendto, ___syscall_socket, ___syscall_stat64, ___syscall_unlinkat, __mmap_js, __munmap_js, _eglBindAPI, _eglChooseConfig, _eglCreateContext, _eglCreateWindowSurface, _eglDestroyContext, _eglDestroySurface, _eglGetConfigAttrib, _eglGetDisplay, _eglGetError, _eglInitialize, _eglMakeCurrent, _eglQueryString, _eglSwapBuffers, _eglSwapInterval, _eglTerminate, _eglWaitClient, _eglWaitNative, _emscripten_exit_fullscreen, getCanvasSizeMainThread, setCanvasElementSizeMainThread, _emscripten_exit_pointerlock, _emscripten_get_device_pixel_ratio, _emscripten_get_element_css_size, _emscripten_get_gamepad_status, _emscripten_get_num_gamepads, _emscripten_get_screen_size, _emscripten_request_fullscreen_strategy, _emscripten_request_pointerlock, _emscripten_sample_gamepad_data, _emscripten_set_beforeunload_callback_on_thread, _emscripten_set_blur_callback_on_thread, _emscripten_set_element_css_size, _emscripten_set_focus_callback_on_thread, _emscripten_set_fullscreenchange_callback_on_thread, _emscripten_set_gamepadconnected_callback_on_thread, _emscripten_set_gamepaddisconnected_callback_on_thread, _emscripten_set_keydown_callback_on_thread, _emscripten_set_keypress_callback_on_thread, _emscripten_set_keyup_callback_on_thread, _emscripten_set_mousedown_callback_on_thread, _emscripten_set_mouseenter_callback_on_thread, _emscripten_set_mouseleave_callback_on_thread, _emscripten_set_mousemove_callback_on_thread, _emscripten_set_mouseup_callback_on_thread, _emscripten_set_pointerlockchange_callback_on_thread, _emscripten_set_resize_callback_on_thread, _emscripten_set_touchcancel_callback_on_thread, _emscripten_set_touchend_callback_on_thread, _emscripten_set_touchmove_callback_on_thread, _emscripten_set_touchstart_callback_on_thread, _emscripten_set_visibilitychange_callback_on_thread, _emscripten_set_wheel_callback_on_thread, _emscripten_set_window_title, _environ_get, _environ_sizes_get, _fd_close, _fd_read, _fd_seek, _fd_write ];

function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
  ignoredModuleProp("logReadFiles");
  ignoredModuleProp("loadSplitModule");
  ignoredModuleProp("onMalloc");
  ignoredModuleProp("onRealloc");
  ignoredModuleProp("onFree");
  ignoredModuleProp("onSbrkGrow");
}

var ASM_CONSTS = {
  4559448: () => Module.window ? 1 : 0,
  4559482: () => {
    var win = Module.window ? Module.window : window;
    var AudioContext = win.AudioContext || win.webkitAudioContext;
    var contextForCheck = new AudioContext;
    if (!contextForCheck) {
      return 0;
    }
    var retValue = 0;
    if (self.AudioWorkletNode) {
      if (contextForCheck.audioWorklet.addModule) {
        retValue = 1;
      }
    }
    contextForCheck.close();
    return retValue;
  },
  4559830: () => {
    var win = Module.window ? Module.window : window;
    var AudioContext = win.AudioContext || win.webkitAudioContext;
    var infocontext = new AudioContext;
    if (!infocontext) {
      return 0;
    }
    var inforate = infocontext.sampleRate;
    infocontext.close();
    return inforate;
  },
  4560094: () => {
    Module.mInputRegistered = false;
  },
  4560131: () => {
    var win = Module.window ? Module.window : window;
    var AudioContext = win.AudioContext || win.webkitAudioContext;
    Module.context = new AudioContext;
    if (!Module.context) {
      return 0;
    }
    Module.FMOD_JS_MixFunction = Module["cwrap"]("FMOD_JS_MixFunction", "void", [ "number" ]);
    return Module.context.sampleRate;
  },
  4560443: ($0, $1) => {
    Module._as_script_node = Module.context.createScriptProcessor($1, 0, $0);
    Module["OutputWebAudio_resumeAudio"] = function() {
      if (Module.context && Module.mInputRegistered) {
        console.log("Resetting audio driver based on user input.");
        Module._as_script_node.connect(Module.context.destination);
        Module._as_script_node.onaudioprocess = function(audioProcessingEvent) {
          Module._as_output_buffer = audioProcessingEvent.outputBuffer;
          Module.FMOD_JS_MixFunction(Module._as_output_buffer.getChannelData(0).length);
        };
        Module.context.resume();
        var win = Module.window ? Module.window : window;
        win.removeEventListener("click", Module.OutputWebAudio_resumeAudio, false);
        win.removeEventListener("touchend", Module.OutputWebAudio_resumeAudio, false);
        Module.mInputRegistered = false;
      }
    };
  },
  4561227: () => {
    if (Module.mInputRegistered) {
      Module.mInputRegistered = false;
      var win = Module.window ? Module.window : window;
      win.removeEventListener("click", Module["OutputWebAudio_resumeAudio"], false);
      win.removeEventListener("touchend", Module["OutputWebAudio_resumeAudio"], false);
    }
  },
  4561508: () => {
    var win = Module.window ? Module.window : window;
    win.addEventListener("touchend", Module["OutputWebAudio_resumeAudio"], false);
    win.addEventListener("click", Module["OutputWebAudio_resumeAudio"], false);
    Module.mInputRegistered = true;
  },
  4561749: () => {
    Module._as_script_node.disconnect(Module.context.destination);
  },
  4561816: ($0, $1, $2, $3) => {
    var data = (growMemViews(), HEAPF32).subarray(($0 / 4), ($0 / 4) + ($2 * $3));
    for (var channel = 0; channel < $3; channel++) {
      var outputData = Module._as_output_buffer.getChannelData(channel);
      for (var sample = 0; sample < $2; sample++) {
        outputData[sample + $1] = data[(sample * $3) + channel];
      }
    }
  },
  4562098: () => {
    Module.context.suspend();
  },
  4562128: () => {
    Module.context.resume();
  },
  4562157: () => {
    var win = Module.window ? Module.window : window;
    var AudioContext = win.AudioContext || win.webkitAudioContext;
    var infocontext = new AudioContext;
    if (!infocontext) {
      return 0;
    }
    var inforate = infocontext.sampleRate;
    infocontext.close();
    return inforate;
  },
  4562421: () => {
    Module.mWorkletNode = null;
    Module.mModulePolling = false;
    Module.mModuleLoading = false;
    Module.mStartInterval = null;
    Module.mStopInterval = null;
    Module.mSuspendInterval = null;
    Module.mResumeInterval = null;
    Module.mWorkletNodeConnected = false;
    Module.mInputRegistered = false;
    var win = Module.window ? Module.window : window;
    var AudioContext = win.AudioContext || win.webkitAudioContext;
    Module.mContext = new AudioContext;
    if (!Module.mContext) {
      return 0;
    }
    Module.mContext.destination.channelCount = Module.mContext.destination.maxChannelCount;
    return Module.mContext.destination.maxChannelCount;
  },
  4563035: $0 => {
    const initAddModuleRef = $0;
    if (!initAddModuleRef) {
      Module.mAddModuleRef = 0;
    }
    if (!self.AudioWorkletNode) {
      return -1;
    }
    if (!Module.mContext.audioWorklet.addModule) {
      return -2;
    }
    Module.FMOD_JS_MixerSlowpathFunction = Module["cwrap"]("FMOD_JS_MixerSlowpathFunction", "void", []);
    Module.FMOD_JS_MixerFastpathFunction = Module["cwrap"]("FMOD_JS_MixerFastpathFunction", "void", [ "number" ]);
    return Module.mContext.sampleRate;
  },
  4563469: ($0, $1) => {
    Module.mSpeakerChannelCount = $0;
    const bufferLength = $1;
    Module.mUrl = null;
    Module.mOutputData = null;
    Module.mSharedArrayBuffers = false;
    if (self.SharedArrayBuffer) {
      if (self.crossOriginIsolated) {
        Module.mSharedArrayBuffers = true;
      }
    }
    if (!Module.mSharedArrayBuffers) {
      const slowCodePath = new Blob([ "class AudioProcessor extends AudioWorkletProcessor", "{", "constructor(options)", "{", "super();", "this.payload = [null, null];", "this.bufferFlag = 0;", "this.dataFlag = 0;", "this.bufferIndex = 0;", "this.bufferSize = 0;", "this.channelCount = options.outputChannelCount;", "this.port.onmessage = (event) => {", "const { data } = event;", "if (data)", "{", "this.payload[this.dataFlag] = new Float32Array(data);", "this.bufferSize = data.length / this.channelCount;", "}", "else", "{", "this.payload[this.dataFlag] = null;", "}", "this.dataFlag ^= 1;", "};", "}", "process(inputs, outputs, parameters)", "{", "const output = outputs[0];", "if (output.length === 0) return true;", "if (this.payload[this.bufferFlag]) {", "if (this.bufferIndex === 0) {", "this.port.postMessage(this.bufferSize);", "}", "const bufferSliceEnd = this.bufferSize / output[0].length;", "const sliceOffset = output[0].length * this.bufferIndex;", "for (let channel = 0; channel < output.length; ++channel) {", "const outputChannel = output[channel];", "const indexOffset = this.bufferSize * channel + sliceOffset;", "outputChannel.set(new Float32Array(this.payload[this.bufferFlag].slice(0 + indexOffset, outputChannel.length + indexOffset)));", "}", "this.bufferIndex++;", "if (this.bufferIndex === bufferSliceEnd) {", "this.bufferIndex = 0;", "this.bufferFlag ^= 1;", "}", "}", "return true;", "}", "}", "registerProcessor('audio-processor', AudioProcessor);" ], {
        type: "application/javascript"
      });
      Module.mUrl = URL.createObjectURL(slowCodePath);
      Module.mOutputData = new Float32Array(Module.mSpeakerChannelCount * bufferLength);
    } else {
      const fastCodePath = new Blob([ "class AudioProcessor extends AudioWorkletProcessor", "{", "constructor(options)", "{", "super();", "this.payload = null;", "this.bufferFlag = 0;", "this.bufferIndex = 0;", "this.bufferSize = 0;", "this.bufferOffset = 0;", "this.channelCount = options.outputChannelCount;", "this.port.onmessage = (event) => {", "const { data } = event;", "if (data)", "{", "this.payload = data;", "this.bufferSize = this.payload.length / (this.channelCount * 2);", "this.bufferOffset = this.payload.length / 2;", "}", "else", "{", "this.payload = null;", "}", "};", "}", "process(inputs, outputs, parameters)", "{", "const output = outputs[0];", "if (output.length === 0) return true;", "if (this.payload) {", "if (this.bufferIndex === 0) {", "this.port.postMessage(this.bufferFlag ^ 1);", "}", "const bufferSliceEnd = this.bufferSize / output[0].length;", "const sliceOffset = output[0].length * this.bufferIndex + this.bufferOffset * this.bufferFlag;", "for (let channel = 0; channel < output.length; ++channel) {", "const outputChannel = output[channel];", "const indexOffset = this.bufferSize * channel + sliceOffset;", "outputChannel.set(new Float32Array(this.payload.slice(0 + indexOffset, outputChannel.length + indexOffset)));", "}", "this.bufferIndex++;", "if (this.bufferIndex === bufferSliceEnd) {", "this.bufferIndex = 0;", "this.bufferFlag ^= 1;", "}", "}", "return true;", "}", "}", "registerProcessor('audio-processor', AudioProcessor);" ], {
        type: "application/javascript"
      });
      Module.mUrl = URL.createObjectURL(fastCodePath);
      Module.mOutputData = new Float32Array(new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * Module.mSpeakerChannelCount * bufferLength * 2));
    }
    Module.mModulePolling = true;
    Module["waitForAudioWorklet"] = function(condition, callback) {
      var myInterval = null;
      if (condition()) {
        myInterval = setInterval(function() {
          if (!condition()) {
            callback();
            clearInterval(myInterval);
          }
        }, 50);
      } else {
        callback();
        return null;
      }
      return myInterval;
    };
    Module["OutputAudioWorklet_resumeAudio"] = function() {
      if (Module.mContext && Module.mInputRegistered) {
        console.log("Resetting audio driver based on user input.");
        Module.mContext.resume();
        var win = Module.window ? Module.window : window;
        win.removeEventListener("click", Module.OutputAudioWorklet_resumeAudio, false);
        win.removeEventListener("touchend", Module.OutputAudioWorklet_resumeAudio, false);
        Module.mInputRegistered = false;
        if (!Module.mModuleLoading) {
          Module.mModuleLoading = true;
          Module.mAddModuleRef++;
          Module.mContext.resume().then(function() {
            Module.mContext.audioWorklet.addModule(Module.mUrl).then(function() {
              if (Module.mAddModuleRef === 1) {
                Module.mWorkletNode = new AudioWorkletNode(Module.mContext, "audio-processor", {
                  "outputChannelCount": [ Module.mSpeakerChannelCount ]
                });
                Module.mModulePolling = false;
                URL.revokeObjectURL(Module.mUrl);
                if (Module.mWorkletNode) {
                  Module.mWorkletNode.port.postMessage(Module.mOutputData);
                  if (Module.mSharedArrayBuffers) {
                    Module.mWorkletNode.port.onmessage = function(event) {
                      Module.FMOD_JS_MixerFastpathFunction(event.data);
                    };
                  } else {
                    Module.mWorkletNode.port.onmessage = function(event) {
                      Module.FMOD_JS_MixerSlowpathFunction();
                      Module.mWorkletNode.port.postMessage(Module.mOutputData);
                    };
                  }
                } else {
                  console.log("Error when creating AudioWorkletNode: Null object");
                }
              }
              Module.mAddModuleRef--;
            }).catch(function(err) {
              Module.mModulePolling = false;
              Module.mAddModuleRef--;
              console.log("Error when opening audio processor ");
              console.log(err);
            });
          }).catch(function(err) {
            Module.mModulePolling = false;
            Module.mAddModuleRef--;
            console.log("Error with mContext.resume()");
            console.log(err);
          });
        }
      }
    };
    return Module.mSharedArrayBuffers;
  },
  4569124: () => {
    var win = Module.window ? Module.window : window;
    win.addEventListener("touchend", Module["OutputAudioWorklet_resumeAudio"], false);
    win.addEventListener("click", Module["OutputAudioWorklet_resumeAudio"], false);
    Module.mInputRegistered = true;
  },
  4569373: () => {
    if (Module.mStartInterval) {
      clearInterval(Module.mStartInterval);
    }
    if (Module.mStopInterval) {
      clearInterval(Module.mStopInterval);
    }
    if (Module.mSuspendInterval) {
      clearInterval(Module.mSuspendInterval);
    }
    if (Module.mResumeInterval) {
      clearInterval(Module.mResumeInterval);
    }
    if (Module.mWorkletNode) {
      if (Module.mWorkletNodeConnected) {
        Module.mWorkletNode.disconnect();
      }
    }
    if (Module.mContext) {
      Module.mContext.close();
    }
    if (Module.mInputRegistered) {
      Module.mInputRegistered = false;
      var win = Module.window ? Module.window : window;
      win.removeEventListener("click", Module["OutputAudioWorklet_resumeAudio"], false);
      win.removeEventListener("touchend", Module["OutputAudioWorklet_resumeAudio"], false);
    }
  },
  4570093: () => {
    Module.mStartInterval = Module["waitForAudioWorklet"](function() {
      return (Module.mWorkletNode === null && Module.mModulePolling);
    }, function() {
      if (Module.mWorkletNode) {
        Module.mWorkletNode.connect(Module.mContext.destination);
        Module.mWorkletNodeConnected = true;
      }
    });
  },
  4570370: () => {
    if (Module["waitForAudioWorklet"]) {
      Module.mStopInterval = Module["waitForAudioWorklet"](function() {
        return (Module.mWorkletNode === null && Module.mModulePolling || !Module.mWorkletNodeConnected);
      }, function() {
        if (Module.mWorkletNode) {
          Module.mWorkletNode.disconnect();
          Module.mWorkletNodeConnected = false;
        }
      });
    }
  },
  4570695: ($0, $1, $2) => {
    const buffer = $0;
    const bufferLength = $1;
    const speakerModeChannels = $2;
    var data = (growMemViews(), HEAPF32).subarray((buffer / 4), (buffer / 4) + (bufferLength * speakerModeChannels));
    for (var channel = 0; channel < speakerModeChannels; channel++) {
      const offset = channel * bufferLength;
      for (var sample = 0; sample < bufferLength; sample++) {
        Module.mOutputData[sample + offset] = data[(sample * speakerModeChannels) + channel];
      }
    }
  },
  4571122: ($0, $1, $2, $3) => {
    const buffer = $0;
    const bufferLength = $1;
    const speakerModeChannels = $2;
    const frameFlag = $3;
    var data = (growMemViews(), HEAPF32).subarray((buffer / 4), (buffer / 4) + (bufferLength * speakerModeChannels));
    const arrayOffset = speakerModeChannels * frameFlag * bufferLength;
    for (var channel = 0; channel < speakerModeChannels; channel++) {
      const offset = channel * bufferLength + arrayOffset;
      for (var sample = 0; sample < bufferLength; sample++) {
        Module.mOutputData[sample + offset] = data[(sample * speakerModeChannels) + channel];
      }
    }
  },
  4571653: () => {
    if (Module.mContext) {
      Module.mContext.suspend();
    }
  },
  4571709: () => {
    if (Module.mContext) {
      Module.mContext.resume();
    }
  },
  4571764: $0 => {
    var str = UTF8ToString($0) + "\n\n" + "Abort/Retry/Ignore/AlwaysIgnore? [ariA] :";
    var reply = window.prompt(str, "i");
    if (reply === null) {
      reply = "i";
    }
    return reply.length === 1 ? reply.charCodeAt(0) : -1;
  },
  4571979: () => {
    if (typeof (AudioContext) !== "undefined") {
      return true;
    } else if (typeof (webkitAudioContext) !== "undefined") {
      return true;
    }
    return false;
  },
  4572126: () => {
    if ((typeof (navigator.mediaDevices) !== "undefined") && (typeof (navigator.mediaDevices.getUserMedia) !== "undefined")) {
      return true;
    } else if (typeof (navigator.webkitGetUserMedia) !== "undefined") {
      return true;
    }
    return false;
  },
  4572360: $0 => {
    if (typeof (Module["SDL2"]) === "undefined") {
      Module["SDL2"] = {};
    }
    var SDL2 = Module["SDL2"];
    if (!$0) {
      SDL2.audio = {};
    } else {
      SDL2.capture = {};
    }
    if (!SDL2.audioContext) {
      if (typeof (AudioContext) !== "undefined") {
        SDL2.audioContext = new AudioContext;
      } else if (typeof (webkitAudioContext) !== "undefined") {
        SDL2.audioContext = new webkitAudioContext;
      }
      if (SDL2.audioContext) {
        if ((typeof navigator.userActivation) === "undefined") {
          autoResumeAudioContext(SDL2.audioContext);
        }
      }
    }
    return SDL2.audioContext === undefined ? -1 : 0;
  },
  4572912: () => {
    var SDL2 = Module["SDL2"];
    return SDL2.audioContext.sampleRate;
  },
  4572980: ($0, $1, $2, $3) => {
    var SDL2 = Module["SDL2"];
    var have_microphone = function(stream) {
      if (SDL2.capture.silenceTimer !== undefined) {
        clearInterval(SDL2.capture.silenceTimer);
        SDL2.capture.silenceTimer = undefined;
        SDL2.capture.silenceBuffer = undefined;
      }
      SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream);
      SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1);
      SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {
        if ((SDL2 === undefined) || (SDL2.capture === undefined)) {
          return;
        }
        audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
        SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
        dynCall("vp", $2, [ $3 ]);
      };
      SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode);
      SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination);
      SDL2.capture.stream = stream;
    };
    var no_microphone = function(error) {};
    SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
    SDL2.capture.silenceBuffer.getChannelData(0).fill(0);
    var silence_callback = function() {
      SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer;
      dynCall("vp", $2, [ $3 ]);
    };
    SDL2.capture.silenceTimer = setInterval(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1e3);
    if ((navigator.mediaDevices !== undefined) && (navigator.mediaDevices.getUserMedia !== undefined)) {
      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      }).then(have_microphone).catch(no_microphone);
    } else if (navigator.webkitGetUserMedia !== undefined) {
      navigator.webkitGetUserMedia({
        audio: true,
        video: false
      }, have_microphone, no_microphone);
    }
  },
  4574673: ($0, $1, $2, $3) => {
    var SDL2 = Module["SDL2"];
    SDL2.audio.scriptProcessorNode = SDL2.audioContext["createScriptProcessor"]($1, 0, $0);
    SDL2.audio.scriptProcessorNode["onaudioprocess"] = function(e) {
      if ((SDL2 === undefined) || (SDL2.audio === undefined)) {
        return;
      }
      if (SDL2.audio.silenceTimer !== undefined) {
        clearInterval(SDL2.audio.silenceTimer);
        SDL2.audio.silenceTimer = undefined;
        SDL2.audio.silenceBuffer = undefined;
      }
      SDL2.audio.currentOutputBuffer = e["outputBuffer"];
      dynCall("vp", $2, [ $3 ]);
    };
    SDL2.audio.scriptProcessorNode["connect"](SDL2.audioContext["destination"]);
    if (SDL2.audioContext.state === "suspended") {
      SDL2.audio.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
      SDL2.audio.silenceBuffer.getChannelData(0).fill(0);
      var silence_callback = function() {
        if ((typeof navigator.userActivation) !== "undefined") {
          if (navigator.userActivation.hasBeenActive) {
            SDL2.audioContext.resume();
          }
        }
        SDL2.audio.currentOutputBuffer = SDL2.audio.silenceBuffer;
        dynCall("vp", $2, [ $3 ]);
        SDL2.audio.currentOutputBuffer = undefined;
      };
      SDL2.audio.silenceTimer = setInterval(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1e3);
    }
  },
  4575848: ($0, $1) => {
    var SDL2 = Module["SDL2"];
    var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels;
    for (var c = 0; c < numChannels; ++c) {
      var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c);
      if (channelData.length != $1) {
        throw "Web Audio capture buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!";
      }
      if (numChannels == 1) {
        for (var j = 0; j < $1; ++j) {
          setValue($0 + (j * 4), channelData[j], "float");
        }
      } else {
        for (var j = 0; j < $1; ++j) {
          setValue($0 + (((j * numChannels) + c) * 4), channelData[j], "float");
        }
      }
    }
  },
  4576453: ($0, $1) => {
    var SDL2 = Module["SDL2"];
    var buf = $0 >>> 2;
    var numChannels = SDL2.audio.currentOutputBuffer["numberOfChannels"];
    for (var c = 0; c < numChannels; ++c) {
      var channelData = SDL2.audio.currentOutputBuffer["getChannelData"](c);
      if (channelData.length != $1) {
        throw "Web Audio output buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!";
      }
      for (var j = 0; j < $1; ++j) {
        channelData[j] = (growMemViews(), HEAPF32)[buf + (j * numChannels + c)];
      }
    }
  },
  4576942: $0 => {
    var SDL2 = Module["SDL2"];
    if ($0) {
      if (SDL2.capture.silenceTimer !== undefined) {
        clearInterval(SDL2.capture.silenceTimer);
      }
      if (SDL2.capture.stream !== undefined) {
        var tracks = SDL2.capture.stream.getAudioTracks();
        for (var i = 0; i < tracks.length; i++) {
          SDL2.capture.stream.removeTrack(tracks[i]);
        }
      }
      if (SDL2.capture.scriptProcessorNode !== undefined) {
        SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {};
        SDL2.capture.scriptProcessorNode.disconnect();
      }
      if (SDL2.capture.mediaStreamNode !== undefined) {
        SDL2.capture.mediaStreamNode.disconnect();
      }
      SDL2.capture = undefined;
    } else {
      if (SDL2.audio.scriptProcessorNode != undefined) {
        SDL2.audio.scriptProcessorNode.disconnect();
      }
      if (SDL2.audio.silenceTimer !== undefined) {
        clearInterval(SDL2.audio.silenceTimer);
      }
      SDL2.audio = undefined;
    }
    if ((SDL2.audioContext !== undefined) && (SDL2.audio === undefined) && (SDL2.capture === undefined)) {
      SDL2.audioContext.close();
      SDL2.audioContext = undefined;
    }
  },
  4577948: ($0, $1, $2) => {
    var w = $0;
    var h = $1;
    var pixels = $2;
    if (!Module["SDL2"]) Module["SDL2"] = {};
    var SDL2 = Module["SDL2"];
    if (SDL2.ctxCanvas !== Module["canvas"]) {
      SDL2.ctx = Browser.createContext(Module["canvas"], false, true);
      SDL2.ctxCanvas = Module["canvas"];
    }
    if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) {
      SDL2.image = SDL2.ctx.createImageData(w, h);
      SDL2.w = w;
      SDL2.h = h;
      SDL2.imageCtx = SDL2.ctx;
    }
    var data = SDL2.image.data;
    var src = pixels / 4;
    var dst = 0;
    var num;
    if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
      num = data.length;
      while (dst < num) {
        var val = (growMemViews(), HEAP32)[src];
        data[dst] = val & 255;
        data[dst + 1] = (val >> 8) & 255;
        data[dst + 2] = (val >> 16) & 255;
        data[dst + 3] = 255;
        src++;
        dst += 4;
      }
    } else {
      if (SDL2.data32Data !== data) {
        SDL2.data32 = new Int32Array(data.buffer);
        SDL2.data8 = new Uint8Array(data.buffer);
        SDL2.data32Data = data;
      }
      var data32 = SDL2.data32;
      num = data32.length;
      data32.set((growMemViews(), HEAP32).subarray(src, src + num));
      var data8 = SDL2.data8;
      var i = 3;
      var j = i + 4 * num;
      if (num % 8 == 0) {
        while (i < j) {
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
          data8[i] = 255;
          i = i + 4 | 0;
        }
      } else {
        while (i < j) {
          data8[i] = 255;
          i = i + 4 | 0;
        }
      }
    }
    SDL2.ctx.putImageData(SDL2.image, 0, 0);
  },
  4579414: ($0, $1, $2, $3, $4) => {
    var w = $0;
    var h = $1;
    var hot_x = $2;
    var hot_y = $3;
    var pixels = $4;
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    var image = ctx.createImageData(w, h);
    var data = image.data;
    var src = pixels / 4;
    var dst = 0;
    var num;
    if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
      num = data.length;
      while (dst < num) {
        var val = (growMemViews(), HEAP32)[src];
        data[dst] = val & 255;
        data[dst + 1] = (val >> 8) & 255;
        data[dst + 2] = (val >> 16) & 255;
        data[dst + 3] = (val >> 24) & 255;
        src++;
        dst += 4;
      }
    } else {
      var data32 = new Int32Array(data.buffer);
      num = data32.length;
      data32.set((growMemViews(), HEAP32).subarray(src, src + num));
    }
    ctx.putImageData(image, 0, 0);
    var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto";
    var urlBuf = _malloc(url.length + 1);
    stringToUTF8(url, urlBuf, url.length + 1);
    return urlBuf;
  },
  4580402: $0 => {
    if (Module["canvas"]) {
      Module["canvas"].style["cursor"] = UTF8ToString($0);
    }
  },
  4580485: () => {
    if (Module["canvas"]) {
      Module["canvas"].style["cursor"] = "none";
    }
  },
  4580554: () => window.innerWidth,
  4580584: () => window.innerHeight,
  4580615: ($0, $1) => {
    alert(UTF8ToString($0) + "\n\n" + UTF8ToString($1));
  }
};

// Imports from the Wasm binary.
var _notifyPointerLockLost = Module["_notifyPointerLockLost"] = makeInvalidEarlyAccess("_notifyPointerLockLost");

var _main = Module["_main"] = makeInvalidEarlyAccess("_main");

var _free = makeInvalidEarlyAccess("_free");

var _strerror = makeInvalidEarlyAccess("_strerror");

var _pthread_self = makeInvalidEarlyAccess("_pthread_self");

var _malloc = makeInvalidEarlyAccess("_malloc");

var _realloc = makeInvalidEarlyAccess("_realloc");

var _htons = makeInvalidEarlyAccess("_htons");

var ___cxa_get_exception_ptr = makeInvalidEarlyAccess("___cxa_get_exception_ptr");

var _htonl = makeInvalidEarlyAccess("_htonl");

var _fflush = makeInvalidEarlyAccess("_fflush");

var _ntohs = makeInvalidEarlyAccess("_ntohs");

var _FMOD_JS_MixFunction = Module["_FMOD_JS_MixFunction"] = makeInvalidEarlyAccess("_FMOD_JS_MixFunction");

var _FMOD_JS_MixerSlowpathFunction = Module["_FMOD_JS_MixerSlowpathFunction"] = makeInvalidEarlyAccess("_FMOD_JS_MixerSlowpathFunction");

var _FMOD_JS_MixerFastpathFunction = Module["_FMOD_JS_MixerFastpathFunction"] = makeInvalidEarlyAccess("_FMOD_JS_MixerFastpathFunction");

var ___getTypeName = makeInvalidEarlyAccess("___getTypeName");

var __embind_initialize_bindings = makeInvalidEarlyAccess("__embind_initialize_bindings");

var __emscripten_tls_init = makeInvalidEarlyAccess("__emscripten_tls_init");

var _emscripten_builtin_memalign = makeInvalidEarlyAccess("_emscripten_builtin_memalign");

var __emscripten_run_callback_on_thread = makeInvalidEarlyAccess("__emscripten_run_callback_on_thread");

var __emscripten_thread_init = makeInvalidEarlyAccess("__emscripten_thread_init");

var __emscripten_thread_crashed = makeInvalidEarlyAccess("__emscripten_thread_crashed");

var _emscripten_stack_get_end = makeInvalidEarlyAccess("_emscripten_stack_get_end");

var _emscripten_stack_get_base = makeInvalidEarlyAccess("_emscripten_stack_get_base");

var __emscripten_run_js_on_main_thread_done = makeInvalidEarlyAccess("__emscripten_run_js_on_main_thread_done");

var __emscripten_run_js_on_main_thread = makeInvalidEarlyAccess("__emscripten_run_js_on_main_thread");

var __emscripten_thread_free_data = makeInvalidEarlyAccess("__emscripten_thread_free_data");

var __emscripten_thread_exit = makeInvalidEarlyAccess("__emscripten_thread_exit");

var __emscripten_check_mailbox = makeInvalidEarlyAccess("__emscripten_check_mailbox");

var _setThrew = makeInvalidEarlyAccess("_setThrew");

var __emscripten_tempret_set = makeInvalidEarlyAccess("__emscripten_tempret_set");

var _emscripten_stack_init = makeInvalidEarlyAccess("_emscripten_stack_init");

var _emscripten_stack_set_limits = makeInvalidEarlyAccess("_emscripten_stack_set_limits");

var _emscripten_stack_get_free = makeInvalidEarlyAccess("_emscripten_stack_get_free");

var __emscripten_stack_restore = makeInvalidEarlyAccess("__emscripten_stack_restore");

var __emscripten_stack_alloc = makeInvalidEarlyAccess("__emscripten_stack_alloc");

var _emscripten_stack_get_current = makeInvalidEarlyAccess("_emscripten_stack_get_current");

var ___cxa_decrement_exception_refcount = makeInvalidEarlyAccess("___cxa_decrement_exception_refcount");

var ___cxa_increment_exception_refcount = makeInvalidEarlyAccess("___cxa_increment_exception_refcount");

var ___get_exception_message = makeInvalidEarlyAccess("___get_exception_message");

var ___cxa_can_catch = makeInvalidEarlyAccess("___cxa_can_catch");

var dynCall_vi = makeInvalidEarlyAccess("dynCall_vi");

var dynCall_viiii = makeInvalidEarlyAccess("dynCall_viiii");

var dynCall_ii = makeInvalidEarlyAccess("dynCall_ii");

var dynCall_iiiii = makeInvalidEarlyAccess("dynCall_iiiii");

var dynCall_v = makeInvalidEarlyAccess("dynCall_v");

var dynCall_viii = makeInvalidEarlyAccess("dynCall_viii");

var dynCall_iii = makeInvalidEarlyAccess("dynCall_iii");

var dynCall_vii = makeInvalidEarlyAccess("dynCall_vii");

var dynCall_iiii = makeInvalidEarlyAccess("dynCall_iiii");

var dynCall_iiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiii");

var dynCall_i = makeInvalidEarlyAccess("dynCall_i");

var dynCall_viiiiii = makeInvalidEarlyAccess("dynCall_viiiiii");

var dynCall_d = makeInvalidEarlyAccess("dynCall_d");

var dynCall_dii = makeInvalidEarlyAccess("dynCall_dii");

var dynCall_viiiii = makeInvalidEarlyAccess("dynCall_viiiii");

var dynCall_iiiiii = makeInvalidEarlyAccess("dynCall_iiiiii");

var dynCall_iiddi = makeInvalidEarlyAccess("dynCall_iiddi");

var dynCall_viid = makeInvalidEarlyAccess("dynCall_viid");

var dynCall_viiiid = makeInvalidEarlyAccess("dynCall_viiiid");

var dynCall_vif = makeInvalidEarlyAccess("dynCall_vif");

var dynCall_di = makeInvalidEarlyAccess("dynCall_di");

var dynCall_diffff = makeInvalidEarlyAccess("dynCall_diffff");

var dynCall_viiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiii");

var dynCall_iiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiii");

var dynCall_iiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiii");

var dynCall_fi = makeInvalidEarlyAccess("dynCall_fi");

var dynCall_j = makeInvalidEarlyAccess("dynCall_j");

var dynCall_fii = makeInvalidEarlyAccess("dynCall_fii");

var dynCall_iidii = makeInvalidEarlyAccess("dynCall_iidii");

var dynCall_iid = makeInvalidEarlyAccess("dynCall_iid");

var dynCall_viiid = makeInvalidEarlyAccess("dynCall_viiid");

var dynCall_vid = makeInvalidEarlyAccess("dynCall_vid");

var dynCall_iidi = makeInvalidEarlyAccess("dynCall_iidi");

var dynCall_iiid = makeInvalidEarlyAccess("dynCall_iiid");

var dynCall_iififi = makeInvalidEarlyAccess("dynCall_iififi");

var dynCall_viifi = makeInvalidEarlyAccess("dynCall_viifi");

var dynCall_viiif = makeInvalidEarlyAccess("dynCall_viiif");

var dynCall_iiiiifi = makeInvalidEarlyAccess("dynCall_iiiiifi");

var dynCall_iiiifii = makeInvalidEarlyAccess("dynCall_iiiifii");

var dynCall_viiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiii");

var dynCall_viffff = makeInvalidEarlyAccess("dynCall_viffff");

var dynCall_viiiifiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiifiiiiiiiii");

var dynCall_fif = makeInvalidEarlyAccess("dynCall_fif");

var dynCall_iifffffffff = makeInvalidEarlyAccess("dynCall_iifffffffff");

var dynCall_iif = makeInvalidEarlyAccess("dynCall_iif");

var dynCall_viiififf = makeInvalidEarlyAccess("dynCall_viiififf");

var dynCall_iiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiii");

var dynCall_viif = makeInvalidEarlyAccess("dynCall_viif");

var dynCall_viiffff = makeInvalidEarlyAccess("dynCall_viiffff");

var dynCall_viiiffii = makeInvalidEarlyAccess("dynCall_viiiffii");

var dynCall_viiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiiii");

var dynCall_viiiiifii = makeInvalidEarlyAccess("dynCall_viiiiifii");

var dynCall_viiifi = makeInvalidEarlyAccess("dynCall_viiifi");

var dynCall_vifi = makeInvalidEarlyAccess("dynCall_vifi");

var dynCall_f = makeInvalidEarlyAccess("dynCall_f");

var dynCall_if = makeInvalidEarlyAccess("dynCall_if");

var dynCall_vifff = makeInvalidEarlyAccess("dynCall_vifff");

var dynCall_viifii = makeInvalidEarlyAccess("dynCall_viifii");

var dynCall_viiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiiiii");

var dynCall_iiiiiid = makeInvalidEarlyAccess("dynCall_iiiiiid");

var dynCall_iij = makeInvalidEarlyAccess("dynCall_iij");

var dynCall_viiiiiiiif = makeInvalidEarlyAccess("dynCall_viiiiiiiif");

var dynCall_viiiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiiiiiiii");

var dynCall_viiiiifi = makeInvalidEarlyAccess("dynCall_viiiiifi");

var dynCall_viiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiiiiiii");

var dynCall_viiiiiiif = makeInvalidEarlyAccess("dynCall_viiiiiiif");

var dynCall_viiiiiif = makeInvalidEarlyAccess("dynCall_viiiiiif");

var dynCall_viiiif = makeInvalidEarlyAccess("dynCall_viiiif");

var dynCall_viifff = makeInvalidEarlyAccess("dynCall_viifff");

var dynCall_viiiiiifi = makeInvalidEarlyAccess("dynCall_viiiiiifi");

var dynCall_viifiii = makeInvalidEarlyAccess("dynCall_viifiii");

var dynCall_iiif = makeInvalidEarlyAccess("dynCall_iiif");

var dynCall_iiiiiif = makeInvalidEarlyAccess("dynCall_iiiiiif");

var dynCall_iiiff = makeInvalidEarlyAccess("dynCall_iiiff");

var dynCall_viiifii = makeInvalidEarlyAccess("dynCall_viiifii");

var dynCall_viiiifi = makeInvalidEarlyAccess("dynCall_viiiifi");

var dynCall_iiiifi = makeInvalidEarlyAccess("dynCall_iiiifi");

var dynCall_vidi = makeInvalidEarlyAccess("dynCall_vidi");

var dynCall_iifii = makeInvalidEarlyAccess("dynCall_iifii");

var dynCall_iiiifiiii = makeInvalidEarlyAccess("dynCall_iiiifiiii");

var dynCall_viifiiii = makeInvalidEarlyAccess("dynCall_viifiiii");

var dynCall_iiji = makeInvalidEarlyAccess("dynCall_iiji");

var dynCall_fiiiiii = makeInvalidEarlyAccess("dynCall_fiiiiii");

var dynCall_fiii = makeInvalidEarlyAccess("dynCall_fiii");

var dynCall_iiiif = makeInvalidEarlyAccess("dynCall_iiiif");

var dynCall_fiiiii = makeInvalidEarlyAccess("dynCall_fiiiii");

var dynCall_dd = makeInvalidEarlyAccess("dynCall_dd");

var dynCall_vidd = makeInvalidEarlyAccess("dynCall_vidd");

var dynCall_fifddi = makeInvalidEarlyAccess("dynCall_fifddi");

var dynCall_vij = makeInvalidEarlyAccess("dynCall_vij");

var dynCall_viij = makeInvalidEarlyAccess("dynCall_viij");

var dynCall_ji = makeInvalidEarlyAccess("dynCall_ji");

var dynCall_vdii = makeInvalidEarlyAccess("dynCall_vdii");

var dynCall_vdiiii = makeInvalidEarlyAccess("dynCall_vdiiii");

var dynCall_iiiiidi = makeInvalidEarlyAccess("dynCall_iiiiidi");

var dynCall_viifffi = makeInvalidEarlyAccess("dynCall_viifffi");

var dynCall_viff = makeInvalidEarlyAccess("dynCall_viff");

var dynCall_viidii = makeInvalidEarlyAccess("dynCall_viidii");

var dynCall_viiidii = makeInvalidEarlyAccess("dynCall_viiidii");

var dynCall_viiifff = makeInvalidEarlyAccess("dynCall_viiifff");

var dynCall_viiff = makeInvalidEarlyAccess("dynCall_viiff");

var dynCall_iiiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiii");

var dynCall_iiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiii");

var dynCall_vifffffffff = makeInvalidEarlyAccess("dynCall_vifffffffff");

var dynCall_iiiiiffff = makeInvalidEarlyAccess("dynCall_iiiiiffff");

var dynCall_iifif = makeInvalidEarlyAccess("dynCall_iifif");

var dynCall_iiff = makeInvalidEarlyAccess("dynCall_iiff");

var dynCall_viiiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiiiiii");

var dynCall_iiiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiiii");

var dynCall_diid = makeInvalidEarlyAccess("dynCall_diid");

var dynCall_viiidi = makeInvalidEarlyAccess("dynCall_viiidi");

var dynCall_viiiidi = makeInvalidEarlyAccess("dynCall_viiiidi");

var dynCall_iiiidi = makeInvalidEarlyAccess("dynCall_iiiidi");

var dynCall_viiiddd = makeInvalidEarlyAccess("dynCall_viiiddd");

var dynCall_viiidd = makeInvalidEarlyAccess("dynCall_viiidd");

var dynCall_fiifi = makeInvalidEarlyAccess("dynCall_fiifi");

var dynCall_ij = makeInvalidEarlyAccess("dynCall_ij");

var dynCall_diii = makeInvalidEarlyAccess("dynCall_diii");

var dynCall_viijii = makeInvalidEarlyAccess("dynCall_viijii");

var dynCall_iiiid = makeInvalidEarlyAccess("dynCall_iiiid");

var dynCall_jii = makeInvalidEarlyAccess("dynCall_jii");

var dynCall_viiiiiiifffii = makeInvalidEarlyAccess("dynCall_viiiiiiifffii");

var dynCall_viffffi = makeInvalidEarlyAccess("dynCall_viffffi");

var dynCall_iiiiiifii = makeInvalidEarlyAccess("dynCall_iiiiiifii");

var dynCall_iiiiiiiiiiifiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiifiiiiii");

var dynCall_iiiiifii = makeInvalidEarlyAccess("dynCall_iiiiifii");

var dynCall_viiiiiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiiiiiiiiiiii");

var dynCall_iiiifiifii = makeInvalidEarlyAccess("dynCall_iiiifiifii");

var dynCall_iiiiiiiiiifiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiifiiiiii");

var dynCall_iiiifiifiii = makeInvalidEarlyAccess("dynCall_iiiifiifiii");

var dynCall_iiiifiif = makeInvalidEarlyAccess("dynCall_iiiifiif");

var dynCall_viiffi = makeInvalidEarlyAccess("dynCall_viiffi");

var dynCall_fiiiiiiii = makeInvalidEarlyAccess("dynCall_fiiiiiiii");

var dynCall_viiiiif = makeInvalidEarlyAccess("dynCall_viiiiif");

var dynCall_viiiff = makeInvalidEarlyAccess("dynCall_viiiff");

var dynCall_iijjjj = makeInvalidEarlyAccess("dynCall_iijjjj");

var dynCall_viiifiii = makeInvalidEarlyAccess("dynCall_viiifiii");

var dynCall_ff = makeInvalidEarlyAccess("dynCall_ff");

var dynCall_viiifif = makeInvalidEarlyAccess("dynCall_viiifif");

var dynCall_iiiiiiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiiiiiii");

var dynCall_iiiiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiiiii");

var dynCall_iiiiiiiiiiiiiii = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiiiiii");

var dynCall_viiffii = makeInvalidEarlyAccess("dynCall_viiffii");

var dynCall_viifji = makeInvalidEarlyAccess("dynCall_viifji");

var dynCall_iiiiiiif = makeInvalidEarlyAccess("dynCall_iiiiiiif");

var dynCall_iiiiifiii = makeInvalidEarlyAccess("dynCall_iiiiifiii");

var dynCall_iiiiiifi = makeInvalidEarlyAccess("dynCall_iiiiiifi");

var dynCall_iiiiiiiiifi = makeInvalidEarlyAccess("dynCall_iiiiiiiiifi");

var dynCall_iiiiffi = makeInvalidEarlyAccess("dynCall_iiiiffi");

var dynCall_iiiiif = makeInvalidEarlyAccess("dynCall_iiiiif");

var dynCall_iiiiiiifii = makeInvalidEarlyAccess("dynCall_iiiiiiifii");

var dynCall_fiiii = makeInvalidEarlyAccess("dynCall_fiiii");

var dynCall_iiiiff = makeInvalidEarlyAccess("dynCall_iiiiff");

var dynCall_iiiiiifff = makeInvalidEarlyAccess("dynCall_iiiiiifff");

var dynCall_iiiiiiff = makeInvalidEarlyAccess("dynCall_iiiiiiff");

var dynCall_viiiij = makeInvalidEarlyAccess("dynCall_viiiij");

var dynCall_viiiiiff = makeInvalidEarlyAccess("dynCall_viiiiiff");

var dynCall_did = makeInvalidEarlyAccess("dynCall_did");

var dynCall_iiiiiiiiiiji = makeInvalidEarlyAccess("dynCall_iiiiiiiiiiji");

var dynCall_iiiiiiij = makeInvalidEarlyAccess("dynCall_iiiiiiij");

var dynCall_viiiiiji = makeInvalidEarlyAccess("dynCall_viiiiiji");

var dynCall_vifii = makeInvalidEarlyAccess("dynCall_vifii");

var dynCall_iijii = makeInvalidEarlyAccess("dynCall_iijii");

var dynCall_vijjidddii = makeInvalidEarlyAccess("dynCall_vijjidddii");

var dynCall_iiijii = makeInvalidEarlyAccess("dynCall_iiijii");

var dynCall_viji = makeInvalidEarlyAccess("dynCall_viji");

var dynCall_iiiijii = makeInvalidEarlyAccess("dynCall_iiiijii");

var dynCall_viiij = makeInvalidEarlyAccess("dynCall_viiij");

var dynCall_iiij = makeInvalidEarlyAccess("dynCall_iiij");

var dynCall_vijj = makeInvalidEarlyAccess("dynCall_vijj");

var dynCall_iiijiiiiii = makeInvalidEarlyAccess("dynCall_iiijiiiiii");

var dynCall_vidii = makeInvalidEarlyAccess("dynCall_vidii");

var dynCall_viiiidfi = makeInvalidEarlyAccess("dynCall_viiiidfi");

var dynCall_viiiiid = makeInvalidEarlyAccess("dynCall_viiiiid");

var dynCall_iiiiid = makeInvalidEarlyAccess("dynCall_iiiiid");

var dynCall_iiiiiiiiij = makeInvalidEarlyAccess("dynCall_iiiiiiiiij");

var dynCall_iiffffffffffffffff = makeInvalidEarlyAccess("dynCall_iiffffffffffffffff");

var dynCall_fiff = makeInvalidEarlyAccess("dynCall_fiff");

var dynCall_vifiii = makeInvalidEarlyAccess("dynCall_vifiii");

var dynCall_fiiff = makeInvalidEarlyAccess("dynCall_fiiff");

var dynCall_viiiffi = makeInvalidEarlyAccess("dynCall_viiiffi");

var dynCall_viiiiifiiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiifiiiiiiiii");

var dynCall_viiiifii = makeInvalidEarlyAccess("dynCall_viiiifii");

var dynCall_viiffiii = makeInvalidEarlyAccess("dynCall_viiffiii");

var dynCall_viffii = makeInvalidEarlyAccess("dynCall_viffii");

var dynCall_iifi = makeInvalidEarlyAccess("dynCall_iifi");

var dynCall_iiijiii = makeInvalidEarlyAccess("dynCall_iiijiii");

var dynCall_viiiiiiiifii = makeInvalidEarlyAccess("dynCall_viiiiiiiifii");

var dynCall_viifiif = makeInvalidEarlyAccess("dynCall_viifiif");

var dynCall_viiiiifiiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiifiiiiiiii");

var dynCall_iiiifiiiii = makeInvalidEarlyAccess("dynCall_iiiifiiiii");

var dynCall_viiiifiifiiifffii = makeInvalidEarlyAccess("dynCall_viiiifiifiiifffii");

var dynCall_viiiiifiiiiiii = makeInvalidEarlyAccess("dynCall_viiiiifiiiiiii");

var dynCall_iiiiiff = makeInvalidEarlyAccess("dynCall_iiiiiff");

var dynCall_fiifii = makeInvalidEarlyAccess("dynCall_fiifii");

var dynCall_viiiiiffi = makeInvalidEarlyAccess("dynCall_viiiiiffi");

var dynCall_viiiiffi = makeInvalidEarlyAccess("dynCall_viiiiffi");

var dynCall_fiiiiff = makeInvalidEarlyAccess("dynCall_fiiiiff");

var dynCall_ifi = makeInvalidEarlyAccess("dynCall_ifi");

var dynCall_iiiiiiiiiif = makeInvalidEarlyAccess("dynCall_iiiiiiiiiif");

var dynCall_iiifii = makeInvalidEarlyAccess("dynCall_iiifii");

var dynCall_iiiiiiifi = makeInvalidEarlyAccess("dynCall_iiiiiiifi");

var dynCall_iiifi = makeInvalidEarlyAccess("dynCall_iiifi");

var dynCall_iifff = makeInvalidEarlyAccess("dynCall_iifff");

var dynCall_iiffffffff = makeInvalidEarlyAccess("dynCall_iiffffffff");

var dynCall_iijji = makeInvalidEarlyAccess("dynCall_iijji");

var dynCall_iijf = makeInvalidEarlyAccess("dynCall_iijf");

var dynCall_iijj = makeInvalidEarlyAccess("dynCall_iijj");

var dynCall_iiffi = makeInvalidEarlyAccess("dynCall_iiffi");

var dynCall_iiiffi = makeInvalidEarlyAccess("dynCall_iiiffi");

var dynCall_iiifffii = makeInvalidEarlyAccess("dynCall_iiifffii");

var dynCall_iiiifffffiii = makeInvalidEarlyAccess("dynCall_iiiifffffiii");

var dynCall_iiiffffii = makeInvalidEarlyAccess("dynCall_iiiffffii");

var dynCall_iiifffffii = makeInvalidEarlyAccess("dynCall_iiifffffii");

var dynCall_iiifffi = makeInvalidEarlyAccess("dynCall_iiifffi");

var dynCall_viiiiiiffffff = makeInvalidEarlyAccess("dynCall_viiiiiiffffff");

var dynCall_iiiiiffi = makeInvalidEarlyAccess("dynCall_iiiiiffi");

var dynCall_viiiiiiiifffii = makeInvalidEarlyAccess("dynCall_viiiiiiiifffii");

var dynCall_viiiiiiiiifff = makeInvalidEarlyAccess("dynCall_viiiiiiiiifff");

var dynCall_jiji = makeInvalidEarlyAccess("dynCall_jiji");

var dynCall_vffff = makeInvalidEarlyAccess("dynCall_vffff");

var dynCall_vf = makeInvalidEarlyAccess("dynCall_vf");

var dynCall_vff = makeInvalidEarlyAccess("dynCall_vff");

var dynCall_vfi = makeInvalidEarlyAccess("dynCall_vfi");

var dynCall_vfff = makeInvalidEarlyAccess("dynCall_vfff");

var dynCall_iidiiii = makeInvalidEarlyAccess("dynCall_iidiiii");

var dynCall_jiiii = makeInvalidEarlyAccess("dynCall_jiiii");

var dynCall_iiiiij = makeInvalidEarlyAccess("dynCall_iiiiij");

var dynCall_iiiiijj = makeInvalidEarlyAccess("dynCall_iiiiijj");

var dynCall_iiiiiijj = makeInvalidEarlyAccess("dynCall_iiiiiijj");

var _asyncify_start_unwind = makeInvalidEarlyAccess("_asyncify_start_unwind");

var _asyncify_stop_unwind = makeInvalidEarlyAccess("_asyncify_stop_unwind");

var _asyncify_start_rewind = makeInvalidEarlyAccess("_asyncify_start_rewind");

var _asyncify_stop_rewind = makeInvalidEarlyAccess("_asyncify_stop_rewind");

var __indirect_function_table = makeInvalidEarlyAccess("__indirect_function_table");

var wasmTable = makeInvalidEarlyAccess("wasmTable");

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports["notifyPointerLockLost"] != "undefined", "missing Wasm export: notifyPointerLockLost");
  assert(typeof wasmExports["__main_argc_argv"] != "undefined", "missing Wasm export: __main_argc_argv");
  assert(typeof wasmExports["free"] != "undefined", "missing Wasm export: free");
  assert(typeof wasmExports["strerror"] != "undefined", "missing Wasm export: strerror");
  assert(typeof wasmExports["pthread_self"] != "undefined", "missing Wasm export: pthread_self");
  assert(typeof wasmExports["malloc"] != "undefined", "missing Wasm export: malloc");
  assert(typeof wasmExports["realloc"] != "undefined", "missing Wasm export: realloc");
  assert(typeof wasmExports["htons"] != "undefined", "missing Wasm export: htons");
  assert(typeof wasmExports["__cxa_get_exception_ptr"] != "undefined", "missing Wasm export: __cxa_get_exception_ptr");
  assert(typeof wasmExports["htonl"] != "undefined", "missing Wasm export: htonl");
  assert(typeof wasmExports["fflush"] != "undefined", "missing Wasm export: fflush");
  assert(typeof wasmExports["ntohs"] != "undefined", "missing Wasm export: ntohs");
  assert(typeof wasmExports["FMOD_JS_MixFunction"] != "undefined", "missing Wasm export: FMOD_JS_MixFunction");
  assert(typeof wasmExports["FMOD_JS_MixerSlowpathFunction"] != "undefined", "missing Wasm export: FMOD_JS_MixerSlowpathFunction");
  assert(typeof wasmExports["FMOD_JS_MixerFastpathFunction"] != "undefined", "missing Wasm export: FMOD_JS_MixerFastpathFunction");
  assert(typeof wasmExports["__getTypeName"] != "undefined", "missing Wasm export: __getTypeName");
  assert(typeof wasmExports["_embind_initialize_bindings"] != "undefined", "missing Wasm export: _embind_initialize_bindings");
  assert(typeof wasmExports["_emscripten_tls_init"] != "undefined", "missing Wasm export: _emscripten_tls_init");
  assert(typeof wasmExports["emscripten_builtin_memalign"] != "undefined", "missing Wasm export: emscripten_builtin_memalign");
  assert(typeof wasmExports["_emscripten_run_callback_on_thread"] != "undefined", "missing Wasm export: _emscripten_run_callback_on_thread");
  assert(typeof wasmExports["_emscripten_thread_init"] != "undefined", "missing Wasm export: _emscripten_thread_init");
  assert(typeof wasmExports["_emscripten_thread_crashed"] != "undefined", "missing Wasm export: _emscripten_thread_crashed");
  assert(typeof wasmExports["emscripten_stack_get_end"] != "undefined", "missing Wasm export: emscripten_stack_get_end");
  assert(typeof wasmExports["emscripten_stack_get_base"] != "undefined", "missing Wasm export: emscripten_stack_get_base");
  assert(typeof wasmExports["_emscripten_run_js_on_main_thread_done"] != "undefined", "missing Wasm export: _emscripten_run_js_on_main_thread_done");
  assert(typeof wasmExports["_emscripten_run_js_on_main_thread"] != "undefined", "missing Wasm export: _emscripten_run_js_on_main_thread");
  assert(typeof wasmExports["_emscripten_thread_free_data"] != "undefined", "missing Wasm export: _emscripten_thread_free_data");
  assert(typeof wasmExports["_emscripten_thread_exit"] != "undefined", "missing Wasm export: _emscripten_thread_exit");
  assert(typeof wasmExports["_emscripten_check_mailbox"] != "undefined", "missing Wasm export: _emscripten_check_mailbox");
  assert(typeof wasmExports["setThrew"] != "undefined", "missing Wasm export: setThrew");
  assert(typeof wasmExports["_emscripten_tempret_set"] != "undefined", "missing Wasm export: _emscripten_tempret_set");
  assert(typeof wasmExports["emscripten_stack_init"] != "undefined", "missing Wasm export: emscripten_stack_init");
  assert(typeof wasmExports["emscripten_stack_set_limits"] != "undefined", "missing Wasm export: emscripten_stack_set_limits");
  assert(typeof wasmExports["emscripten_stack_get_free"] != "undefined", "missing Wasm export: emscripten_stack_get_free");
  assert(typeof wasmExports["_emscripten_stack_restore"] != "undefined", "missing Wasm export: _emscripten_stack_restore");
  assert(typeof wasmExports["_emscripten_stack_alloc"] != "undefined", "missing Wasm export: _emscripten_stack_alloc");
  assert(typeof wasmExports["emscripten_stack_get_current"] != "undefined", "missing Wasm export: emscripten_stack_get_current");
  assert(typeof wasmExports["__cxa_decrement_exception_refcount"] != "undefined", "missing Wasm export: __cxa_decrement_exception_refcount");
  assert(typeof wasmExports["__cxa_increment_exception_refcount"] != "undefined", "missing Wasm export: __cxa_increment_exception_refcount");
  assert(typeof wasmExports["__get_exception_message"] != "undefined", "missing Wasm export: __get_exception_message");
  assert(typeof wasmExports["__cxa_can_catch"] != "undefined", "missing Wasm export: __cxa_can_catch");
  assert(typeof wasmExports["dynCall_vi"] != "undefined", "missing Wasm export: dynCall_vi");
  assert(typeof wasmExports["dynCall_viiii"] != "undefined", "missing Wasm export: dynCall_viiii");
  assert(typeof wasmExports["dynCall_ii"] != "undefined", "missing Wasm export: dynCall_ii");
  assert(typeof wasmExports["dynCall_iiiii"] != "undefined", "missing Wasm export: dynCall_iiiii");
  assert(typeof wasmExports["dynCall_v"] != "undefined", "missing Wasm export: dynCall_v");
  assert(typeof wasmExports["dynCall_viii"] != "undefined", "missing Wasm export: dynCall_viii");
  assert(typeof wasmExports["dynCall_iii"] != "undefined", "missing Wasm export: dynCall_iii");
  assert(typeof wasmExports["dynCall_vii"] != "undefined", "missing Wasm export: dynCall_vii");
  assert(typeof wasmExports["dynCall_iiii"] != "undefined", "missing Wasm export: dynCall_iiii");
  assert(typeof wasmExports["dynCall_iiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiii");
  assert(typeof wasmExports["dynCall_i"] != "undefined", "missing Wasm export: dynCall_i");
  assert(typeof wasmExports["dynCall_viiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiii");
  assert(typeof wasmExports["dynCall_d"] != "undefined", "missing Wasm export: dynCall_d");
  assert(typeof wasmExports["dynCall_dii"] != "undefined", "missing Wasm export: dynCall_dii");
  assert(typeof wasmExports["dynCall_viiiii"] != "undefined", "missing Wasm export: dynCall_viiiii");
  assert(typeof wasmExports["dynCall_iiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiii");
  assert(typeof wasmExports["dynCall_iiddi"] != "undefined", "missing Wasm export: dynCall_iiddi");
  assert(typeof wasmExports["dynCall_viid"] != "undefined", "missing Wasm export: dynCall_viid");
  assert(typeof wasmExports["dynCall_viiiid"] != "undefined", "missing Wasm export: dynCall_viiiid");
  assert(typeof wasmExports["dynCall_vif"] != "undefined", "missing Wasm export: dynCall_vif");
  assert(typeof wasmExports["dynCall_di"] != "undefined", "missing Wasm export: dynCall_di");
  assert(typeof wasmExports["dynCall_diffff"] != "undefined", "missing Wasm export: dynCall_diffff");
  assert(typeof wasmExports["dynCall_viiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiii");
  assert(typeof wasmExports["dynCall_fi"] != "undefined", "missing Wasm export: dynCall_fi");
  assert(typeof wasmExports["dynCall_j"] != "undefined", "missing Wasm export: dynCall_j");
  assert(typeof wasmExports["dynCall_fii"] != "undefined", "missing Wasm export: dynCall_fii");
  assert(typeof wasmExports["dynCall_iidii"] != "undefined", "missing Wasm export: dynCall_iidii");
  assert(typeof wasmExports["dynCall_iid"] != "undefined", "missing Wasm export: dynCall_iid");
  assert(typeof wasmExports["dynCall_viiid"] != "undefined", "missing Wasm export: dynCall_viiid");
  assert(typeof wasmExports["dynCall_vid"] != "undefined", "missing Wasm export: dynCall_vid");
  assert(typeof wasmExports["dynCall_iidi"] != "undefined", "missing Wasm export: dynCall_iidi");
  assert(typeof wasmExports["dynCall_iiid"] != "undefined", "missing Wasm export: dynCall_iiid");
  assert(typeof wasmExports["dynCall_iififi"] != "undefined", "missing Wasm export: dynCall_iififi");
  assert(typeof wasmExports["dynCall_viifi"] != "undefined", "missing Wasm export: dynCall_viifi");
  assert(typeof wasmExports["dynCall_viiif"] != "undefined", "missing Wasm export: dynCall_viiif");
  assert(typeof wasmExports["dynCall_iiiiifi"] != "undefined", "missing Wasm export: dynCall_iiiiifi");
  assert(typeof wasmExports["dynCall_iiiifii"] != "undefined", "missing Wasm export: dynCall_iiiifii");
  assert(typeof wasmExports["dynCall_viiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiii");
  assert(typeof wasmExports["dynCall_viffff"] != "undefined", "missing Wasm export: dynCall_viffff");
  assert(typeof wasmExports["dynCall_viiiifiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiifiiiiiiiii");
  assert(typeof wasmExports["dynCall_fif"] != "undefined", "missing Wasm export: dynCall_fif");
  assert(typeof wasmExports["dynCall_iifffffffff"] != "undefined", "missing Wasm export: dynCall_iifffffffff");
  assert(typeof wasmExports["dynCall_iif"] != "undefined", "missing Wasm export: dynCall_iif");
  assert(typeof wasmExports["dynCall_viiififf"] != "undefined", "missing Wasm export: dynCall_viiififf");
  assert(typeof wasmExports["dynCall_iiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiii");
  assert(typeof wasmExports["dynCall_viif"] != "undefined", "missing Wasm export: dynCall_viif");
  assert(typeof wasmExports["dynCall_viiffff"] != "undefined", "missing Wasm export: dynCall_viiffff");
  assert(typeof wasmExports["dynCall_viiiffii"] != "undefined", "missing Wasm export: dynCall_viiiffii");
  assert(typeof wasmExports["dynCall_viiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiii");
  assert(typeof wasmExports["dynCall_viiiiifii"] != "undefined", "missing Wasm export: dynCall_viiiiifii");
  assert(typeof wasmExports["dynCall_viiifi"] != "undefined", "missing Wasm export: dynCall_viiifi");
  assert(typeof wasmExports["dynCall_vifi"] != "undefined", "missing Wasm export: dynCall_vifi");
  assert(typeof wasmExports["dynCall_f"] != "undefined", "missing Wasm export: dynCall_f");
  assert(typeof wasmExports["dynCall_if"] != "undefined", "missing Wasm export: dynCall_if");
  assert(typeof wasmExports["dynCall_vifff"] != "undefined", "missing Wasm export: dynCall_vifff");
  assert(typeof wasmExports["dynCall_viifii"] != "undefined", "missing Wasm export: dynCall_viifii");
  assert(typeof wasmExports["dynCall_viiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiid"] != "undefined", "missing Wasm export: dynCall_iiiiiid");
  assert(typeof wasmExports["dynCall_iij"] != "undefined", "missing Wasm export: dynCall_iij");
  assert(typeof wasmExports["dynCall_viiiiiiiif"] != "undefined", "missing Wasm export: dynCall_viiiiiiiif");
  assert(typeof wasmExports["dynCall_viiiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_viiiiifi"] != "undefined", "missing Wasm export: dynCall_viiiiifi");
  assert(typeof wasmExports["dynCall_viiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_viiiiiiif"] != "undefined", "missing Wasm export: dynCall_viiiiiiif");
  assert(typeof wasmExports["dynCall_viiiiiif"] != "undefined", "missing Wasm export: dynCall_viiiiiif");
  assert(typeof wasmExports["dynCall_viiiif"] != "undefined", "missing Wasm export: dynCall_viiiif");
  assert(typeof wasmExports["dynCall_viifff"] != "undefined", "missing Wasm export: dynCall_viifff");
  assert(typeof wasmExports["dynCall_viiiiiifi"] != "undefined", "missing Wasm export: dynCall_viiiiiifi");
  assert(typeof wasmExports["dynCall_viifiii"] != "undefined", "missing Wasm export: dynCall_viifiii");
  assert(typeof wasmExports["dynCall_iiif"] != "undefined", "missing Wasm export: dynCall_iiif");
  assert(typeof wasmExports["dynCall_iiiiiif"] != "undefined", "missing Wasm export: dynCall_iiiiiif");
  assert(typeof wasmExports["dynCall_iiiff"] != "undefined", "missing Wasm export: dynCall_iiiff");
  assert(typeof wasmExports["dynCall_viiifii"] != "undefined", "missing Wasm export: dynCall_viiifii");
  assert(typeof wasmExports["dynCall_viiiifi"] != "undefined", "missing Wasm export: dynCall_viiiifi");
  assert(typeof wasmExports["dynCall_iiiifi"] != "undefined", "missing Wasm export: dynCall_iiiifi");
  assert(typeof wasmExports["dynCall_vidi"] != "undefined", "missing Wasm export: dynCall_vidi");
  assert(typeof wasmExports["dynCall_iifii"] != "undefined", "missing Wasm export: dynCall_iifii");
  assert(typeof wasmExports["dynCall_iiiifiiii"] != "undefined", "missing Wasm export: dynCall_iiiifiiii");
  assert(typeof wasmExports["dynCall_viifiiii"] != "undefined", "missing Wasm export: dynCall_viifiiii");
  assert(typeof wasmExports["dynCall_iiji"] != "undefined", "missing Wasm export: dynCall_iiji");
  assert(typeof wasmExports["dynCall_fiiiiii"] != "undefined", "missing Wasm export: dynCall_fiiiiii");
  assert(typeof wasmExports["dynCall_fiii"] != "undefined", "missing Wasm export: dynCall_fiii");
  assert(typeof wasmExports["dynCall_iiiif"] != "undefined", "missing Wasm export: dynCall_iiiif");
  assert(typeof wasmExports["dynCall_fiiiii"] != "undefined", "missing Wasm export: dynCall_fiiiii");
  assert(typeof wasmExports["dynCall_dd"] != "undefined", "missing Wasm export: dynCall_dd");
  assert(typeof wasmExports["dynCall_vidd"] != "undefined", "missing Wasm export: dynCall_vidd");
  assert(typeof wasmExports["dynCall_fifddi"] != "undefined", "missing Wasm export: dynCall_fifddi");
  assert(typeof wasmExports["dynCall_vij"] != "undefined", "missing Wasm export: dynCall_vij");
  assert(typeof wasmExports["dynCall_viij"] != "undefined", "missing Wasm export: dynCall_viij");
  assert(typeof wasmExports["dynCall_ji"] != "undefined", "missing Wasm export: dynCall_ji");
  assert(typeof wasmExports["dynCall_vdii"] != "undefined", "missing Wasm export: dynCall_vdii");
  assert(typeof wasmExports["dynCall_vdiiii"] != "undefined", "missing Wasm export: dynCall_vdiiii");
  assert(typeof wasmExports["dynCall_iiiiidi"] != "undefined", "missing Wasm export: dynCall_iiiiidi");
  assert(typeof wasmExports["dynCall_viifffi"] != "undefined", "missing Wasm export: dynCall_viifffi");
  assert(typeof wasmExports["dynCall_viff"] != "undefined", "missing Wasm export: dynCall_viff");
  assert(typeof wasmExports["dynCall_viidii"] != "undefined", "missing Wasm export: dynCall_viidii");
  assert(typeof wasmExports["dynCall_viiidii"] != "undefined", "missing Wasm export: dynCall_viiidii");
  assert(typeof wasmExports["dynCall_viiifff"] != "undefined", "missing Wasm export: dynCall_viiifff");
  assert(typeof wasmExports["dynCall_viiff"] != "undefined", "missing Wasm export: dynCall_viiff");
  assert(typeof wasmExports["dynCall_iiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_vifffffffff"] != "undefined", "missing Wasm export: dynCall_vifffffffff");
  assert(typeof wasmExports["dynCall_iiiiiffff"] != "undefined", "missing Wasm export: dynCall_iiiiiffff");
  assert(typeof wasmExports["dynCall_iifif"] != "undefined", "missing Wasm export: dynCall_iifif");
  assert(typeof wasmExports["dynCall_iiff"] != "undefined", "missing Wasm export: dynCall_iiff");
  assert(typeof wasmExports["dynCall_viiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_diid"] != "undefined", "missing Wasm export: dynCall_diid");
  assert(typeof wasmExports["dynCall_viiidi"] != "undefined", "missing Wasm export: dynCall_viiidi");
  assert(typeof wasmExports["dynCall_viiiidi"] != "undefined", "missing Wasm export: dynCall_viiiidi");
  assert(typeof wasmExports["dynCall_iiiidi"] != "undefined", "missing Wasm export: dynCall_iiiidi");
  assert(typeof wasmExports["dynCall_viiiddd"] != "undefined", "missing Wasm export: dynCall_viiiddd");
  assert(typeof wasmExports["dynCall_viiidd"] != "undefined", "missing Wasm export: dynCall_viiidd");
  assert(typeof wasmExports["dynCall_fiifi"] != "undefined", "missing Wasm export: dynCall_fiifi");
  assert(typeof wasmExports["dynCall_ij"] != "undefined", "missing Wasm export: dynCall_ij");
  assert(typeof wasmExports["dynCall_diii"] != "undefined", "missing Wasm export: dynCall_diii");
  assert(typeof wasmExports["dynCall_viijii"] != "undefined", "missing Wasm export: dynCall_viijii");
  assert(typeof wasmExports["dynCall_iiiid"] != "undefined", "missing Wasm export: dynCall_iiiid");
  assert(typeof wasmExports["dynCall_jii"] != "undefined", "missing Wasm export: dynCall_jii");
  assert(typeof wasmExports["dynCall_viiiiiiifffii"] != "undefined", "missing Wasm export: dynCall_viiiiiiifffii");
  assert(typeof wasmExports["dynCall_viffffi"] != "undefined", "missing Wasm export: dynCall_viffffi");
  assert(typeof wasmExports["dynCall_iiiiiifii"] != "undefined", "missing Wasm export: dynCall_iiiiiifii");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiifiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiifiiiiii");
  assert(typeof wasmExports["dynCall_iiiiifii"] != "undefined", "missing Wasm export: dynCall_iiiiifii");
  assert(typeof wasmExports["dynCall_viiiiiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiifiifii"] != "undefined", "missing Wasm export: dynCall_iiiifiifii");
  assert(typeof wasmExports["dynCall_iiiiiiiiiifiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiifiiiiii");
  assert(typeof wasmExports["dynCall_iiiifiifiii"] != "undefined", "missing Wasm export: dynCall_iiiifiifiii");
  assert(typeof wasmExports["dynCall_iiiifiif"] != "undefined", "missing Wasm export: dynCall_iiiifiif");
  assert(typeof wasmExports["dynCall_viiffi"] != "undefined", "missing Wasm export: dynCall_viiffi");
  assert(typeof wasmExports["dynCall_fiiiiiiii"] != "undefined", "missing Wasm export: dynCall_fiiiiiiii");
  assert(typeof wasmExports["dynCall_viiiiif"] != "undefined", "missing Wasm export: dynCall_viiiiif");
  assert(typeof wasmExports["dynCall_viiiff"] != "undefined", "missing Wasm export: dynCall_viiiff");
  assert(typeof wasmExports["dynCall_iijjjj"] != "undefined", "missing Wasm export: dynCall_iijjjj");
  assert(typeof wasmExports["dynCall_viiifiii"] != "undefined", "missing Wasm export: dynCall_viiifiii");
  assert(typeof wasmExports["dynCall_ff"] != "undefined", "missing Wasm export: dynCall_ff");
  assert(typeof wasmExports["dynCall_viiifif"] != "undefined", "missing Wasm export: dynCall_viiifif");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiiiiii");
  assert(typeof wasmExports["dynCall_viiffii"] != "undefined", "missing Wasm export: dynCall_viiffii");
  assert(typeof wasmExports["dynCall_viifji"] != "undefined", "missing Wasm export: dynCall_viifji");
  assert(typeof wasmExports["dynCall_iiiiiiif"] != "undefined", "missing Wasm export: dynCall_iiiiiiif");
  assert(typeof wasmExports["dynCall_iiiiifiii"] != "undefined", "missing Wasm export: dynCall_iiiiifiii");
  assert(typeof wasmExports["dynCall_iiiiiifi"] != "undefined", "missing Wasm export: dynCall_iiiiiifi");
  assert(typeof wasmExports["dynCall_iiiiiiiiifi"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiifi");
  assert(typeof wasmExports["dynCall_iiiiffi"] != "undefined", "missing Wasm export: dynCall_iiiiffi");
  assert(typeof wasmExports["dynCall_iiiiif"] != "undefined", "missing Wasm export: dynCall_iiiiif");
  assert(typeof wasmExports["dynCall_iiiiiiifii"] != "undefined", "missing Wasm export: dynCall_iiiiiiifii");
  assert(typeof wasmExports["dynCall_fiiii"] != "undefined", "missing Wasm export: dynCall_fiiii");
  assert(typeof wasmExports["dynCall_iiiiff"] != "undefined", "missing Wasm export: dynCall_iiiiff");
  assert(typeof wasmExports["dynCall_iiiiiifff"] != "undefined", "missing Wasm export: dynCall_iiiiiifff");
  assert(typeof wasmExports["dynCall_iiiiiiff"] != "undefined", "missing Wasm export: dynCall_iiiiiiff");
  assert(typeof wasmExports["dynCall_viiiij"] != "undefined", "missing Wasm export: dynCall_viiiij");
  assert(typeof wasmExports["dynCall_viiiiiff"] != "undefined", "missing Wasm export: dynCall_viiiiiff");
  assert(typeof wasmExports["dynCall_did"] != "undefined", "missing Wasm export: dynCall_did");
  assert(typeof wasmExports["dynCall_iiiiiiiiiiji"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiiji");
  assert(typeof wasmExports["dynCall_iiiiiiij"] != "undefined", "missing Wasm export: dynCall_iiiiiiij");
  assert(typeof wasmExports["dynCall_viiiiiji"] != "undefined", "missing Wasm export: dynCall_viiiiiji");
  assert(typeof wasmExports["dynCall_vifii"] != "undefined", "missing Wasm export: dynCall_vifii");
  assert(typeof wasmExports["dynCall_iijii"] != "undefined", "missing Wasm export: dynCall_iijii");
  assert(typeof wasmExports["dynCall_vijjidddii"] != "undefined", "missing Wasm export: dynCall_vijjidddii");
  assert(typeof wasmExports["dynCall_iiijii"] != "undefined", "missing Wasm export: dynCall_iiijii");
  assert(typeof wasmExports["dynCall_viji"] != "undefined", "missing Wasm export: dynCall_viji");
  assert(typeof wasmExports["dynCall_iiiijii"] != "undefined", "missing Wasm export: dynCall_iiiijii");
  assert(typeof wasmExports["dynCall_viiij"] != "undefined", "missing Wasm export: dynCall_viiij");
  assert(typeof wasmExports["dynCall_iiij"] != "undefined", "missing Wasm export: dynCall_iiij");
  assert(typeof wasmExports["dynCall_vijj"] != "undefined", "missing Wasm export: dynCall_vijj");
  assert(typeof wasmExports["dynCall_iiijiiiiii"] != "undefined", "missing Wasm export: dynCall_iiijiiiiii");
  assert(typeof wasmExports["dynCall_vidii"] != "undefined", "missing Wasm export: dynCall_vidii");
  assert(typeof wasmExports["dynCall_viiiidfi"] != "undefined", "missing Wasm export: dynCall_viiiidfi");
  assert(typeof wasmExports["dynCall_viiiiid"] != "undefined", "missing Wasm export: dynCall_viiiiid");
  assert(typeof wasmExports["dynCall_iiiiid"] != "undefined", "missing Wasm export: dynCall_iiiiid");
  assert(typeof wasmExports["dynCall_iiiiiiiiij"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiij");
  assert(typeof wasmExports["dynCall_iiffffffffffffffff"] != "undefined", "missing Wasm export: dynCall_iiffffffffffffffff");
  assert(typeof wasmExports["dynCall_fiff"] != "undefined", "missing Wasm export: dynCall_fiff");
  assert(typeof wasmExports["dynCall_vifiii"] != "undefined", "missing Wasm export: dynCall_vifiii");
  assert(typeof wasmExports["dynCall_fiiff"] != "undefined", "missing Wasm export: dynCall_fiiff");
  assert(typeof wasmExports["dynCall_viiiffi"] != "undefined", "missing Wasm export: dynCall_viiiffi");
  assert(typeof wasmExports["dynCall_viiiiifiiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiifiiiiiiiii");
  assert(typeof wasmExports["dynCall_viiiifii"] != "undefined", "missing Wasm export: dynCall_viiiifii");
  assert(typeof wasmExports["dynCall_viiffiii"] != "undefined", "missing Wasm export: dynCall_viiffiii");
  assert(typeof wasmExports["dynCall_viffii"] != "undefined", "missing Wasm export: dynCall_viffii");
  assert(typeof wasmExports["dynCall_iifi"] != "undefined", "missing Wasm export: dynCall_iifi");
  assert(typeof wasmExports["dynCall_iiijiii"] != "undefined", "missing Wasm export: dynCall_iiijiii");
  assert(typeof wasmExports["dynCall_viiiiiiiifii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiifii");
  assert(typeof wasmExports["dynCall_viifiif"] != "undefined", "missing Wasm export: dynCall_viifiif");
  assert(typeof wasmExports["dynCall_viiiiifiiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiifiiiiiiii");
  assert(typeof wasmExports["dynCall_iiiifiiiii"] != "undefined", "missing Wasm export: dynCall_iiiifiiiii");
  assert(typeof wasmExports["dynCall_viiiifiifiiifffii"] != "undefined", "missing Wasm export: dynCall_viiiifiifiiifffii");
  assert(typeof wasmExports["dynCall_viiiiifiiiiiii"] != "undefined", "missing Wasm export: dynCall_viiiiifiiiiiii");
  assert(typeof wasmExports["dynCall_iiiiiff"] != "undefined", "missing Wasm export: dynCall_iiiiiff");
  assert(typeof wasmExports["dynCall_fiifii"] != "undefined", "missing Wasm export: dynCall_fiifii");
  assert(typeof wasmExports["dynCall_viiiiiffi"] != "undefined", "missing Wasm export: dynCall_viiiiiffi");
  assert(typeof wasmExports["dynCall_viiiiffi"] != "undefined", "missing Wasm export: dynCall_viiiiffi");
  assert(typeof wasmExports["dynCall_fiiiiff"] != "undefined", "missing Wasm export: dynCall_fiiiiff");
  assert(typeof wasmExports["dynCall_ifi"] != "undefined", "missing Wasm export: dynCall_ifi");
  assert(typeof wasmExports["dynCall_iiiiiiiiiif"] != "undefined", "missing Wasm export: dynCall_iiiiiiiiiif");
  assert(typeof wasmExports["dynCall_iiifii"] != "undefined", "missing Wasm export: dynCall_iiifii");
  assert(typeof wasmExports["dynCall_iiiiiiifi"] != "undefined", "missing Wasm export: dynCall_iiiiiiifi");
  assert(typeof wasmExports["dynCall_iiifi"] != "undefined", "missing Wasm export: dynCall_iiifi");
  assert(typeof wasmExports["dynCall_iifff"] != "undefined", "missing Wasm export: dynCall_iifff");
  assert(typeof wasmExports["dynCall_iiffffffff"] != "undefined", "missing Wasm export: dynCall_iiffffffff");
  assert(typeof wasmExports["dynCall_iijji"] != "undefined", "missing Wasm export: dynCall_iijji");
  assert(typeof wasmExports["dynCall_iijf"] != "undefined", "missing Wasm export: dynCall_iijf");
  assert(typeof wasmExports["dynCall_iijj"] != "undefined", "missing Wasm export: dynCall_iijj");
  assert(typeof wasmExports["dynCall_iiffi"] != "undefined", "missing Wasm export: dynCall_iiffi");
  assert(typeof wasmExports["dynCall_iiiffi"] != "undefined", "missing Wasm export: dynCall_iiiffi");
  assert(typeof wasmExports["dynCall_iiifffii"] != "undefined", "missing Wasm export: dynCall_iiifffii");
  assert(typeof wasmExports["dynCall_iiiifffffiii"] != "undefined", "missing Wasm export: dynCall_iiiifffffiii");
  assert(typeof wasmExports["dynCall_iiiffffii"] != "undefined", "missing Wasm export: dynCall_iiiffffii");
  assert(typeof wasmExports["dynCall_iiifffffii"] != "undefined", "missing Wasm export: dynCall_iiifffffii");
  assert(typeof wasmExports["dynCall_iiifffi"] != "undefined", "missing Wasm export: dynCall_iiifffi");
  assert(typeof wasmExports["dynCall_viiiiiiffffff"] != "undefined", "missing Wasm export: dynCall_viiiiiiffffff");
  assert(typeof wasmExports["dynCall_iiiiiffi"] != "undefined", "missing Wasm export: dynCall_iiiiiffi");
  assert(typeof wasmExports["dynCall_viiiiiiiifffii"] != "undefined", "missing Wasm export: dynCall_viiiiiiiifffii");
  assert(typeof wasmExports["dynCall_viiiiiiiiifff"] != "undefined", "missing Wasm export: dynCall_viiiiiiiiifff");
  assert(typeof wasmExports["dynCall_jiji"] != "undefined", "missing Wasm export: dynCall_jiji");
  assert(typeof wasmExports["dynCall_vffff"] != "undefined", "missing Wasm export: dynCall_vffff");
  assert(typeof wasmExports["dynCall_vf"] != "undefined", "missing Wasm export: dynCall_vf");
  assert(typeof wasmExports["dynCall_vff"] != "undefined", "missing Wasm export: dynCall_vff");
  assert(typeof wasmExports["dynCall_vfi"] != "undefined", "missing Wasm export: dynCall_vfi");
  assert(typeof wasmExports["dynCall_vfff"] != "undefined", "missing Wasm export: dynCall_vfff");
  assert(typeof wasmExports["dynCall_iidiiii"] != "undefined", "missing Wasm export: dynCall_iidiiii");
  assert(typeof wasmExports["dynCall_jiiii"] != "undefined", "missing Wasm export: dynCall_jiiii");
  assert(typeof wasmExports["dynCall_iiiiij"] != "undefined", "missing Wasm export: dynCall_iiiiij");
  assert(typeof wasmExports["dynCall_iiiiijj"] != "undefined", "missing Wasm export: dynCall_iiiiijj");
  assert(typeof wasmExports["dynCall_iiiiiijj"] != "undefined", "missing Wasm export: dynCall_iiiiiijj");
  assert(typeof wasmExports["asyncify_start_unwind"] != "undefined", "missing Wasm export: asyncify_start_unwind");
  assert(typeof wasmExports["asyncify_stop_unwind"] != "undefined", "missing Wasm export: asyncify_stop_unwind");
  assert(typeof wasmExports["asyncify_start_rewind"] != "undefined", "missing Wasm export: asyncify_start_rewind");
  assert(typeof wasmExports["asyncify_stop_rewind"] != "undefined", "missing Wasm export: asyncify_stop_rewind");
  assert(typeof wasmExports["__indirect_function_table"] != "undefined", "missing Wasm export: __indirect_function_table");
  _notifyPointerLockLost = Module["_notifyPointerLockLost"] = createExportWrapper("notifyPointerLockLost", 0);
  _main = Module["_main"] = createExportWrapper("__main_argc_argv", 2);
  _free = createExportWrapper("free", 1);
  _strerror = createExportWrapper("strerror", 1);
  _pthread_self = createExportWrapper("pthread_self", 0);
  _malloc = createExportWrapper("malloc", 1);
  _realloc = createExportWrapper("realloc", 2);
  _htons = createExportWrapper("htons", 1);
  ___cxa_get_exception_ptr = createExportWrapper("__cxa_get_exception_ptr", 1);
  _htonl = createExportWrapper("htonl", 1);
  _fflush = createExportWrapper("fflush", 1);
  _ntohs = createExportWrapper("ntohs", 1);
  _FMOD_JS_MixFunction = Module["_FMOD_JS_MixFunction"] = createExportWrapper("FMOD_JS_MixFunction", 1);
  _FMOD_JS_MixerSlowpathFunction = Module["_FMOD_JS_MixerSlowpathFunction"] = createExportWrapper("FMOD_JS_MixerSlowpathFunction", 0);
  _FMOD_JS_MixerFastpathFunction = Module["_FMOD_JS_MixerFastpathFunction"] = createExportWrapper("FMOD_JS_MixerFastpathFunction", 1);
  ___getTypeName = createExportWrapper("__getTypeName", 1);
  __embind_initialize_bindings = createExportWrapper("_embind_initialize_bindings", 0);
  __emscripten_tls_init = createExportWrapper("_emscripten_tls_init", 0);
  _emscripten_builtin_memalign = createExportWrapper("emscripten_builtin_memalign", 2);
  __emscripten_run_callback_on_thread = createExportWrapper("_emscripten_run_callback_on_thread", 6);
  __emscripten_thread_init = createExportWrapper("_emscripten_thread_init", 6);
  __emscripten_thread_crashed = createExportWrapper("_emscripten_thread_crashed", 0);
  _emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"];
  _emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"];
  __emscripten_run_js_on_main_thread_done = createExportWrapper("_emscripten_run_js_on_main_thread_done", 3);
  __emscripten_run_js_on_main_thread = createExportWrapper("_emscripten_run_js_on_main_thread", 5);
  __emscripten_thread_free_data = createExportWrapper("_emscripten_thread_free_data", 1);
  __emscripten_thread_exit = createExportWrapper("_emscripten_thread_exit", 1);
  __emscripten_check_mailbox = createExportWrapper("_emscripten_check_mailbox", 0);
  _setThrew = createExportWrapper("setThrew", 2);
  __emscripten_tempret_set = createExportWrapper("_emscripten_tempret_set", 1);
  _emscripten_stack_init = wasmExports["emscripten_stack_init"];
  _emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"];
  _emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"];
  __emscripten_stack_restore = wasmExports["_emscripten_stack_restore"];
  __emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"];
  _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"];
  ___cxa_decrement_exception_refcount = createExportWrapper("__cxa_decrement_exception_refcount", 1);
  ___cxa_increment_exception_refcount = createExportWrapper("__cxa_increment_exception_refcount", 1);
  ___get_exception_message = createExportWrapper("__get_exception_message", 3);
  ___cxa_can_catch = createExportWrapper("__cxa_can_catch", 3);
  dynCall_vi = dynCalls["vi"] = createExportWrapper("dynCall_vi", 2);
  dynCall_viiii = dynCalls["viiii"] = createExportWrapper("dynCall_viiii", 5);
  dynCall_ii = dynCalls["ii"] = createExportWrapper("dynCall_ii", 2);
  dynCall_iiiii = dynCalls["iiiii"] = createExportWrapper("dynCall_iiiii", 5);
  dynCall_v = dynCalls["v"] = createExportWrapper("dynCall_v", 1);
  dynCall_viii = dynCalls["viii"] = createExportWrapper("dynCall_viii", 4);
  dynCall_iii = dynCalls["iii"] = createExportWrapper("dynCall_iii", 3);
  dynCall_vii = dynCalls["vii"] = createExportWrapper("dynCall_vii", 3);
  dynCall_iiii = dynCalls["iiii"] = createExportWrapper("dynCall_iiii", 4);
  dynCall_iiiiiii = dynCalls["iiiiiii"] = createExportWrapper("dynCall_iiiiiii", 7);
  dynCall_i = dynCalls["i"] = createExportWrapper("dynCall_i", 1);
  dynCall_viiiiii = dynCalls["viiiiii"] = createExportWrapper("dynCall_viiiiii", 7);
  dynCall_d = dynCalls["d"] = createExportWrapper("dynCall_d", 1);
  dynCall_dii = dynCalls["dii"] = createExportWrapper("dynCall_dii", 3);
  dynCall_viiiii = dynCalls["viiiii"] = createExportWrapper("dynCall_viiiii", 6);
  dynCall_iiiiii = dynCalls["iiiiii"] = createExportWrapper("dynCall_iiiiii", 6);
  dynCall_iiddi = dynCalls["iiddi"] = createExportWrapper("dynCall_iiddi", 5);
  dynCall_viid = dynCalls["viid"] = createExportWrapper("dynCall_viid", 4);
  dynCall_viiiid = dynCalls["viiiid"] = createExportWrapper("dynCall_viiiid", 6);
  dynCall_vif = dynCalls["vif"] = createExportWrapper("dynCall_vif", 3);
  dynCall_di = dynCalls["di"] = createExportWrapper("dynCall_di", 2);
  dynCall_diffff = dynCalls["diffff"] = createExportWrapper("dynCall_diffff", 6);
  dynCall_viiiiiii = dynCalls["viiiiiii"] = createExportWrapper("dynCall_viiiiiii", 8);
  dynCall_iiiiiiii = dynCalls["iiiiiiii"] = createExportWrapper("dynCall_iiiiiiii", 8);
  dynCall_iiiiiiiii = dynCalls["iiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiii", 9);
  dynCall_fi = dynCalls["fi"] = createExportWrapper("dynCall_fi", 2);
  dynCall_j = dynCalls["j"] = createExportWrapper("dynCall_j", 1);
  dynCall_fii = dynCalls["fii"] = createExportWrapper("dynCall_fii", 3);
  dynCall_iidii = dynCalls["iidii"] = createExportWrapper("dynCall_iidii", 5);
  dynCall_iid = dynCalls["iid"] = createExportWrapper("dynCall_iid", 3);
  dynCall_viiid = dynCalls["viiid"] = createExportWrapper("dynCall_viiid", 5);
  dynCall_vid = dynCalls["vid"] = createExportWrapper("dynCall_vid", 3);
  dynCall_iidi = dynCalls["iidi"] = createExportWrapper("dynCall_iidi", 4);
  dynCall_iiid = dynCalls["iiid"] = createExportWrapper("dynCall_iiid", 4);
  dynCall_iififi = dynCalls["iififi"] = createExportWrapper("dynCall_iififi", 6);
  dynCall_viifi = dynCalls["viifi"] = createExportWrapper("dynCall_viifi", 5);
  dynCall_viiif = dynCalls["viiif"] = createExportWrapper("dynCall_viiif", 5);
  dynCall_iiiiifi = dynCalls["iiiiifi"] = createExportWrapper("dynCall_iiiiifi", 7);
  dynCall_iiiifii = dynCalls["iiiifii"] = createExportWrapper("dynCall_iiiifii", 7);
  dynCall_viiiiiiii = dynCalls["viiiiiiii"] = createExportWrapper("dynCall_viiiiiiii", 9);
  dynCall_viffff = dynCalls["viffff"] = createExportWrapper("dynCall_viffff", 6);
  dynCall_viiiifiiiiiiiii = dynCalls["viiiifiiiiiiiii"] = createExportWrapper("dynCall_viiiifiiiiiiiii", 15);
  dynCall_fif = dynCalls["fif"] = createExportWrapper("dynCall_fif", 3);
  dynCall_iifffffffff = dynCalls["iifffffffff"] = createExportWrapper("dynCall_iifffffffff", 11);
  dynCall_iif = dynCalls["iif"] = createExportWrapper("dynCall_iif", 3);
  dynCall_viiififf = dynCalls["viiififf"] = createExportWrapper("dynCall_viiififf", 8);
  dynCall_iiiiiiiiii = dynCalls["iiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiii", 10);
  dynCall_viif = dynCalls["viif"] = createExportWrapper("dynCall_viif", 4);
  dynCall_viiffff = dynCalls["viiffff"] = createExportWrapper("dynCall_viiffff", 7);
  dynCall_viiiffii = dynCalls["viiiffii"] = createExportWrapper("dynCall_viiiffii", 8);
  dynCall_viiiiiiiii = dynCalls["viiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiii", 10);
  dynCall_viiiiifii = dynCalls["viiiiifii"] = createExportWrapper("dynCall_viiiiifii", 9);
  dynCall_viiifi = dynCalls["viiifi"] = createExportWrapper("dynCall_viiifi", 6);
  dynCall_vifi = dynCalls["vifi"] = createExportWrapper("dynCall_vifi", 4);
  dynCall_f = dynCalls["f"] = createExportWrapper("dynCall_f", 1);
  dynCall_if = dynCalls["if"] = createExportWrapper("dynCall_if", 2);
  dynCall_vifff = dynCalls["vifff"] = createExportWrapper("dynCall_vifff", 5);
  dynCall_viifii = dynCalls["viifii"] = createExportWrapper("dynCall_viifii", 6);
  dynCall_viiiiiiiiii = dynCalls["viiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiii", 11);
  dynCall_iiiiiid = dynCalls["iiiiiid"] = createExportWrapper("dynCall_iiiiiid", 7);
  dynCall_iij = dynCalls["iij"] = createExportWrapper("dynCall_iij", 3);
  dynCall_viiiiiiiif = dynCalls["viiiiiiiif"] = createExportWrapper("dynCall_viiiiiiiif", 10);
  dynCall_viiiiiiiiiiiii = dynCalls["viiiiiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiiiiii", 14);
  dynCall_viiiiifi = dynCalls["viiiiifi"] = createExportWrapper("dynCall_viiiiifi", 8);
  dynCall_viiiiiiiiiiii = dynCalls["viiiiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiiiii", 13);
  dynCall_viiiiiiif = dynCalls["viiiiiiif"] = createExportWrapper("dynCall_viiiiiiif", 9);
  dynCall_viiiiiif = dynCalls["viiiiiif"] = createExportWrapper("dynCall_viiiiiif", 8);
  dynCall_viiiif = dynCalls["viiiif"] = createExportWrapper("dynCall_viiiif", 6);
  dynCall_viifff = dynCalls["viifff"] = createExportWrapper("dynCall_viifff", 6);
  dynCall_viiiiiifi = dynCalls["viiiiiifi"] = createExportWrapper("dynCall_viiiiiifi", 9);
  dynCall_viifiii = dynCalls["viifiii"] = createExportWrapper("dynCall_viifiii", 7);
  dynCall_iiif = dynCalls["iiif"] = createExportWrapper("dynCall_iiif", 4);
  dynCall_iiiiiif = dynCalls["iiiiiif"] = createExportWrapper("dynCall_iiiiiif", 7);
  dynCall_iiiff = dynCalls["iiiff"] = createExportWrapper("dynCall_iiiff", 5);
  dynCall_viiifii = dynCalls["viiifii"] = createExportWrapper("dynCall_viiifii", 7);
  dynCall_viiiifi = dynCalls["viiiifi"] = createExportWrapper("dynCall_viiiifi", 7);
  dynCall_iiiifi = dynCalls["iiiifi"] = createExportWrapper("dynCall_iiiifi", 6);
  dynCall_vidi = dynCalls["vidi"] = createExportWrapper("dynCall_vidi", 4);
  dynCall_iifii = dynCalls["iifii"] = createExportWrapper("dynCall_iifii", 5);
  dynCall_iiiifiiii = dynCalls["iiiifiiii"] = createExportWrapper("dynCall_iiiifiiii", 9);
  dynCall_viifiiii = dynCalls["viifiiii"] = createExportWrapper("dynCall_viifiiii", 8);
  dynCall_iiji = dynCalls["iiji"] = createExportWrapper("dynCall_iiji", 4);
  dynCall_fiiiiii = dynCalls["fiiiiii"] = createExportWrapper("dynCall_fiiiiii", 7);
  dynCall_fiii = dynCalls["fiii"] = createExportWrapper("dynCall_fiii", 4);
  dynCall_iiiif = dynCalls["iiiif"] = createExportWrapper("dynCall_iiiif", 5);
  dynCall_fiiiii = dynCalls["fiiiii"] = createExportWrapper("dynCall_fiiiii", 6);
  dynCall_dd = dynCalls["dd"] = createExportWrapper("dynCall_dd", 2);
  dynCall_vidd = dynCalls["vidd"] = createExportWrapper("dynCall_vidd", 4);
  dynCall_fifddi = dynCalls["fifddi"] = createExportWrapper("dynCall_fifddi", 6);
  dynCall_vij = dynCalls["vij"] = createExportWrapper("dynCall_vij", 3);
  dynCall_viij = dynCalls["viij"] = createExportWrapper("dynCall_viij", 4);
  dynCall_ji = dynCalls["ji"] = createExportWrapper("dynCall_ji", 2);
  dynCall_vdii = dynCalls["vdii"] = createExportWrapper("dynCall_vdii", 4);
  dynCall_vdiiii = dynCalls["vdiiii"] = createExportWrapper("dynCall_vdiiii", 6);
  dynCall_iiiiidi = dynCalls["iiiiidi"] = createExportWrapper("dynCall_iiiiidi", 7);
  dynCall_viifffi = dynCalls["viifffi"] = createExportWrapper("dynCall_viifffi", 7);
  dynCall_viff = dynCalls["viff"] = createExportWrapper("dynCall_viff", 4);
  dynCall_viidii = dynCalls["viidii"] = createExportWrapper("dynCall_viidii", 6);
  dynCall_viiidii = dynCalls["viiidii"] = createExportWrapper("dynCall_viiidii", 7);
  dynCall_viiifff = dynCalls["viiifff"] = createExportWrapper("dynCall_viiifff", 7);
  dynCall_viiff = dynCalls["viiff"] = createExportWrapper("dynCall_viiff", 5);
  dynCall_iiiiiiiiiii = dynCalls["iiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiii", 11);
  dynCall_iiiiiiiiiiii = dynCalls["iiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiii", 12);
  dynCall_vifffffffff = dynCalls["vifffffffff"] = createExportWrapper("dynCall_vifffffffff", 11);
  dynCall_iiiiiffff = dynCalls["iiiiiffff"] = createExportWrapper("dynCall_iiiiiffff", 9);
  dynCall_iifif = dynCalls["iifif"] = createExportWrapper("dynCall_iifif", 5);
  dynCall_iiff = dynCalls["iiff"] = createExportWrapper("dynCall_iiff", 4);
  dynCall_viiiiiiiiiii = dynCalls["viiiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiiii", 12);
  dynCall_iiiiiiiiiiiii = dynCalls["iiiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiiii", 13);
  dynCall_diid = dynCalls["diid"] = createExportWrapper("dynCall_diid", 4);
  dynCall_viiidi = dynCalls["viiidi"] = createExportWrapper("dynCall_viiidi", 6);
  dynCall_viiiidi = dynCalls["viiiidi"] = createExportWrapper("dynCall_viiiidi", 7);
  dynCall_iiiidi = dynCalls["iiiidi"] = createExportWrapper("dynCall_iiiidi", 6);
  dynCall_viiiddd = dynCalls["viiiddd"] = createExportWrapper("dynCall_viiiddd", 7);
  dynCall_viiidd = dynCalls["viiidd"] = createExportWrapper("dynCall_viiidd", 6);
  dynCall_fiifi = dynCalls["fiifi"] = createExportWrapper("dynCall_fiifi", 5);
  dynCall_ij = dynCalls["ij"] = createExportWrapper("dynCall_ij", 2);
  dynCall_diii = dynCalls["diii"] = createExportWrapper("dynCall_diii", 4);
  dynCall_viijii = dynCalls["viijii"] = createExportWrapper("dynCall_viijii", 6);
  dynCall_iiiid = dynCalls["iiiid"] = createExportWrapper("dynCall_iiiid", 5);
  dynCall_jii = dynCalls["jii"] = createExportWrapper("dynCall_jii", 3);
  dynCall_viiiiiiifffii = dynCalls["viiiiiiifffii"] = createExportWrapper("dynCall_viiiiiiifffii", 13);
  dynCall_viffffi = dynCalls["viffffi"] = createExportWrapper("dynCall_viffffi", 7);
  dynCall_iiiiiifii = dynCalls["iiiiiifii"] = createExportWrapper("dynCall_iiiiiifii", 9);
  dynCall_iiiiiiiiiiifiiiiii = dynCalls["iiiiiiiiiiifiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiifiiiiii", 18);
  dynCall_iiiiifii = dynCalls["iiiiifii"] = createExportWrapper("dynCall_iiiiifii", 8);
  dynCall_viiiiiiiiiiiiiii = dynCalls["viiiiiiiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiiiiiiii", 16);
  dynCall_iiiifiifii = dynCalls["iiiifiifii"] = createExportWrapper("dynCall_iiiifiifii", 10);
  dynCall_iiiiiiiiiifiiiiii = dynCalls["iiiiiiiiiifiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiifiiiiii", 17);
  dynCall_iiiifiifiii = dynCalls["iiiifiifiii"] = createExportWrapper("dynCall_iiiifiifiii", 11);
  dynCall_iiiifiif = dynCalls["iiiifiif"] = createExportWrapper("dynCall_iiiifiif", 8);
  dynCall_viiffi = dynCalls["viiffi"] = createExportWrapper("dynCall_viiffi", 6);
  dynCall_fiiiiiiii = dynCalls["fiiiiiiii"] = createExportWrapper("dynCall_fiiiiiiii", 9);
  dynCall_viiiiif = dynCalls["viiiiif"] = createExportWrapper("dynCall_viiiiif", 7);
  dynCall_viiiff = dynCalls["viiiff"] = createExportWrapper("dynCall_viiiff", 6);
  dynCall_iijjjj = dynCalls["iijjjj"] = createExportWrapper("dynCall_iijjjj", 6);
  dynCall_viiifiii = dynCalls["viiifiii"] = createExportWrapper("dynCall_viiifiii", 8);
  dynCall_ff = dynCalls["ff"] = createExportWrapper("dynCall_ff", 2);
  dynCall_viiifif = dynCalls["viiifif"] = createExportWrapper("dynCall_viiifif", 7);
  dynCall_iiiiiiiiiiiiiiii = dynCalls["iiiiiiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiiiiiii", 16);
  dynCall_iiiiiiiiiiiiii = dynCalls["iiiiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiiiii", 14);
  dynCall_iiiiiiiiiiiiiii = dynCalls["iiiiiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiiiiii", 15);
  dynCall_viiffii = dynCalls["viiffii"] = createExportWrapper("dynCall_viiffii", 7);
  dynCall_viifji = dynCalls["viifji"] = createExportWrapper("dynCall_viifji", 6);
  dynCall_iiiiiiif = dynCalls["iiiiiiif"] = createExportWrapper("dynCall_iiiiiiif", 8);
  dynCall_iiiiifiii = dynCalls["iiiiifiii"] = createExportWrapper("dynCall_iiiiifiii", 9);
  dynCall_iiiiiifi = dynCalls["iiiiiifi"] = createExportWrapper("dynCall_iiiiiifi", 8);
  dynCall_iiiiiiiiifi = dynCalls["iiiiiiiiifi"] = createExportWrapper("dynCall_iiiiiiiiifi", 11);
  dynCall_iiiiffi = dynCalls["iiiiffi"] = createExportWrapper("dynCall_iiiiffi", 7);
  dynCall_iiiiif = dynCalls["iiiiif"] = createExportWrapper("dynCall_iiiiif", 6);
  dynCall_iiiiiiifii = dynCalls["iiiiiiifii"] = createExportWrapper("dynCall_iiiiiiifii", 10);
  dynCall_fiiii = dynCalls["fiiii"] = createExportWrapper("dynCall_fiiii", 5);
  dynCall_iiiiff = dynCalls["iiiiff"] = createExportWrapper("dynCall_iiiiff", 6);
  dynCall_iiiiiifff = dynCalls["iiiiiifff"] = createExportWrapper("dynCall_iiiiiifff", 9);
  dynCall_iiiiiiff = dynCalls["iiiiiiff"] = createExportWrapper("dynCall_iiiiiiff", 8);
  dynCall_viiiij = dynCalls["viiiij"] = createExportWrapper("dynCall_viiiij", 6);
  dynCall_viiiiiff = dynCalls["viiiiiff"] = createExportWrapper("dynCall_viiiiiff", 8);
  dynCall_did = dynCalls["did"] = createExportWrapper("dynCall_did", 3);
  dynCall_iiiiiiiiiiji = dynCalls["iiiiiiiiiiji"] = createExportWrapper("dynCall_iiiiiiiiiiji", 12);
  dynCall_iiiiiiij = dynCalls["iiiiiiij"] = createExportWrapper("dynCall_iiiiiiij", 8);
  dynCall_viiiiiji = dynCalls["viiiiiji"] = createExportWrapper("dynCall_viiiiiji", 8);
  dynCall_vifii = dynCalls["vifii"] = createExportWrapper("dynCall_vifii", 5);
  dynCall_iijii = dynCalls["iijii"] = createExportWrapper("dynCall_iijii", 5);
  dynCall_vijjidddii = dynCalls["vijjidddii"] = createExportWrapper("dynCall_vijjidddii", 10);
  dynCall_iiijii = dynCalls["iiijii"] = createExportWrapper("dynCall_iiijii", 6);
  dynCall_viji = dynCalls["viji"] = createExportWrapper("dynCall_viji", 4);
  dynCall_iiiijii = dynCalls["iiiijii"] = createExportWrapper("dynCall_iiiijii", 7);
  dynCall_viiij = dynCalls["viiij"] = createExportWrapper("dynCall_viiij", 5);
  dynCall_iiij = dynCalls["iiij"] = createExportWrapper("dynCall_iiij", 4);
  dynCall_vijj = dynCalls["vijj"] = createExportWrapper("dynCall_vijj", 4);
  dynCall_iiijiiiiii = dynCalls["iiijiiiiii"] = createExportWrapper("dynCall_iiijiiiiii", 10);
  dynCall_vidii = dynCalls["vidii"] = createExportWrapper("dynCall_vidii", 5);
  dynCall_viiiidfi = dynCalls["viiiidfi"] = createExportWrapper("dynCall_viiiidfi", 8);
  dynCall_viiiiid = dynCalls["viiiiid"] = createExportWrapper("dynCall_viiiiid", 7);
  dynCall_iiiiid = dynCalls["iiiiid"] = createExportWrapper("dynCall_iiiiid", 6);
  dynCall_iiiiiiiiij = dynCalls["iiiiiiiiij"] = createExportWrapper("dynCall_iiiiiiiiij", 10);
  dynCall_iiffffffffffffffff = dynCalls["iiffffffffffffffff"] = createExportWrapper("dynCall_iiffffffffffffffff", 18);
  dynCall_fiff = dynCalls["fiff"] = createExportWrapper("dynCall_fiff", 4);
  dynCall_vifiii = dynCalls["vifiii"] = createExportWrapper("dynCall_vifiii", 6);
  dynCall_fiiff = dynCalls["fiiff"] = createExportWrapper("dynCall_fiiff", 5);
  dynCall_viiiffi = dynCalls["viiiffi"] = createExportWrapper("dynCall_viiiffi", 7);
  dynCall_viiiiifiiiiiiiii = dynCalls["viiiiifiiiiiiiii"] = createExportWrapper("dynCall_viiiiifiiiiiiiii", 16);
  dynCall_viiiifii = dynCalls["viiiifii"] = createExportWrapper("dynCall_viiiifii", 8);
  dynCall_viiffiii = dynCalls["viiffiii"] = createExportWrapper("dynCall_viiffiii", 8);
  dynCall_viffii = dynCalls["viffii"] = createExportWrapper("dynCall_viffii", 6);
  dynCall_iifi = dynCalls["iifi"] = createExportWrapper("dynCall_iifi", 4);
  dynCall_iiijiii = dynCalls["iiijiii"] = createExportWrapper("dynCall_iiijiii", 7);
  dynCall_viiiiiiiifii = dynCalls["viiiiiiiifii"] = createExportWrapper("dynCall_viiiiiiiifii", 12);
  dynCall_viifiif = dynCalls["viifiif"] = createExportWrapper("dynCall_viifiif", 7);
  dynCall_viiiiifiiiiiiii = dynCalls["viiiiifiiiiiiii"] = createExportWrapper("dynCall_viiiiifiiiiiiii", 15);
  dynCall_iiiifiiiii = dynCalls["iiiifiiiii"] = createExportWrapper("dynCall_iiiifiiiii", 10);
  dynCall_viiiifiifiiifffii = dynCalls["viiiifiifiiifffii"] = createExportWrapper("dynCall_viiiifiifiiifffii", 17);
  dynCall_viiiiifiiiiiii = dynCalls["viiiiifiiiiiii"] = createExportWrapper("dynCall_viiiiifiiiiiii", 14);
  dynCall_iiiiiff = dynCalls["iiiiiff"] = createExportWrapper("dynCall_iiiiiff", 7);
  dynCall_fiifii = dynCalls["fiifii"] = createExportWrapper("dynCall_fiifii", 6);
  dynCall_viiiiiffi = dynCalls["viiiiiffi"] = createExportWrapper("dynCall_viiiiiffi", 9);
  dynCall_viiiiffi = dynCalls["viiiiffi"] = createExportWrapper("dynCall_viiiiffi", 8);
  dynCall_fiiiiff = dynCalls["fiiiiff"] = createExportWrapper("dynCall_fiiiiff", 7);
  dynCall_ifi = dynCalls["ifi"] = createExportWrapper("dynCall_ifi", 3);
  dynCall_iiiiiiiiiif = dynCalls["iiiiiiiiiif"] = createExportWrapper("dynCall_iiiiiiiiiif", 11);
  dynCall_iiifii = dynCalls["iiifii"] = createExportWrapper("dynCall_iiifii", 6);
  dynCall_iiiiiiifi = dynCalls["iiiiiiifi"] = createExportWrapper("dynCall_iiiiiiifi", 9);
  dynCall_iiifi = dynCalls["iiifi"] = createExportWrapper("dynCall_iiifi", 5);
  dynCall_iifff = dynCalls["iifff"] = createExportWrapper("dynCall_iifff", 5);
  dynCall_iiffffffff = dynCalls["iiffffffff"] = createExportWrapper("dynCall_iiffffffff", 10);
  dynCall_iijji = dynCalls["iijji"] = createExportWrapper("dynCall_iijji", 5);
  dynCall_iijf = dynCalls["iijf"] = createExportWrapper("dynCall_iijf", 4);
  dynCall_iijj = dynCalls["iijj"] = createExportWrapper("dynCall_iijj", 4);
  dynCall_iiffi = dynCalls["iiffi"] = createExportWrapper("dynCall_iiffi", 5);
  dynCall_iiiffi = dynCalls["iiiffi"] = createExportWrapper("dynCall_iiiffi", 6);
  dynCall_iiifffii = dynCalls["iiifffii"] = createExportWrapper("dynCall_iiifffii", 8);
  dynCall_iiiifffffiii = dynCalls["iiiifffffiii"] = createExportWrapper("dynCall_iiiifffffiii", 12);
  dynCall_iiiffffii = dynCalls["iiiffffii"] = createExportWrapper("dynCall_iiiffffii", 9);
  dynCall_iiifffffii = dynCalls["iiifffffii"] = createExportWrapper("dynCall_iiifffffii", 10);
  dynCall_iiifffi = dynCalls["iiifffi"] = createExportWrapper("dynCall_iiifffi", 7);
  dynCall_viiiiiiffffff = dynCalls["viiiiiiffffff"] = createExportWrapper("dynCall_viiiiiiffffff", 13);
  dynCall_iiiiiffi = dynCalls["iiiiiffi"] = createExportWrapper("dynCall_iiiiiffi", 8);
  dynCall_viiiiiiiifffii = dynCalls["viiiiiiiifffii"] = createExportWrapper("dynCall_viiiiiiiifffii", 14);
  dynCall_viiiiiiiiifff = dynCalls["viiiiiiiiifff"] = createExportWrapper("dynCall_viiiiiiiiifff", 13);
  dynCall_jiji = dynCalls["jiji"] = createExportWrapper("dynCall_jiji", 4);
  dynCall_vffff = dynCalls["vffff"] = createExportWrapper("dynCall_vffff", 5);
  dynCall_vf = dynCalls["vf"] = createExportWrapper("dynCall_vf", 2);
  dynCall_vff = dynCalls["vff"] = createExportWrapper("dynCall_vff", 3);
  dynCall_vfi = dynCalls["vfi"] = createExportWrapper("dynCall_vfi", 3);
  dynCall_vfff = dynCalls["vfff"] = createExportWrapper("dynCall_vfff", 4);
  dynCall_iidiiii = dynCalls["iidiiii"] = createExportWrapper("dynCall_iidiiii", 7);
  dynCall_jiiii = dynCalls["jiiii"] = createExportWrapper("dynCall_jiiii", 5);
  dynCall_iiiiij = dynCalls["iiiiij"] = createExportWrapper("dynCall_iiiiij", 6);
  dynCall_iiiiijj = dynCalls["iiiiijj"] = createExportWrapper("dynCall_iiiiijj", 7);
  dynCall_iiiiiijj = dynCalls["iiiiiijj"] = createExportWrapper("dynCall_iiiiiijj", 8);
  _asyncify_start_unwind = createExportWrapper("asyncify_start_unwind", 1);
  _asyncify_stop_unwind = createExportWrapper("asyncify_stop_unwind", 0);
  _asyncify_start_rewind = createExportWrapper("asyncify_start_rewind", 1);
  _asyncify_stop_rewind = createExportWrapper("asyncify_stop_rewind", 0);
  __indirect_function_table = wasmTable = wasmExports["__indirect_function_table"];
}

var wasmImports;

function assignWasmImports() {
  wasmImports = {
    /** @export */ __assert_fail: ___assert_fail,
    /** @export */ __call_sighandler: ___call_sighandler,
    /** @export */ __cxa_begin_catch: ___cxa_begin_catch,
    /** @export */ __cxa_end_catch: ___cxa_end_catch,
    /** @export */ __cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
    /** @export */ __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
    /** @export */ __cxa_find_matching_catch_4: ___cxa_find_matching_catch_4,
    /** @export */ __cxa_find_matching_catch_5: ___cxa_find_matching_catch_5,
    /** @export */ __cxa_find_matching_catch_6: ___cxa_find_matching_catch_6,
    /** @export */ __cxa_rethrow: ___cxa_rethrow,
    /** @export */ __cxa_rethrow_primary_exception: ___cxa_rethrow_primary_exception,
    /** @export */ __cxa_throw: ___cxa_throw,
    /** @export */ __cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
    /** @export */ __pthread_create_js: ___pthread_create_js,
    /** @export */ __resumeException: ___resumeException,
    /** @export */ __syscall_bind: ___syscall_bind,
    /** @export */ __syscall_dup3: ___syscall_dup3,
    /** @export */ __syscall_fcntl64: ___syscall_fcntl64,
    /** @export */ __syscall_fstat64: ___syscall_fstat64,
    /** @export */ __syscall_getcwd: ___syscall_getcwd,
    /** @export */ __syscall_getdents64: ___syscall_getdents64,
    /** @export */ __syscall_getsockname: ___syscall_getsockname,
    /** @export */ __syscall_getsockopt: ___syscall_getsockopt,
    /** @export */ __syscall_ioctl: ___syscall_ioctl,
    /** @export */ __syscall_lstat64: ___syscall_lstat64,
    /** @export */ __syscall_mkdirat: ___syscall_mkdirat,
    /** @export */ __syscall_newfstatat: ___syscall_newfstatat,
    /** @export */ __syscall_openat: ___syscall_openat,
    /** @export */ __syscall_recvfrom: ___syscall_recvfrom,
    /** @export */ __syscall_rmdir: ___syscall_rmdir,
    /** @export */ __syscall_sendto: ___syscall_sendto,
    /** @export */ __syscall_socket: ___syscall_socket,
    /** @export */ __syscall_stat64: ___syscall_stat64,
    /** @export */ __syscall_unlinkat: ___syscall_unlinkat,
    /** @export */ _abort_js: __abort_js,
    /** @export */ _embind_register_bigint: __embind_register_bigint,
    /** @export */ _embind_register_bool: __embind_register_bool,
    /** @export */ _embind_register_emval: __embind_register_emval,
    /** @export */ _embind_register_float: __embind_register_float,
    /** @export */ _embind_register_integer: __embind_register_integer,
    /** @export */ _embind_register_memory_view: __embind_register_memory_view,
    /** @export */ _embind_register_std_string: __embind_register_std_string,
    /** @export */ _embind_register_std_wstring: __embind_register_std_wstring,
    /** @export */ _embind_register_void: __embind_register_void,
    /** @export */ _emscripten_init_main_thread_js: __emscripten_init_main_thread_js,
    /** @export */ _emscripten_lookup_name: __emscripten_lookup_name,
    /** @export */ _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
    /** @export */ _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
    /** @export */ _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
    /** @export */ _emscripten_thread_cleanup: __emscripten_thread_cleanup,
    /** @export */ _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
    /** @export */ _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
    /** @export */ _emscripten_throw_longjmp: __emscripten_throw_longjmp,
    /** @export */ _emval_create_invoker: __emval_create_invoker,
    /** @export */ _emval_decref: __emval_decref,
    /** @export */ _emval_get_global: __emval_get_global,
    /** @export */ _emval_get_property: __emval_get_property,
    /** @export */ _emval_incref: __emval_incref,
    /** @export */ _emval_invoke: __emval_invoke,
    /** @export */ _emval_new_cstring: __emval_new_cstring,
    /** @export */ _emval_run_destructors: __emval_run_destructors,
    /** @export */ _gmtime_js: __gmtime_js,
    /** @export */ _localtime_js: __localtime_js,
    /** @export */ _mktime_js: __mktime_js,
    /** @export */ _mmap_js: __mmap_js,
    /** @export */ _munmap_js: __munmap_js,
    /** @export */ _tzset_js: __tzset_js,
    /** @export */ clock_time_get: _clock_time_get,
    /** @export */ eglBindAPI: _eglBindAPI,
    /** @export */ eglChooseConfig: _eglChooseConfig,
    /** @export */ eglCreateContext: _eglCreateContext,
    /** @export */ eglCreateWindowSurface: _eglCreateWindowSurface,
    /** @export */ eglDestroyContext: _eglDestroyContext,
    /** @export */ eglDestroySurface: _eglDestroySurface,
    /** @export */ eglGetConfigAttrib: _eglGetConfigAttrib,
    /** @export */ eglGetDisplay: _eglGetDisplay,
    /** @export */ eglGetError: _eglGetError,
    /** @export */ eglInitialize: _eglInitialize,
    /** @export */ eglMakeCurrent: _eglMakeCurrent,
    /** @export */ eglQueryString: _eglQueryString,
    /** @export */ eglSwapBuffers: _eglSwapBuffers,
    /** @export */ eglSwapInterval: _eglSwapInterval,
    /** @export */ eglTerminate: _eglTerminate,
    /** @export */ eglWaitGL: _eglWaitGL,
    /** @export */ eglWaitNative: _eglWaitNative,
    /** @export */ emscripten_asm_const_int: _emscripten_asm_const_int,
    /** @export */ emscripten_asm_const_int_sync_on_main_thread: _emscripten_asm_const_int_sync_on_main_thread,
    /** @export */ emscripten_asm_const_ptr_sync_on_main_thread: _emscripten_asm_const_ptr_sync_on_main_thread,
    /** @export */ emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
    /** @export */ emscripten_date_now: _emscripten_date_now,
    /** @export */ emscripten_err: _emscripten_err,
    /** @export */ emscripten_exit_fullscreen: _emscripten_exit_fullscreen,
    /** @export */ emscripten_exit_pointerlock: _emscripten_exit_pointerlock,
    /** @export */ emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
    /** @export */ emscripten_fetch_free: _emscripten_fetch_free,
    /** @export */ emscripten_get_device_pixel_ratio: _emscripten_get_device_pixel_ratio,
    /** @export */ emscripten_get_element_css_size: _emscripten_get_element_css_size,
    /** @export */ emscripten_get_gamepad_status: _emscripten_get_gamepad_status,
    /** @export */ emscripten_get_now: _emscripten_get_now,
    /** @export */ emscripten_get_num_gamepads: _emscripten_get_num_gamepads,
    /** @export */ emscripten_get_screen_size: _emscripten_get_screen_size,
    /** @export */ emscripten_glActiveTexture: _emscripten_glActiveTexture,
    /** @export */ emscripten_glAttachShader: _emscripten_glAttachShader,
    /** @export */ emscripten_glBeginQuery: _emscripten_glBeginQuery,
    /** @export */ emscripten_glBeginQueryEXT: _emscripten_glBeginQueryEXT,
    /** @export */ emscripten_glBeginTransformFeedback: _emscripten_glBeginTransformFeedback,
    /** @export */ emscripten_glBindAttribLocation: _emscripten_glBindAttribLocation,
    /** @export */ emscripten_glBindBuffer: _emscripten_glBindBuffer,
    /** @export */ emscripten_glBindBufferBase: _emscripten_glBindBufferBase,
    /** @export */ emscripten_glBindBufferRange: _emscripten_glBindBufferRange,
    /** @export */ emscripten_glBindFramebuffer: _emscripten_glBindFramebuffer,
    /** @export */ emscripten_glBindRenderbuffer: _emscripten_glBindRenderbuffer,
    /** @export */ emscripten_glBindSampler: _emscripten_glBindSampler,
    /** @export */ emscripten_glBindTexture: _emscripten_glBindTexture,
    /** @export */ emscripten_glBindTransformFeedback: _emscripten_glBindTransformFeedback,
    /** @export */ emscripten_glBindVertexArray: _emscripten_glBindVertexArray,
    /** @export */ emscripten_glBindVertexArrayOES: _emscripten_glBindVertexArrayOES,
    /** @export */ emscripten_glBlendColor: _emscripten_glBlendColor,
    /** @export */ emscripten_glBlendEquation: _emscripten_glBlendEquation,
    /** @export */ emscripten_glBlendEquationSeparate: _emscripten_glBlendEquationSeparate,
    /** @export */ emscripten_glBlendFunc: _emscripten_glBlendFunc,
    /** @export */ emscripten_glBlendFuncSeparate: _emscripten_glBlendFuncSeparate,
    /** @export */ emscripten_glBlitFramebuffer: _emscripten_glBlitFramebuffer,
    /** @export */ emscripten_glBufferData: _emscripten_glBufferData,
    /** @export */ emscripten_glBufferSubData: _emscripten_glBufferSubData,
    /** @export */ emscripten_glCheckFramebufferStatus: _emscripten_glCheckFramebufferStatus,
    /** @export */ emscripten_glClear: _emscripten_glClear,
    /** @export */ emscripten_glClearBufferfi: _emscripten_glClearBufferfi,
    /** @export */ emscripten_glClearBufferfv: _emscripten_glClearBufferfv,
    /** @export */ emscripten_glClearBufferiv: _emscripten_glClearBufferiv,
    /** @export */ emscripten_glClearBufferuiv: _emscripten_glClearBufferuiv,
    /** @export */ emscripten_glClearColor: _emscripten_glClearColor,
    /** @export */ emscripten_glClearDepthf: _emscripten_glClearDepthf,
    /** @export */ emscripten_glClearStencil: _emscripten_glClearStencil,
    /** @export */ emscripten_glClientWaitSync: _emscripten_glClientWaitSync,
    /** @export */ emscripten_glClipControlEXT: _emscripten_glClipControlEXT,
    /** @export */ emscripten_glColorMask: _emscripten_glColorMask,
    /** @export */ emscripten_glCompileShader: _emscripten_glCompileShader,
    /** @export */ emscripten_glCompressedTexImage2D: _emscripten_glCompressedTexImage2D,
    /** @export */ emscripten_glCompressedTexImage3D: _emscripten_glCompressedTexImage3D,
    /** @export */ emscripten_glCompressedTexSubImage2D: _emscripten_glCompressedTexSubImage2D,
    /** @export */ emscripten_glCompressedTexSubImage3D: _emscripten_glCompressedTexSubImage3D,
    /** @export */ emscripten_glCopyBufferSubData: _emscripten_glCopyBufferSubData,
    /** @export */ emscripten_glCopyTexImage2D: _emscripten_glCopyTexImage2D,
    /** @export */ emscripten_glCopyTexSubImage2D: _emscripten_glCopyTexSubImage2D,
    /** @export */ emscripten_glCopyTexSubImage3D: _emscripten_glCopyTexSubImage3D,
    /** @export */ emscripten_glCreateProgram: _emscripten_glCreateProgram,
    /** @export */ emscripten_glCreateShader: _emscripten_glCreateShader,
    /** @export */ emscripten_glCullFace: _emscripten_glCullFace,
    /** @export */ emscripten_glDeleteBuffers: _emscripten_glDeleteBuffers,
    /** @export */ emscripten_glDeleteFramebuffers: _emscripten_glDeleteFramebuffers,
    /** @export */ emscripten_glDeleteProgram: _emscripten_glDeleteProgram,
    /** @export */ emscripten_glDeleteQueries: _emscripten_glDeleteQueries,
    /** @export */ emscripten_glDeleteQueriesEXT: _emscripten_glDeleteQueriesEXT,
    /** @export */ emscripten_glDeleteRenderbuffers: _emscripten_glDeleteRenderbuffers,
    /** @export */ emscripten_glDeleteSamplers: _emscripten_glDeleteSamplers,
    /** @export */ emscripten_glDeleteShader: _emscripten_glDeleteShader,
    /** @export */ emscripten_glDeleteSync: _emscripten_glDeleteSync,
    /** @export */ emscripten_glDeleteTextures: _emscripten_glDeleteTextures,
    /** @export */ emscripten_glDeleteTransformFeedbacks: _emscripten_glDeleteTransformFeedbacks,
    /** @export */ emscripten_glDeleteVertexArrays: _emscripten_glDeleteVertexArrays,
    /** @export */ emscripten_glDeleteVertexArraysOES: _emscripten_glDeleteVertexArraysOES,
    /** @export */ emscripten_glDepthFunc: _emscripten_glDepthFunc,
    /** @export */ emscripten_glDepthMask: _emscripten_glDepthMask,
    /** @export */ emscripten_glDepthRangef: _emscripten_glDepthRangef,
    /** @export */ emscripten_glDetachShader: _emscripten_glDetachShader,
    /** @export */ emscripten_glDisable: _emscripten_glDisable,
    /** @export */ emscripten_glDisableVertexAttribArray: _emscripten_glDisableVertexAttribArray,
    /** @export */ emscripten_glDrawArrays: _emscripten_glDrawArrays,
    /** @export */ emscripten_glDrawArraysInstanced: _emscripten_glDrawArraysInstanced,
    /** @export */ emscripten_glDrawArraysInstancedANGLE: _emscripten_glDrawArraysInstancedANGLE,
    /** @export */ emscripten_glDrawArraysInstancedARB: _emscripten_glDrawArraysInstancedARB,
    /** @export */ emscripten_glDrawArraysInstancedEXT: _emscripten_glDrawArraysInstancedEXT,
    /** @export */ emscripten_glDrawArraysInstancedNV: _emscripten_glDrawArraysInstancedNV,
    /** @export */ emscripten_glDrawBuffers: _emscripten_glDrawBuffers,
    /** @export */ emscripten_glDrawBuffersEXT: _emscripten_glDrawBuffersEXT,
    /** @export */ emscripten_glDrawBuffersWEBGL: _emscripten_glDrawBuffersWEBGL,
    /** @export */ emscripten_glDrawElements: _emscripten_glDrawElements,
    /** @export */ emscripten_glDrawElementsInstanced: _emscripten_glDrawElementsInstanced,
    /** @export */ emscripten_glDrawElementsInstancedANGLE: _emscripten_glDrawElementsInstancedANGLE,
    /** @export */ emscripten_glDrawElementsInstancedARB: _emscripten_glDrawElementsInstancedARB,
    /** @export */ emscripten_glDrawElementsInstancedEXT: _emscripten_glDrawElementsInstancedEXT,
    /** @export */ emscripten_glDrawElementsInstancedNV: _emscripten_glDrawElementsInstancedNV,
    /** @export */ emscripten_glDrawRangeElements: _emscripten_glDrawRangeElements,
    /** @export */ emscripten_glEnable: _emscripten_glEnable,
    /** @export */ emscripten_glEnableVertexAttribArray: _emscripten_glEnableVertexAttribArray,
    /** @export */ emscripten_glEndQuery: _emscripten_glEndQuery,
    /** @export */ emscripten_glEndQueryEXT: _emscripten_glEndQueryEXT,
    /** @export */ emscripten_glEndTransformFeedback: _emscripten_glEndTransformFeedback,
    /** @export */ emscripten_glFenceSync: _emscripten_glFenceSync,
    /** @export */ emscripten_glFinish: _emscripten_glFinish,
    /** @export */ emscripten_glFlush: _emscripten_glFlush,
    /** @export */ emscripten_glFlushMappedBufferRange: _emscripten_glFlushMappedBufferRange,
    /** @export */ emscripten_glFramebufferRenderbuffer: _emscripten_glFramebufferRenderbuffer,
    /** @export */ emscripten_glFramebufferTexture2D: _emscripten_glFramebufferTexture2D,
    /** @export */ emscripten_glFramebufferTextureLayer: _emscripten_glFramebufferTextureLayer,
    /** @export */ emscripten_glFrontFace: _emscripten_glFrontFace,
    /** @export */ emscripten_glGenBuffers: _emscripten_glGenBuffers,
    /** @export */ emscripten_glGenFramebuffers: _emscripten_glGenFramebuffers,
    /** @export */ emscripten_glGenQueries: _emscripten_glGenQueries,
    /** @export */ emscripten_glGenQueriesEXT: _emscripten_glGenQueriesEXT,
    /** @export */ emscripten_glGenRenderbuffers: _emscripten_glGenRenderbuffers,
    /** @export */ emscripten_glGenSamplers: _emscripten_glGenSamplers,
    /** @export */ emscripten_glGenTextures: _emscripten_glGenTextures,
    /** @export */ emscripten_glGenTransformFeedbacks: _emscripten_glGenTransformFeedbacks,
    /** @export */ emscripten_glGenVertexArrays: _emscripten_glGenVertexArrays,
    /** @export */ emscripten_glGenVertexArraysOES: _emscripten_glGenVertexArraysOES,
    /** @export */ emscripten_glGenerateMipmap: _emscripten_glGenerateMipmap,
    /** @export */ emscripten_glGetActiveAttrib: _emscripten_glGetActiveAttrib,
    /** @export */ emscripten_glGetActiveUniform: _emscripten_glGetActiveUniform,
    /** @export */ emscripten_glGetActiveUniformBlockName: _emscripten_glGetActiveUniformBlockName,
    /** @export */ emscripten_glGetActiveUniformBlockiv: _emscripten_glGetActiveUniformBlockiv,
    /** @export */ emscripten_glGetActiveUniformsiv: _emscripten_glGetActiveUniformsiv,
    /** @export */ emscripten_glGetAttachedShaders: _emscripten_glGetAttachedShaders,
    /** @export */ emscripten_glGetAttribLocation: _emscripten_glGetAttribLocation,
    /** @export */ emscripten_glGetBooleanv: _emscripten_glGetBooleanv,
    /** @export */ emscripten_glGetBufferParameteri64v: _emscripten_glGetBufferParameteri64v,
    /** @export */ emscripten_glGetBufferParameteriv: _emscripten_glGetBufferParameteriv,
    /** @export */ emscripten_glGetBufferPointerv: _emscripten_glGetBufferPointerv,
    /** @export */ emscripten_glGetError: _emscripten_glGetError,
    /** @export */ emscripten_glGetFloatv: _emscripten_glGetFloatv,
    /** @export */ emscripten_glGetFragDataLocation: _emscripten_glGetFragDataLocation,
    /** @export */ emscripten_glGetFramebufferAttachmentParameteriv: _emscripten_glGetFramebufferAttachmentParameteriv,
    /** @export */ emscripten_glGetInteger64i_v: _emscripten_glGetInteger64i_v,
    /** @export */ emscripten_glGetInteger64v: _emscripten_glGetInteger64v,
    /** @export */ emscripten_glGetIntegeri_v: _emscripten_glGetIntegeri_v,
    /** @export */ emscripten_glGetIntegerv: _emscripten_glGetIntegerv,
    /** @export */ emscripten_glGetInternalformativ: _emscripten_glGetInternalformativ,
    /** @export */ emscripten_glGetProgramBinary: _emscripten_glGetProgramBinary,
    /** @export */ emscripten_glGetProgramInfoLog: _emscripten_glGetProgramInfoLog,
    /** @export */ emscripten_glGetProgramiv: _emscripten_glGetProgramiv,
    /** @export */ emscripten_glGetQueryObjecti64vEXT: _emscripten_glGetQueryObjecti64vEXT,
    /** @export */ emscripten_glGetQueryObjectivEXT: _emscripten_glGetQueryObjectivEXT,
    /** @export */ emscripten_glGetQueryObjectui64vEXT: _emscripten_glGetQueryObjectui64vEXT,
    /** @export */ emscripten_glGetQueryObjectuiv: _emscripten_glGetQueryObjectuiv,
    /** @export */ emscripten_glGetQueryObjectuivEXT: _emscripten_glGetQueryObjectuivEXT,
    /** @export */ emscripten_glGetQueryiv: _emscripten_glGetQueryiv,
    /** @export */ emscripten_glGetQueryivEXT: _emscripten_glGetQueryivEXT,
    /** @export */ emscripten_glGetRenderbufferParameteriv: _emscripten_glGetRenderbufferParameteriv,
    /** @export */ emscripten_glGetSamplerParameterfv: _emscripten_glGetSamplerParameterfv,
    /** @export */ emscripten_glGetSamplerParameteriv: _emscripten_glGetSamplerParameteriv,
    /** @export */ emscripten_glGetShaderInfoLog: _emscripten_glGetShaderInfoLog,
    /** @export */ emscripten_glGetShaderPrecisionFormat: _emscripten_glGetShaderPrecisionFormat,
    /** @export */ emscripten_glGetShaderSource: _emscripten_glGetShaderSource,
    /** @export */ emscripten_glGetShaderiv: _emscripten_glGetShaderiv,
    /** @export */ emscripten_glGetString: _emscripten_glGetString,
    /** @export */ emscripten_glGetStringi: _emscripten_glGetStringi,
    /** @export */ emscripten_glGetSynciv: _emscripten_glGetSynciv,
    /** @export */ emscripten_glGetTexParameterfv: _emscripten_glGetTexParameterfv,
    /** @export */ emscripten_glGetTexParameteriv: _emscripten_glGetTexParameteriv,
    /** @export */ emscripten_glGetTransformFeedbackVarying: _emscripten_glGetTransformFeedbackVarying,
    /** @export */ emscripten_glGetUniformBlockIndex: _emscripten_glGetUniformBlockIndex,
    /** @export */ emscripten_glGetUniformIndices: _emscripten_glGetUniformIndices,
    /** @export */ emscripten_glGetUniformLocation: _emscripten_glGetUniformLocation,
    /** @export */ emscripten_glGetUniformfv: _emscripten_glGetUniformfv,
    /** @export */ emscripten_glGetUniformiv: _emscripten_glGetUniformiv,
    /** @export */ emscripten_glGetUniformuiv: _emscripten_glGetUniformuiv,
    /** @export */ emscripten_glGetVertexAttribIiv: _emscripten_glGetVertexAttribIiv,
    /** @export */ emscripten_glGetVertexAttribIuiv: _emscripten_glGetVertexAttribIuiv,
    /** @export */ emscripten_glGetVertexAttribPointerv: _emscripten_glGetVertexAttribPointerv,
    /** @export */ emscripten_glGetVertexAttribfv: _emscripten_glGetVertexAttribfv,
    /** @export */ emscripten_glGetVertexAttribiv: _emscripten_glGetVertexAttribiv,
    /** @export */ emscripten_glHint: _emscripten_glHint,
    /** @export */ emscripten_glInvalidateFramebuffer: _emscripten_glInvalidateFramebuffer,
    /** @export */ emscripten_glInvalidateSubFramebuffer: _emscripten_glInvalidateSubFramebuffer,
    /** @export */ emscripten_glIsBuffer: _emscripten_glIsBuffer,
    /** @export */ emscripten_glIsEnabled: _emscripten_glIsEnabled,
    /** @export */ emscripten_glIsFramebuffer: _emscripten_glIsFramebuffer,
    /** @export */ emscripten_glIsProgram: _emscripten_glIsProgram,
    /** @export */ emscripten_glIsQuery: _emscripten_glIsQuery,
    /** @export */ emscripten_glIsQueryEXT: _emscripten_glIsQueryEXT,
    /** @export */ emscripten_glIsRenderbuffer: _emscripten_glIsRenderbuffer,
    /** @export */ emscripten_glIsSampler: _emscripten_glIsSampler,
    /** @export */ emscripten_glIsShader: _emscripten_glIsShader,
    /** @export */ emscripten_glIsSync: _emscripten_glIsSync,
    /** @export */ emscripten_glIsTexture: _emscripten_glIsTexture,
    /** @export */ emscripten_glIsTransformFeedback: _emscripten_glIsTransformFeedback,
    /** @export */ emscripten_glIsVertexArray: _emscripten_glIsVertexArray,
    /** @export */ emscripten_glIsVertexArrayOES: _emscripten_glIsVertexArrayOES,
    /** @export */ emscripten_glLineWidth: _emscripten_glLineWidth,
    /** @export */ emscripten_glLinkProgram: _emscripten_glLinkProgram,
    /** @export */ emscripten_glMapBufferRange: _emscripten_glMapBufferRange,
    /** @export */ emscripten_glPauseTransformFeedback: _emscripten_glPauseTransformFeedback,
    /** @export */ emscripten_glPixelStorei: _emscripten_glPixelStorei,
    /** @export */ emscripten_glPolygonModeWEBGL: _emscripten_glPolygonModeWEBGL,
    /** @export */ emscripten_glPolygonOffset: _emscripten_glPolygonOffset,
    /** @export */ emscripten_glPolygonOffsetClampEXT: _emscripten_glPolygonOffsetClampEXT,
    /** @export */ emscripten_glProgramBinary: _emscripten_glProgramBinary,
    /** @export */ emscripten_glProgramParameteri: _emscripten_glProgramParameteri,
    /** @export */ emscripten_glQueryCounterEXT: _emscripten_glQueryCounterEXT,
    /** @export */ emscripten_glReadBuffer: _emscripten_glReadBuffer,
    /** @export */ emscripten_glReadPixels: _emscripten_glReadPixels,
    /** @export */ emscripten_glReleaseShaderCompiler: _emscripten_glReleaseShaderCompiler,
    /** @export */ emscripten_glRenderbufferStorage: _emscripten_glRenderbufferStorage,
    /** @export */ emscripten_glRenderbufferStorageMultisample: _emscripten_glRenderbufferStorageMultisample,
    /** @export */ emscripten_glResumeTransformFeedback: _emscripten_glResumeTransformFeedback,
    /** @export */ emscripten_glSampleCoverage: _emscripten_glSampleCoverage,
    /** @export */ emscripten_glSamplerParameterf: _emscripten_glSamplerParameterf,
    /** @export */ emscripten_glSamplerParameterfv: _emscripten_glSamplerParameterfv,
    /** @export */ emscripten_glSamplerParameteri: _emscripten_glSamplerParameteri,
    /** @export */ emscripten_glSamplerParameteriv: _emscripten_glSamplerParameteriv,
    /** @export */ emscripten_glScissor: _emscripten_glScissor,
    /** @export */ emscripten_glShaderBinary: _emscripten_glShaderBinary,
    /** @export */ emscripten_glShaderSource: _emscripten_glShaderSource,
    /** @export */ emscripten_glStencilFunc: _emscripten_glStencilFunc,
    /** @export */ emscripten_glStencilFuncSeparate: _emscripten_glStencilFuncSeparate,
    /** @export */ emscripten_glStencilMask: _emscripten_glStencilMask,
    /** @export */ emscripten_glStencilMaskSeparate: _emscripten_glStencilMaskSeparate,
    /** @export */ emscripten_glStencilOp: _emscripten_glStencilOp,
    /** @export */ emscripten_glStencilOpSeparate: _emscripten_glStencilOpSeparate,
    /** @export */ emscripten_glTexImage2D: _emscripten_glTexImage2D,
    /** @export */ emscripten_glTexImage3D: _emscripten_glTexImage3D,
    /** @export */ emscripten_glTexParameterf: _emscripten_glTexParameterf,
    /** @export */ emscripten_glTexParameterfv: _emscripten_glTexParameterfv,
    /** @export */ emscripten_glTexParameteri: _emscripten_glTexParameteri,
    /** @export */ emscripten_glTexParameteriv: _emscripten_glTexParameteriv,
    /** @export */ emscripten_glTexStorage2D: _emscripten_glTexStorage2D,
    /** @export */ emscripten_glTexStorage3D: _emscripten_glTexStorage3D,
    /** @export */ emscripten_glTexSubImage2D: _emscripten_glTexSubImage2D,
    /** @export */ emscripten_glTexSubImage3D: _emscripten_glTexSubImage3D,
    /** @export */ emscripten_glTransformFeedbackVaryings: _emscripten_glTransformFeedbackVaryings,
    /** @export */ emscripten_glUniform1f: _emscripten_glUniform1f,
    /** @export */ emscripten_glUniform1fv: _emscripten_glUniform1fv,
    /** @export */ emscripten_glUniform1i: _emscripten_glUniform1i,
    /** @export */ emscripten_glUniform1iv: _emscripten_glUniform1iv,
    /** @export */ emscripten_glUniform1ui: _emscripten_glUniform1ui,
    /** @export */ emscripten_glUniform1uiv: _emscripten_glUniform1uiv,
    /** @export */ emscripten_glUniform2f: _emscripten_glUniform2f,
    /** @export */ emscripten_glUniform2fv: _emscripten_glUniform2fv,
    /** @export */ emscripten_glUniform2i: _emscripten_glUniform2i,
    /** @export */ emscripten_glUniform2iv: _emscripten_glUniform2iv,
    /** @export */ emscripten_glUniform2ui: _emscripten_glUniform2ui,
    /** @export */ emscripten_glUniform2uiv: _emscripten_glUniform2uiv,
    /** @export */ emscripten_glUniform3f: _emscripten_glUniform3f,
    /** @export */ emscripten_glUniform3fv: _emscripten_glUniform3fv,
    /** @export */ emscripten_glUniform3i: _emscripten_glUniform3i,
    /** @export */ emscripten_glUniform3iv: _emscripten_glUniform3iv,
    /** @export */ emscripten_glUniform3ui: _emscripten_glUniform3ui,
    /** @export */ emscripten_glUniform3uiv: _emscripten_glUniform3uiv,
    /** @export */ emscripten_glUniform4f: _emscripten_glUniform4f,
    /** @export */ emscripten_glUniform4fv: _emscripten_glUniform4fv,
    /** @export */ emscripten_glUniform4i: _emscripten_glUniform4i,
    /** @export */ emscripten_glUniform4iv: _emscripten_glUniform4iv,
    /** @export */ emscripten_glUniform4ui: _emscripten_glUniform4ui,
    /** @export */ emscripten_glUniform4uiv: _emscripten_glUniform4uiv,
    /** @export */ emscripten_glUniformBlockBinding: _emscripten_glUniformBlockBinding,
    /** @export */ emscripten_glUniformMatrix2fv: _emscripten_glUniformMatrix2fv,
    /** @export */ emscripten_glUniformMatrix2x3fv: _emscripten_glUniformMatrix2x3fv,
    /** @export */ emscripten_glUniformMatrix2x4fv: _emscripten_glUniformMatrix2x4fv,
    /** @export */ emscripten_glUniformMatrix3fv: _emscripten_glUniformMatrix3fv,
    /** @export */ emscripten_glUniformMatrix3x2fv: _emscripten_glUniformMatrix3x2fv,
    /** @export */ emscripten_glUniformMatrix3x4fv: _emscripten_glUniformMatrix3x4fv,
    /** @export */ emscripten_glUniformMatrix4fv: _emscripten_glUniformMatrix4fv,
    /** @export */ emscripten_glUniformMatrix4x2fv: _emscripten_glUniformMatrix4x2fv,
    /** @export */ emscripten_glUniformMatrix4x3fv: _emscripten_glUniformMatrix4x3fv,
    /** @export */ emscripten_glUnmapBuffer: _emscripten_glUnmapBuffer,
    /** @export */ emscripten_glUseProgram: _emscripten_glUseProgram,
    /** @export */ emscripten_glValidateProgram: _emscripten_glValidateProgram,
    /** @export */ emscripten_glVertexAttrib1f: _emscripten_glVertexAttrib1f,
    /** @export */ emscripten_glVertexAttrib1fv: _emscripten_glVertexAttrib1fv,
    /** @export */ emscripten_glVertexAttrib2f: _emscripten_glVertexAttrib2f,
    /** @export */ emscripten_glVertexAttrib2fv: _emscripten_glVertexAttrib2fv,
    /** @export */ emscripten_glVertexAttrib3f: _emscripten_glVertexAttrib3f,
    /** @export */ emscripten_glVertexAttrib3fv: _emscripten_glVertexAttrib3fv,
    /** @export */ emscripten_glVertexAttrib4f: _emscripten_glVertexAttrib4f,
    /** @export */ emscripten_glVertexAttrib4fv: _emscripten_glVertexAttrib4fv,
    /** @export */ emscripten_glVertexAttribDivisor: _emscripten_glVertexAttribDivisor,
    /** @export */ emscripten_glVertexAttribDivisorANGLE: _emscripten_glVertexAttribDivisorANGLE,
    /** @export */ emscripten_glVertexAttribDivisorARB: _emscripten_glVertexAttribDivisorARB,
    /** @export */ emscripten_glVertexAttribDivisorEXT: _emscripten_glVertexAttribDivisorEXT,
    /** @export */ emscripten_glVertexAttribDivisorNV: _emscripten_glVertexAttribDivisorNV,
    /** @export */ emscripten_glVertexAttribI4i: _emscripten_glVertexAttribI4i,
    /** @export */ emscripten_glVertexAttribI4iv: _emscripten_glVertexAttribI4iv,
    /** @export */ emscripten_glVertexAttribI4ui: _emscripten_glVertexAttribI4ui,
    /** @export */ emscripten_glVertexAttribI4uiv: _emscripten_glVertexAttribI4uiv,
    /** @export */ emscripten_glVertexAttribIPointer: _emscripten_glVertexAttribIPointer,
    /** @export */ emscripten_glVertexAttribPointer: _emscripten_glVertexAttribPointer,
    /** @export */ emscripten_glViewport: _emscripten_glViewport,
    /** @export */ emscripten_glWaitSync: _emscripten_glWaitSync,
    /** @export */ emscripten_has_asyncify: _emscripten_has_asyncify,
    /** @export */ emscripten_request_fullscreen_strategy: _emscripten_request_fullscreen_strategy,
    /** @export */ emscripten_request_pointerlock: _emscripten_request_pointerlock,
    /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */ emscripten_run_script: _emscripten_run_script,
    /** @export */ emscripten_sample_gamepad_data: _emscripten_sample_gamepad_data,
    /** @export */ emscripten_set_beforeunload_callback_on_thread: _emscripten_set_beforeunload_callback_on_thread,
    /** @export */ emscripten_set_blur_callback_on_thread: _emscripten_set_blur_callback_on_thread,
    /** @export */ emscripten_set_canvas_element_size: _emscripten_set_canvas_element_size,
    /** @export */ emscripten_set_element_css_size: _emscripten_set_element_css_size,
    /** @export */ emscripten_set_focus_callback_on_thread: _emscripten_set_focus_callback_on_thread,
    /** @export */ emscripten_set_fullscreenchange_callback_on_thread: _emscripten_set_fullscreenchange_callback_on_thread,
    /** @export */ emscripten_set_gamepadconnected_callback_on_thread: _emscripten_set_gamepadconnected_callback_on_thread,
    /** @export */ emscripten_set_gamepaddisconnected_callback_on_thread: _emscripten_set_gamepaddisconnected_callback_on_thread,
    /** @export */ emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
    /** @export */ emscripten_set_keypress_callback_on_thread: _emscripten_set_keypress_callback_on_thread,
    /** @export */ emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
    /** @export */ emscripten_set_main_loop: _emscripten_set_main_loop,
    /** @export */ emscripten_set_mousedown_callback_on_thread: _emscripten_set_mousedown_callback_on_thread,
    /** @export */ emscripten_set_mouseenter_callback_on_thread: _emscripten_set_mouseenter_callback_on_thread,
    /** @export */ emscripten_set_mouseleave_callback_on_thread: _emscripten_set_mouseleave_callback_on_thread,
    /** @export */ emscripten_set_mousemove_callback_on_thread: _emscripten_set_mousemove_callback_on_thread,
    /** @export */ emscripten_set_mouseup_callback_on_thread: _emscripten_set_mouseup_callback_on_thread,
    /** @export */ emscripten_set_pointerlockchange_callback_on_thread: _emscripten_set_pointerlockchange_callback_on_thread,
    /** @export */ emscripten_set_resize_callback_on_thread: _emscripten_set_resize_callback_on_thread,
    /** @export */ emscripten_set_touchcancel_callback_on_thread: _emscripten_set_touchcancel_callback_on_thread,
    /** @export */ emscripten_set_touchend_callback_on_thread: _emscripten_set_touchend_callback_on_thread,
    /** @export */ emscripten_set_touchmove_callback_on_thread: _emscripten_set_touchmove_callback_on_thread,
    /** @export */ emscripten_set_touchstart_callback_on_thread: _emscripten_set_touchstart_callback_on_thread,
    /** @export */ emscripten_set_visibilitychange_callback_on_thread: _emscripten_set_visibilitychange_callback_on_thread,
    /** @export */ emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
    /** @export */ emscripten_set_window_title: _emscripten_set_window_title,
    /** @export */ emscripten_sleep: _emscripten_sleep,
    /** @export */ emscripten_start_fetch: _emscripten_start_fetch,
    /** @export */ environ_get: _environ_get,
    /** @export */ environ_sizes_get: _environ_sizes_get,
    /** @export */ exit: _exit,
    /** @export */ fd_close: _fd_close,
    /** @export */ fd_read: _fd_read,
    /** @export */ fd_seek: _fd_seek,
    /** @export */ fd_write: _fd_write,
    /** @export */ glActiveTexture: _glActiveTexture,
    /** @export */ glAttachShader: _glAttachShader,
    /** @export */ glBindAttribLocation: _glBindAttribLocation,
    /** @export */ glBindBuffer: _glBindBuffer,
    /** @export */ glBindFramebuffer: _glBindFramebuffer,
    /** @export */ glBindRenderbuffer: _glBindRenderbuffer,
    /** @export */ glBindTexture: _glBindTexture,
    /** @export */ glBindVertexArray: _glBindVertexArray,
    /** @export */ glBlendFunc: _glBlendFunc,
    /** @export */ glBlendFuncSeparate: _glBlendFuncSeparate,
    /** @export */ glBlitFramebuffer: _glBlitFramebuffer,
    /** @export */ glBufferData: _glBufferData,
    /** @export */ glBufferSubData: _glBufferSubData,
    /** @export */ glCheckFramebufferStatus: _glCheckFramebufferStatus,
    /** @export */ glClear: _glClear,
    /** @export */ glClearColor: _glClearColor,
    /** @export */ glClearDepthf: _glClearDepthf,
    /** @export */ glClearStencil: _glClearStencil,
    /** @export */ glColorMask: _glColorMask,
    /** @export */ glCompileShader: _glCompileShader,
    /** @export */ glCompressedTexImage2D: _glCompressedTexImage2D,
    /** @export */ glCompressedTexSubImage2D: _glCompressedTexSubImage2D,
    /** @export */ glCopyTexSubImage2D: _glCopyTexSubImage2D,
    /** @export */ glCreateProgram: _glCreateProgram,
    /** @export */ glCreateShader: _glCreateShader,
    /** @export */ glCullFace: _glCullFace,
    /** @export */ glDeleteBuffers: _glDeleteBuffers,
    /** @export */ glDeleteFramebuffers: _glDeleteFramebuffers,
    /** @export */ glDeleteProgram: _glDeleteProgram,
    /** @export */ glDeleteRenderbuffers: _glDeleteRenderbuffers,
    /** @export */ glDeleteShader: _glDeleteShader,
    /** @export */ glDeleteTextures: _glDeleteTextures,
    /** @export */ glDeleteVertexArrays: _glDeleteVertexArrays,
    /** @export */ glDepthFunc: _glDepthFunc,
    /** @export */ glDepthMask: _glDepthMask,
    /** @export */ glDisable: _glDisable,
    /** @export */ glDisableVertexAttribArray: _glDisableVertexAttribArray,
    /** @export */ glDrawArrays: _glDrawArrays,
    /** @export */ glDrawElements: _glDrawElements,
    /** @export */ glEnable: _glEnable,
    /** @export */ glEnableVertexAttribArray: _glEnableVertexAttribArray,
    /** @export */ glFramebufferRenderbuffer: _glFramebufferRenderbuffer,
    /** @export */ glFramebufferTexture2D: _glFramebufferTexture2D,
    /** @export */ glGenBuffers: _glGenBuffers,
    /** @export */ glGenFramebuffers: _glGenFramebuffers,
    /** @export */ glGenRenderbuffers: _glGenRenderbuffers,
    /** @export */ glGenTextures: _glGenTextures,
    /** @export */ glGenVertexArrays: _glGenVertexArrays,
    /** @export */ glGenerateMipmap: _glGenerateMipmap,
    /** @export */ glGetActiveUniform: _glGetActiveUniform,
    /** @export */ glGetIntegerv: _glGetIntegerv,
    /** @export */ glGetProgramInfoLog: _glGetProgramInfoLog,
    /** @export */ glGetProgramiv: _glGetProgramiv,
    /** @export */ glGetShaderInfoLog: _glGetShaderInfoLog,
    /** @export */ glGetShaderiv: _glGetShaderiv,
    /** @export */ glGetString: _glGetString,
    /** @export */ glGetUniformLocation: _glGetUniformLocation,
    /** @export */ glInvalidateFramebuffer: _glInvalidateFramebuffer,
    /** @export */ glLinkProgram: _glLinkProgram,
    /** @export */ glMapBufferRange: _glMapBufferRange,
    /** @export */ glPixelStorei: _glPixelStorei,
    /** @export */ glPolygonOffset: _glPolygonOffset,
    /** @export */ glReadPixels: _glReadPixels,
    /** @export */ glRenderbufferStorage: _glRenderbufferStorage,
    /** @export */ glRenderbufferStorageMultisample: _glRenderbufferStorageMultisample,
    /** @export */ glShaderSource: _glShaderSource,
    /** @export */ glStencilFunc: _glStencilFunc,
    /** @export */ glStencilMask: _glStencilMask,
    /** @export */ glStencilOp: _glStencilOp,
    /** @export */ glStencilOpSeparate: _glStencilOpSeparate,
    /** @export */ glTexImage2D: _glTexImage2D,
    /** @export */ glTexImage3D: _glTexImage3D,
    /** @export */ glTexParameteri: _glTexParameteri,
    /** @export */ glTexStorage2D: _glTexStorage2D,
    /** @export */ glTexStorage3D: _glTexStorage3D,
    /** @export */ glTexSubImage2D: _glTexSubImage2D,
    /** @export */ glTexSubImage3D: _glTexSubImage3D,
    /** @export */ glUniform1fv: _glUniform1fv,
    /** @export */ glUniform1i: _glUniform1i,
    /** @export */ glUniform2fv: _glUniform2fv,
    /** @export */ glUniform3fv: _glUniform3fv,
    /** @export */ glUniform4fv: _glUniform4fv,
    /** @export */ glUniformMatrix4fv: _glUniformMatrix4fv,
    /** @export */ glUnmapBuffer: _glUnmapBuffer,
    /** @export */ glUseProgram: _glUseProgram,
    /** @export */ glVertexAttribPointer: _glVertexAttribPointer,
    /** @export */ glViewport: _glViewport,
    /** @export */ invoke_d,
    /** @export */ invoke_dd,
    /** @export */ invoke_di,
    /** @export */ invoke_did,
    /** @export */ invoke_diffff,
    /** @export */ invoke_dii,
    /** @export */ invoke_diid,
    /** @export */ invoke_diii,
    /** @export */ invoke_f,
    /** @export */ invoke_ff,
    /** @export */ invoke_fi,
    /** @export */ invoke_fif,
    /** @export */ invoke_fifddi,
    /** @export */ invoke_fiff,
    /** @export */ invoke_fii,
    /** @export */ invoke_fiiff,
    /** @export */ invoke_fiifi,
    /** @export */ invoke_fiii,
    /** @export */ invoke_fiiii,
    /** @export */ invoke_fiiiiff,
    /** @export */ invoke_fiiiii,
    /** @export */ invoke_fiiiiii,
    /** @export */ invoke_fiiiiiiii,
    /** @export */ invoke_i,
    /** @export */ invoke_if,
    /** @export */ invoke_ifi,
    /** @export */ invoke_ii,
    /** @export */ invoke_iid,
    /** @export */ invoke_iiddi,
    /** @export */ invoke_iidi,
    /** @export */ invoke_iidii,
    /** @export */ invoke_iif,
    /** @export */ invoke_iiff,
    /** @export */ invoke_iifffffffff,
    /** @export */ invoke_iiffffffffffffffff,
    /** @export */ invoke_iifi,
    /** @export */ invoke_iifif,
    /** @export */ invoke_iififi,
    /** @export */ invoke_iifii,
    /** @export */ invoke_iii,
    /** @export */ invoke_iiid,
    /** @export */ invoke_iiif,
    /** @export */ invoke_iiiff,
    /** @export */ invoke_iiifi,
    /** @export */ invoke_iiifii,
    /** @export */ invoke_iiii,
    /** @export */ invoke_iiiid,
    /** @export */ invoke_iiiidi,
    /** @export */ invoke_iiiif,
    /** @export */ invoke_iiiiff,
    /** @export */ invoke_iiiiffi,
    /** @export */ invoke_iiiifi,
    /** @export */ invoke_iiiifii,
    /** @export */ invoke_iiiifiif,
    /** @export */ invoke_iiiifiifii,
    /** @export */ invoke_iiiifiifiii,
    /** @export */ invoke_iiiifiiii,
    /** @export */ invoke_iiiii,
    /** @export */ invoke_iiiiid,
    /** @export */ invoke_iiiiidi,
    /** @export */ invoke_iiiiif,
    /** @export */ invoke_iiiiiff,
    /** @export */ invoke_iiiiiffff,
    /** @export */ invoke_iiiiifi,
    /** @export */ invoke_iiiiifii,
    /** @export */ invoke_iiiiifiii,
    /** @export */ invoke_iiiiii,
    /** @export */ invoke_iiiiiid,
    /** @export */ invoke_iiiiiif,
    /** @export */ invoke_iiiiiiff,
    /** @export */ invoke_iiiiiifff,
    /** @export */ invoke_iiiiiifi,
    /** @export */ invoke_iiiiiifii,
    /** @export */ invoke_iiiiiii,
    /** @export */ invoke_iiiiiiif,
    /** @export */ invoke_iiiiiiifi,
    /** @export */ invoke_iiiiiiifii,
    /** @export */ invoke_iiiiiiii,
    /** @export */ invoke_iiiiiiiii,
    /** @export */ invoke_iiiiiiiiifi,
    /** @export */ invoke_iiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiif,
    /** @export */ invoke_iiiiiiiiiifiiiiii,
    /** @export */ invoke_iiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiifiiiiii,
    /** @export */ invoke_iiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiji,
    /** @export */ invoke_iiiiiiiiij,
    /** @export */ invoke_iiiiiiij,
    /** @export */ invoke_iiiiij,
    /** @export */ invoke_iiiijii,
    /** @export */ invoke_iiij,
    /** @export */ invoke_iiijii,
    /** @export */ invoke_iiijiii,
    /** @export */ invoke_iiijiiiiii,
    /** @export */ invoke_iij,
    /** @export */ invoke_iiji,
    /** @export */ invoke_iijii,
    /** @export */ invoke_iijjjj,
    /** @export */ invoke_ij,
    /** @export */ invoke_j,
    /** @export */ invoke_ji,
    /** @export */ invoke_jii,
    /** @export */ invoke_jiiii,
    /** @export */ invoke_v,
    /** @export */ invoke_vdii,
    /** @export */ invoke_vdiiii,
    /** @export */ invoke_vi,
    /** @export */ invoke_vid,
    /** @export */ invoke_vidd,
    /** @export */ invoke_vidi,
    /** @export */ invoke_vidii,
    /** @export */ invoke_vif,
    /** @export */ invoke_viff,
    /** @export */ invoke_vifff,
    /** @export */ invoke_viffff,
    /** @export */ invoke_vifffffffff,
    /** @export */ invoke_viffffi,
    /** @export */ invoke_viffii,
    /** @export */ invoke_vifi,
    /** @export */ invoke_vii,
    /** @export */ invoke_viid,
    /** @export */ invoke_viidii,
    /** @export */ invoke_viif,
    /** @export */ invoke_viiff,
    /** @export */ invoke_viifff,
    /** @export */ invoke_viiffff,
    /** @export */ invoke_viifffi,
    /** @export */ invoke_viiffi,
    /** @export */ invoke_viiffii,
    /** @export */ invoke_viiffiii,
    /** @export */ invoke_viifi,
    /** @export */ invoke_viifii,
    /** @export */ invoke_viifiif,
    /** @export */ invoke_viifiii,
    /** @export */ invoke_viifiiii,
    /** @export */ invoke_viifji,
    /** @export */ invoke_viii,
    /** @export */ invoke_viiid,
    /** @export */ invoke_viiidd,
    /** @export */ invoke_viiiddd,
    /** @export */ invoke_viiidi,
    /** @export */ invoke_viiidii,
    /** @export */ invoke_viiif,
    /** @export */ invoke_viiiff,
    /** @export */ invoke_viiifff,
    /** @export */ invoke_viiiffi,
    /** @export */ invoke_viiiffii,
    /** @export */ invoke_viiifi,
    /** @export */ invoke_viiifif,
    /** @export */ invoke_viiififf,
    /** @export */ invoke_viiifii,
    /** @export */ invoke_viiifiii,
    /** @export */ invoke_viiii,
    /** @export */ invoke_viiiid,
    /** @export */ invoke_viiiidfi,
    /** @export */ invoke_viiiidi,
    /** @export */ invoke_viiiif,
    /** @export */ invoke_viiiiffi,
    /** @export */ invoke_viiiifi,
    /** @export */ invoke_viiiifii,
    /** @export */ invoke_viiiifiifiiifffii,
    /** @export */ invoke_viiiifiiiiiiiii,
    /** @export */ invoke_viiiii,
    /** @export */ invoke_viiiiid,
    /** @export */ invoke_viiiiif,
    /** @export */ invoke_viiiiiffi,
    /** @export */ invoke_viiiiifi,
    /** @export */ invoke_viiiiifii,
    /** @export */ invoke_viiiiifiiiiiii,
    /** @export */ invoke_viiiiifiiiiiiii,
    /** @export */ invoke_viiiiii,
    /** @export */ invoke_viiiiiif,
    /** @export */ invoke_viiiiiifi,
    /** @export */ invoke_viiiiiii,
    /** @export */ invoke_viiiiiiif,
    /** @export */ invoke_viiiiiiifffii,
    /** @export */ invoke_viiiiiiii,
    /** @export */ invoke_viiiiiiiif,
    /** @export */ invoke_viiiiiiiifii,
    /** @export */ invoke_viiiiiiiii,
    /** @export */ invoke_viiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiiiii,
    /** @export */ invoke_viiiiiji,
    /** @export */ invoke_viiiij,
    /** @export */ invoke_viiij,
    /** @export */ invoke_viij,
    /** @export */ invoke_viijii,
    /** @export */ invoke_vij,
    /** @export */ invoke_viji,
    /** @export */ invoke_vijj,
    /** @export */ invoke_vijjidddii,
    /** @export */ llvm_eh_typeid_for: _llvm_eh_typeid_for,
    /** @export */ memory: wasmMemory,
    /** @export */ proc_exit: _proc_exit,
    /** @export */ random_get: _random_get
  };
}

function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index, a1) {
  var sp = stackSave();
  try {
    dynCall_vi(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    dynCall_v(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_iii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_ii(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index, a1, a2) {
  var sp = stackSave();
  try {
    dynCall_vii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return dynCall_i(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiiii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_d(index) {
  var sp = stackSave();
  try {
    return dynCall_d(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dii(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_dii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiiii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiddi(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vid(index, a1, a2) {
  var sp = stackSave();
  try {
    dynCall_vid(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_di(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_di(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiiid(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vif(index, a1, a2) {
  var sp = stackSave();
  try {
    dynCall_vif(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viid(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viid(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_j(index) {
  var sp = stackSave();
  try {
    return dynCall_j(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iidii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iid(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_iid(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiid(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viiid(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iidi(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fii(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_fii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iififi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iififi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viifi(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiif(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viiif(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiifi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiifii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viffff(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiifii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    dynCall_viiiifiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fif(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_fif(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiffii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iif(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_iif(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiififf(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiififf(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viif(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viif(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiffff(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return dynCall_iifffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fi(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_fi(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    dynCall_viiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiifi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_vifi(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_f(index) {
  var sp = stackSave();
  try {
    return dynCall_f(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_if(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_if(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_vifff(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viifii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiid(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiid(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiifi(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiif(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiiif(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiif(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiiif(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viifff(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    dynCall_viiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viifiii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiif(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiif(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiif(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiff(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiifi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiifi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_vidi(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iifii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiji(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viifiiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diffff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_diffff(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_fiiiiii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_fiii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiif(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiif(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_fiiiii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dd(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_dd(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viff(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidd(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_vidd(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fifddi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_fifddi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viij(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vij(index, a1, a2) {
  var sp = stackSave();
  try {
    dynCall_vij(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ji(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_ji(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vdii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_vdii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vdiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_vdiiii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiidi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiidi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viifffi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiidii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiifff(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viidii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viiff(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    dynCall_vifffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiffff(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiffff(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifif(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iifif(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiff(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiidi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiidi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiddd(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiddd(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidd(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiidd(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiifi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_fiifi(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ij(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_ij(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiidi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_diii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diid(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_diid(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiidi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiid(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiid(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jii(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_jii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_viffii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viffii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiifffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiifffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viffffi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiifii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return dynCall_iiiifiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return dynCall_iiiifiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiif(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiifiif(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiffi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiffiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_fiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiifii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iij(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_iij(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiiif(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiiff(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijjjj(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iijjjj(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiifiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ff(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_ff(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiid(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiid(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiifif(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiffii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifji(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viifji(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiifi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiifi(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiffi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiif(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiif(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiif(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiif(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_fiiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiff(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiifff(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiifff(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiff(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiff(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiij(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiiij(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_did(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_did(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiij(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iijii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiji(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiiji(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiij(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiij(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijjidddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    dynCall_vijjidddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiijii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viji(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiijii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiijii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiij(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viiij(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijj(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_vijj(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return dynCall_iiijiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_vidii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiidfi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiidfi(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiid(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiiid(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiid(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viijii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffffffffffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
  var sp = stackSave();
  try {
    return dynCall_iiffffffffffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_fiiff(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiffi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iifi(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiijiii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    dynCall_viiiiifiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viifiif(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifiifiiifffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
  var sp = stackSave();
  try {
    dynCall_viiiifiifiiifffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    dynCall_viiiiifiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiff(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    dynCall_viiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiffi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiffi(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiiff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_fiiiiff(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_fiff(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ifi(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_ifi(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiifii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiifi(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiij(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_jiiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
var calledRun;

function callMain(args = []) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(typeof onPreRuns === "undefined" || onPreRuns.length == 0, "cannot call main when preRun functions remain to be called");
  var entryFunction = _main;
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv;
  for (var arg of args) {
    (growMemViews(), HEAPU32)[((argv_ptr) >> 2)] = stringToUTF8OnStack(arg);
    argv_ptr += 4;
  }
  (growMemViews(), HEAPU32)[((argv_ptr) >> 2)] = 0;
  try {
    var ret = entryFunction(argc, argv);
    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // See $establishStackSpace for the equivalent code that runs on a thread
  assert(!ENVIRONMENT_IS_PTHREAD);
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run(args = arguments_) {
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  if ((ENVIRONMENT_IS_PTHREAD)) {
    initRuntime();
    return;
  }
  stackCheckInit();
  preRun();
  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    Module["onRuntimeInitialized"]?.();
    consumedModuleProp("onRuntimeInitialized");
    var noInitialRun = Module["noInitialRun"] || false;
    if (!noInitialRun) callMain(args);
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(() => {
      setTimeout(() => Module["setStatus"](""), 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    for (var name of [ "stdout", "stderr" ]) {
      var info = FS.analyzePath("/dev/" + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty?.output?.length) {
        has = true;
      }
    }
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
  }
}

var wasmExports;

if ((!(ENVIRONMENT_IS_PTHREAD))) {
  // Call createWasm on startup if we are the main thread.
  // Worker threads call this once they receive the module via postMessage
  // With async instantation wasmExports is assigned asynchronously when the
  // instance is received.
  createWasm();
  run();
}
