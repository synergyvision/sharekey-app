(function() {
    'use strict';
    angular
        .module('starter')
        .controller('redesController', redesController);
  
        redesController.$inject = ['$scope','$http','$localStorage','$state','$location','$stateParams','$rootScope','$window','appConstants','$filter','$ionicPlatform','ionicAlertPopup'];
        function redesController($scope,$http,$localStorage,$state,$location,$stateParams,$rootScope,$window,appConstants,$filter,$ionicPlatform,ionicAlertPopup){
            
            var filter = $filter('translate')
            var token = $localStorage.userToken;
            var uid = $localStorage.uid;
            var username = $localStorage[uid + '-username'];
            var preMessage = 'Soy ' + username + ' en SecureShare ';
            $scope.fbForm = false;
            $scope.twitterForm = false;
            $scope.githubForm = false;

            $scope.toggleFormFb = function (){
            $scope.fbForm = !$scope.fbForm;
            }

            $scope.toggleFormTw = function (){
            $scope.twitterForm = !$scope.twitterForm;
            }

            $scope.toggleFormGh = function (){
            $scope.githubForm = !$scope.githubForm;
            }
            
        
            var makeid = function() {
                var result           = '';
                var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                for ( var i = 0; i < 20; i++ ) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            }
        
           /* $scope.loginFacebook = function(){
                facebookConnectPlugin.login(["public_profile"], function success (response){
                alert(response)}, function fail (response){
                    alert(response)
                })
            };*/

           /* $ionicPlatform.ready(function(){
                var fbLoginSuccess = function (userData) {
                    alert("UserInfo: " + JSON.stringify(userData));
                }
                
                facebookConnectPlugin.login(["public_profile"],
                    fbLoginSuccess,
                    function (error) { alert("" + error) }
                );
                
            })*/

            var validateFeed =  function (feed){
                var valid = false
                for (i = 0; i < feed.length; i ++){
                    if( feed[i].message == $scope.validationMessage){
                    valid = true;
                    validateFacebook();
                    }
                }
                if (valid == false){
                    ionicAlertPopup.alertPop(filter('networks.github'),filter('networks.fb_error'))
                }
            }

            var validateFacebook = function (){
                $http.post(appConstants.apiUrl + appConstants.config + uid + '/validateFacebook',
                    {headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    ionicAlertPopup.alertPop(filter('networks.facebook'),filter('networks.fb_success'))
                    $state.reload();
                }).catch(function (error){
                    console.log(error)
                })
            }

            $scope.getSocials = function (){
                $scope.spinner = true;
                $http.get(appConstants.apiUrl + appConstants.config + uid + '/addedSocials',{headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    $scope.spinner = false;
                        $scope.validFacebook = response.data.facebook
                        $scope.validTwitter = response.data.twitter
                        $scope.validGitHub = response.data.github
                }).catch(function (error){
                        console.log(error)
                })
            }

            $scope.showTwitterMessage = function(){
                $scope.validationMessage = preMessage + makeid();
                $scope.$apply
            }

            $scope.getTwitterFeed = function(){
                var user = $.param({
                    username: $scope.twitterUsername
                })
                $http.post(appConstants.apiUrl + appConstants.config + uid + '/getTwitterFeed',user,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.feed.errors){
                        ionicAlertPopup.alertPop(filter('networks.twitter'),filter('networks.tw_user_404'))
                    }else{
                        validateTweet(response.data.feed)
                    }
                }).catch(function (error){
                    console.log(error)
                })
            }
            
            var validateTweet = function (feed){
                var valid = false
                for (var i = 0; i < feed.length; i ++){
                    if( feed[i].text == $scope.validationMessage){
                        valid = true;
                        validateTwitter();
                    }
                }
                if (valid == false){
                    ionicAlertPopup.alertPop(filter('networks.twitter'),filter('networks.tw_error'))
                }
            }

            var validateTwitter = function (){
                var data = ""
                $http.post(appConstants.apiUrl + appConstants.config + uid + '/validateTwitter',data,
                    {headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    ionicAlertPopup.alertPop(filter('networks.twitter'),filter('networks.tw_success'))
                    $state.reload();
                }).catch(function (error){
                    console.log(error)
                })
            }

            var getServerKey = function (){
                return $http.get(appConstants.apiUrl + 'config/serverKeys')
                .then(function(response){
                    return response.data.publickey
                }).catch(function (error){
                    console.log(error)
                })
            }
        
            var encryptPassword = async (password) =>{
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

            $scope.getToken = function (){
                var password = encryptPassword($scope.password)
                password.then(function (password){
                    var loginGit = $.param({
                    username: $scope.username,
                    password: password
                    }) 
                    $http.post(appConstants.apiUrl + appConstants.repos + uid + '/getToken',loginGit,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token} 
                    }).then(function (response){
                        if (response.status == 201){
                            ionicAlertPopup.alertPop(filter('networks.gh_valid'))
                            $scope.getSocials()
                          }else if(response.data.status == 401){
                            $localStorage[uid + '-gituser'] = $scope.username;
                            $localStorage[uid + '-password'] = password
                            $state.go('tab.networks-otp')
                          }
                    }).catch(function (error){
                        ionicAlertPopup.alertPop(filter('networks.github'),filter('networks.gh_error'))
                    })
                })
            }

            $scope.otpLogin = function(){
                var loginGit = $.param({
                    username: $localStorage[uid + '-gituser'],
                    password: $localStorage[uid + '-password'],
                    otp: $scope.otp
                  }) 
                  console.log(loginGit);
                  $http.post(appConstants.apiUrl + appConstants.repos + uid + '/getToken',loginGit,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token} 
                    }).then(function (response){
                        delete $localStorage[uid + '-gituser'];
                        delete $localStorage[uid + '-password']
                    if (response.data.status == 'created'){
                      ionicAlertPopup.alertPop(filter('networks.github'),filter('networks.gh_valid'))
                      $state.go('tab.networks')
                    }else{
                      $state.go('tab.networks')
                      ionicAlertPopup.alertPop(filter('networks.github'),filter('networks.gh_error'))
                    }
                  }).catch(function (error){
                      console.log(error)
                      $state.go('tab.networks')
                      delete $localStorage[uid + '-gituser'];
                      delete $localStorage[uid + '-password']
                      ionicAlertPopup.alertPop(filter('networks.github'),filter('networks.gh_error'))
                  })
            }
            
            $scope.copy = function(){
                var copyText = document.getElementById('validationMessage');
                copyText.select(); 
                copyText.setSelectionRange(0, 99999); /*For mobile devices*/
                document.execCommand("copy");
              }
     }    
})()  