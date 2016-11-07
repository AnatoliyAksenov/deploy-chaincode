(function() {
  'use strict';

  angular
    .module('App')
    .directive('invoke', invoke);

  function invoke(){
    var directive = {
      restrict:'E',
      scope:{
      },
      templateUrl: '/templates/invoke.html',
      controller: Invoke,
      controllerAs: 'cntrl',
      bindToController: true
    };

    return directive;
  };
  
  
  Invoke.$inject = ['$scope', 'dataAssistant'];

  function Invoke($scope, dataAssistant){

    $scope.hist = [];
    $scope.lastName = '';
    $scope.firstName = '';
    $scope.passportNumber = '';
    
    $scope.invoke = function(snils, hash){
      $scope.error = '';
      $scope.result = '';
      
      dataAssistant.get("/api/invoke/" + $scope.$parent.chaincodeID + '/invoke/' + snils + '/' + hash).then(function(result){
        
        $scope.hist.push({snils: snils, hash: hash, result: result, error: null});
        
        var res;
        if ('data' in result)
        {
          res = result.data;
          
          if ( typeof res == 'string')
          {
            res = JSON.parse(res);
            
            if ('result' in res)
            {
              res = res.result;
            }
          }
        }
        
        $scope.result = res;
        
      }, function(error){
        
        $scope.error = error;
        $scope.hist.push({snils: snils, hash: hash, result: null, error: error});
      });
    };
    
    $scope.recalcHash = function(){
      
      $scope.hash = $scope.firstName + $scope.lastName + $scope.passportNumber;
      
    };
  }  
  
})();	