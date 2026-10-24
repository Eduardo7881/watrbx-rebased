-- Decal v1.0.2
-- Used for faces and decals

local assetId, baseUrl = ...

local assetUrl = "rbxassetid://" .. assetId
--local baseUrl = "http://www.watrbx.wtf"
local fileExtension = "PNG"

local ThumbnailGenerator = game:GetService("ThumbnailGenerator")

pcall(function() game:GetService("ContentProvider"):SetBaseUrl(baseUrl) end)
game:GetService('ScriptContext').ScriptsDisabled = true

local decal = game:GetObjects(assetUrl)[1]
decal.Texture = string.gsub(decal.Texture, "https://www.roblox.com", baseUrl)
decal.Texture = string.gsub(decal.Texture, "https://roblox.com", baseUrl)

local image, requestedUrls
local success = pcall(function()
	image, requestedUrls = ThumbnailGenerator:ClickTexture(decal.Texture, fileExtension, 1024, 1024)
end)

if success then
	return image, requestedUrls
end

-- if we fail return the hourglass, since we're probably in moderation.
return "/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAX8P/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=", {decal.Texture}
