(function() {
    'use strict';
    angular
        .module('starter')
        .controller('tabsController', tabsController);
  
        tabsController.$inject = ['$scope','$localStorage','$state'];
        function tabsController($scope,$localStorage,$state){
            var id = $localStorage.uid

            $scope.goToProfile = function(){
                $state.go('tab.account',{'user_id': id})
            }
        }
})()  