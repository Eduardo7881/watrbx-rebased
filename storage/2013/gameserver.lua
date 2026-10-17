
local port = 53640

game:Load('rbxasset://temp.rbxl')
print("Loading map")
local scriptContext = game:GetService('ScriptContext')
pcall(function() scriptContext:AddStarterScript(libraryRegistrationScriptAssetID) end)
scriptContext.ScriptsDisabled = false
game:SetPlaceID(-1, false)
game:GetService("ChangeHistoryService"):SetEnabled(false)
pcall(function() settings().Network.UseInstancePacketCache = true end)
pcall(function() settings().Network.UsePhysicsPacketCache = true end)
--pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.FIFO end)
pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)
--settings().Network.PhysicsSend = 1 -- 1==RoundRobin
settings().Network.PhysicsSend = Enum.PhysicsSendMethod.ErrorComputation2
settings().Network.ExperimentalPhysicsEnabled = true
settings().Network.WaitingForCharacterLogRate = 100
pcall(function() settings().Diagnostics:LegacyScriptMode() end)
game.Lighting.GlobalShadows = true
game:GetService("RunService"):Run()
game:GetService("NetworkServer"):Start(port)
pcall(function() game:GetService("Players"):SetChatStyle(Enum.ChatStyle.Both) end)