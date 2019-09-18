(function() {
    'use strict';
    angular
        .module('starter')
        .controller('signUpController', signUpController);
  
        signUpController.$inject = ['$scope','$http','$location','$state','appConstants','$ionicPopup','$filter'];
        function signUpController($scope,$http,$location,$state,appConstants,$ionicPopup,$filter){

            var translate = $filter('translate')

            $scope.sendData = function(){
                var signUpRequest = $.param({
                    email: $scope.email,
                    password: $scope.password,
                    nombre: $scope.name,
                    apellido: $scope.lastname,
                    telefono: $scope.phone,
                    usuario: $scope.username
                });
                $http.post(appConstants.apiUrl + 'signup',signUpRequest,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
                }).then(function(response){
                    console.log(response)
                    if (response.data.status == 201){
                    var alertPopup = $ionicPopup.alert({
                        title: translate('register.success_title'),
                        template: translate('register.success')
                    });
                    $state.go('login');
                    }else{
                    if (response.data.status == 400){
                        var alertPopup = $ionicPopup.alert({
                        title: translate('register.error'),
                        template: translate('register.username_error')
                        });
                    } else if (response.data.status === 'auth/email-already-in-use'){
                        var alertPopup = $ionicPopup.alert({
                        title: translate('register.error'),
                        template: translate('register.email_error')
                        });
                    }else{
                        alert(translate('register.error_500'))
                        }
                    }
                })
        }
    }
})()  