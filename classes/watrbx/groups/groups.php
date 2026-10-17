<?php

namespace watrbx\groups;

class groups {

    public function getUserGroups($userid) {
        global $db;

        $rows = $db->table("hasrole")
            ->join("group_roles", "hasrole.roleid", "=", "group_roles.id")
            ->join("groups", "group_roles.groupid", "=", "groups.id")
            ->where("hasrole.userid", $userid)
            ->select("groups.*")
            ->get();

        $groups = [];

        foreach ($rows as $row) {
            $groups[$row->id] = $row;
        }

        return array_values($groups);
    }

    public function getGroupInfo($groupid) {
        global $db;

        return $db->table("groups")
            ->where("id", $groupid)
            ->first();
    }
}