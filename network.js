var XMLHttpRequest = require('xhr2');
var hfc = require("hfc");
var fs = require('fs');
var q = require("q");


process.env['GRPC_SSL_CIPHER_SUITES'] = 'ECDHE-RSA-AES128-GCM-SHA256:' +
    'ECDHE-RSA-AES128-SHA256:' +
    'ECDHE-RSA-AES256-SHA384:' +
    'ECDHE-RSA-AES256-GCM-SHA384:' +
    'ECDHE-ECDSA-AES128-GCM-SHA256:' +
    'ECDHE-ECDSA-AES128-SHA256:' +
    'ECDHE-ECDSA-AES256-SHA384:' +
    'ECDHE-ECDSA-AES256-GCM-SHA384';

// run command: debug=network node index    
function debug(message){
    if (process.env.debug && process.env.debug == 'network')
    {
      console.log(message);
    }
}    
    
var network;
var credentials;
var peers;
var users;
var admin_user;
var admin_secret;
var network_id;
var ca_url;
var chain;
var cert;
var chain_user;


module.exports.init_network = function(){
    var deferred = q.defer();
    
    debug('start init_network');
    
    if (process.env['VCAP_SERVICES'] == void 0)
    {
        debug('error getting env variable VCAP_SERVICES');    
        deferred.reject(new Error('Environment variable VCAP_SERVICES doe\'s not exists'));
        return deferred.promise;
        
    } else {
        debug('parse VCAP_SERVICEs');
        
        var vcap = process.env['VCAP_SERVICES'];
        
        if (typeof vcap == 'string' && vcap.length)
        {
            network = JSON.parse(vcap, 'utf8') || [];    
        }
    }
    
    // TODO: change to find first key in netwrok
    if (network != void 0)
    {
        debug('prepare network module');
        credentials = network['ibm-blockchain-5-prod'][0].credentials;
        peers = credentials.peers || [];
        users = credentials.users || [];
        admin_user = users[0].username;
        admin_secret = users[0].secret;
        
        debug('find ca server');
        network_id = credentials.peers[0].network_id + '-ca';
        if (credentials && credentials.ca[network_id] && credentials.ca[network_id].discovery_host && credentials.ca[network_id].discovery_port)
        {
            ca_url = "grpcs://" + credentials.ca[network_id].discovery_host + ":" + credentials.ca[network_id].discovery_port;
        }
    } else {
        debug('error prepare network module');
        deferred.reject(new Error('Error parse settings structure.'));
        return deferred.promise;
    }
    
    
    if (chain == void 0)
    {
        debug('prepare chain');
        chain = hfc.newChain("targetChain");
        chain.setKeyValStore(hfc.newFileKeyValStore(__dirname+'/keyValStore'));   
        chain.enrolled = false;
    }
    
    try{
        debug('read sert file');
        cert = fs.readFileSync(__dirname + '/certificate.pem')
    }
    catch(error){
        debug('error reading sert file');
        deferred.reject(error);
        return deferred.promise;
    }
    
    if (cert != void 0 && ca_url != void 0)
    {
        debug('prepare chain memberservices');
        chain.setMemberServicesUrl(ca_url, {
            pem: cert
        });
    } else {
        debug('error prepare chain memberservice');
        deferred.reject(new Error('Certificate not found.'));
        return deferred.promise;
    }
    
    if (peers && peers.length > 0)
    {
        debug('add peer to chain');
        //for (var i = 0; i < peers.length; i++) {
        var i = 2;
            chain.addPeer("grpcs://" + peers[i].discovery_host + ":" + peers[i].discovery_port, {
                pem: cert
            });
        //}
    } else {
        deferred.reject(new Error('Error adding peer to chain.'));
        return deferred.promise;
    }
    
    debug('finis init_network');
    deferred.resolve({status:"OK"});
    
    return deferred.promise;

}

function chain_enroll(){
    var deferred = q.defer();
    if (chain.enrolled == false)
    {
        chain.enroll(admin_user, admin_secret, function(err, admin) {
            if (err) {
                
                deferred.reject(new Error('ERROR: failed to enroll admin : ' + err));
            }
            
            chain.setRegistrar(admin);
            
            chain.enrolled = true;
            chain_user = admin;
            deferred.resolve(admin);
        });
    } else {
        deferred.resolve(chain_user);
    }
    return deferred.promise;
}

