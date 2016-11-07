(function() {
  'use strict';

  angular
    .module('App')
    .directive('network', network);

  function network(){
    var directive = {
      restrict:'E',
      scope:{
      },
      templateUrl: '/templates/network.html',
      controller: Network,
      bindToController: true
    };

    return directive;
  };
  
  
  Network.$inject = ['$scope', 'dataAssistant'];

  function Network($scope, dataAssistant){
    $scope.networkid = '';
    $scope.peers = [];
    $scope.statuses = [];
    
    dataAssistant.get('/api/network/networkid').then(function(result){
      
      $scope.networkid = result.data.network_id;
    
      
    }, function(error){
      
      $scope.networkid = null;
      $scope.error = error;
      
    });
    
    //loading peers
    dataAssistant.get('/api/peers/get').then(function(result){
      
      $scope.peers = result.data;
    }, function(error){
      $scope.error = error;
    });
    
    //get status
    $scope.update = function(id){
      
      dataAssistant.get('/api/peers/' + id + '/status').then(function(result){
        
        
        $scope.statuses[id] = result.data;
      }, function(error){
        
        $scope.statuses[id] = error;
        
      });
    };
    
    
  
  }  
  
})();