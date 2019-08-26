(function() {
    'use strict';
    angular
        .module('starter')
        .controller('LoginController', loginController);
  
        loginController.$inject = ['$scope','$http','$location','$localStorage','appConstants','$state','$ionicPopup'];
        function loginController($scope,$http,$location,$localStorage,appConstants,$state,$ionicPopup){
            var getServerKey = function (){
                return $http({
                  url: appConstants.apiUrl + 'config/serverKeys',
                  method: 'GET'
                }).then(function(response){
                  return response.data.publickey
                }).catch(function (error){
                  console.log(error)
                })
              }
            
              var encryptPassword = function(password){
                var publicKey = getServerKey()
                return publicKey.then(async (publicKey) => {
                  publicKey = publicKey.replace(/(?:\\[r])+/g, "");
                  const options = {
                    message: openpgp.message.fromText(password),      
                    publicKeys: (await openpgp.key.readArmored(publicKey)).keys 
                  }
                  return openpgp.encrypt(options).then(ciphertext => {
                      var encrypted = ciphertext.data
                      return encrypted
                  })
                })
              }
            
              $scope.sendData = function(){
                var password = encryptPassword($scope.password)
                password.then(function (password){
                    var loginRequest = $.param({
                      email: $scope.email,
                      password: password
                    });
                    $http({
                      url : appConstants.apiUrl + 'login',
                      method: 'POST',
                      data: loginRequest,
                      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
                    }).then(function(response){
                      if (response.data.status == 200){
                        $localStorage.uid = response.data.uid;
                        $localStorage.userToken = response.data.token
                        $http({
                          url: appConstants.apiUrl +  appConstants.profile + $localStorage.uid,
                          method: 'GET',
                          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization': 'Bearer: ' + $localStorage.userToken}
                        }).then(function (response){
                          if (response.data.status == 200){
                              $localStorage[$localStorage.uid + '-username'] = response.data.content.username;
                              $localStorage.userPicture = response.data.content.profileUrl;
                              $state.go('tab.dash');
                          }else{
                            var alertPopup = $ionicPopup.alert({
                              title: 'Error',
                              template: 'Ha ocurrido un error'
                            });
                          }  
                        })
                      }else{
                        if (response.data.status === 'auth/wrong-password'){
                          var alertPopup = $ionicPopup.alert({
                            title: 'Error',
                            template: 'Su contraseña es incorrecta'
                          });
                        } else if (response.data.status === 'auth/user-not-found'){
                          var alertPopup = $ionicPopup.alert({
                            title: 'Error',
                            template: 'Su correo es invalido'
                          });
                        }
                      }
                    })
                  })  
                }
            
        }
})()  