(function() {
    'use strict';
    angular
        .module('starter')
        .controller('CheckEmailController', CheckEmailController);
  
        CheckEmailController.$inject = ['$scope','$http','appConstants','$ionicPopup','$filter'];
        function CheckEmailController($scope,$http,appConstants,$ionicPopup,$filter){

          var translate = $filter('translate');

            $scope.sendEmail = function(){
                var emailRequest = $.param({
                  email: $scope.email,
                });
                $http.post(appConstants.apiUrl + 'login/sendEmail',emailRequest,
                  {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
                }).then(function(response){
                  if (response.data.status == 200){
                    var alertPopup = $ionicPopup.alert({
                      title: translate('recoverPassword.title'),
                      template: translate('recoverPassword.success'),
                    });
                  }else {
                    var alertPopup = $ionicPopup.alert({
                      title: translate('recoverPassword.error'),
                      template: translate('recoverPassword.error_not_found'),
                    });
                  }
                })
              }  
        }
})()  