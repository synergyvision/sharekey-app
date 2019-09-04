(function() {
    'use strict';
    angular
        .module('starter')
        .controller('CheckEmailController', CheckEmailController);
  
        CheckEmailController.$inject = ['$scope','$http','appConstants','$ionicPopup'];
        function CheckEmailController($scope,$http,appConstants,$ionicPopup){
            $scope.sendEmail = function(){
                var emailRequest = $.param({
                  email: $scope.email,
                });
                $http.post(appConstants.apiUrl + 'login/sendEmail',emailRequest,
                  {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
                }).then(function(response){
                  if (response.data.status == 200){
                    var alertPopup = $ionicPopup.alert({
                      title: 'Información',
                      template: 'Se ha enviado un correo de recuperacioón a tu cuenta'
                    });
                  }else {
                    var alertPopup = $ionicPopup.alert({
                      title: 'Error',
                      template: 'Tu correo es invalido o no esta registrado'
                    });
                  }
                })
              }  
        }
})()  