(function() {
    'use strict';
    angular
        .module('starter')
        .controller('LoginController', loginController);
  
        loginController.$inject = ['$scope','$http','$location','$localStorage','appConstants','$state','$ionicPopup','$filter','$ionicLoading'];
        function loginController($scope,$http,$location,$localStorage,appConstants,$state,$ionicPopup,$filter,$ionicLoading){

          var translate = $filter('translate');

            var show = function() {
              $ionicLoading.show({
                template: '<ion-spinner icon="spiral"></ion-spinner>'
              })
            };
            var hide = function(){
              $ionicLoading.hide()
            };
          

            //function that retrieves the server public key
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

              //function that encripts the password with the server public key
            
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
            
              // function that sends the credentials for login

              $scope.sendData = function(){
                show()
                var password = encryptPassword($scope.password)
                password.then(function (password){
                    var loginRequest = $.param({
                      email: $scope.email,
                      password: password
                    });
                    $http.post(appConstants.apiUrl + 'login', loginRequest,{headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}})
                    .then(function(response){
                      if (response.data.status == 200){
                        $localStorage.uid = response.data.uid;
                        $localStorage.userToken = response.data.token
                        $http.get(appConstants.apiUrl +  appConstants.profile + $localStorage.uid, {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization': 'Bearer: ' + $localStorage.userToken}
                        }).then(function (response){
                          if (response.data.status == 200){
                              hide()
                              $localStorage[$localStorage.uid + '-username'] = response.data.content.username;
                              $localStorage.userPicture = response.data.content.profileUrl;
                              $state.go('tab.dash');
                          }else{
                            var alertPopup = $ionicPopup.alert({
                              title: translate('login.error_title'),
                              template: translate('login.error'),
                            });
                          }  
                        })
                      }else{
                        if (response.data.status === 'auth/wrong-password'){
                          hide()
                          var alertPopup = $ionicPopup.alert({
                            title: translate('login.error_title'),
                            template: translate('login.password_error'),
                          });
                        } else if (response.data.status === 'auth/user-not-found'){
                          hide()
                          var alertPopup = $ionicPopup.alert({
                            title: translate('login.error_title'),
                            template: translate('login.email_error'),
                          });
                        }
                      }
                    })
                  })  
                }
            
        }
})()  