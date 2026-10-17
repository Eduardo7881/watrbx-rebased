<?php
use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;

global $db;
global $currentuser;

if (!$currentuser) {
    header("Location: /newlogin");
    exit;
}

if (!isset($_GET["gid"])) {
    header("Location: /my/groups.aspx");
    exit;
}

$groupId = (int)$_GET["gid"];

// get group info
$group = $db->table("groups")->where("id", $groupId)->first();

if (!$group) {
    header("Location: /my/groups.aspx");
    exit;
}

// check if current user is owner or has high enough role
$myRole = $db->table("hasrole")
    ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
    ->where("hasrole.userid", $currentuser->id)
    ->where("group_roles.groupid", $groupId)
    ->select("group_roles.priority", new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`"))
    ->first();

if (!$myRole || $myRole->priority < 100) {
    header("Location: /my/groups.aspx?gid=" . $groupId);
    exit;
}

$isOwner = $myRole->priority == 255;

// get all members
$members = $db->table("hasrole")
    ->join("group_roles", "group_roles.id", "=", "hasrole.roleid")
    ->join("users", "users.id", "=", "hasrole.userid")
    ->where("group_roles.groupid", $groupId)
    ->select(
        "users.id",
        "users.username",
        new \Pixie\QueryBuilder\Raw("`hasrole`.`id` as `hasroleid`"), 
        "group_roles.priority",
        new \Pixie\QueryBuilder\Raw("`group_roles`.`name` as `rolename`"),
        new \Pixie\QueryBuilder\Raw("`group_roles`.`id` as `roleid`")
    )
    ->orderBy("group_roles.priority", "DESC")
    ->get();

// get all roles for this group
$roles = $db->table("group_roles")
    ->where("groupid", $groupId)
    ->orderBy("priority", "DESC")
    ->get();

// get owner
$ownerRole = $db->table("group_roles")
    ->where("groupid", $groupId)
    ->where("priority", 255)
    ->first();

$groupOwner = null;
if ($ownerRole) {
    $ownerMembership = $db->table("hasrole")->where("roleid", $ownerRole->id)->first();
    if ($ownerMembership) {
        $auth = new authentication();
        $groupOwner = $auth->getuserbyid($ownerMembership->userid);
    }
}

$auth   = new authentication();
$thumbs = new \watrbx\thumbnails();

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
$pagebuilder->set_page_name("Group Admin - " . htmlspecialchars($group->title));
$pagebuilder->buildheader();
?>

</form>
<div id="BodyWrapper">
    <div id="RepositionBody">
        <div id="Body" class="body-width">

        <style>
            #Body { padding: 10px; width: 970px; }
        </style>

        <div>
            <h2><?= htmlspecialchars($group->title) ?></h2>
        </div>
        <div id="GroupTitle">
            <div>Owned By:
                <?php if ($groupOwner): ?>
                    <a style="color:Purple;font-style:italic;" href="/users/<?= $groupOwner->id ?>/profile">
                        <?= htmlspecialchars($groupOwner->username) ?>
                    </a>
                <?php else: ?>
                    <em>Unknown</em>
                <?php endif; ?>
            </div>
            <div>Group Funds: <span class="robux"><?= (int)$group->robux ?></span></div>
        </div>

        <hr style="clear:both;">

        <div class="divider-right menu-area GroupAdminMenu">
            <div class="verticaltab selected" id="membersTab"><a href="#nav-members">Members</a></div>
            <div class="verticaltab" id="groupInfoTab"><a href="#nav-groupInfo">Group Info</a></div>
            <div class="verticaltab" id="rolesTab"><a href="#nav-roles">Roles</a></div>
            <div class="back-to-groups">
                <a class="btn-control btn-control-medium translate"
                   href="/my/groups.aspx?gid=<?= $groupId ?>">Back To My Groups</a>
            </div>
        </div>

        <div id="content" class="content-area">

            <!-- MEMBERS TAB -->
            <div id="members" class="GroupAdminContent">
                <div id="MembersContainer" class="GroupAdminSubsection">
                    <h2>Members</h2>
                    <br>
                    <div class="GroupAdmin">
                        <?php foreach ($members as $member):
                            if ($member->priority == 255) continue; // skip owner, can't kick them
                        ?>
                            <div class="GroupMember">
                                <?php if ($isOwner || $myRole->priority > $member->priority): ?>
                                    <div class="dropdown">
                                        <div class="button gear init"></div>
                                        <ul class="dropdown-list" style="min-width:40px;display:none;">
                                            <li>
                                                <a href="/api/v1/group-kick?groupId=<?= $groupId ?>&userId=<?= $member->id ?>"
                                                   onclick="return confirm('Kick <?= htmlspecialchars($member->username) ?>?');">
                                                    Kick User
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                <?php endif; ?>
                                <div class="MemberThumbnail">
                                    <span class="avatar avatar-headshot-sm card-plain">
                                        <img src="<?= $thumbs->get_user_thumb($member->id, '150x150', 'headshot') ?>"
                                             class="avatar-card-image">
                                    </span>
                                </div>
                                <div class="RepeaterText">
                                    <div class="member-name-container">
                                        <a class="notranslate" href="/users/<?= $member->id ?>/profile">
                                            <?= htmlspecialchars($member->username) ?>
                                        </a>
                                    </div>
                                </div>
                                <?php if ($isOwner || $myRole->priority > $member->priority): ?>
                                    <form method="POST" action="/api/v1/group-change-role" style="display:inline;">
                                        <input type="hidden" name="groupId" value="<?= $groupId ?>">
                                        <input type="hidden" name="userId" value="<?= $member->id ?>">
                                        <select name="roleId" style="width:100px;"
                                                onchange="this.form.submit()">
                                            <?php foreach ($roles as $role):
                                                if ($role->priority == 255) continue;
                                            ?>
                                                <option value="<?= $role->id ?>"
                                                    <?= $role->id == $member->roleid ? 'selected' : '' ?>>
                                                    <?= htmlspecialchars($role->name) ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </form>
                                <?php else: ?>
                                    <span style="font-size:11px;color:#888;"><?= htmlspecialchars($member->rolename) ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="item-separator"></div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- GROUP INFO TAB -->
            <div id="groupInfo" class="GroupAdminContent" style="display:none;">
                <div class="GroupAdminSubsection" style="display:inline-block;">
                    <h2>Group Information</h2>
                    <br>
                    <?php if ($isOwner): ?>
                        <form method="POST" action="/api/v1/group-update?groupId=<?= $groupId ?>">
                            <div style="margin:10px;">
                                <label>Description</label><br>
                                <textarea name="description" rows="5" style="width:400px;"
                                          class="GroupDescriptionEdit"><?= htmlspecialchars($group->description) ?></textarea>
                            </div>
                            <div style="text-align:center;">
                                <input type="submit" value="Save" class="btn-small btn-primary" />
                            </div>
                        </form>
                    <?php else: ?>
                        <p><?= htmlspecialchars($group->description) ?></p>
                    <?php endif; ?>
                </div>
            </div>

            
            .avatar-card-image {
                width: 150px;
            }
        </style>

        <div>
            <h2><?= htmlspecialchars($group->title) ?></h2>
        </div>
        <div id="GroupTitle">
            <div>Owned By:
                <?php if ($groupOwner): ?>
                    <a style="color:Purple;font-style:italic;" href="/users/<?= $groupOwner->id ?>/profile">
                        <?= htmlspecialchars($groupOwner->username) ?>
                    </a>
                <?php else: ?>
                    <em>Unknown</em>
                <?php endif; ?>
            </div>
            <div>Group Funds: <span class="robux"><?= (int)$group->robux ?></span></div>
        </div>

        <hr style="clear:both;">

        <div class="divider-right menu-area GroupAdminMenu">
            <div class="verticaltab selected" id="membersTab"><a href="#nav-members">Members</a></div>
            <div class="verticaltab" id="groupInfoTab"><a href="#nav-groupInfo">Group Info</a></div>
            <div class="verticaltab" id="rolesTab"><a href="#nav-roles">Roles</a></div>
            <div class="back-to-groups">
                <a class="btn-control btn-control-medium translate"
                   href="/my/groups.aspx?gid=<?= $groupId ?>">Back To My Groups</a>
            </div>
        </div>

        <div id="content" class="content-area">

            <!-- MEMBERS TAB -->
            <div id="members" class="GroupAdminContent">
                <div id="MembersContainer" class="GroupAdminSubsection">
                    <h2>Members</h2>
                    <br>
                    <div class="GroupAdmin">
                        <?php foreach ($members as $member):
                            if ($member->priority == 255) continue; // skip owner, can't kick them
                        ?>
                            <div class="GroupMember">
                                <?php if ($isOwner || $myRole->priority > $member->priority): ?>
                                    <div class="dropdown">
                                        <div class="button gear init"></div>
                                        <ul class="dropdown-list" style="min-width:40px;display:none;">
                                            <li>
                                                <a href="/api/v1/group-kick?groupId=<?= $groupId ?>&userId=<?= $member->id ?>"
                                                   onclick="return confirm('Kick <?= htmlspecialchars($member->username) ?>?');">
                                                    Kick User
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                <?php endif; ?>
                                <div class="MemberThumbnail">
                                    <span class="avatar avatar-headshot-sm card-plain">
                                        <img src="<?= $thumbs->get_user_thumb($member->id, '150x150', 'headshot') ?>"
                                             class="avatar-card-image">
                                    </span>
                                </div>
                                <div class="RepeaterText">
                                    <div class="member-name-container">
                                        <a class="notranslate" href="/users/<?= $member->id ?>/profile">
                                            <?= htmlspecialchars($member->username) ?>
                                        </a>
                                    </div>
                                </div>
                                <?php if ($isOwner || $myRole->priority > $member->priority): ?>
                                    <form method="POST" action="/api/v1/group-change-role" style="display:inline;">
                                        <input type="hidden" name="groupId" value="<?= $groupId ?>">
                                        <input type="hidden" name="userId" value="<?= $member->id ?>">
                                        <select name="roleId" style="width:100px;"
                                                onchange="this.form.submit()">
                                            <?php foreach ($roles as $role):
                                                if ($role->priority == 255) continue;
                                            ?>
                                                <option value="<?= $role->id ?>"
                                                    <?= $role->id == $member->roleid ? 'selected' : '' ?>>
                                                    <?= htmlspecialchars($role->name) ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </form>
                                <?php else: ?>
                                    <span style="font-size:11px;color:#888;"><?= htmlspecialchars($member->rolename) ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="item-separator"></div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- GROUP INFO TAB -->
            <div id="groupInfo" class="GroupAdminContent" style="display:none;">
                <div class="GroupAdminSubsection" style="display:inline-block;">
                    <h2>Group Information</h2>
                    <br>
                    <?php if ($isOwner): ?>
                        <form method="POST" action="/api/v1/group-update?groupId=<?= $groupId ?>">
                            <div style="margin:10px;">
                                <label>Description</label><br>
                                <textarea name="description" rows="5" style="width:400px;"
                                          class="GroupDescriptionEdit"><?= htmlspecialchars($group->description) ?></textarea>
                            </div>
                            <div style="text-align:center;">
                                <input type="submit" value="Save" class="btn-small btn-primary" />
                            </div>
                        </form>
                    <?php else: ?>
                        <p><?= htmlspecialchars($group->description) ?></p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- ROLES TAB -->
            <div id="roles" class="GroupAdminContent" style="display:none;">
                <div class="GroupAdminSubsection">
                    <h2>Roles</h2>
                    <br>
                    <table class="table" cellpadding="0" cellspacing="0" border="0">
                        <thead>
                            <tr class="table-header">
                                <th class="first">Name</th>
                                <th>Rank</th>
                                <?php if ($isOwner): ?><th>Actions</th><?php endif; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($roles as $role): ?>
                                <tr>
                                    <td><?= htmlspecialchars($role->name) ?></td>
                                    <td><?= (int)$role->priority ?></td>
                                    <?php if ($isOwner): ?>
                                        <td>
                                            <?php if ($role->priority !== 255 && $role->priority !== 0): ?>
                                                <a href="/api/v1/group-delete-role?groupId=<?= $groupId ?>&roleId=<?= $role->id ?>"
                                                   onclick="return confirm('Delete role <?= htmlspecialchars($role->name) ?>?');"
                                                   class="btn-control btn-control-medium">Delete</a>
                                            <?php endif; ?>
                                        </td>
                                    <?php endif; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>

                    <?php if ($isOwner): ?>
                        <br>
                        <h3>Create New Role</h3>
                        <form method="POST" action="/api/v1/group-create-role?groupId=<?= $groupId ?>">
                            <input type="text" name="name" placeholder="Role Name" maxlength="100" required>
                            <input type="number" name="priority" placeholder="Rank (1-254)" min="1" max="254" required>
                            <input type="submit" value="Create" class="btn-control btn-control-medium">
                        </form>
                    <?php endif; ?>
                </div>
            </div>

        </div>

        <div style="clear:both;"></div>
        </div>
    </div>
</div>

<script type="text/javascript">
$(function () {
    var contents = $('#content');
    $('.divider-right.menu-area .verticaltab').on("click", function () {
        var selId = $(this).attr('id');
        $('.divider-right.menu-area .verticaltab').each(function () {
            ($(this).attr('id') == selId) ? $(this).addClass('selected') : $(this).removeClass('selected');
        });
        contents.children('div').each(function () {
            ($(this).attr('id') + "Tab" == selId) ? $(this).show() : $(this).hide();
        });
    });
    $('.divider-right.menu-area .verticaltab').first().click();
});
</script>

<?php $pagebuilder->build_footer(); ?>
