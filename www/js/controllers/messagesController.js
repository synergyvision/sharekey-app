(function() {
    'use strict';
    angular
        .module('starter')
        .controller('messagesController', messagesController);
  
        messagesController.$inject = ['$scope','$http','$localStorage','$state','$window','$location','$stateParams','appConstants','$ionicPopup','$ionicLoading','$filter'];
        function messagesController($scope,$http,$localStorage,$state,$window,$location,$stateParams,appConstants,$ionicPopup,$ionicLoading,$filter){
            var uid = $localStorage.uid
            $scope.userKeys = $localStorage[uid + 'keys'];
            var token = $localStorage.userToken;
            $scope.form = false;
            $scope.decryptedContent = $stateParams.content

            var filter = $filter('translate');

            $scope.getPublicKey =  function (idUser){
                if (!$scope.message){
                alert(filter('messages.empty_error'))
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
                var Private = decryptKey(keyPrivate,$scope.passphrase);
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
                    alert(filter('messages.send_success'));
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

            $scope.passPopUp = function(id,content){
                $scope.something = {};
                $scope.something.id = id;
                $scope.something.content = content;
                var myPopup = $ionicPopup.show({
                  template: '<input type="password" ng-model="something.passphrase">',
                  title: filter('messages.ask_pass'),
                  scope: $scope,
                  buttons: [
                    { text: filter('messages.cancel') },
                    {
                      text: filter('messages.continue'),
                      type: 'button-positive',
                      onTap: function(e) {
                        if (!$scope.something.passphrase) {
                          //don't allow the user to close unless he enters wifi password
                          e.preventDefault();
                        } else {
                            $scope.decrypt($scope.something)
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

            $scope.decrypt = async (data) => {
                var privateKey = getPrivateKey();
                try {
                    var privateKey = decryptKey(privateKey,data.passphrase);
                }catch(e){
                    alert(filter('messages.pass_error'))
                }
                var message = decriptMessage(privateKey,data.passphrase,data.content)
                message.then(function (decrypted){
                    $state.go('tab.readMessage',{'id': data.id,'content': decrypted})
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
                        alert(filter('messages.deleted'))
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

            $scope.readMessage =  function (id, status,content){
                if (status == 'unread'){
                    updateStatus(id);
                }
                $scope.passPopUp(id,content)
            }

            $scope.readOwnMessage = function (id,content){
                $scope.passPopUp(id,content)
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
                    alert(filter('messages.publish_success'))
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