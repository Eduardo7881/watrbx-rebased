<?php
    global $currentuser;
?>
<div id="Container" ng-app="AccountDisabled">
    <div style="clear: both"></div>
        <div id="Body" class="simple-body">
            <div class="status-error roblox-message-error" id="error-message" style="display: none;">An error occured. Please try again.</div>
            <div class="status-confirm roblox-message-confirm" id="confirm-message" style="display: none;">Account Reactivated.</div>
            <div class="account-reactivation-container">
                <div class="account-reactivation-page-content">
                    <h2 class="account-reactivation-title">Account Deactivated</h2>
                    <div class="account-reactivation-info-section">
                    <p class="body text">Your account is currently deactivated.<br>If you would like to reactivate, click the button below.</p>
                    <div class="account-reactivation-action-section">
                        <div id="ProcessingView" style="display:none">
                            <div class="ProcessingModalBody">
                                <p class="processing-indicator"><img src='https://images.rbxcdn.com/ec4e85b0c4396cf753a06fade0a8d8af.gif' alt="Searching..." /></p>
                            </div>
                        </div>
                        <button onclick="showConfirmation()" type="button" class="rbx-btn-secondary-xs" title="Reactivate">Reactivate</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script>
    function showConfirmation(){
        Roblox.GenericConfirmation.open({
            titleText: "Reactivate Account",
            bodyContent: "Are you sure you would like to reactivate your account?",
            acceptText: "Reactivate",
            imageUrl: "/images/cbb24e0c0f1fb97381a065bd1e056fcb.png",
            onAccept: reactivate,
            declineText: "Cancel",
            footerText: "You will always be able to deactivate your account again in the future.",
            dismissable: true
        });
    }

    function reactivate() {
        try {
            document.getElementById("error-message").style.display = "none";

            var settings = {
              overlayClose: false,
              opacity: 50,
              overlayCss: { backgroundColor: "#000" },
              escClose: false
            };

            $("#ProcessingView").modal(settings);
            fetch('/api/v1/enable-account', {
                method: "POST"
            })
            .then(response => {
                if(response.ok){
                    document.getElementById("confirm-message").style.display = "block";
                    console.log(response);
                    window.location.href = "/home";
                } else {
                    $.modal.close();
                    document.getElementById("error-message").style.display = "block";
                }
            })
        } catch (error){
            console.log(error);
        }
    }
</script>