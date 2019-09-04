(function() {
    'use strict';
    angular
        .module('starter')
        .controller('signUpController', signUpController);
  
        signUpController.$inject = ['$scope','$http','$location','$state','appConstants','$ionicPopup'];
        function signUpController($scope,$http,$location,$state,appConstants,$ionicPopup){
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
                        title: 'Exito!',
                        template: 'El usuario se ha registrado exitosamente'
                    });
                    $state.go('login');
                    }else{
                    if (response.data.status == 400){
                        var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: 'El nombre de usuario no se encuentra disponible'
                        });
                    } else if (response.data.status === 'auth/email-already-in-use'){
                        var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: 'El correo ya se encuentra asociado a una cuenta'
                        });
                    }else{
                        alert('Hubo un error intentelo de nuevo')
                        }
                    }
                })
        }
    }
})()  