<?php

declare(strict_types=1);
namespace rbx;

enum RBXItemType: string {
    /* Character */
    case Hat = "Hat",
    case Face = "Face",
    case Head = "Head",
    case Torso = "Torso",
    case LeftArm = "LeftArm",
    case RightArm = "RightArm",
    case LeftLeg = "LeftLeg",
    case RightLeg = "RightLeg",
    case Gear = "Gear"
    case Package = "Package",

    /* Accessories */
    case HairAccessory = "HairAccessory",
    case NeckAccessory = "NeckAccessory",
    case ShoulderAccessory = "ShoulderAccessory",
    case FrontAccessory = "FrontAccessory",
    case BackAccessory = "BackAccessory",
    case WaistAccessory = "WaistAccessory",

    /* Animations */
    case ClimbAnimation = "ClimbAnimation",
    case WalkAnimation = "WalkAnimation",
    case DeathAnimation = "DeathAnimation",
    case FallAnimation = "FallAnimation",
    case IdleAnimation = "IdleAnimation",
    case JumpAnimation = "JumpAnimation",
    case RunAnimation = "RunAnimation",
    case SwimAnimation = "SwimAnimation",

    /* Miscellaneous */
    case Lua = "Lua",
    case Script = "Lua",
    case Image = "Image",
    case Audio = "Audio",
    case Place = "Place",
    case Model = "Model",
    case Badge = "Badge",
    case GamePass = "GamePass",
    case Plugin = "Plugin",
    case MeshPart = "MeshPart",
    case Animation = "Animation"
};

?>
