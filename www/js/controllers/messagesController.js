(function() {
    'use strict';
    angular
        .module('starter')
        .controller('messagesController', messagesController);
  
        messagesController.$inject = ['$scope','$http','$localStorage','$state','$window','$location','$sessionStorage','$stateParams','appConstants','$ionicPopup','$ionicLoading'];
        function messagesController($scope,$http,$localStorage,$state,$window,$location,$sessionStorage,$stateParams,appConstants,$ionicPopup,$ionicLoading){
            var uid = $localStorage.uid
            $scope.userKeys = $localStorage[uid + 'keys'];
            var token = $localStorage.userToken;
            $scope.form = false;

            $scope.getPublicKey =  function (idUser){
                if (!$scope.message){
                alert("No puede mandar un mensaje en blanco")
                }else{
                    var keyRequest = $.param({
                        id: idUser
                    })
                    $http({
                        url: appConstants.apiUrl + appConstants.profile + uid + '/getPublicKey',
                        method: 'POST',
                        data: keyRequest,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                    }).then(function (response){
                        console.log('retrieved public key from server')
                        $scope.encrypt(response.data.data);
                    }).catch(function (error){
                        if (error){
                            if (error.status == 401){
                                console.log(error)
                            }
                            else{
                                console.log(error.message);
                            }
                        } 
                    })  
                }
            }

            var getPublicKey = function (name){
                for (var i = 0 ; i < $scope.userKeys.length; i++){
                    if ($scope.userKeys[i].keyname ==name){
                        return $scope.userKeys[i].publicKey
                    }
                }
            }

            var getPrivateKey = function (name){
                for (var i = 0 ; i < $scope.userKeys.length; i++){
                    if ($scope.userKeys[i].keyname == name){
                        return $scope.userKeys[i].privateKey
                    }
                }
            }

            var decryptKey = function (key,password) {
                var bytes  = CryptoJS.AES.decrypt(key,password);
                var key = bytes.toString(CryptoJS.enc.Utf8);
                return key;

            }

            var encryptWithMultiplePublicKeys  = async (pubkeys, privkey, passphrase = null, message) => {
                    pubkeys = pubkeys.map(async (key) => {
                    return (await openpgp.key.readArmored(key)).keys[0]
                });
                if (passphrase == null){
                    const options = {
                        message: openpgp.message.fromText(message),
                        publicKeys: await Promise.all(pubkeys)       				  // for encryption
                    }
                    return openpgp.encrypt(options).then(ciphertext => {
                        var encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
                        return encrypted
                    })
                }else{
                    const privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0]
                    await privKeyObj.decrypt(passphrase)

                    const options = {
                        message: openpgp.message.fromText(message),
                        publicKeys: await Promise.all(pubkeys),           				  // for encryption
                        privateKeys: [privKeyObj]                                 // for signing (optional)
                    }
                    return openpgp.encrypt(options).then(ciphertext => {
                        var encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
                        return encrypted
                    })
                }  
            };

            $scope.getContacts = function (){

                $http({
                    url: appConstants.apiUrl + appConstants.profile + uid + '/contacts',
                    method: 'GET',
                    headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.status == 200){
                        console.log('contacts received')
                        $scope.contacts = response.data.data
                    }
                }).catch(function (error){
                    if (error.status == 401){
                    $state.go('login');
                    }
                })

            } 

            $scope.encrypt = function (key) {
                console.log('begin encription')
                show();
                var keyPublic = getPublicKey($scope.chatKey);
                var keyPrivate = getPrivateKey($scope.chatKey);
                var pKeys = [keyPublic,key]
                var Private = decryptKey(keyPrivate,$sessionStorage.appKey);
                var message = encryptWithMultiplePublicKeys(pKeys,Private,$scope.passphrase,$scope.message);
                message.then( function (encryptedMessage){
                    sendMessage(encryptedMessage);
                }).catch(function (error){
                    alert(error)
                })
            }

            var sendMessage = function (messageEncrypted){
                if (!$scope.publish){
                    $scope.publish = false;
                }
                var messageRequest = $.param({
                id_sender: uid,
                username: $localStorage[uid + '-username'],
                content: messageEncrypted,
                recipient: $scope.id_recipient,
                publish: $scope.publish
                })
               $http.post(appConstants.apiUrl + appConstants.messages + uid, messageRequest,
                    {headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    hide();
                    alert('Su mensaje se ha enviado');
                    console.log('message sent');
                }).catch(function (error){
                    if (error){
                            console.log(error.code);
                            console.log(error.message);
                        
                    } 
                })
            }

            $scope.getMessage = function (){
                $http.get(appConstants.apiUrl + appConstants.messages + uid + '/' + $stateParams.id,
                    {headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    $scope.data = response.data.data
                    $scope.data = getDate($scope.data)
                    console.log($scope.data)
                }).catch(function (error){
                    if (error){
                            console.log(error.code);
                            console.log(error.message);
                        
                    } 
                })
            }

            var getPrivateKey = function (){
                for (var i = 0 ; i < $scope.userKeys.length; i++){
                    if ($scope.userKeys[i].default == true){
                        return $scope.userKeys[i].privateKey
                    }
                }
            }

            var decriptMessage = async (privateKey,passphrase,mensaje) => {
                const privKeyObj = (await openpgp.key.readArmored(privateKey)).keys[0]
                await privKeyObj.decrypt(passphrase)
                const options = {
                    message: await openpgp.message.readArmored(mensaje),    // parse armored message
                    //publicKeys: (await openpgp.key.readArmored(pubkey)).keys, // for verification (optional)
                    privateKeys: [privKeyObj]                                 // for decryption
                }

                return openpgp.decrypt(options).then(plaintext => {
                    var decrypted = plaintext.data;
                    return decrypted
                })
            }

            $scope.passPopUp = function(){
                $scope.something = {};
                var myPopup = $ionicPopup.show({
                  template: '<input type="password" ng-model="something.passphrase">',
                  title: 'Introduzca su clave para ver el mensaje',
                  scope: $scope,
                  buttons: [
                    { text: 'Cancelar' },
                    {
                      text: '<b>Ver</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                        if (!$scope.something.passphrase) {
                          //don't allow the user to close unless he enters wifi password
                          e.preventDefault();
                        } else {
                            $scope.decrypt($scope.something.passphrase)
                        }
                      }
                    }
                  ]
                });
            }

            var show = function() {
                $ionicLoading.show({
                  template: '<ion-spinner icon="spiral"></ion-spinner>'
                })
              };
              var hide = function(){
                $ionicLoading.hide()
              };

            $scope.decrypt = async (passphrase) => {
                show()
                var privateKey = getPrivateKey();
                var privateKey = decryptKey(privateKey,$sessionStorage.appKey);
                var message = decriptMessage(privateKey,passphrase,$scope.data.content)
                message.then(function (decrypted){
                    $scope.data.content = decrypted;
                    $scope.decrypted = true;
                    hide()
                    $scope.$apply();
                }).catch(function (error){
                    alert('Verifique que su llave y passphrase sean correctas')
                })
            } 

            $scope.respond = function(name,id) {
                console.log(name,id)
                $state.go('dash.messages',{'id_user': id,'name': name});
            }

            var getDate = function (messages){
                for (var i = 0; i < messages.length; i++){
                    var sent = new Date(messages[i].data.timestamp);
                    messages[i].sent = sent.toLocaleString();
                }
                if(!messages.length){
                    var sent = new Date(messages.timestamp);
                    messages.sent = sent.toLocaleString();
                }
                return messages
            }

            $scope.getMessages = function (tray){
                $scope.tray = tray;
                var requestMessages = $.param({
                    user_id: uid
                })
                $http.post(appConstants.apiUrl + appConstants.messages + uid + '/mail/' +tray,requestMessages,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response);
                    if (response.data.status == 200){
                        var messages = response.data.data;
                        $scope.correos = getDate(messages);
                    }
                }).catch(function (error){
                    console.log(error);
                })
            }

            $scope.deleteMessage = function (){
                $http.delete(appConstants.apiUrl + appConstants.messages + uid + '/' + $stateParams.id,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.status == 200){
                        console.log(response.data);
                        alert('se ha eliminado un mensaje')
                        $state.go('tab.messages');
                    }
                }).catch(function (error){
                    alert(error)
                })
            }

            var updateStatus = function(id){
                $http.put(appConstants.apiUrl + appConstants.messages + uid + '/' + id,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data)
                }).catch(function (error){
                    alert(error)
                })
            }

            $scope.readMessage =  function (id, status){
                if (status == 'unread'){
                    updateStatus(id);
                }
                $state.go('tab.readMessage',{'id': id})
            }

            $scope.readOwnMessage = function (id){
                $state.go('tab.readMessage',{'id': id})
            }

            $scope.publishMessage = function (){
                var publishRequest = $.param({
                    sender: $scope.data.sender,
                    id_sender: $scope.data.id_sender,
                    content: $scope.data.content
                })
                $http.post(appConstants.apiUrl + appConstants.messages + uid + '/' + $stateParams.id + '/publish',publishRequest,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response);
                    $state.go('tab.messages')
                    alert('Su feedback ha sido publicado exitosamente')
                }).catch(function (error){
                    console.log(error);
                })
            }


            $scope.newMessage = function (){
                $state.go('tab.newMessage');
            }

            $scope.toggleForm = function(){
                $scope.form = !$scope.form;
            }
        }    
})()  