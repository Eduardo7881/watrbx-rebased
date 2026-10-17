-- Credits to Only Retro Roblox Here
local assetId = ...
print("Rendering package")

local ThumbnailGenerator = game:GetService("ThumbnailGenerator")

game:GetService("ContentProvider"):SetBaseUrl("http://www.watrbx.wtf/")
game:GetService("ScriptContext").ScriptsDisabled = true

local mannequin = game:GetObjects("http://www.watrbx.wtf/asset/?id=1785197&version=6")[1]
mannequin.Parent = workspace

local package = {"http://www.watrbx.wtf/asset/?id=" .. assetId}
local bodyParts = {}

for _, v in pairs(package) do
    local objs = game:GetObjects(v)
    for _, obj in pairs(objs) do
        obj.Parent = mannequin
        
        if obj:IsA("Tool") then
            mannequin.Torso["Right Shoulder"].CurrentAngle = 1.57
        elseif obj:IsA("DataModelMesh") then
            mannequin.Head.Mesh:Remove()
            obj.Parent = mannequin.Head
        elseif obj:IsA("Decal") then
            mannequin.Head.face:Remove()
            obj.Parent = mannequin.Head
        elseif obj:IsA("CharacterMesh") then
            bodyParts[obj.BodyPart] = true
        end
    end
end

if bodyParts[Enum.BodyPart.LeftArm] and bodyParts[Enum.BodyPart.Torso] and bodyParts[Enum.BodyPart.RightArm] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=27113661")[1].Parent = mannequin
elseif bodyParts[Enum.BodyPart.LeftArm] and bodyParts[Enum.BodyPart.RightArm] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251042")[1].Parent = mannequin
elseif bodyParts[Enum.BodyPart.Torso] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251062")[1].Parent = mannequin
elseif bodyParts[Enum.BodyPart.LeftArm] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251081")[1].Parent = mannequin
elseif bodyParts[Enum.BodyPart.RightArm] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251071")[1].Parent = mannequin
end

if bodyParts[Enum.BodyPart.LeftLeg] and bodyParts[Enum.BodyPart.RightLeg] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251154")[1].Parent = mannequin
elseif bodyParts[Enum.BodyPart.LeftLeg] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251138")[1].Parent = mannequin
elseif bodyParts[Enum.BodyPart.RightLeg] then
    game:GetObjects("http://www.watrbx.wtf/asset/?id=25251144")[1].Parent = mannequin
end

return ThumbnailGenerator:Click("PNG", 1024, 1024, --[[hideSky = ]] true, false)
