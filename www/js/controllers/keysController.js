(function() {
    'use strict';
    angular
        .module('starter')
        .controller('keysController', keysController);
  
        keysController.$inject = ['$scope','$http','$localStorage','$state','$window','$sessionStorage','appConstants','$ionicPopup','$ionicHistory','$filter'];
        function keysController($scope,$http,$localStorage,$state,$window,$sessionStorage,appConstants,$ionicPopup,$ionicHistory,$filter){
            var uid = $localStorage.uid;
            var token = $localStorage.userToken;

            var filter = $filter('translate');

          // check if keys exists

            if ($localStorage[uid + 'keys']){
              $scope.userKeys = $localStorage[uid + 'keys']
              console.log($scope.userKeys)
            }else{
              $scope.userKeys = [];
            }
        
            //toggles the password field

            $scope.toggleShowPassword = function() {
              $scope.showPassword = !$scope.showPassword;
            }

            // encrypt a private key with a has
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
              $http.get(appConstants.apiUrl + 'mnemonic').then(function (response){
                if (response.data.status == 200){
                    $scope.phrase = response.data.message;
                }else{
                  alert(response.data.message);
                }  
              })
                  
            }

            //check the received keys from the server to see which one is active
        
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
              $scope.spinner = true;
              $http.get(appConstants.apiUrl + appConstants.profile + uid + '/getKeys',
                {headers: {'Authorization':'Bearer: ' + token}
              }).then(function (response){
                    $scope.spinner = false;
                    var keys = response.data.data;
                    $scope.keys = checkActiveKeys(keys);
              }).catch(function (error){
                  if (error.status == 401){
                    var alertPopup = $ionicPopup.alert({
                      title: filter('keys.error_title'),
                      template: filter('keys.expired_error')
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
              $http.put(appConstants.apiUrl + appConstants.profile+ uid + '/updateDefault',updateDefault,
                {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
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
        
            //function that sends keypair to the cloud
        
            var storekeys = function (publicKey,privateKey,name){
                
                var storeRequest = $.param({
                  pubkey: publicKey,
                  privkey: privateKey,
                  keyname: name
                })
                  
                $http.post(appConstants.apiUrl + appConstants.profile + $localStorage.uid + '/storeKeys',storeRequest,
                  {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
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
                      title: filter('keys.generating'),
                      template: '<ion-spinner icon="spiral"></ion-spinner>'
                    });
                    var uid = $localStorage.uid;
                    var options = {
                        userIds: [{ name: $scope.name, email: $scope.email}],
                        numBits: 4096,
                        passphrase: $scope.passphrase,
                    }
                    var words = translate($scope.phrase);
                    console.log("Generating Keys")
                    openpgp.generateKey(options).then(function(key){
                        var privkey = key.privateKeyArmored;
                        var pubkey = key.publicKeyArmored;
                        // encrypt keys on local storage
                        var localPrivateKey = encryptKeys(privkey,$scope.passphrase)
                        console.log(localPrivateKey)
                        localPrivateKey = localPrivateKey.toString();
                        console.log(localPrivateKey)
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
        
            //deletes a key on the cloud

            $scope.deleteKeys  =  function (name){
              var deleteRequest = $.param({
                name: name
              })
              $http({url:appConstants.apiUrl + appConstants.profile + $localStorage.uid + '/deleteKey',
              method:"DELETE",
              data:deleteRequest,
              headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
              }).then(function (response){
                    if (response.status == 200){
                      alert(filter('keys.key_deleted'));
                      localDelete(name)
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

            //show recovery modal
        
            var showRecoverPopUp = function(){
              $scope.data = {};
              var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="data.phraseRecovery">',
                title: 'Introduzca su frase de recuperacion',
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
                        $scope.checkWords($scope.data.phraseRecovery)
                      }
                    }
                  }
                ]
              });
            }

            //start the recovery key flow
        
            $scope.recoverKeys = function (){
              name = $localStorage.KeyRecover;
              var recoverRequest = $.param({
                name: name
              })
        
              $http.post(appConstants.apiUrl + appConstants.profile + $localStorage.uid + '/recoverKey',recoverRequest,
                {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
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

            //deletes the recovery key recovered after succesfully activating it
        
            $scope.closeRecover = function (){
              delete $localStorage.KeyRecover;
              delete $localStorage.recoveryKey;
            }

            //opens passphrase modal
        
            var appKeyPopUp = function(){
              $scope.data = {}
              var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="data.appKey">',
                title: filter('keys.ask_pass'),
                scope: $scope,
                buttons: [
                  { text: filter('keys.cancel') },
                  {
                    text: filter('keys.activate'),
                    type: 'button-positive',
                    onTap: function(e) {
                      if (!$scope.data.appKey) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                      } else {
                        $scope.newPassword($scope.data.appKey)
                      }
                    }
                  }
                ]
              });
            }

            //function that validates the recovery password
        
            $scope.checkWords = function (phraseRecovery){
              var words = translate(phraseRecovery)
              try{
                var bytes  = CryptoJS.AES.decrypt($localStorage.recoveryKey.PrivKey,words);
                var priv = bytes.toString(CryptoJS.enc.Utf8);
                $localStorage.recoveryKey.PrivKey = priv;
                appKeyPopUp();
              }catch(e){
                alert(filter('keys.recovery_error'));
              }
            }

            //function that validates a passphrase by encripting a string

            var encryptContent = async (privkey,pubkey,passphrase) =>{
              const privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0]
              await privKeyObj.decrypt(passphrase)
              const options = {
                  message: openpgp.message.fromText('hello there'),      
                  publicKeys: (await openpgp.key.readArmored(pubkey)).keys                              
              }
        
              return openpgp.encrypt(options).then(ciphertext => {
                var encrypted = ciphertext.data 
                return encrypted
        
              })
            }    

            //funciton that encrypts the activated key with its passphrase
        
            $scope.newPassword = function (appKey){
              var words = translate(appKey)
              if (words){
                var a = encryptContent($localStorage.recoveryKey.PrivKey,$localStorage.recoveryKey.PubKey,words)
                a.then(function (){
                  var localPrivateKey = encryptKeys($localStorage.recoveryKey.PrivKey,words)
                  var localPrivateKey = localPrivateKey.toString();
                  localStorekeys($localStorage.recoveryKey.PubKey,localPrivateKey,$localStorage.recoveryKey.name,$localStorage.recoveryKey.default);
                  alert("LLave activada exitosamente");
                  delete $localStorage.recoveryKey
                  $state.go('tab.keys');
                }).catch(function(error){
                  alert(filter('keys.pass_error'))
                })
              }
            }
            $scope.newKey = function (){
              $state.go('tab.newKey')
            }


            $scope.copy = function(){
              var copyText = document.getElementById('phrase');
              copyText.select(); 
              copyText.setSelectionRange(0, 99999); /*For mobile devices*/
              document.execCommand("copy");
            }

        }    
})()  