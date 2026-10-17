<?php 
use watrlabs\watrkit\pagebuilder;
use watrlabs\authentication;
use watrbx\gameserver;
$gameserver = new gameserver();
$pagebuilder = new pagebuilder();
$auth = new authentication();
$auth->requiresession();
global $currentuser;
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=leanbase___fda3e1484c646a2dacdc1d4f7238b091_m.css');
$pagebuilder->addresource('cssfiles', '/CSS/Base/CSS/FetchCSS?path=page___b20a9ce37814c8ad660c1ac93362fe25_m.css');

$pagebuilder->addresource('jsfiles', '/js/7d13e3379e372e07bf054bef36861305.js.gzip');

$pagebuilder->addresource('jsfiles', '/js/d849afd828ec9246ad457b640dbb54b3.js.gzip?t=3');

$pagebuilder->addresource('jsfiles', '/js/d03710605a8eb25ee026670046b51a9a.js.gzip');

$pagebuilder->addresource('jsfiles', '/js/ec5a4736748f2fbe4ce160e5d15b71f7.js.gzip');

$pagebuilder->addresource('jsfiles', '/js/4f8051eafc2560cc4bc34be4280598fd.js.gzip');

$pagebuilder->addresource('jsfiles', '/js/fdd3d60fbc80594033aebd8c3d24e6a9.js.gzip');


$pagebuilder->set_page_name("Account");
$pagebuilder->setlegacy(false);
$pagebuilder->buildheader();

$auth->createcsrf("account");

$allservers = $gameserver->get_all_servers();
$allthemes = (new \watrbx\themes())->getAllThemes();

if(isset($newblurb)){
  $blurb = $newblurb;
} else {
  $blurb = $currentuser->about;
}

?>

<div class="container-main  
                 
                
                
                ">
            <script type="text/javascript">
                if (top.location != self.location) {
                    top.location = self.location.href;
                }
            </script>
        <noscript>&lt;div&gt;&lt;div class="alert-info" role="alert"&gt;Please enable Javascript to use all the features on this site.&lt;/div&gt;&lt;/div&gt;</noscript>
        <div class="content ">

                                    


<script type="text/javascript">
    var Roblox = Roblox || {};
    Roblox.uiBootstrap = {};
    Roblox.uiBootstrap = {
        tooltipPopupTemplateLink: "/viewapp/common/template/tooltip/tooltip-popup.html",
        tooltipHtmlUnsafePopupTemplateLink: "/viewapp/common/template/tooltip/tooltip-html-unsafe-popup.html",
        popoverPopupTemplateLink: "/viewapp/common/template/popover/popover.html",
        popoverListTemplateLink: "/viewapp/common/template/popover/popover-list.html",
        modalBackdropTemplateLink: "/viewapp/common/template/modal/backdrop.html",
        modalWindowTemplateLink: "/viewapp/common/template/modal/window.html",

    };
    Roblox.AccountTemplates = {
        infoTemplateUrl: "accounts-info",
        socialTemplateUrl: "accounts-social",
        securityTemplateUrl: "accounts-security",
        privacyTemplateUrl: "accounts-privacy",
        billingTemplateUrl: "accounts-billing",
        preferencesTemplateUrl: "accounts-preferences",
        modalAddPasswordTemplateUrl: "modal-add-password",
        modalUpdateEmailTemplateUrl: "modal-update-email",
        modalChangeEmailTemplateUrl: "modal-change-email",
        modalChangeUserNameTemplateUrl: "modal-change-username",
        modalGenericResponseTemplateUrl: "modal-generic-response",
        modalInsufficientFundsTemplateUrl: "modal-insufficient-funds",
        modalChangePasswordTemplateUrl: "modal-change-password"
    }
</script>

