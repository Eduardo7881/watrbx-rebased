<?php
use watrlabs\watrkit\pagebuilder;

$page = new pagebuilder();
$page->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=main___7000c43d73500e63554d81258494fa21_m.css');
$page->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___8886b17141736b16771d4f28d5fe2eda_m.css');
$page->addresource('jsfiles', '/js/4eedc3a9c944bd9a29f80c2e9668dfdb.js.gzip');
$page->addresource('jsfiles', '/js/8220b4ecd0fe4da790391da3fd0b442c.js.gzip');
$page->addresource('jsfiles', '/js/59e30cf6dc89b69db06bd17fbf8ca97c.js.gzip');
$page->addresource('jsfiles', '/js/f3251ed8271ce1271b831073a47b65e3.js.gzip');
$page->addresource('jsfiles', '/js/ec43bbe2464c7dead5f4c5f723965c3a.js.gzip');
$page->addresource('jsfiles', '/ScriptResource.axd');
$page->setlegacy(true);
$page->set_page_name("Create Group");
$page->buildheader();

global $currentuser;

if (!$currentuser) {
    header("Location: /newlogin");
    exit;
}
?>

<?php if (!empty($error)): ?>
    <p style="color:red;"><?= htmlspecialchars($error) ?></p>
<?php endif; ?>

<?php
global $currentuser;

if (!$currentuser) {
    header("Location: /newlogin");
    exit;
}
?>

<?php if (!empty($error)): ?>
    <p style="color:red;"><?= htmlspecialchars($error) ?></p>
<?php endif; ?>

<div id="BodyWrapper">
    <div id="RepositionBody">
        <div id="Body" style="width:970px;padding:20px;">

            <h1>Create Group</h1>

            <form method="POST" action="/my/creategroup.aspx" enctype="multipart/form-data">
                <div style="margin-bottom:10px;">
                    <label>Group Name</label><br>
                    <input type="text" name="name" maxlength="50"
                           value="<?= htmlspecialchars($_POST['name'] ?? '') ?>"
                           style="width:300px;" required>
                </div>
                <div style="margin-bottom:10px;">
                    <label>Description</label><br>
                    <textarea name="description" rows="5" style="width:300px;"
                    ><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
                </div>
                <div style="margin-bottom:10px;">
                    <label>Group Emblem (optional)</label><br>
                    <input type="file" name="emblem" accept="image/*">
                    <br>
                    <small style="color:#888;">Recommended: square image, PNG or JPG.</small>
                </div>

                <button type="submit" class="btn-large btn-primary">Create Group</button>
                <input type="submit" class="btn-large btn-primary" value="Create Group">
            </form>

        </div>
    </div>
</div>
<?=$page->build_footer();?>
