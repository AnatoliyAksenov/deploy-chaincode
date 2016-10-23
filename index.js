var hfc = require('hfc');
var fs = require('fs');
const https = require('https');

var chain = hfc.newChain("targetChain");

process.env['GRPC_SSL_CIPHER_SUITES'] = 'ECDHE-RSA-AES128-GCM-SHA256:' +
    'ECDHE-RSA-AES128-SHA256:' +
    'ECDHE-RSA-AES256-SHA384:' +
    'ECDHE-RSA-AES256-GCM-SHA384:' +
    'ECDHE-ECDSA-AES128-GCM-SHA256:' +
    'ECDHE-ECDSA-AES128-SHA256:' +
    'ECDHE-ECDSA-AES256-SHA384:' +
    'ECDHE-ECDSA-AES256-GCM-SHA384';

var ccPath = ccPath = process.env["GOPATH"]+"/src";

var network = JSON.parse(process.env['VCAP_SERVICES'], 'utf8');

var credentials = network['ibm-blockchain-5-prod'][0].credentials;

var peers = credentials.peers;
var users = credentials.users;

var isHSBN = peers[0].discovery_host.indexOf('zone') >= 0 ? true : false;
var peerAddress = [];
var network_id = credentials.peers[0].network_id + '-ca';

var ca_url = "grpcs://" + credentials.ca[network_id].discovery_host + ":" + credentials.ca[network_id].discovery_port;

chain.setKeyValStore(hfc.newFileKeyValStore(__dirname+'/keyValStore'));

var certFile = 'certificate.pem';
var certUrl = credentials.cert;
fs.access(certFile, function (err) {
    if (!err) {
        console.log("\nDeleting existing certificate ", certFile);
        fs.unlinkSync(certFile);
    }
    downloadCertificate();
});

function downloadCertificate() {
    var file = fs.createWriteStream(certFile);
    var data = '';
    https.get(certUrl, function (res) {
        console.log('\nDownloading %s from %s', certFile, certUrl);
        if (res.statusCode !== 200) {
            console.log('\nDownload certificate failed, error code = %d', certFile, res.statusCode);
            process.exit();
        }
        res.on('data', function(d) {
                data += d;
        });
        // event received when certificate download is completed
        res.on('end', function() {
    	    if (process.platform != "win32") {
    		    data += '\n';
    	    }
            
            fs.writeFileSync(certFile, data);
            
    	    copyCertificate();
        });
    }).on('error', function (e) {
        console.error(e);
        process.exit();
    });
}

function copyCertificate() {

    setTimeout(function() {
        enrollAndRegisterUsers();
    }, 1000);
}

function enrollAndRegisterUsers() {
    var cert = fs.readFileSync(certFile);
    chain.setMemberServicesUrl(ca_url, {
        pem: cert
    });

        chain.addPeer("grpcs://" + peers[2].discovery_host + ":" + peers[2].discovery_port, {
            pem: cert
        });

    var testChaincodeID;

    chain.enroll(users[0].username, users[0].secret, function(err, admin) {
        if (err) throw Error("\nERROR: failed to enroll admin : %s", err);

        console.log("\nEnrolled admin sucecssfully");

        chain.setRegistrar(admin);
        
        deployChaincode(admin);
    });
}

function deployChaincode(user) {
    var deployRequest = {
        fcn: "init",
        args: ["a", "100"],
        chaincodePath: "chain_code/",
        certificatePath: "/certs/peer/cert.pem" //important!!!
    };

    var deployTx = user.deploy(deployRequest);

    deployTx.on('complete', function(results) {

        testChaincodeID = results.chaincodeID;
        console.log("\nChaincode ID : " + testChaincodeID);
        console.log("\nSuccessfully deployed chaincode: request=%j, response=%j", deployRequest, results);
        invokeOnUser(user);
    });

    deployTx.on('error', function(err) {

        console.log("\nFailed to deploy chaincode: request=%j, error=%j", deployRequest, err);

    });
}

function invokeOnUser(user) {

    var invokeRequest = {
        chaincodeID: testChaincodeID,
        fcn: "invoke",
        args: ["a", "b", "1"]
    };

    var invokeTx = user.invoke(invokeRequest);

    invokeTx.on('submitted', function(results) {
        console.log("\nSuccessfully submitted chaincode invoke transaction: request=%j, response=%j", invokeRequest, results);
    });
    invokeTx.on('complete', function(results) {
        console.log("\nSuccessfully completed chaincode invoke transaction: request=%j, response=%j", invokeRequest, results);
        queryUser(user);
    });
    invokeTx.on('error', function(err) {
        console.log("\nFailed to submit chaincode invoke transaction: request=%j, error=%j", invokeRequest, err);
    });
}

function queryUser(user) {
    var queryRequest = {
        chaincodeID: testChaincodeID,
        fcn: "query",
        args: ["a"]
    };

    var queryTx = user.query(queryRequest);

    queryTx.on('complete', function(results) {
        console.log("\nSuccessfully queried  chaincode function: request=%j, value=%s", queryRequest, results.result.toString());
    });
    queryTx.on('error', function(err) {
        console.log("\nFailed to query chaincode, function: request=%j, error=%j", queryRequest, err);
    });
}
