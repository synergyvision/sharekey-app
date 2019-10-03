(function() {
    'use strict';
    angular
        .module('starter')
        .controller('tabsController', tabsController);
  
        tabsController.$inject = ['$scope','$localStorage'];
        function tabsController($scope,$localStorage){
            var id = $localStorage.uid

            $scope.goToProfile = function(){
                $state.go('tab.account',{'user_id': id})
            }
        }
})()  