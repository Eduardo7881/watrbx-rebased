-- Prepended to Edit.lua and Visit.lua and Studio.lua and PlaySolo.lua--

local wspeed = "%baseurl%"

if true then
	pcall(function() game:SetPlaceID(%placeid%) end)
else
	if %placeid% > 0 then
		pcall(function() game:SetPlaceID(%placeid%) end)
	end
end

visit = game:GetService("Visit")

local message = Instance.new("Message")
message.Parent = workspace
message.archivable = false

game:GetService("ScriptInformationProvider"):SetAssetUrl(wspeed .. "/Asset/")
game:GetService("ContentProvider"):SetThreadPool(16)
pcall(function() game:GetService("InsertService"):SetFreeModelUrl(wspeed .. "/Game/Tools/InsertAsset.ashx?type=fm&q=%s&pg=%d&rs=%d") end) -- Used for free model search (insert tool)
pcall(function() game:GetService("InsertService"):SetFreeDecalUrl(wspeed .. "/Game/Tools/InsertAsset.ashx?type=fd&q=%s&pg=%d&rs=%d") end) -- Used for free decal search (insert tool)

settings().Diagnostics:LegacyScriptMode()

game:GetService("InsertService"):SetBaseSetsUrl(wspeed .. "/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
game:GetService("InsertService"):SetUserSetsUrl(wspeed .. "/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
game:GetService("InsertService"):SetCollectionUrl(wspeed .. "/Game/Tools/InsertAsset.ashx?sid=%d")
game:GetService("InsertService"):SetAssetUrl(wspeed .. "/Asset/?id=%d")
game:GetService("InsertService"):SetAssetVersionUrl(wspeed .. "/Asset/?assetversionid=%d")

pcall(function() game:GetService("SocialService"):SetFriendUrl(wspeed .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetBestFriendUrl(wspeed .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupUrl(wspeed .. "/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
pcall(function() game:SetCreatorID(0, Enum.CreatorType.User) end)

pcall(function() game:SetScreenshotInfo("") end)
pcall(function() game:SetVideoInfo("") end)

message.Text = "Loading Place. Please wait..." 
coroutine.yield() 
game:Load(wspeed .. "/asset/?id=" .. %placeid%) 
message.Parent = nil

game:GetService("ChangeHistoryService"):SetEnabled(true)
visit:SetPing(wspeed .. "/Game/ClientPresence.ashx?PlaceId=%placeid%&Location=studio", 60)
