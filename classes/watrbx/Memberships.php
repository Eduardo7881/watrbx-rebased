<?php

namespace watrbx;

final class RBXMemberships {
    private $memberships = [
        'None'                   => 0,
        'BuildersClub'           => 1,
        'TurboBuildersClub'      => 2,
        'OutrageousBuildersClub' => 3,
        'Premium'                => 4
    ];

    public function getIdFromName(string $name) {
        return $this->memberships[$name] ?? 0;
    }
}

?>