<input name="__RequestVerificationToken" type="hidden" value="7gS6lTm8IyQhDPMnLd0uGQckcXIVf0905eki4-Gets1F5DmpXrXDKeS11Bq7gDLWDcYQIxzRV-lXjP5yOa7vGpHfTZx3SWYe0PV2m9QQ57hJH6IE0">

<div class="row page-content new-username-pwd-rule ng-scope" data-v2-username-password-rules-enabled="1" ng-modules="robloxApp, robloxApp.helpers, accounts, ui.bootstrap" ng-controller="accountsController" id="user-account">
<div id="state-properties" data-countries="[{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Choose a Country&quot;,&quot;Value&quot;:&quot;0&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Australia&quot;,&quot;Value&quot;:&quot;11&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Belgium&quot;,&quot;Value&quot;:&quot;27&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Brazil&quot;,&quot;Value&quot;:&quot;13&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Canada&quot;,&quot;Value&quot;:&quot;9&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Denmark&quot;,&quot;Value&quot;:&quot;15&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Finland&quot;,&quot;Value&quot;:&quot;32&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;France&quot;,&quot;Value&quot;:&quot;4&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Germany&quot;,&quot;Value&quot;:&quot;2&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Indonesia&quot;,&quot;Value&quot;:&quot;30&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Ireland&quot;,&quot;Value&quot;:&quot;7&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Israel&quot;,&quot;Value&quot;:&quot;29&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Italy&quot;,&quot;Value&quot;:&quot;6&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Lithuania&quot;,&quot;Value&quot;:&quot;28&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Malaysia&quot;,&quot;Value&quot;:&quot;19&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Mexico&quot;,&quot;Value&quot;:&quot;25&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Netherlands&quot;,&quot;Value&quot;:&quot;3&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;New Zealand&quot;,&quot;Value&quot;:&quot;12&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Norway&quot;,&quot;Value&quot;:&quot;21&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Philippines&quot;,&quot;Value&quot;:&quot;14&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Poland&quot;,&quot;Value&quot;:&quot;18&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Portugal&quot;,&quot;Value&quot;:&quot;8&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Romania&quot;,&quot;Value&quot;:&quot;22&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Russia&quot;,&quot;Value&quot;:&quot;31&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Saudi Arabia&quot;,&quot;Value&quot;:&quot;26&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Singapore&quot;,&quot;Value&quot;:&quot;24&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Spain&quot;,&quot;Value&quot;:&quot;5&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Sweden&quot;,&quot;Value&quot;:&quot;16&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Thailand&quot;,&quot;Value&quot;:&quot;23&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;Turkey&quot;,&quot;Value&quot;:&quot;20&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;United Arab Emirates&quot;,&quot;Value&quot;:&quot;17&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;United Kingdom&quot;,&quot;Value&quot;:&quot;10&quot;},{&quot;Disabled&quot;:false,&quot;Group&quot;:null,&quot;Selected&quot;:false,&quot;Text&quot;:&quot;United States&quot;,&quot;Value&quot;:&quot;1&quot;}]" data-cancelrenewalurl="https://www.roblox.com/upgrades/cancel-subscription" data-upgrademembershipurl="https://www.roblox.com/premium/membership" data-buyrobuxurl="https://www.roblox.com/upgrades/robux" data-checkifinvalidusernameforsignup="https://www.roblox.com/usercheck/checkifinvalidusernameforsignup" data-is2svenabledforsettings="true" account-state-properties="" account-data="accountData" class="hidden ng-isolate-scope"></div><div id="notification-settings" data-can-toggle-mobile-push-notifications="True" data-notifications-domain="https://notifications.roblox.com">
</div>

     <h1 class="user-account-header">My Settings</h1>
      <div class="tab-dropdown">
          <div class="input-group-btn" dropdown="">
              <button type="button" dropdown-toggle="" class="input-dropdown-btn" ng-disabled="disabled" aria-haspopup="true" aria-expanded="false">
                  <span class="rbx-selection-label ng-binding">Account Info</span>
                  <span class="icon-down-16x16"></span>
              </button>
              <ul class="dropdown-menu" role="menu">
                  <!-- ngRepeat: tab in accountsTabs --><li ui-sref="info" class="ng-scope">
                      <a class="ng-binding">Account Info</a>
                  </li><!-- end ngRepeat: tab in accountsTabs --><li  ui-sref="security" class="ng-scope">
                      <a class="ng-binding">Security</a>
                  </li><!-- end ngRepeat: tab in accountsTabs --><li  ui-sref="privacy" class="ng-scope">
                      <a class="ng-binding">Privacy</a>
                  </li><!-- end ngRepeat: tab in accountsTabs --><li  ui-sref="billing" class="ng-scope">
                      <a class="ng-binding">Billing</a>
                  </li><!-- end ngRepeat: tab in accountsTabs -->
                  <li  ui-sref="Preferences" class="ng-scope">
                      <a class="ng-binding">Preferences</a>
                  </li><!-- end ngRepeat: tab in accountsTabs -->
              </ul>
          </div>
      </div>

    <div class="rbx-tabs-horizontal">
        <ul id="horizontal-tabs" class="nav nav-tabs" role="tablist" ng-init="currentData.activeTab">
            <!-- ngRepeat: tab in accountsTabs --><li class="rbx-tab ng-scope"  ng-class="{'active': currentData.activeTab == tab.name}" ui-sref="info" style="width: 20%;">
                <a class="rbx-tab-heading">
                    <span class="text-lead ng-binding">Account Info</span>
                </a>
            </li><!-- end ngRepeat: tab in accountsTabs --><li class="rbx-tab ng-scope"  ng-class="{'active': currentData.activeTab == tab.name}" ui-sref="security" style="width: 20%;">
                <a class="rbx-tab-heading">
                    <span class="text-lead ng-binding">Security</span>
                </a>
            </li><!-- end ngRepeat: tab in accountsTabs --><li class="rbx-tab ng-scope" ng-class="{'active': currentData.activeTab == tab.name}" ui-sref="privacy" style="width: 20%;">
                <a class="rbx-tab-heading">
                    <span class="text-lead ng-binding">Privacy</span>
                </a>
            </li><!-- end ngRepeat: tab in accountsTabs --><li class="rbx-tab ng-scope" ng-class="{'active': currentData.activeTab == tab.name}" ui-sref="billing" style="width: 20%;">
                <a class="rbx-tab-heading">
                    <span class="text-lead ng-binding">Billing</span>
                </a>
            </li><!-- end ngRepeat: tab in accountsTabs -->
            <li class="rbx-tab ng-scope" ng-class="{'active': currentData.activeTab == tab.name}" ui-sref="Preferences" style="width: 20%;">
                <a class="rbx-tab-heading">
                    <span class="text-lead ng-binding">Preferences</span>
                </a>
            </li>
        </ul>
    </div>

        <!-- uiView:  -->
