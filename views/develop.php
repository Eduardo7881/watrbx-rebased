<?php 
use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;
use watrbx\thumbnails;
use Cocur\Slugify\Slugify;
$slugify = new slugify();
$auth = new authentication();
$auth->requiresession();
$pagebuilder = new pagebuilder();
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=main___52c69b42777a376ab8c76204ed8e75e2_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___cda0cc7c6f454f40a6342985b7a289e6_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___693f28640f335d1c8bc50c5a11d7ad3d_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Pages/Build/BuildPage.css');
$pagebuilder->addresource('cssfiles', '/CSS/Pages/Build/Develop.css');
$pagebuilder->addresource('cssfiles', '/CSS/Pages/Build/DropDownMenus.css');
$pagebuilder->addresource('cssfiles', '/CSS/Pages/Build/Navigation.css');
$pagebuilder->addresource('cssfiles', '/CSS/Pages/Build/StudioWidget.css');
$pagebuilder->addresource('cssfiles', '/CSS/Pages/Build/Upload.css');
$pagebuilder->addresource('jsfiles', '/js/c5827143734572fa7bd8fcc79c3c126b.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/22f5b93b0e23b69d9c48f68ea3c65fe3.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/6385cae49dc708a8f2f93167ad17466d.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/f3251ed8271ce1271b831073a47b65e3.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/2580e8485e871856bb8abe4d0d297bd2.js.gzip');
$pagebuilder->set_page_name("Develop");

$allowedcategories = [
  "Places"=>9,
  "Models"=>10,
  "Decals"=>13,
  "Badges"=>21,
  "Game Passes"=>34,
  "Audio"=>3,
  "Animations"=>24,
  "Meshes"=>40,
  "Ads"=>"ads",
  "Sponsored Games"=>"sponsored-games",
  "Shirts"=>11,
  "T-Shirts"=>2,
  "Pants"=>12,
  "Plugins"=>38,
  "Sets"=>"sets"
];

global $currentpage;

$currentpage = 9;

if(isset($_GET["View"])){
  $view = $_GET["View"];

  if(in_array($view, $allowedcategories)){
    $currentpage = $view;
  }
}

function is_tab_selected($tab) {

  global $currentpage;

  if($tab == $currentpage){
    echo "tab-item-selected";
  }

}

$developFiles = [
  9 => "../views/components/develop/places.php",
  11 => "../views/components/develop/shirts.php",
  12 => "../views/components/develop/pants.php",
  "ads" => "../views/components/develop/ads.php",
  10 => "../views/components/develop/models.php" 
];


$pagebuilder->setlegacy(true);
$pagebuilder->buildheader();

?>

<div id="AdvertisingLeaderboard">
                

<iframe allowtransparency="true" frameborder="0" height="110" scrolling="no" src="/userads/1" width="728" data-js-adtype="iframead"></iframe>


            </div>

