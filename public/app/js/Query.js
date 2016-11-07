//<!-- QUERY directive -->
(function() {
  'use strict';

  angular
    .module('App')
    .directive('query', query);

  function query(){
    var directive = {
      restrict:'E',
      scope:{
      },
      templateUrl: '/templates/query.html',
      controller: Query,
      controllerAs: 'cntrl',
      bindToController: true
    };

    return directive;
  };
  
  
  Query.$inject = ['$scope', 'dataAssistant'];

  function Query($scope, dataAssistant){
    
    $scope.hist = [];
    
    $scope.query = function(snils){
      $scope.result = '';
      $scope.error = '';
      
      dataAssistant.get("/api/query/" + $scope.$parent.chaincodeID + '/snils/' + snils).then(function(result){
        var val = JSON.parse(result.data).result.data;
        if (val != void 0){
          if(val.length > 0)
          {
            val = String.fromCharCode.apply(null,val);
          } else
          {
            val = 'null';
          }
        } 
        
        $scope.result = val;
        $scope.hist.push({snils: snils, result: val, error: ''});

      }, function(error){

        $scope.error = error;
        $scope.hist.push({snils: snils, result: '', error: error});

      });
    };
  }  
  
})();