<?php

declare(strict_types=1);
namespace rbx;

final class ItemInfo {
    static function IsWearable(RBXItemType $item) {
        // Questionable code
        $wearable = false;
        switch ($item) {
            case RBXItemType::Hat:
            case RBXItemType::Face:
            case RBXItemType::LeftArm:
            case RBXItemType::RightArm:
            case RBXItemType::Torso:
            case RBXItemType::LeftLeg:
            case RBXItemType::RightLeg:
            case RBXItemType::Gear:
            case RBXItemType::Package:
                $wearable = true;
                break;

            default:
                $wearable = false;
                break;
        }

        return $wearable;
    }
};
?>
