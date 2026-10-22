<p id="savingtext">Saving Place</p>
<script>
    window.external.SaveUrl('<?=$_ENV["BASE_URL"]?>/api/v1/upload-place?placeId=<?=$assetinsertid?>'); 
    document.getElementById("savingtext").innerText = "Done saving.";
</script>
