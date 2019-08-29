(function() {
    'use strict';
    angular
        .module('starter')
        .controller('redesController', redesController);
  
        redesController.$inject = ['$scope','$http','$localStorage','$state','$location','$stateParams','$rootScope','$window','appConstants'];
        function redesController($scope,$http,$localStorage,$state,$location,$stateParams,$rootScope,$window,appConstants){
            
            var token = $localStorage.userToken;
            var uid = $localStorage.uid;
            var username = $localStorage[uid + '-username'];
            var preMessage = 'Verificando. Soy ' + username + ' en Sharekey ';
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
        
            $scope.loginFacebook = function(){
                facebookConnectPlugin.login(["public_profile"], function success (response){
                alert(response)}, function fail (response){
                    alert(response)
                })
            };



            /*$scope.verify = function (){
                FB.api(
                "me/feed?limit=5",
                function (response) {
                    if (response && !response.error) {
                    validateFeed(response.data)
                    }
                }
            );
            }*/

            var validateFeed =  function (feed){
                var valid = false
                for (i = 0; i < feed.length; i ++){
                    if( feed[i].message == $scope.validationMessage){
                    valid = true;
                    validateFacebook();
                    }
                }
                if (valid == false){
                alert('Ha ocurrido un error, validando el mensaje, revisa que el mensaje se subio en facebook o recarga la pagina para obtener otro mensaje')
                }
            }

            var validateFacebook = function (){
                $http({
                    url: appConstants.apiUrl + appConstants.config + uid + '/validateFacebook',
                    method: 'POST',
                    headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    alert('Se ha validado la información de facebook exitosamente')
                    $state.reload();
                }).catch(function (error){
                    console.log(error)
                })
            }

            $scope.getSocials = function (){
                $http({
                        url: appConstants.apiUrl + appConstants.config + uid + '/addedSocials',
                        method: 'GET',
                        headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
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
            console.log($scope.twitterUsername)
                var user = $.param({
                    username: $scope.twitterUsername
                })
                $http({
                    url: appConstants.apiUrl + appConstants.config + uid + '/getTwitterFeed',
                    method: 'POST',
                    data: user,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.feed.errors){
                        alert('No pudimos encontrar tu usuario por favor verifícalo')
                    }else{
                        validateTweet(response.data.feed)
                    }
                }).catch(function (error){
                    console.log(error)
                })
            }
            
            var validateTweet = function (feed){
                var valid = false
                for (i = 0; i < feed.length; i ++){
                    if( feed[i].text == $scope.validationMessage){
                        valid = true;
                        validateTwitter();
                    }
                }
                if (valid == false){
                    alert('Ha ocurrido un error validando el mensaje, revisa que el mensaje se subio en twitter o recarga la pagina para obtener otro mensaje')
                }
            }

            var validateTwitter = function (){
                $http({
                    url: appConstants.apiUrl + appConstants.config + uid + '/validateTwitter',
                    method: 'POST',
                    headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    alert('Se ha validado la información de twitter exitosamente')
                    $state.reload();
                }).catch(function (error){
                    console.log(error)
                })
            }

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
                console.log($scope.username,$scope.password)
                var password = encryptPassword($scope.password)
                password.then(function (password){
                    var loginGit = $.param({
                    username: $scope.username,
                    password: password
                    }) 
                    $http({
                    url: appConstants.apiUrl + appConstants.repos + uid + '/getToken',
                    method: 'POST',
                    data: loginGit,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token} 
                    }).then(function (response){
                        console.log(response.data)
                        $state.reload()
                    }).catch(function (error){
                        alert('Hubo un error creando el token verifique sus datos')
                    })
                })
            } 
     }    
})()  