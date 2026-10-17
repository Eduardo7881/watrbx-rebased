<?php
use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;

global $db;
global $currentuser;

$pagebuilder = new pagebuilder();
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=main___7000c43d73500e63554d81258494fa21_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___8886b17141736b16771d4f28d5fe2eda_m.css');
$pagebuilder->addresource('jsfiles', '/js/4eedc3a9c944bd9a29f80c2e9668dfdb.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/8220b4ecd0fe4da790391da3fd0b442c.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/59e30cf6dc89b69db06bd17fbf8ca97c.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/f3251ed8271ce1271b831073a47b65e3.js.gzip');
$pagebuilder->addresource('jsfiles', '/js/ec43bbe2464c7dead5f4c5f723965c3a.js.gzip');
$pagebuilder->addresource('jsfiles', '/ScriptResource.axd');
$pagebuilder->setlegacy(true);
$pagebuilder->set_page_name("Groups");
$pagebuilder->buildheader();

$myGroups = [];
if ($currentuser) {
    $myGroups = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->join("groups", "groups.id", "=", "group_roles.groupid")
        ->where("hasrole.userid", $currentuser->id)
        ->select(
            "groups.id",
            "groups.title",
            "groups.description",
            "groups.shout",
            "groups.robux",
            "groups.tix",
            "groups.emblem",
            "group_roles.priority",
            new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`")
        )
        ->get();
}

$selectedGroupId = isset($_GET["gid"]) ? (int)$_GET["gid"] : null;

if (!$selectedGroupId && !empty($myGroups)) {
    $selectedGroupId = $myGroups[0]->id;
}

$selectedGroup  = null;
$groupOwner     = null;
$memberCount    = 0;
$myRoleInGroup  = null;
$isOwner        = false;
$groupWallPosts = [];
$groupMembers   = [];
$groupGames     = [];

if ($selectedGroupId) {
    $selectedGroup = $db->table("groups")->where("id", $selectedGroupId)->first();

    if ($selectedGroup) {
        $ownerRole = $db->table("group_roles")
            ->where("groupid", $selectedGroupId)
            ->where("priority", 255)
            ->first();

        if ($ownerRole) {
            $ownerMembership = $db->table("hasrole")
                ->where("roleid", $ownerRole->id)
                ->first();
            if ($ownerMembership) {
                $auth = new authentication();
                $groupOwner = $auth->getuserbyid($ownerMembership->userid);
            }
        }

        $memberCount = $db->table("hasrole")
            ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
            ->where("group_roles.groupid", $selectedGroupId)
            ->count();

        if ($currentuser) {
            $myRoleInGroup = $db->table("hasrole")
                ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
                ->where("hasrole.userid", $currentuser->id)
                ->where("group_roles.groupid", $selectedGroupId)
                ->select(
                    "group_roles.priority",
                    new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`")
                )
                ->first();
            $isOwner = $myRoleInGroup && $myRoleInGroup->priority == 255;
        }

        $groupWallPosts = $db->table("group_wall")
            ->where("groupid", $selectedGroupId)
            ->orderBy("id", "DESC")
            ->limit(10)
            ->get();

        $groupMembers = $db->table("hasrole")
            ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
            ->join("users", "users.id", "=", "hasrole.userid")
            ->where("group_roles.groupid", $selectedGroupId)
            ->select(
                "users.id",
                "users.username",
                new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`")
            )
            ->get();

        if ($groupOwner) {
            $groupGames = $db->table("universes")
                ->where("owner", $groupOwner->id)
                ->limit(6)
                ->get();
        }
    }
}

$auth   = new authentication();
$thumbs = new \watrbx\thumbnails();

// helper to get emblem url
function groupEmblemUrl($emblem, $size = 150) {
    return $emblem ? '//cdn.knb.qzz.io/' . $emblem : '/images/defaultimage.png';
}
?>

<div id="BodyWrapper">
    <div id="RepositionBody">
        <div id="Body" style="width:970px;">

        <style>
            #Body { padding: 10px; width: 970px; }
        </style>

        <div id="left-column">
            <div class="GroupListContainer StandardBox">
                <div title="Create a new group">
                    <div class="btn-large btn-primary" style="cursor:pointer"
                         onclick="window.location.href='/My/CreateGroup.aspx';">

$myGroups = [];
if ($currentuser) {
    $myGroups = $db->table("hasrole")
        ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
        ->join("groups", "groups.id", "=", "group_roles.groupid")
        ->where("hasrole.userid", $currentuser->id)
        ->select(
            "groups.id",
            "groups.title",
            "groups.description",
            "groups.shout",
            "groups.robux",
            "groups.tix",
            "groups.emblem",
            "group_roles.priority",
            new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`")
        )
        ->get();
}

