<?php

namespace watrbx;
use watrlabs\authentication;

class avatars {
    static function get_body_colors($userid){
        $auth = new authentication;
        return $auth->get_body_colors($userid);
    }
}