<div id="BodyWrapper">
  <div id="RepositionBody">
    <div id="Body" class="body-width">
      <div id="TosAgreementInfo" data-terms-check-needed="True"></div>
      <div id="DevelopTabs" class="tab-container">
        <div id="MyCreationsTabLink" class="tab-active" data-url="/develop">My Creations</div>
        <div id="GroupCreationsTabLink" data-url="/develop/groups" data-default-get-url="/build/buildview" style="display:none">Group Creations</div>
        <div id="LibraryTabLink" data-url="/develop/library" data-library-get-url="/catalog/contents?CatalogContext=DevelopOnly&amp;Category=Models">Library</div>
      </div>
      <div>
        <div id="MyCreationsTab" class="tab-active">
          <div class="BuildPageContent" data-groupid="">
            <input id="assetTypeId" name="assetTypeId" type="hidden" value="9">
            <input data-val="true" data-val-required="The IsTgaUploadEnabled field is required." id="isTgaUploadEnabled" name="isTgaUploadEnabled" type="hidden" value="True">
            <table id="build-page" data-asset-type-id="9" data-showcases-enabled="true" data-edit-opens-studio="True">
              <tbody>
                <tr>
                  <td class="menu-area divider-right">
                    <a href="/develop?View=9" class="tab-item <?=is_tab_selected(9)?>">Places</a>
                    <a href="/develop?View=10" class="tab-item <?=is_tab_selected(10)?>">Models</a>
                    <a href="/develop?View=13" class="tab-item <?=is_tab_selected(13)?>">Decals</a>
                    <a href="/develop?View=21" class="tab-item <?=is_tab_selected(21)?>">Badges</a>
                    <a href="/develop?View=34" class="tab-item <?=is_tab_selected(34)?>">Game Passes</a>
                    <a href="/develop?View=3" class="tab-item <?=is_tab_selected(3)?>">Audio</a>
                    <a href="/develop?View=24" class="tab-item <?=is_tab_selected(24)?>">Animations</a>
                    <a href="/develop?View=40" class="tab-item <?=is_tab_selected(40)?>">Meshes</a>
                    <a href="/develop?View=ads" class="tab-item <?=is_tab_selected("ads")?>">User Ads</a>
                    <a href="/develop?View=11" class="tab-item <?=is_tab_selected(11)?>">Shirts</a>
                    <a href="/develop?View=2" class="tab-item <?=is_tab_selected(2)?>">T-Shirts</a>
                    <a href="/develop?View=12" class="tab-item <?=is_tab_selected(12)?>">Pants</a>
                    <a href="/develop?View=38" class="tab-item <?=is_tab_selected(38)?>">Plugins</a>
                    <a href="/My/Sets.aspx" class="tab-item">Sets</a>
                    <div id="StudioWidget">
											<div class="widget-name">
												<h3>ROBLOX Studio</h3>
											</div>
											<div class="content">
												<div id="LeftColumn">
													<div class="studio-icon"><img src="/images/RobloxStudio.png"></div>
												</div>
												<div id="RightColumn">
													<ul>
														<li><a href="//setup.watrbx.wtf/RobloxStudioLauncherBeta.exe" class="studio-launch" download="//setup.watrbx.wtf/RobloxStudioLauncherBeta.exe">Download</a></li>
														<li><a href="#">Forum</a></li>
														<li><a href="#">Wiki</a></li>
													</ul>
												</div>
											</div>
										</div>
                  </td>
                    <?php
                      if(array_key_exists($currentpage, $developFiles)){
                        require($developFiles[$currentpage]);
                      } else {
                        echo "<td class=\"content-area\"><div><h1>We're sorry.</h1><br><p>This feature is currently unfinished. Please check back later!</p></div></td>";
                      }
                    ?>
                </tr>
              </tbody>
            </table>
            <div id="build-dropdown-menu">
              <a href="#" data-href-template="/places/0/update">Configure Place</a>
              <a href="#" data-gameonly-link="true" data-href-template="/places/0/stats">Developer Stats</a>
              <a class="shutdown-all-servers-button" href="#">Shut Down All Servers</a>
            </div>
            <div class="PlaceSelectorModal modalPopup unifiedModal" style="display:none">
              <div class="Title">Select Place</div>
              <div class="GenericModalBody text">
                <div class="place-selector-modal" data-place-loader-url="/universes/get-places-by-context?creationContext=NonGameCreation&amp;universeId=0&amp;groupId=">
                  <div class="place-selector-container">
                    <div id="PlaceSelectorItemContainer" class="place-selector-item-container"></div>
                    <div id="PlaceSelectorPagerContainer" class="place-selector-pager-container"></div>
                  </div>
                  <div class="place-selector template" title="Place" style="display:none">
                    <div class="place-image" data-retry-url-template="/asset-thumbnail/json?height=100&amp;width=160&amp;format=jpeg&amp;returnAutoGenerated=True">
                      <img alt="^_^" class="item-image" src="https://images.rbxcdn.com/ec5c01d220bf1b73403fa51519267742.gif">
                    </div>
                    <div class="InfoContainer">
                      <div class="place-name"></div>
                      <div class="game-name">
                        <span class="form-label">Game: </span>
                        <span class="game-name-text"></span>
                      </div>
                    </div>
                    <div style="clear:both"></div>
                  </div>
                </div>
              </div>
            </div>
            <script>
              $(function() {
                Roblox.PlaceSelector.Init();
                Roblox.PlaceSelector.Resources = {
                  anErrorOccurred: 'An error occurred, please try again.'
                };
              });
            </script>
            <div class="GenericModal modalPopup unifiedModal smallModal" style="display:none">
              <div class="Title"></div>
              <div class="GenericModalBody">
                <div>
                  <div class="ImageContainer">
                    <img class="GenericModalImage" alt="generic image">
                  </div>
                  <div class="Message"></div>
                </div>
                <div class="GenericModalButtonContainer">
                  <a class="ImageButton btn-neutral btn-large roblox-ok">OK</a>
                </div>
              </div>
            </div>
            <script>
              Roblox = Roblox || {};
              Roblox.BuildPage = Roblox.BuildPage || {};
              Roblox.BuildPage.AlertURL = "https://images.rbxcdn.com/43ac54175f3f3cd403536fedd9170c10.png";
            </script>
          </div>
          <div class="Ads_WideSkyscraper">
             <iframe allowtransparency="true"
            frameborder="0"
            height="612"
            scrolling="no"
            src="/userads/2"
            width="160"
            data-js-adtype="iframead"></iframe>

          </div>
          <script>
            if (typeof Roblox === "undefined") {
              Roblox = {};
            }
            if (typeof Roblox.BuildPage === "undefined") {
              Roblox.BuildPage = {};
            }
            Roblox.BuildPage.Resources = {
                active: "Active",
                inactive: "Inactive",
                activatePlace: "Activate Place",
                editGame: "Edit Game",
                ok: "OK",
                robloxStudio: "ROBLOX Studio",
                openIn: "To edit this game, open to this page in ",
                placeInactive: "Place Inactive",
                toBuileHere: "To build here, please activate this place by clicking the ",
                inactiveButton: "inactive button. ",
                createModel: "Create Model",
                toCreate: "To create models, please use ",
                makeActive: "Make Active",
                makeInactive: "Make Inactive",
                purchaseComplete: "Purchase Complete!",
                youHaveBid: "You have successfully bid ",
                confirmBid: "Confirm the Bid",
                placeBid: "Place Bid",
                cancel: "Cancel",
                errorOccurred: "Error Occurred",
                adDeleted: "Ad Deleted",
                theAdWasDeleted: "The Ad has been deleted.",
                confirmDelete: "Confirm Deletion",
                areYouSureDelete: "Are you sure you want to delete this Ad?",
                bidRejected: "Your bid was Rejected",
                bidRange: "Bid value must be a number between ",
                bidRange2: "Bid value must be a number greater than ",
                and: " and ",
                yourRejected: "Your bid was Rejected",
                estimatorExplanation: "This estimator uses data from ads run yesterday to guess how many impressions your ad will recieve.",
                estimatedImpressions: "Estimated Impressions ",
                makeAdBid: "Make Ad Bid",
                wouldYouLikeToBid: "Would you like to bid ",
                verify: "Verify",
                emailVerifiedTitle: "Verify Your Email",
                emailVerifiedMessage: "You must verify your email before you can work on your place. You can verify your email on the  < a href = '/my/account?confirmemail=1' > Account < /a> page.",continueText:"Continue",profileRemoveTitle:"Remove from profile?",profileRemoveMessage:"This game is inactive and listed on your profile, do you wish to remove it?",profileAddTitle:"Add to profile?",profileAddMessage:"This game is active, but not listed on your profile, do you wish to add it?",deactivateTitle:"Deactivate Place",deactivateBody:"This will shut down any running games; VIP subscriptions will also be cancelled. < br / > < br / > Do you still want to deactivate ? ",deactivateButton:"
                Deactivate ",questionmarkImgUrl:"
                https: //static.rbxcdn.com/images/Buttons/questionmark-12x12.png",activationRequestFailed:"Request to activate game failed. Please retry in a few minutes!",deactivationRequestFailed:"Request to deactivate game failed. Please retry in a few minutes!",tooManyActiveMessage:"You have reached the maximum number of active places for your membership level. Deactivate one of your existing active places before making this place active.",activeSlotsMessage:"{0} of {1} active slots used"};
          </script>
        </div>
        <div id="GroupCreationsTab" style="display:none">
          <div class="BuildPageContent" data-groupid="">
            <div class="GenericModal modalPopup unifiedModal smallModal" style="display:none">
              <div class="Title"></div>
              <div class="GenericModalBody">
                <div>
                  <div class="ImageContainer">
                    <img class="GenericModalImage" alt="generic image">
                  </div>
                  <div class="Message"></div>
                </div>
                <div class="GenericModalButtonContainer">
                  <a class="ImageButton btn-neutral btn-large roblox-ok">OK</a>
                </div>
              </div>
            </div>
            <script>
              Roblox = Roblox || {};
              Roblox.BuildPage = Roblox.BuildPage || {};
              Roblox.BuildPage.AlertURL = "https://images.rbxcdn.com/43ac54175f3f3cd403536fedd9170c10.png";
            </script>
          </div>
          <div class="Ads_WideSkyscraper">
            <div id="Skyscraper-Adp-Right" class="abp abp-container right-abp">
              <iframe allowtransparency="true"
                      frameborder="0"
                      height="612"
                      scrolling="no"
                      src="/userads/2"
                      width="160"
                      data-js-adtype="iframead"></iframe>
                </div>
          </div>
          <script>
            if (typeof Roblox === "undefined") {
              Roblox = {};
            }
            if (typeof Roblox.BuildPage === "undefined") {
              Roblox.BuildPage = {};
            }
            Roblox.BuildPage.Resources = {
                active: "Active",
                inactive: "Inactive",
                activatePlace: "Activate Place",
                editGame: "Edit Game",
                ok: "OK",
                robloxStudio: "ROBLOX Studio",
                openIn: "To edit this game, open to this page in ",
                placeInactive: "Place Inactive",
                toBuileHere: "To build here, please activate this place by clicking the ",
                inactiveButton: "inactive button. ",
                createModel: "Create Model",
                toCreate: "To create models, please use ",
                makeActive: "Make Active",
                makeInactive: "Make Inactive",
                purchaseComplete: "Purchase Complete!",
                youHaveBid: "You have successfully bid ",
                confirmBid: "Confirm the Bid",
                placeBid: "Place Bid",
                cancel: "Cancel",
                errorOccurred: "Error Occurred",
                adDeleted: "Ad Deleted",
                theAdWasDeleted: "The Ad has been deleted.",
                confirmDelete: "Confirm Deletion",
                areYouSureDelete: "Are you sure you want to delete this Ad?",
                bidRejected: "Your bid was Rejected",
                bidRange: "Bid value must be a number between ",
                bidRange2: "Bid value must be a number greater than ",
                and: " and ",
                yourRejected: "Your bid was Rejected",
                estimatorExplanation: "This estimator uses data from ads run yesterday to guess how many impressions your ad will recieve.",
                estimatedImpressions: "Estimated Impressions ",
                makeAdBid: "Make Ad Bid",
                wouldYouLikeToBid: "Would you like to bid ",
                verify: "Verify",
                emailVerifiedTitle: "Verify Your Email",
                emailVerifiedMessage: "You must verify your email before you can work on your place. You can verify your email on the  < a href = '/my/account?confirmemail=1' > Account < /a> page.",continueText:"Continue",profileRemoveTitle:"Remove from profile?",profileRemoveMessage:"This game is inactive and listed on your profile, do you wish to remove it?",profileAddTitle:"Add to profile?",profileAddMessage:"This game is active, but not listed on your profile, do you wish to add it?",deactivateTitle:"Deactivate Place",deactivateBody:"This will shut down any running games; VIP subscriptions will also be cancelled. < br / > < br / > Do you still want to deactivate ? ",deactivateButton:"
                Deactivate ",questionmarkImgUrl:"
                https: //static.rbxcdn.com/images/Buttons/questionmark-12x12.png",activationRequestFailed:"Request to activate game failed. Please retry in a few minutes!",deactivationRequestFailed:"Request to deactivate game failed. Please retry in a few minutes!",tooManyActiveMessage:"You have reached the maximum number of active places for your membership level. Deactivate one of your existing active places before making this place active.",activeSlotsMessage:"{0} of {1} active slots used"};
          </script>
        </div>
        <div id="LibraryTab">
          <div class="loading" id="LibraryLoadingIndicatorContainer">
            <img id="LibraryLoadingIndicator" src="https://images.rbxcdn.com/ec4e85b0c4396cf753a06fade0a8d8af.gif" alt="Progress">
          </div>
        </div>

      </div>
      <div id="AdPreviewModal" class="simplemodal-data" style="display:none">
        <div id="ConfirmationDialog" style="overflow:hidden">
          <div id="AdPreviewContainer" style="overflow:hidden"></div>
        </div>
      </div>
      <script>
        Roblox.CatalogValues = Roblox.CatalogValues || {};
        Roblox.CatalogValues.CatalogContentsUrl = "/catalog/contents";
        Roblox.CatalogValues.CatalogContext = 2;
        Roblox.CatalogValues.CatalogContextDevelopOnly = 2;
        Roblox.CatalogValues.ContainerID = "LibraryTab";
        $(function() {
          if (Roblox && Roblox.AdsHelper && Roblox.AdsHelper.AdRefresher) {
            Roblox.AdsHelper.AdRefresher.globalCreateNewAdEnabled = true;
            Roblox.AdsHelper.AdRefresher.adRefreshRateInMilliseconds = 3000;
          }
        });
      </script>
      <div style="clear:both"></div>
    </div>
  </div>
</div>

<? $pagebuilder->build_footer(); ?>