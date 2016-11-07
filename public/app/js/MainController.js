(function() {
  'use strict';

  angular
    .module('App')
    .controller('MainController', MainController);

    MainController.inject = ['$scope', 'dataAssistant'];

    function MainController($scope, dataAssistant) {
      $scope.chaincodeID_ERROR = '';
      $scope.chaincodeID = '';
      
      dataAssistant.get('/api/chaincodeID').then(function(result){
        
        $scope.chaincodeID = result.data;
        
      }, function(error){
        
        $scope.chaincodeID = 'null';
        $scope.chaincodeID_ERROR = error;
        $scope.page = 'network_error';
        $('#chaincodeid_error').show();
        
      });
      
      
			$scope.showNetwork = function(){
				$scope.page = 'network';
			};
			
			$scope.showQuery = function(){
				$scope.page = 'query';
			};
			
			$scope.showInvoke = function(){
				$scope.page = 'invoke';
			};
			
			$scope.init_network = function(){
			  dataAssistant.get('/api/init')
			  .then(function(){
			    
			    $scope.page = 'network';
			    
			  }, function(error){
			    
			    $scope.error = error;
			    $scope.$parent.network_error = error;
			    $scope.$parent.page = 'network_error';
			    $('#network_error').show();
			    
			  });
			};
    }
})();