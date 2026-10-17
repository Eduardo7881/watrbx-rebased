<td class="content-area">
    <div class="status-confirm roblox-message-confirm">This page is currently non functional. Please check back later!</div>
    <br>
    <h2>Create a Shirt</h2>
    <div class="col-12">
        <div class="ms-4 me-4 mt-4">
            <p>Did you use the template? If not, <a href="https://cdn.watrbx.wtf/ShirtTemplate_02222016.png" download>download it here</a>.</p>
            <p>Find your image: <input name="shirtItem" accept="png" id="itemImage" type="file"></p>
            <p>Shirt Name: <input id="itemName" type="text" class="inputItemName-0-2-57"></p>
            <a href="#" id="CreateShirt" class="btn-medium btn-primary">Upload</a>
        </div>
    </div>
    <script>

        const submitButton = document.getElementById("CreateShirt");
        const shirtName = document.getElementById("itemName");
        const shirtFile = document.getElementById("itemImage");

        submitButton.addEventListener("click", function(event){
            event.preventDefault();

            if(!shirtFile.files.length){
                alert("Please select an image!");
                return;
            }

            const fd = new FormData();
            fd.append("title", shirtName.value);
            fd.append("file", shirtFile.files[0]);

            fetch('/api/v2/shirt-creator', {
                method: 'POST',
                body: fd
            })

            .then(res => res.json())
            .then(data => console.log(data))
            .catch(err => alert("An error occured."))
        });

    </script>
</td>