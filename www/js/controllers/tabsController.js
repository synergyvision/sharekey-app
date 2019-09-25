(function() {
    'use strict';
    angular
        .module('starter')
        .controller('tabsController', tabsController);
  
        tabsController.$inject = ['$scope','$localStorage'];
        function tabsController($scope,$localStorage){
            $scope.id = $localStorage.uid
        }
})()  