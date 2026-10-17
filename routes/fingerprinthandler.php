<?php
use watrlabs\router\Routing;
use watrlabs\authentication;

global $router; // IMPORTANT: KEEP THIS HERE!

$router->group('/api/v1/fingerprints', function($router) {
    
    $router->post("/submit-fingerprint", function () {

        global $db;
        global $currentuser;
        $auth = new authentication();
        

        if ($_SERVER['REQUEST_METHOD'] === 'POST') { // I hate doing this because it reminds me a lot of madblox and whatnot

            $input = file_get_contents('php://input');

            if(!empty($input)){

                $fingerprint = json_decode($input);

                if(isset($fingerprint->visitorId) && isset($fingerprint->confidence)){

                    $fpdata = $db->table("fingerprints")->where("visitorid", $fingerprint->visitorId)->first();

                    if(!$fpdata){
                        $insert = [
                            "visitorid"=>$fingerprint->visitorId,
                            "confidence"=>$fingerprint->confidence,
                            "date"=>time()
                        ];

                        $db->table("fingerprints")->insert($insert);
                    }

                    
                    
                    if($auth->havesession()){
                        $auth->relatefingerprint($fingerprint->visitorId);
                    } else {
                        $auth->createsession(0, $fingerprint->visitorId);
                    }
                    
                    return ["status"=>"ok", "message"=>"The CCP is now tracking you."];

                }
                
            }

        }
    });
    
}, '');