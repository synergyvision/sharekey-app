(function() {
    'use strict';
    angular
        .module('starter')
        .controller('tabsController', tabsController);
  
        tabsController.$inject = ['$scope','$localStorage','$state'];
        function tabsController($scope,$localStorage,$state){

            $scope.goToProfile = function(){
                var id = $localStorage.uid
                $state.go('tab.account',{'user_id': id})
            }
        }
})()  