<div class="tab-content rbx-tab-content ng-scope" ui-view="" ng-controller="accountsContentController">
  <div class="section ng-scope">
    <h3>Account Info</h3>
    <div class="section-content settings-account-info-container">
      <div class="col-sm-12">
        <div class="form-group">
          <span class="text-label account-settings-label">Username:</span>
          <span class="account-field-username ng-binding"><?=$currentuser->username?></span>
          <span class="account-change-username icon-edit" title="Change Username" ng-click="changeUsername()"></span>
        </div>
        <div class="form-group">
          <span class="text-label account-settings-label">Password:</span>
          <span class="account-field-password" ng-hide="accountContent.userInfo.data.IsSetPasswordNotificationEnabled">*******</span>
          <span class="account-field-password-needed ng-hide" ng-show="accountContent.userInfo.data.IsSetPasswordNotificationEnabled">
            <span class="icon-warning"></span> Add Password </span>
          <span class="account-change-password icon-edit" title="Change Password" ng-hide="accountContent.userInfo.data.IsSetPasswordNotificationEnabled" ng-click="changePassword()"></span>
          <span class="account-change-password icon-edit ng-hide" title="Add Password" ng-show="accountContent.userInfo.data.IsSetPasswordNotificationEnabled" ng-click="addPassword()"></span>
        </div>
        <div class="form-group ng-hide" ng-show="accountContent.userInfo.data.PreviousUserNames!=''">
          <span class="account-previous-usernames">(Previous usernames: <span class="account-previous-username-list ng-binding"></span> ) </span>
        </div>
        <div class="form-group">
          <span class="text-label account-settings-label ng-binding"> Email address:</span>
          <span class="account-field-email ng-binding">*******@gmail.com</span>
          <span class="account-field-email-verified-icon icon-checkmark-16x16" ng-show="accountContent.hasVerifiedEmail"></span>
          <span class="text-robux account-field-email-verified-text" ng-show="accountContent.hasVerifiedEmail">Verified</span>
          <span class="account-field-email-add-msg text-error ng-binding ng-hide" ng-hide="accountContent.userInfo.data.IsEmailOnFile">
            <span class="icon-warning"></span> Add email </span>
          <span class="account-field-email-verify-msg text-error ng-hide" ng-show="accountContent.hasEmailButNotVerified">
            <span class="icon-warning"></span> Pending verification </span>
          <span class="account-field-email-add-address text-name ng-binding ng-hide" ng-click="addEmailAddress()" ng-hide="accountContent.userInfo.data.IsEmailOnFile">Add Email</span>
          <span class="account-field-email-verify ng-hide" ng-show="accountContent.hasEmailButNotVerified">
            <span class="text-name" ng-click="verifyEmailAddress()">Verify</span> or <span class="text-name" title="Update Email" ng-click="changeEmailAddress()">update email</span>
          </span>
          <span class="account-change-email icon-edit" title="Update Email" ng-click="changeEmailAddress()" ng-show="accountContent.hasVerifiedEmail"></span>
        </div>
        <div class="form-group ng-hide" ng-hide="true">
          <span class="text-label account-settings-label">Connect account:</span>
          <span class="account-field-email text-error">Add email</span>
        </div>
      </div>
    </div>
  </div>
  <div class="section ng-scope">
    <h3>Personal</h3>
    <div class="section-content settings-personal-container">
      <div class="col-sm-12">
        <div class="form-group description-container">
          <textarea class="form-control input-field personal-field-description ng-pristine ng-valid" placeholder="Describe yourself (1000 character limit)" rows="4" ng-model="accountContent.userInfo.data.PersonalBlurb" maxlength="1000"></textarea>
          <span class="small">Do not provide any details that can be used to identify you outside ROBLOX.</span>
        </div>
        <div class="form-group birthday-container">
          <div class="form-control fake-input-lg">
            <label class="text-label" ng-disabled="!accountContent.userInfo.data.UserAbove13">Birthday</label>
            <div class="rbx-select-group month">
              <select class="input-field rbx-select ng-pristine ng-valid" id="MondDropdown" ng-model="accountContent.userInfo.data.BirthMonth" ng-options="month.value as month.name for month in populateAccount.months" ng-disabled="!accountContent.userInfo.data.UserAbove13" ng-change="populateDays()">
                <option value="0">Jan</option>
                <option value="1">Feb</option>
                <option value="2">Mar</option>
                <option value="3">Apr</option>
                <option value="4">May</option>
                <option value="5">Jun</option>
                <option value="6">Jul</option>
                <option value="7">Aug</option>
                <option value="8">Sep</option>
                <option value="9">Oct</option>
                <option value="10">Nov</option>
                <option value="11">Dec</option>
              </select>
            </div>
            <div class="rbx-select-group day">
              <select class="input-field rbx-select ng-pristine ng-valid" id="DayDropdown" ng-model="accountContent.userInfo.data.BirthDay" ng-options="day for day in populateAccount.days track by day" ng-disabled="!accountContent.userInfo.data.UserAbove13">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
                <option value="15">15</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="18">18</option>
                <option value="19">19</option>
                <option value="20">20</option>
                <option value="21">21</option>
                <option value="22">22</option>
                <option value="23">23</option>
                <option value="24">24</option>
                <option value="25">25</option>
                <option value="26">26</option>
                <option value="27">27</option>
                <option value="28">28</option>
                <option value="29">29</option>
                <option value="30">30</option>
                <option value="31">31</option>
              </select>
            </div>
            <div class="rbx-select-group year">
              <select class="input-field rbx-select ng-pristine ng-valid" id="YearDropdown" ng-model="accountContent.userInfo.data.BirthYear" ng-options="year for year in populateAccount.years track by year" ng-disabled="!accountContent.userInfo.data.UserAbove13" ng-change="populateDays()">
                <option value="2016">2016</option>
                <option value="2015">2015</option>
                <option value="2014">2014</option>
                <option value="2013">2013</option>
                <option value="2012">2012</option>
                <option value="2011">2011</option>
                <option value="2010">2010</option>
                <option value="2009">2009</option>
                <option value="2008">2008</option>
                <option value="2007">2007</option>
                <option value="2006">2006</option>
                <option value="2005">2005</option>
                <option value="2004">2004</option>
                <option value="2003">2003</option>
                <option value="2002">2002</option>
                <option value="2001">2001</option>
                <option value="2000">2000</option>
                <option value="1999">1999</option>
                <option value="1998">1998</option>
                <option value="1997">1997</option>
                <option value="1996">1996</option>
                <option value="1995">1995</option>
                <option value="1994">1994</option>
                <option value="1993">1993</option>
                <option value="1992">1992</option>
                <option value="1991">1991</option>
                <option value="1990">1990</option>
                <option value="1989">1989</option>
                <option value="1988">1988</option>
                <option value="1987">1987</option>
                <option value="1986">1986</option>
                <option value="1985">1985</option>
                <option value="1984">1984</option>
                <option value="1983">1983</option>
                <option value="1982">1982</option>
                <option value="1981">1981</option>
                <option value="1980">1980</option>
                <option value="1979">1979</option>
                <option value="1978">1978</option>
                <option value="1977">1977</option>
                <option value="1976">1976</option>
                <option value="1975">1975</option>
                <option value="1974">1974</option>
                <option value="1973">1973</option>
                <option value="1972">1972</option>
                <option value="1971">1971</option>
                <option value="1970">1970</option>
                <option value="1969">1969</option>
                <option value="1968">1968</option>
                <option value="1967">1967</option>
                <option value="1966">1966</option>
                <option value="1965">1965</option>
                <option value="1964">1964</option>
                <option value="1963">1963</option>
                <option value="1962">1962</option>
                <option value="1961">1961</option>
                <option value="1960">1960</option>
                <option value="1959">1959</option>
                <option value="1958">1958</option>
                <option value="1957">1957</option>
                <option value="1956">1956</option>
                <option value="1955">1955</option>
                <option value="1954">1954</option>
                <option value="1953">1953</option>
                <option value="1952">1952</option>
                <option value="1951">1951</option>
                <option value="1950">1950</option>
                <option value="1949">1949</option>
                <option value="1948">1948</option>
                <option value="1947">1947</option>
                <option value="1946">1946</option>
                <option value="1945">1945</option>
                <option value="1944">1944</option>
                <option value="1943">1943</option>
                <option value="1942">1942</option>
                <option value="1941">1941</option>
                <option value="1940">1940</option>
                <option value="1939">1939</option>
                <option value="1938">1938</option>
                <option value="1937">1937</option>
                <option value="1936">1936</option>
                <option value="1935">1935</option>
                <option value="1934">1934</option>
                <option value="1933">1933</option>
                <option value="1932">1932</option>
                <option value="1931">1931</option>
                <option value="1930">1930</option>
                <option value="1929">1929</option>
                <option value="1928">1928</option>
                <option value="1927">1927</option>
                <option value="1926">1926</option>
                <option value="1925">1925</option>
                <option value="1924">1924</option>
                <option value="1923">1923</option>
                <option value="1922">1922</option>
                <option value="1921">1921</option>
                <option value="1920">1920</option>
                <option value="1919">1919</option>
                <option value="1918">1918</option>
                <option value="1917">1917</option>
              </select>
            </div>
          </div>
          <span class="small account-more-info" ng-show="accountContent.userInfo.data.UserAbove13">
            <span class="tooltip-container ng-scope" tooltip-placement="bottom-left" tooltip="Click here for more information" ng-click="privacyModeInfo()">
              <span class="icon-moreinfo"></span>
            </span> Updating age to under 13 will enable Privacy Mode. </span>
        </div>
        <div class="form-group gender-container">
          <div class="form-control fake-input-lg">
            <label class="text-label">Gender</label>
            <div id="MaleButton" class="gender-button" ng-click="chooseGender(populateAccount.gender.MALE)">
              <div class="gender-icon icon-male selected" ng-class="{'selected':accountContent.userInfo.data.Gender===populateAccount.gender.MALE}"></div>
            </div>
            <div id="FemaleButton" class="gender-button" ng-click="chooseGender(populateAccount.gender.FEMALE)">
              <div class="gender-icon icon-female" ng-class="{'selected':accountContent.userInfo.data.Gender===populateAccount.gender.FEMALE}"></div>
            </div>
          </div>
        </div>
        <div class="language-country-container">
          <div class="form-group col-sm-6 country-container">
            <div id="country-list" class="rbx-select-group">
              <select class="input-field rbx-select ng-pristine ng-valid" ng-model="accountContent.countryId" ng-options="country.Value as country.Text for country in accountData.stateProperties.countries">
                <option value="0">Choose a Country</option>
                <option value="1">Australia</option>
                <option value="2">Belgium</option>
                <option value="3">Brazil</option>
                <option value="4">Canada</option>
                <option value="5">Denmark</option>
                <option value="6">Finland</option>
                <option value="7">France</option>
                <option value="8">Germany</option>
                <option value="9">Indonesia</option>
                <option value="10">Ireland</option>
                <option value="11">Israel</option>
                <option value="12">Italy</option>
                <option value="13">Lithuania</option>
                <option value="14">Malaysia</option>
                <option value="15">Mexico</option>
                <option value="16">Netherlands</option>
                <option value="17">New Zealand</option>
                <option value="18">Norway</option>
                <option value="19">Philippines</option>
                <option value="20">Poland</option>
                <option value="21">Portugal</option>
                <option value="22">Romania</option>
                <option value="23">Russia</option>
                <option value="24">Saudi Arabia</option>
                <option value="25">Singapore</option>
                <option value="26">Spain</option>
                <option value="27">Sweden</option>
                <option value="28">Thailand</option>
                <option value="29">Turkey</option>
                <option value="30">United Arab Emirates</option>
                <option value="31">United Kingdom</option>
                <option value="32">United States</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-group col-sm-2 save-settings-container">
          <button id="SaveInfoSettings" class="btn-control-sm acct-settings-btn" ng-click="updateAccountInfo()" ng-disabled="accountContent.userInfo.data.birthDate()&gt;currentDate">Save</button>
        </div>
      </div>
    </div>
  </div>
  <div class="section ng-scope ng-hide" ng-show="accountData.stateProperties.is2SvEnabledForSettings!='true'">
    <h3>Security Setting</h3>
    <div class="section-content settings-security-setting-container">
      <div class="col-sm-12">
        <div class="form-group account-security-settings-container">
          <span class="security-settings-text">Sign out of all other sessions</span>
          <button id="SignOut" class="btn-control-sm acct-settings-btn" ng-click="signOutFromSessions()">Sign out</button>
        </div>
      </div>
    </div>
  </div>
  <!-- ngIf: accountData.stateProperties.is2SvEnabledForSettings=='true' -->
  <!-- ngInclude: 'accounts-social' -->
  <div ng-if="accountData.stateProperties.is2SvEnabledForSettings=='true'" ng-include="'accounts-social'" class="ng-scope">
    <div class="section ng-scope safety-off" ng-class="accountContent.userInfo.data.UseSuperSafePrivacyMode?'safety-on':'safety-off'">
      <h3>Social Networks</h3>
      <span class="text-error privacy-mode-info ng-hide" ng-show="accountContent.userInfo.data.UseSuperSafePrivacyMode" ng-click="privacyModeInfo()">
        <span class="icon-lock"></span> Privacy Mode </span>
      <div class="section-content settings-social-networks-container">
        <div class="col-sm-12">
          <div class="form-group facebook-container">
            <label class="text-label account-settings-label">Facebook:</label>
            <input class="form-control input-field ng-pristine ng-valid" id="facebook" placeholder="e.g. www.facebook.com/ROBLOX" ng-model="accountContent.userInfo.data.Facebook" ng-disabled="accountContent.userInfo.data.UseSuperSafePrivacyMode">
          </div>
          <div class="form-group twitter-container">
            <label class="text-label account-settings-label">Twitter:</label>
            <input class="form-control input-field ng-pristine ng-valid" id="twitter" placeholder="e.g. @ROBLOX" ng-model="accountContent.userInfo.data.Twitter" ng-disabled="accountContent.userInfo.data.UseSuperSafePrivacyMode">
          </div>
          <div class="form-group google-plus-container">
            <label class="text-label account-settings-label">Google+:</label>
            <input class="form-control input-field ng-pristine ng-valid" id="googleplus" placeholder="e.g. http://plus.google.com/profileId" ng-model="accountContent.userInfo.data.GooglePlus" ng-disabled="accountContent.userInfo.data.UseSuperSafePrivacyMode">
          </div>
          <div class="form-group youtube-container">
            <label class="text-label account-settings-label">YouTube:</label>
            <input class="form-control input-field ng-pristine ng-valid" id="youtube" placeholder="e.g. www.youtube.com/user/roblox" ng-model="accountContent.userInfo.data.YouTube" ng-disabled="accountContent.userInfo.data.UseSuperSafePrivacyMode">
          </div>
          <div class="form-group twitch-container">
            <label class="text-label account-settings-label">Twitch:</label>
            <input class="form-control input-field ng-pristine ng-valid" id="twitch" placeholder="e.g. www.twitch.tv/roblox/profile" ng-model="accountContent.userInfo.data.Twitch" ng-disabled="accountContent.userInfo.data.UseSuperSafePrivacyMode">
          </div>
          <div class="form-group visible-container">
            <label class="text-label account-settings-label">Visible to:</label>
            <div id="visible-to" class="rbx-select-group">
              <select class="input-field rbx-select ng-pristine ng-valid" id="social-network-visibility" ng-model="accountContent.userInfo.data.SocialNetworksVisibilityPrivacyValue" ng-options="option.value as option.name for option in populateAccount.visibility" ng-disabled="accountContent.userInfo.data.UseSuperSafePrivacyMode">
                <option value="0">All Users</option>
                <option value="1">Friends, Users I Follow, and Followers</option>
                <option value="2">Friends and Users I Follow</option>
                <option value="3">Friends</option>
                <option value="4">No one</option>
              </select>
            </div>
          </div>
          <div class="form-group col-sm-12 save-settings-container">
            <button id="save-social-settings" class="btn-control-sm acct-settings-btn" ng-click="updateAccountInfo()">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- end ngIf: accountData.stateProperties.is2SvEnabledForSettings=='true' -->
