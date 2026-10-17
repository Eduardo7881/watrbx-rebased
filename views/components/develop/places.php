<?php

use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;
use watrbx\thumbnails;
use Cocur\Slugify\Slugify;
$slugify = new slugify();
$auth = new authentication();
$pagebuilder = new pagebuilder();

?>
<td class="content-area">
                    <a href="/places/create" id="CreatePlace" class="create-new-button btn-medium btn-primary">Create New Place</a>
                    <table class="section-header">
                      <tbody>
                        <tr>
                          <td class="content-title">
                            <div>
                              <h2 class="header-text">Places</h2>
                            </div>
                          </td>
                          <td>
                            <div class="creation-context-filters-and-sorts" data-fetchplaceurl="/build/gamesbycontext?groupId=">
                              <div class="option">
                                <label class="sort-label">Created by:</label>
                                <select class="place-creationcontext-drop-down" size="1">
                                  <option value="NonGameCreation"> Me </option>
                                  <option value="GameAuthorsCreation">My Games</option>
                                  <option value="NonGameAuthorsCreation">Other Games</option>
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr class="creation-context-breadcrumb" style="display:none">
                          <td style="height:21px">
                            <div class="breadCrumb creation-context-breadcrumb">
                              <a href="#breadcrumbs=gamecontext" class="breadCrumbContext">Context</a>
                              <span class="context-game-separator" style="display:none"> » </span>
                              <a href="#breadcrumbs=game" class="breadCrumbGame notranslate" style="display:none">Game</a>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="items-container games-container">
                      <script>
                        function editGameInStudio(play_placeId) {
                          RobloxLaunch._GoogleAnalyticsCallback = function() {
                            var isInsideRobloxIDE = 'website';
                            if (Roblox && Roblox.Client && Roblox.Client.isIDE && Roblox.Client.isIDE()) {
                              isInsideRobloxIDE = 'Studio';
                            };
                            GoogleAnalyticsEvents.FireEvent(['Plugin Location', 'Launch Attempt', isInsideRobloxIDE]);
                            GoogleAnalyticsEvents.FireEvent(['Plugin', 'Launch Attempt', 'Edit']);
                            EventTracker.fireEvent('GameLaunchAttempt_Win32', 'GameLaunchAttempt_Win32_Plugin');
                            if (typeof Roblox.GamePlayEvents != 'undefined') {
                              Roblox.GamePlayEvents.SendClientStartAttempt(null, play_placeId);
                            }
                          };
                          Roblox.Client.WaitForRoblox(function() {
                            if (Roblox.VideoPreRollDFP) {
                              Roblox.VideoPreRollDFP.showVideoPreRoll = false;
                            }
                            RobloxLaunch.StartGame('/Game/edit.ashx?PlaceID=' + play_placeId + '&upload=' + play_placeId, 'edit.ashx', '/Login/Negotiate.ashx', 'FETCH', true);
                          });
                        }
                      </script>
                      <span id="verifiedEmail" style="display:none"></span>
                      <span id="assetLinks" style="display:none" data-asset-links-enabled="True"></span>
                      <?php
                        global $db;
                        global $currentuser;

                        $thumbs = new thumbnails();

                        $allgames = $db->table("assets")->where("owner", $currentuser->id)->where("prodcategory", 9)->get();

                        foreach ($allgames as $game){ 
                          $thumbnail = $thumbs->get_asset_thumb($game->id, "200x200");
                          $universeinfo = $db->table("universes")->where("assetid", $game->id)->first();
                          $universeid = $universeinfo ? $universeinfo->id : 0; // pls dont fail
                          $placeid = $game ? $game->id : 0; // pls dont fail

                          $totalvisits = $db->table("visits")->where("universeid", $game->id)->count();
                          // pls watrabi, store multiple visits rows so i can track 7 days and much more features
                          
                        ?>

                        <table class="item-table" data-item-id="<?=$placeid?>" data-type="game" data-universeid="<?=$universeid?>">
                        <tbody>
                          <tr>
                            <td class="image-col">
                              <a href="/games/<?=$universeid?>/<?=$slugify->slugify($game->name)?>" class="game-image">
                                <img src="<?=$thumbnail?>" alt="<?=htmlspecialchars($game->name)?>" width="70" height="70">
                              </a>
                            </td>
                            <td class="name-col">
                              <a class="title notranslate" href="/games/<?=$universeid?>/<?=$slugify->slugify($game->name)?>"><?=htmlspecialchars($game->name)?></a>
                              <table class="details-table">
                                <tbody>
                                  <tr>
                                    <td class="activate-cell">
                                      <a class="place-active" href="/universes/configure?id=<?=$game->id ?>">
                                          Active
                                      </a>
                                    </td>
                                    <td class="item-date">
                                      <span>Updated:</span><?=date("n/j/Y", $game->updated)?>
                                    </td>
                                    
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                            <td class="stats-col-games">
                              <div class="totals-label">Total Visitors: <span><?=$totalvisits?></span>
                              </div>
                              <div class="totals-label">Last 7 days: <span>0</span>
                              </div>
                            </td>
                            <td class="edit-col">
                              <a class="roblox-edit-button btn-control btn-control-large" href="javascript:">Edit</a>
                            </td>
                            <td class="menu-col">
                              <div class="gear-button-wrapper">
                                <a href="#" class="gear-button"></a>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
<div class="separator"></div>
                        <? } ?>
                      
                      
                      
                    </div>
                    <div class="build-loading-container" style="display:none">
                      <div class="buildpage-loading-container">
                        <img alt="^_^" src="https://images.rbxcdn.com/ec4e85b0c4396cf753a06fade0a8d8af.gif">
                      </div>
                    </div>
                  </td>