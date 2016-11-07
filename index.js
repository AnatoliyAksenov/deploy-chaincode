process.env.GOPATH = __dirname;   //set the gopath to current dir and place chaincode inside src folder

var express = require('express');
var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var app = express();
var network = require("./network.js")
var fs = require("fs");

var router = express.Router();

//// Set Server Parameters ////
var host = process.env.HOST||'0.0.0.0';
var port = process.env.PORT||'8080';


// default paths
app.use('/', express.static('public/app')); //index.html

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'asdfsadfsdffffasdfewer3w3a asdfe4a3at', resave: true, saveUninitialized: true }));

//express routing
router.route('/api/init').get(function (req,res){

    
    network.init_network().then(function(data){
      
      res.status(200).json(JSON.stringify({status: data.status}));  
      
    }, function(error){
      
      res.status(404).json(JSON.stringify({error: error}));
      
    }
    );
    
});


//express routing
router.route('/api/chaincodeID').get(function (req,res){
      
      network.chaincodeID().then(function(data){
      
        res.status(200).json(data);  
        
      }, function(error){
        console.log("%j", error);  
        res.status(404).json(JSON.stringify(error));
        
      });
});

router.route('/api/peers/:id/status').get(function (req,res){
  
    network.getPeers().then(function(result){
      var peers = result;
      
      network.getpeerstatus(peers[req.params.id]).then(function(data){
        
        res.status(200).json(data);  
        
      }, function(error){
        
        res.status(404).json(JSON.stringify({status: "Not found", error: error}));
        
      });
    },function(error){
      res.status(404).json(error);
    });
});

router.route('/api/query/:contractid/:function/:snils').get(function (req,res){
    
    var data = {
      chaincodeID: req.params.contractid,
      fcn: req.params.function,
      args: [req.params.snils]
    };
    
    network.query(data).then(function(request){
      res.status(200).json(JSON.stringify(request));
    },function(error){
      res.status(404).json(JSON.stringify({status:"Not found", error: error}));
    });

});

router.route('/api/invoke/:contractid/:function/:snils/:hash').get(function (req,res){
    var data = {
      chaincodeID: req.params.contractid,
      fcn: req.params.function,
      args: [req.params.snils, req.params.hash]
    };
    
    network.invoke(data).then(function(request){
      res.status(200).json(JSON.stringify(request));
    },function(error){
      console.log(error);
      res.status(404).json(JSON.stringify({status:"Not found", error: error}));
    });

});

router.route('/api/network/networkid').get(function(req,res){
    network.getNetworkId().then(function(result){
      res.status(200).json(result);
    },function(error){
      res.status(404).json(error);
    });
});

router.route('/api/peers/get').get(function(req,res){
    network.getPeers().then(function(result){
      res.status(200).json(result);
    },function(error){
      res.status(404).json(error);
    });
});

app.use('/', router);
app.listen(port,host, function () {
  console.log('Roseurobank app listening ' + host + ':' + port);
});