</div>

</div>
<div>
  <script type="text/javascript">
    Roblox.uiBootstrap = Roblox.uiBootstrap || {};
    Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
    Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
  </script>
  <script type="text/ng-template" id="user-account-security-setting.html"> <div class="modal-content ">
														<div class="modal-header">
															<button type="button" class="close" ng-click="close()">
																<span aria-hidden="true">
																	<span class="icon-close"></span>
																</span>
																<span class="sr-only">Close</span>
															</button>
															<h5>
                    Success
                </h5>
														</div>
														<div class="modal-body">
															<p>You have been signed out of all other sessions.</p>
														</div>
														<div class="modal-footer">
															<button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
														</div>
													</div>
													<!-- /.modal-content -->
												</script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-password-changed.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                    Success
                </h5>
            </div>
            <div class="modal-body">
                <p>You have successfully changed your password</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
                            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-password-error.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                    Error
                </h5>
            </div>
            <div class="modal-body">
                <p>There was an error changing your password</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
                            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-verify-sent.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                    Send Verification Email
                </h5>
            </div>
            <div class="modal-body">
                <p>Thanks! Your verification email has been sent.</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
                            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-email-changed.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                    Email Address Changed
                </h5>
            </div>
            <div class="modal-body">
                <p>An email has been sent for verification.</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
                            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-parent-need-email.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                    Add Parent Email
                </h5>
            </div>
            <div class="modal-body">
                <p>Please update your parent&#39;s email before continuing.</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
                            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-parent-change-birthdate.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                    Change Birthdate
                </h5>
            </div>
            <div class="modal-body">
                <p>An email has been sent to your parent for verification</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Ok
                    </button>
                            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-age-change-confirmation.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                        <span class="icon-warning"></span>
                    Warning
                </h5>
            </div>
            <div class="modal-body">
                <p>This change can not be un-done. The birth date will be locked. Are you sure?</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Yes
                    </button>
                                    <button type="button" class="btn-fixed-width btn-secondary-md" ng-click="close()">
                        No
                    </button>
            </div>
            </div><!-- /.modal-content -->
    </script>