$selectedGroupId = isset($_GET["gid"]) ? (int)$_GET["gid"] : null;

if (!$selectedGroupId && !empty($myGroups)) {
    $selectedGroupId = $myGroups[0]->id;
}

$selectedGroup  = null;
$groupOwner     = null;
$memberCount    = 0;
$myRoleInGroup  = null;
$isOwner        = false;
$groupWallPosts = [];
$groupMembers   = [];
$groupGames     = [];

if ($selectedGroupId) {
    $selectedGroup = $db->table("groups")->where("id", $selectedGroupId)->first();

    if ($selectedGroup) {
        $ownerRole = $db->table("group_roles")
            ->where("groupid", $selectedGroupId)
            ->where("priority", 255)
            ->first();

        if ($ownerRole) {
            $ownerMembership = $db->table("hasrole")
                ->where("roleid", $ownerRole->id)
                ->first();
            if ($ownerMembership) {
                $auth = new authentication();
                $groupOwner = $auth->getuserbyid($ownerMembership->userid);
            }
        }

        $memberCount = $db->table("hasrole")
            ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
            ->where("group_roles.groupid", $selectedGroupId)
            ->count();

        if ($currentuser) {
            $myRoleInGroup = $db->table("hasrole")
                ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
                ->where("hasrole.userid", $currentuser->id)
                ->where("group_roles.groupid", $selectedGroupId)
                ->select(
                    "group_roles.priority",
                    new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`")
                )
                ->first();
            $isOwner = $myRoleInGroup && $myRoleInGroup->priority == 255;
        }

        $groupWallPosts = $db->table("group_wall")
            ->where("groupid", $selectedGroupId)
            ->orderBy("id", "DESC")
            ->limit(10)
            ->get();

        $groupMembers = $db->table("hasrole")
            ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
            ->join("users", "users.id", "=", "hasrole.userid")
            ->where("group_roles.groupid", $selectedGroupId)
            ->select(
                "users.id",
                "users.username",
                new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`")
            )
            ->get();

        if ($groupOwner) {
            $groupGames = $db->table("universes")
                ->where("owner", $groupOwner->id)
                ->limit(6)
                ->get();
        }
    }
}

$auth   = new authentication();
$thumbs = new \watrbx\thumbnails();

// helper to get emblem url
function groupEmblemUrl($emblem, $size = 150) {
    return $emblem ? '//cdn.watrbx.wtf/' . $emblem : '/images/defaultimage.png';
}
?>
<?php
if($selectedGroupId){
    echo '<input name="GroupId" value="'.$selectedGroupId.'" style="display: none;">';
}
?>
<div id="BodyWrapper">
    <div id="RepositionBody">
        <div id="Body" style="width:970px;">

        <style>
            #Body { padding: 10px; width: 970px; }
        </style>

        <div id="left-column">
            <div class="GroupListContainer StandardBox">
                <div title="Create a new group">
                    <div id="CreateGroupBtn" class="btn-large btn-primary" onclick="window.location.replace('/My/CreateGroup.aspx');">
                        Create
                    </div>
                </div>

                <div id="GroupThumbnails">
                    <?php if (empty($myGroups)): ?>
                        <p style="padding:8px;font-size:11px;color:#555;">You are not in any groups.</p>
                    <?php else: ?>
                        <?php foreach ($myGroups as $g): ?>
                            <div class="GroupListItemContainer <?= $g->id == $selectedGroupId ? 'selected' : '' ?>">
                                <div class="GroupListImageContainer notranslate">
                                    <a title="<?= htmlspecialchars($g->title) ?>"
                                       href="/My/Groups.aspx?gid=<?= $g->id ?>"
                                       style="display:inline-block;height:42px;width:42px;cursor:pointer;">
                                        <img src="<?= groupEmblemUrl($g->emblem ?? null, 42) ?>"
                                             height="42" width="42" border="0"

                                             alt="<?= htmlspecialchars($g->title) ?>" />

                                             alt="<?= htmlspecialchars($g->title) ?>"
                                             style="object-fit: contain;"  />

                                    </a>
                                </div>
                                <div class="GroupListName notranslate">
                                    <?= htmlspecialchars($g->title) ?>
                                </div>
                                <div style="clear:both;"></div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    <div style="clear:both;"></div>
                </div>
            </div>
        </div>

        <div id="mid-column">

            <div id="SearchControls">
                <div class="content">
                    <input type="text" class="SearchKeyword default translate" maxlength="100"
                           value="Search all groups"
                           onclick="if(this.value=='Search all groups')this.value='';" />
                    <input type="submit" value="Search" class="group-search-button translate" />
                </div>
            </div>

            <?php if (!$selectedGroup): ?>
                <div style="padding:20px;">
                    <p>You are not in any groups yet. <a href="/My/CreateGroup.aspx">Create one!</a></p>
                </div>
            <?php else: ?>

            <div id="description">
                <div class="GroupPanelContainer">
                    <div class="left-col">
                        <div class="GroupThumbnail">
                            <img src="<?= groupEmblemUrl($selectedGroup->emblem ?? null) ?>"
                                 height="150" width="150" border="0"

                                 alt="<?= htmlspecialchars($selectedGroup->title) ?>" />

                                 alt="<?= htmlspecialchars($selectedGroup->title) ?>"
                                 style="object-fit: contain;" />

                        </div>
                        <div class="GroupOwner">
                            Owned By:
                            <?php if ($groupOwner): ?>
                                <a style="font-style:italic;" href="/users/<?= $groupOwner->id ?>/profile">
                                    <?= htmlspecialchars($groupOwner->username) ?>
                                </a>
                            <?php else: ?>
                                <em>Unknown</em>
                            <?php endif; ?>
                            <div id="MemberCount">Members: <?= $memberCount ?></div>
                        </div>
                        <?php if ($myRoleInGroup): ?>
                            <div class="MyRank">
                                My Rank: <span class="notranslate"><?= htmlspecialchars($myRoleInGroup->rolename) ?></span>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="right-col">
                        <h2 class="notranslate"><?= htmlspecialchars($selectedGroup->title) ?></h2>
                        <div id="GroupDescP" class="linkify">
                            <pre class="notranslate"><?= htmlspecialchars($selectedGroup->description) ?></pre>
                        </div>

                        <?php if (!$myRoleInGroup): ?>
                            <div id="JoinGroupBtn" class="btn-neutral btn-large"
                                 style="margin-top:10px;cursor:pointer;"
                                 onclick="joinGroup(<?= $selectedGroupId ?>)">
                                Join Group
                            </div>
                            <div id="JoinGroupMsg" style="margin-top:5px;display:none;"></div>
                        <?php endif; ?>

                        <?php if (!empty($selectedGroup->shout)): ?>
                            <div id="GroupStatusPane" class="StatusView" style="margin-top:8px;">
                                <div class="top">
                                    <span class="StatusTextField linkify"><?= htmlspecialchars($selectedGroup->shout) ?></span>
                                    <span class="StatusTextField linkify"><?= $selectedGroup->shout ?></span>
                                </div>
                                <div class="bottom">
                                    <?php if ($groupOwner): ?>
                                        <a href="/users/<?= $groupOwner->id ?>/profile" style="font-style:italic;">
                                            <?= htmlspecialchars($groupOwner->username) ?>
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endif; ?>

                        <?php if ($isOwner): ?>
                            <div class="StatusPostControls" style="margin-top:8px;">
                                <input type="text" id="shoutInput" style="width:228px;" class="default"
                                       placeholder="Enter your shout" />
                                <input type="button" value="Group Shout"
                                       style="position:relative;left:5px;width:89px;padding:1px 0;text-align:center;"
                                       onclick="postShout(<?= $selectedGroupId ?>)" />
                                <div id="shoutMsg" style="margin-top:4px;font-size:11px;"></div>
                            </div>
                        <?php endif; ?>
                    </div>
                    <div style="clear:both;"></div>
                </div>
            </div>

            <div id="GroupsPeopleContainer" class="divider-bottom">
                <div>
                    <div id="GroupsPeople_Games" class="tab active">Games</div>
                    <div id="GroupsPeople_Members" class="tab">Members</div>
                    <div id="GroupsPeople_Allies" class="tab">Allies</div>
                    <div id="GroupsPeople_Enemies" class="tab">Enemies</div>
                    <div id="GroupsPeople_Items" class="tab">Store</div>
                    <div style="clear:both;"></div>
                </div>

                <div id="GroupsPeople_Pane">

                    <div id="GroupsPeoplePane_Games" class="tab-content" style="display:block;">
                        <?php if (empty($groupGames)): ?>
                            <p style="padding:10px;">This group has no games.</p>
                        <?php else: ?>
                            <?php foreach ($groupGames as $game): ?>
                                <div class="GroupPlace">
                                    <div>
                                        <a href="/games/<?= $game->assetid ?>/<?= urlencode($game->title) ?>">
                                            <img src="<?= $thumbs->get_asset_thumb($game->assetid) ?>"
                                                 title="<?= htmlspecialchars($game->title) ?>" />
                                        </a>
                                    </div>
                                    <div class="PlaceName">
                                        <a class="NameText" href="/games/<?= $game->assetid ?>/<?= urlencode($game->title) ?>">
                                            <?= htmlspecialchars($game->title) ?>
                                        </a>
                                    </div>
                                    <div class="PlayersOnline">0 players online</div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                        <div class="clear"></div>
                    </div>

                    <div id="GroupsPeoplePane_Members" class="tab-content" style="display:none;">
                        <?php foreach ($groupMembers as $member): ?>
                            <div class="GroupMember">
                                <div class="Avatar">
                                    <a href="/users/<?= $member->id ?>/profile"
                                       style="display:inline-block;height:100px;width:100px;cursor:pointer;">
                                        <img src="<?= $thumbs->get_user_thumb($member->id, '100x100') ?>"
                                             height="100" width="100" border="0"
                                             alt="<?= htmlspecialchars($member->username) ?>" />
                                    </a>
                                </div>
                                <div class="Summary">
                                    <span class="Name">
                                        <a href="/users/<?= $member->id ?>/profile" class="NameText notranslate">
                                            <?= htmlspecialchars($member->username) ?>
                                        </a>
                                    </span>
                                    <span style="font-size:10px;color:#888;">
                                        <?= htmlspecialchars($member->rolename) ?>
                                    </span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                        <div style="clear:both;"></div>
                    </div>

                    <div id="GroupsPeoplePane_Allies" class="tab-content" style="display:none;">
                        <p style="padding:10px;">No allies.</p>
                    </div>

                    <div id="GroupsPeoplePane_Enemies" class="tab-content" style="display:none;">
                        <p style="padding:10px;">No enemies.</p>
                    </div>

                    <div id="GroupsPeoplePane_Items" class="tab-content" style="display:none;">
                        <div id="GroupItemPaneInstructions">
                            <p>Groups have the ability to create and sell official shirts, pants, and t-shirts!</p>
                        </div>
                        <div id="GroupItemContent">
                            <div id="GroupItemPaneContent"></div>
                            <div style="clear:both;text-align:center;padding-top:25px;">
                                <a href="/catalog/browse.aspx?CreatorID=<?= $selectedGroupId ?>">
                                    See more items for sale by this group
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div id="GroupWallPane">
                <div class="StandardBox" style="margin-bottom:0;border-bottom:none;">
                    <span class="InsideBoxHeader">Wall</span>
                    <?php if ($currentuser && $myRoleInGroup): ?>
                        <div id="WallPostBox">
                            <textarea id="wallPostInput" rows="2" class="GroupWallPostText" style="width:85%;"></textarea>
                            <input type="button" value="Post"
                                   class="btn-control btn-control-large GroupWallPostBtn translate"
                                   onclick="postWall(<?= $selectedGroupId ?>)" />
                            <div id="wallPostMsg" style="margin-top:4px;font-size:11px;"></div>
                        </div>
                    <?php endif; ?>
                    <div style="clear:both;"></div>
                </div>

                <div class="StandardBox GroupWallPane" style="background:#fff;border-top:none;">
                    <?php if (empty($groupWallPosts)): ?>
                        <p style="padding:10px;">No wall posts yet.</p>
                    <?php else: ?>
                        <?php foreach ($groupWallPosts as $i => $post):
                            $poster = $auth->getuserbyid($post->userid);
                            if (!$poster) continue;
                            $rowClass = ($i % 2 === 0) ? 'AlternatingItemTemplateOdd' : 'AlternatingItemTemplateEven';
                        ?>
                            <div class="<?= $rowClass ?>">
                                <div class="RepeaterImage">
                                    <a href="/users/<?= $poster->id ?>/profile"
                                       style="display:inline-block;height:100px;width:100px;cursor:pointer;">
                                        <img src="<?= $thumbs->get_user_thumb($poster->id, '100x100') ?>"
                                             height="100" width="100" border="0"
                                             alt="<?= htmlspecialchars($poster->username) ?>" />
                                    </a>
                                </div>
                                <div class="RepeaterText">
                                    <div class="GroupWall_PostContainer notranslate linkify">
                                        <?= htmlspecialchars($post->content) ?>
                                    </div>
                                    <div class="GroupWall_PostDate">
                                        <span style="color:gray;"><?= date('m/d/Y g:i:s A', $post->date) ?></span>
                                        by
                                        <span class="UserLink notranslate">
                                            <a href="/users/<?= $poster->id ?>/profile">
                                                <?= htmlspecialchars($poster->username) ?>
                                            </a>
                                        </span>
                                        <?php if ($isOwner): ?>
                                            <div style="float:right;">
                                                <a href="/api/v1/group-wall-delete?postId=<?= $post->id ?>"
                                                   style="line-height:26px;float:left;">Delete</a>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <div style="clear:both;"></div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <?php endif; ?>
        </div>

        <div id="right-column">
            <?php if ($selectedGroup): ?>
                <div class="StandardBox" style="padding-right:0;">
                    <b>Funds:</b>
                    <span class="robux" style="margin-left:5px;"><?= (int)$selectedGroup->robux ?></span>
                    <span class="tickets" style="margin-left:5px;"><?= (int)$selectedGroup->tix ?></span>
                </div>

                <div class="GroupControlsBox">
                    <span class="InsideBoxHeader">Controls</span>

                    <?php if ($isOwner): ?>
                        <div>
                            <input type="submit" value="Group Admin"

                            <input type="submit" value="Group Admin" name="GroupAdmin"

                                   onclick="location.href='/my/groupadmin.aspx?gid=<?= $selectedGroupId ?>';"
                                   class="btn-control btn-control-medium translate" />
                        </div>
                        <div>
                            <input type="submit" value="Advertise Group"
                                   onclick="location.href='/My/NewUserAd.aspx?targetId=<?= $selectedGroupId ?>&targettype=Group';"
                                   class="btn-control btn-control-medium translate" />
                        </div>
                        <div>
                            <input type="submit" value="Audit Log"
                                   onclick="location.href='/Groups/Audit.aspx?groupid=<?= $selectedGroupId ?>';"
                                   class="btn-control btn-control-medium translate" />
                        </div>

                    <?php elseif ($myRoleInGroup): ?>
                        <div>
                            <input type="submit" value="Leave Group"
                                   onclick="if(confirm('Are you sure you\'d like to leave this group?')) location.href='/api/v1/group-leave?groupId=<?= $selectedGroupId ?>';"
                                   class="btn-control btn-control-medium translate" />
                        </div>
                    <?php endif; ?>

                    <?php if ($myRoleInGroup): ?>
                        <div>
                            <input type="submit" value="Make Primary"
                                   onclick="if(confirm('Are you sure you want to make this your primary group?')) location.href='/api/v1/group-setprimary?groupId=<?= $selectedGroupId ?>';"
                                   class="btn-control btn-control-medium translate" />
                        </div>
                        <div>
                            <input type="submit" value="Leave Group"
                                   onclick="if(confirm('Are you sure you\'d like to leave this group?')) location.href='/api/v1/group-leave?groupId=<?= $selectedGroupId ?>';"
                                   class="btn-control btn-control-medium translate" />
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <div id="ad" style="height:600px;">
                <iframe allowtransparency="true" frameborder="0" height="612"
                        scrolling="no" src="/userads/2" width="160"></iframe>
            </div>
        </div>

        <br style="clear:both;" />
        </div>
    </div>
</div>

<script type="text/javascript">
function joinGroup(groupId) {
    var btn = document.getElementById('JoinGroupBtn');
    var msg = document.getElementById('JoinGroupMsg');
    btn.style.opacity = '0.5';

    var form = new FormData();
    form.append('groupId', groupId);

    fetch('/api/v1/group-join', { method: 'POST', body: form })
        .then(function(r){ return r.json(); })
        .then(function(data){
            if (data.success) {
                btn.style.display = 'none';
                msg.style.display = 'block';
                msg.style.color = 'green';
                msg.innerText = 'You have joined the group!';
                setTimeout(function(){ location.reload(); }, 1000);
            } else {
                btn.style.opacity = '1';
                msg.style.display = 'block';
                msg.style.color = 'red';
                msg.innerText = data.error || 'Something went wrong.';
            }
        });
}

function postShout(groupId) {
    var input = document.getElementById('shoutInput');
    var msg   = document.getElementById('shoutMsg');
    var shout = input.value.trim();

    if (!shout) { msg.style.color='red'; msg.innerText='Shout cannot be empty.'; return; }

    var form = new FormData();
    form.append('groupId', groupId);
    form.append('shout', shout);

    fetch('/api/v1/group-shout', { method: 'POST', body: form })
        .then(function(r){ return r.json(); })
        .then(function(data){
            if (data.success) {
                msg.style.color = 'green';
                msg.innerText = 'Shout updated!';
                input.value = '';
            } else {
                msg.style.color = 'red';
                msg.innerText = data.error || 'Something went wrong.';
            }
        });
}

function postWall(groupId) {
    var input = document.getElementById('wallPostInput');
    var msg   = document.getElementById('wallPostMsg');
    var post  = input.value.trim();

    if (!post) { msg.style.color='red'; msg.innerText='Post cannot be empty.'; return; }

    var form = new FormData();
    form.append('groupId', groupId);
    form.append('post', post);

    fetch('/api/v1/group-wall-post', { method: 'POST', body: form })
        .then(function(r){ return r.json(); })
        .then(function(data){
            if (data.success) {
                msg.style.color = 'green';
                msg.innerText = 'Posted!';
                input.value = '';
                setTimeout(function(){ location.reload(); }, 500);
            } else {
                msg.style.color = 'red';
                msg.innerText = data.error || 'Something went wrong.';
            }
        });
}
</script>

<?php $pagebuilder->build_footer(); ?>