function getURL(url) {
    var request = new XMLHttpRequest();
    var deferred = q.defer();

    request.open("GET", url, true);
    request.onload = onload;
    request.onerror = onerror;
    request.onprogress = onprogress;
    request.send();

    function onload() {
        if (request.status === 200) {
            deferred.resolve(request.responseText);
        } else {
            deferred.reject(new Error("Status code was " + request.status));
        }
    }

    function onerror() {
        deferred.reject(new Error("Can't XHR " + JSON.stringify(url)));
    }

    function onprogress(event) {
        deferred.notify(event.loaded / event.total);
    }

    return deferred.promise;
}

module.exports.getPeers = function(){
    var deferred = q.defer();
    debug('start getPeers');
    
    if (peers != void 0 && peers.length > 0){
        debug('getPeers: find peers.');
        deferred.resolve(peers);
    } else {
        debug('getPeers: peers not found.');
        deferred.reject({error: new Error("Peers not found.")});
    }
    
    debug('end getPeers');
    return deferred.promise;
}

module.exports.getpeerstatus = function(peer){
    var deferred = q.defer();
    debug('start getpeerstatus');
    
    
    if (peer == void 0){
        
        debug('getpeerstatus: peers not found.');
        deferred.reject(new Error('Peer undefined'));
    
    } else {
        debug('find peer address');
    
        if(peer['api_host'] == void 0 || peer['api_port_tls'] == void 0){
            debug('peer address undefined');
            deferred.reject(new Error('The peer no have pai_host or api_port_tls properties.'));
        } else {
           
            
            var url = "https://"+peer.api_host + ":"+ peer.api_port_tls + "/chain";
            debug('getpeerstatus: url for check peer status: ' + url);
            
            debug('getpeerstatus: getting url');
            getURL(url).then(function (data) {
                    debug('getpeerstatus: peer ' + peer.api_host + ' status success.');
                    deferred.resolve(JSON.parse(data));
                    
                }, function(error){
                    
                    debug('getpeerstatus: peer ' + peer.api_host + ' status failed.');
                    deferred.reject(new Error(error));
                }
            );
        }
    }
    
    debug('end getpeerstatus');
    return deferred.promise;
};

module.exports.chaincodeID = function(){
    var deferred = q.defer();
    
    try{
        debug('read sert file');
        var sets = fs.readFileSync(__dirname + '/settings.json');
        if(JSON.parse(sets)['chaincodeID'])
        {
            debug(sets);
            deferred.resolve(JSON.parse(sets)['chaincodeID']);
        }
    }
    catch(error){
        debug('error reading settings.json file: '+ error);
        deferred.reject(error);
        return deferred.promise;
    }
    
    return deferred.promise;
};

module.exports.query = function(data){
    var deferred = q.defer();
    
    debug('start query');
    
    chain_enroll().then(function(user){
        debug('enroll in query complete.');
        
        //query data
        var queryRequest = {
            chaincodeID: data.chaincodeID,
            fcn:         data.fcn,
            args:        data.args
        };
        
        debug('query request: ' + JSON.stringify(queryRequest));
        
        // Trigger the query transaction
        var queryTx = user.query(queryRequest);
        debug('query in progress.');
    
        queryTx.on('complete', function(results) {
            debug('query complete');
            deferred.resolve(results);
        });
        queryTx.on('error', function(err) {
            debug(JSON.stringify(err));
            deferred.reject(new Error(err));
        });
            
    }, function(error){
        debug('enrol in query error: ' + JSON.stringify(error));
        deferred.reject(new Error('Error enrollment admin user: ' + error));
    });
    
    debug('end query');
    return deferred.promise;
};

module.exports.invoke = function(data){
    var deferred = q.defer();

    debug('start invoke');

    chain_enroll().then(function(user){
        
        debug('invoke enroll success.');
        
        //invoke data
        var Request = {
            chaincodeID: data.chaincodeID,
            fcn:         data.fcn,
            args:        data.args
        };
        
        debug("invoke request" + JSON.stringify(Request));
        
        // Trigger the query transaction
        var invokeTx = user.invoke(Request);
        debug('invoke transaction in progress');
        
        invokeTx.on('complete', function(results) {
            debug('invocke complete');
            deferred.resolve(results);
        });
        invokeTx.on('error', function(err) {
            debug('invoke error: ' + err);
            deferred.reject(new Error(err));
        });
            
    }, function(error){
        debug('invoke enroll error: ' + error);
        deferred.reject(new Error('Error enrollment admin user: ' + error));
    });
    
    
    return deferred.promise;
}

module.exports.getNetworkId = function(){
    var deferred = q.defer();
    
    if(peers != void 0 && peers.length > 0){
        deferred.resolve({network_id: peers[0].network_id, status: "OK"});
    } else {
        deferred.reject({network_id: null, status: "Not found."});
    }
    
    return deferred.promise;
}