</div><div>
    <script type="text/javascript">
        Roblox.uiBootstrap = Roblox.uiBootstrap || {};
        Roblox.uiBootstrap.modalBackdropTemplateLink = "/viewapp/common/template/modal/backdrop.html";
        Roblox.uiBootstrap.modalWindowTemplateLink = "/viewapp/common/template/modal/window.html";
    </script>
    <script type="text/ng-template" id="user-account-2sv-disable-confirmation.html">
        <div class="modal-content ">
            <div class="modal-header">
                <button type="button" class="close" ng-click="close()">
                    <span aria-hidden="true"><span class="icon-close"></span></span><span class="sr-only">Close</span>
                </button>
                <h5>
                        <span class="icon-warning"></span>
                    Warning
                </h5>
            </div>
            <div class="modal-body">
                <p>If you turn off 2-Step Verification, only your password will be needed when you login from a new device. Are you sure?</p>
            </div>
            <div class="modal-footer">
                    <button type="submit" id="purchaseConfirm" class="btn-control-md" ng-click="submit()">
                        Yes
                    </button>
                                    <button type="button" class="btn-fixed-width btn-secondary-md" ng-click="close()">
                        No
                    </button>
            </div>
            </div><!-- /.modal-content -->
    </script>
</div>
</div>
        </div>
            </div>

<script type="text/javascript" src="/js/d9970cf0cd9959236d7de21886108efa.js.gzip"></script>
<script type="text/javascript" src="/js/5926309ff55b06c732ffe910f2100b1e.js.gzip"></script>
<script type="text/javascript" src="/js/b1a389c995e5a832c76249e69701d023.js.gzip"></script>
          
            <? $pagebuilder->build_footer(); ?>
