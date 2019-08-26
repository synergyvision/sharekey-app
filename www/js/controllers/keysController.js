(function() {
    'use strict';
    angular
        .module('starter')
        .controller('keysController', keysController);
  
        keysController.$inject = ['$scope','$http','$localStorage','$state','$window','$sessionStorage','appConstants','$ionicPopup','$ionicHistory'];
        function keysController($scope,$http,$localStorage,$state,$window,$sessionStorage,appConstants,$ionicPopup,$ionicHistory){
            var uid = $localStorage.uid;
            var token = $localStorage.userToken;
            if ($localStorage[uid + 'keys']){
              $scope.userKeys = $localStorage[uid + 'keys']
            }else{
              $scope.userKeys = [];
            }
        
            $scope.toggleShowPassword = function() {
              $scope.showPassword = !$scope.showPassword;
            }


           var encryptKeys = function (key,seed){
            var ciphertext = CryptoJS.AES.encrypt(key,seed);
            return ciphertext
            }
        
            var translate = function(phrase){
                var chars={
                    "á":"a", "é":"e", "í":"i", "ó":"o", "ú":"u","ñ":"n"}
                var expr=/[áàéèíìóòúù]/ig;
                var text= phrase.replace(expr,function(e){return chars[e]});
                return text;
            
            }
    
        
        
            // receives a random generated 12 words phrase
            $scope.generarPalabras = function (){
              $http({
                url: appConstants.apiUrl + 'mnemonic',
                method: 'GET'
              }).then(function (response){
                if (response.data.status == 200){
                    $scope.words = response.data.message;
                }else{
                  alert(response.data.message);
                }  
              })
                  
            }
        
            var checkActiveKeys = function (keys){
              for (var i = 0; i < keys.length; i++){
                  keys[i].activated = false;
                  for (var j = 0; j < $scope.userKeys.length; j++){
                      if (keys[i].name == $scope.userKeys[j].keyname ){
                        keys[i].activated = true;
                      }
                  }
                  if (i == (keys.length -1)){
                      return keys
                  }  
              }
        
            }
        
            // check the existing keys on the cloud
            $scope.checkKeys = function(){
              $http({
                url: appConstants.apiUrl + appConstants.profile + uid + '/getKeys',
                method: 'GET',
                headers: {'Authorization':'Bearer: ' + token}
              }).then(function (response){
                    var keys = response.data.data;
                    $scope.keys = checkActiveKeys(keys);
              }).catch(function (error){
                  if (error.status == 401){
                    var alertPopup = $ionicPopup.alert({
                      title: 'Error',
                      template: 'Su sesión ha vencido'
                    });
                    $state.go('login');
                  }else{
                    console.log(error.data);
                  }
                })
                  
            }
        
            //changes the default key
        
            $scope.useKeys = function (name){
              for (var i = 0; i < $scope.userKeys.length;i++){
                  $scope.userKeys[i].default = false;
                  if ($scope.userKeys[i].keyname == name){
                      $scope.userKeys[i].default = true;
                  }
                  if (i == ($scope.userKeys.length - 1)){
                     $localStorage[uid + 'keys'] = $scope.userKeys;
                  }
              }
              var updateDefault = $.param({
                name: name
              })
              $http({
                url: appConstants.apiUrl + appConstants.profile+ uid + '/updateDefault',
                method: 'PUT',
                data: updateDefault,
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
              }).then(function (response){
                    console.log('Data updated on the cloud')
                    $state.reload();
              }).catch(function (error){
                  if (error.status == 401){
                    console.log('sesion vencida')
                    $state.go('login');
                  }else{
                    console.log(error.data);
                  }
                })
            }
        
            $scope.close = function (){
              var popup = angular.element("#changeKey");
              //for hide model
              popup.modal('hide');
              delete $localStorage.todelete
            }
        
            //function that sends keypair to the cloud
        
            var storekeys = function (publicKey,privateKey,name){
                
                var storeRequest = $.param({
                  pubkey: publicKey,
                  privkey: privateKey,
                  keyname: name
                })
                  
                $http({
                  url: appConstants.apiUrl + appConstants.profile + $localStorage.uid + '/storeKeys',
                  method: 'POST',
                  data: storeRequest,
                  headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.status == 200){
                        console.log('keys stored succesfully')
                        closePop();
                        $ionicHistory.goBack();
                    }else{
                      alert(response.data.message);
                    }
                }).catch(function (e){
                  if (e.status == 401){
                      $state.go('login');
                    }
                  })
            }
        
            //store the newly created pair on local storage
        
            var localStorekeys = function(publicKey,privateKey,name,defecto = null){
              var newKey = {
                keyname: name,
                publicKey: publicKey,
                privateKey: privateKey,
                default: defecto
              }
        
              $scope.userKeys.push(newKey);
              $localStorage[uid + 'keys'] = $scope.userKeys;
            }
            var closePop = function()
            {
                  $scope.myPopup.close();
            };
            
            //function that generates a new key pair
            $scope.generateKeys =  function (){
                    $scope.myPopup = $ionicPopup.show({
                      title: 'Información',
                      template: 'Generando llaves <ion-spinner icon="spiral"></ion-spinner>'
                    });
                    var uid = $localStorage.uid;
                    var options = {
                        userIds: [{ name: $scope.name, email: $scope.email}],
                        numBits: 4096,
                        passphrase: $scope.passphrase,
                    }
                    var words = translate($scope.phrase);
                    var appKey = translate($sessionStorage.appKey);
                    console.log("Generating Keys")
                    openpgp.generateKey(options).then(function(key){
                        var privkey = key.privateKeyArmored;
                        var pubkey = key.publicKeyArmored;
                        console.log('keys created')
                        console.log('keys encrypted');
                        // encrypt keys on local storage
                        var localPrivateKey = encryptKeys(privkey,appKey)
                        localPrivateKey = localPrivateKey.toString();
                        localStorekeys(pubkey,localPrivateKey,$scope.newName);
                        // encrypt keys and send to cloud
                        var privateKey = encryptKeys(privkey,words)
                        privateKey = privateKey.toString()
                        storekeys(pubkey,privateKey,$scope.newName)
                        console.log('keys sent to cloud');
                      }).catch(function (error){
                        console.log(error.code + '\n' + error.message);
                      })
                }
                
            //get a keyname for deletion    
        
            $scope.getKeyname = function (name){
              $localStorage.keyDelete = name;
              
            }
        
            //get a keyname to recover
        
            $scope.getRecover = function (name){
              $localStorage.KeyRecover = name;
              $scope.recoverKeys();
            }
            
            //deletes a keypair
            
            var localDelete = function(name){
              for (var i = 0 ; i < $scope.userKeys.length; i++){
                if ($scope.userKeys[i].keyname == name){
                    $scope.userKeys.splice(i,1);
                }
              }
            }
        
            $scope.deleteKeys  =  function (name){
              var deleteRequest = $.param({
                name: name
              })
        
              $http({
                url: appConstants.apiUrl + appConstants.profile + $localStorage.uid + '/deleteKey',
                method: 'DELETE',
                data: deleteRequest,
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
              }).then(function (response){
                    if (response.status == 200){
                      alert('Se ha borrado una llave');
                      $scope.checkKeys();
                    }
                }).catch(function (e){
                  if (e.status == 401){
                      $state.go('login');
                    }else{
                      console.log(e)
                    }
                  })
            }
        
            var showRecoverPopUp = function(){
              $scope.data = {};
              var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="data.phraseRecovery">',
                title: 'Introduzca su frase de 12 palabras para la llave',
                scope: $scope,
                buttons: [
                  { text: 'Cancelar' },
                  {
                    text: '<b>Activar</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                      if (!$scope.data.phraseRecovery) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                      } else {
                        console.log($scope.data.phraseRecovery)
                        return $scope.data.phraseRecovery;
                      }
                    }
                  }
                ]
              });
              myPopup.then(function(res) {
                $scope.checkWords(res)
              });
            }
        
            $scope.recoverKeys = function (){
              name = $localStorage.KeyRecover;
              var recoverRequest = $.param({
                name: name
              })
        
              $http({
                url: appConstants.apiUrl + appConstants.profile + $localStorage.uid + '/recoverKey',
                method: 'POST',
                data: recoverRequest,
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
              }).then(function (response){
                  if (response.data.status == 200){
                      console.log('the key has been retrieved from cloud');
                      $localStorage.recoveryKey = response.data.data;
                      showRecoverPopUp();
                  }else{
                    console.log(response.data.message);
                  }
              }).catch(function (e){
                  if (e.status == 401){
                      $state.go('login');
                    }else{
                      console.log(e.data);
                    }
                  })
        
            }
        
            $scope.closeRecover = function (){
              delete $localStorage.KeyRecover;
              delete $localStorage.recoveryKey;
            }
        
            var appKeyPopUp = function(){
              $scope.data = {}
              var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="data.appKey">',
                title: 'Introduzca su clave de aplicación',
                scope: $scope,
                buttons: [
                  { text: 'Cancelar' },
                  {
                    text: '<b>Activar</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                      if (!$scope.data.appKey) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                      } else {
                        return $scope.data.appKey;
                      }
                    }
                  }
                ]
              });
              myPopup.then(function(res) {
                $scope.newPassword(res)
              });
        
            }
        
            $scope.checkWords = function (phraseRecovery){
              words = translate(phraseRecovery)
              var bytes  = CryptoJS.AES.decrypt($localStorage.recoveryKey.PrivKey,words);
              var priv = bytes.toString(CryptoJS.enc.Utf8);
              if (priv != ""){
                  $localStorage.recoveryKey.PrivKey = priv;
                  appKeyPopUp();
              }else{
                alert("La clave insertada no es correcta")
              }
              
            }
        
            $scope.newPassword = function (appKey){
              words = translate(appKey)
              if (words == $sessionStorage.appKey){
                var localPrivateKey = encryptKeys($localStorage.recoveryKey.PrivKey,words)
                localPrivateKey = localPrivateKey.toString();
                localStorekeys($localStorage.recoveryKey.PubKey,localPrivateKey,$localStorage.recoveryKey.name,$localStorage.recoveryKey.default);
                alert("LLave activada exitosamente");
                delete $localStorage.recoveryKey
                $state.reload();
              }else{
                alert('La clave de aplicacion es incorrecta')
              }  
            }
            $scope.newKey = function (){
              $state.go('tab.newKey')
            }
        }    
})()  