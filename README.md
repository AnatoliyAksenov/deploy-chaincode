# [deploy-chaincode] 

deploy-chaincode is a simple, hyperledger fabric boilerplate to start any hyperledger fabric nodejs project.



## Getting started
- clone the repo: `git clone https://github.com/AnatoliyAksenov/deploy-chaincode.git`
- `cd deploy-chaincode`
- install the procject'a dependencies: `npm install`
- copy `vcap` file from bluemix application details page in [bluemix.net](https://bluemix.net)
- save to session environment: ``export VCAP_SERVICES=`cat vcap.json```
- start application: `npm start`
- start debug application: `npm debug`


## Deploy to bluemix
- login to bluemix: `cf login`
- push project to application: `cf push "<application_name>"`


