(function() {
    'use strict';
    angular
        .module('starter')
        .controller('signUpController', signUpController);
  
        signUpController.$inject = ['$scope','$http','$location','$state','appConstants','$ionicPopup','$filter','ionicAlertPopup'];
        function signUpController($scope,$http,$location,$state,appConstants,$ionicPopup,$filter,ionicAlertPopup){

            var translate = $filter('translate')

            //function that register a new user

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
                        ionicAlertPopup.alertPop(translate('register.success_title'),translate('register.success'))
                    $state.go('login');
                    }else{
                    if (response.data.status == 400){
                        ionicAlertPopup.alertPop(translate('register.error'),translate('register.username_error'))
                    } else if (response.data.status === 'auth/email-already-in-use'){
                        ionicAlertPopup.alertPop(translate('register.error'),translate('register.email_error'))
                    }else{
                        ionicAlertPopup.alertPop('error',translate('register.error_500'))
                        }
                    }
                })
        }
    }
})()  