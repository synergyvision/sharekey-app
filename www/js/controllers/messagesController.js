(function() {
    'use strict';
    angular
        .module('starter')
        .controller('messagesController', messagesController);
  
        messagesController.$inject = ['$scope','$http','$localStorage','$state','$window','$location','$stateParams','appConstants','$ionicPopup','$ionicLoading','$filter','ionicAlertPopup'];
        function messagesController($scope,$http,$localStorage,$state,$window,$location,$stateParams,appConstants,$ionicPopup,$ionicLoading,$filter,ionicAlertPopup){
            var uid = $localStorage.uid
            $scope.userKeys = $localStorage[uid + 'keys'];
            var token = $localStorage.userToken;
            $scope.form = false;
            $scope.decryptedContent = $stateParams.content
            $scope.messages = null;

            var filter = $filter('translate');

            $scope.activeKeys = function(){
                if(!$localStorage[uid+'keys']){
                    ionicAlertPopup.alertPop(filter('keys.info_title'),filter('tabs.keys_message'))
                    $state.go('tab.account',{'user_id': uid})
                  }
            }


            //retrives the recipient public key

            $scope.getPublicKey =  function (idUser){
                if (!$scope.message || !idUser){
                    ionicAlertPopup.alertPop(filter('messages.error'),filter('messages.invalid'))
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
                        console.log('here')
                        var userData = {
                            [idUser]: response.data.name
                          }
                        $scope.encrypt(response.data.data,userData);
                    }).catch(function (error){
                        console.log(error)
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

            //retrieves public key from the locally stored ones

            var getPublicKey = function (name){
                for (var i = 0 ; i < $scope.userKeys.length; i++){
                    if ($scope.userKeys[i].keyname ==name){
                        return $scope.userKeys[i].publicKey
                    }
                }
            }

             //retrieves private key from the locally stored ones

            var getPrivateKey = function (name){
                for (var i = 0 ; i < $scope.userKeys.length; i++){
                    if ($scope.userKeys[i].keyname == name){
                        return $scope.userKeys[i].privateKey
                    }
                }
            }

            //decrypts the hashed private key

            var decryptKey = function (key,password) {
                var bytes  = CryptoJS.AES.decrypt(key,password);
                var key = bytes.toString(CryptoJS.enc.Utf8);
                return key;

            }

            //encrypts the body of the message with the sender and recipients public keys, 
            //if passphrase is received it signs the message

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

            //retrieves list of contacts

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

            //function that starts the encription flow then passes the data to be sent

            $scope.encrypt = function (key,userdata) {
                console.log('begin encription')
                if ($scope.chatKey){
                    console.log('here')
                    show();
                    var keyPublic = getPublicKey($scope.chatKey);
                    var keyPrivate = getPrivateKey($scope.chatKey);
                    var pKeys = [keyPublic,key]
                    if ($scope.passphrase){
                        var Private = decryptKey(keyPrivate,$scope.passphrase);
                    }
                    var message = encryptWithMultiplePublicKeys(pKeys,Private,$scope.passphrase,$scope.message);
                    message.then( function (encryptedMessage){
                        sendMessage(encryptedMessage,userdata);
                    }).catch(function (error){
                        hide();
                        ionicAlertPopup.alertPop(filter('messages.error'),filter('messages.invalid'))
                    })
                }else{
                    ionicAlertPopup.alertPop(filter('messages.error'),filter('messages.no_keys'))
                }    
            }

            //function that sends the message to the server

            var sendMessage = function (messageEncrypted,userdata){
                if (!$scope.publish){
                    $scope.publish = false;
                }
                var messageRequest = $.param({
                id_sender: uid,
                username: $localStorage[uid + '-username'],
                content: messageEncrypted,
                recipient: $scope.id_recipient,
                publish: $scope.publish,
                userKeys: JSON.stringify(userdata)
                })
               $http.post(appConstants.apiUrl + appConstants.messages + uid, messageRequest,
                    {headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    hide();
                    ionicAlertPopup.alertPop('Mensaje',filter('messages.send_success'))
                    $state.go('tab.messages');
                    console.log('message sent');
                }).catch(function (error){
                    hide();
                    console.log(error)
                })
            }

            //function that retrives a single message

            $scope.getMessage = function (){
                $http.get(appConstants.apiUrl + appConstants.messages + uid + '/' + $stateParams.id,
                    {headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    $scope.photo = response.data.photo;
                    $scope.data = response.data.data
                    $scope.data = getDate($scope.data)
                    if($scope.data.status == "unread"){
                        updateStatus($stateParams.id)
                    }
                }).catch(function (error){
                    if (error){
                            console.log(error.code);
                            console.log(error.message);
                        
                    } 
                })
                 
            }

            //function that retrieves a default private key

            var getPrivateKey = function (){
                for (var i = 0 ; i < $scope.userKeys.length; i++){
                    if ($scope.userKeys[i].default == true){
                        return $scope.userKeys[i].privateKey
                    }
                }
            }

            //function decrypts the body of the messahe to be read

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

            //passphrase modal

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

            //spiner modal

            var show = function() {
                $ionicLoading.show({
                  template: '<ion-spinner icon="spiral"></ion-spinner>'
                })
              };
              var hide = function(){
                $ionicLoading.hide()
              };

             //function that starts the decrypt flow 

            $scope.decrypt = async (data) => {
                var privateKey = getPrivateKey();
                try {
                    var privateKey = decryptKey(privateKey,data.passphrase);
                }catch(e){
                    ionicAlertPopup.alertPop('error',filter('messages.pass_error'))
                }
                var message = decriptMessage(privateKey,data.passphrase,data.content)
                message.then(function (decrypted){
                    $state.go('tab.readMessage',{'id': data.id,'content': decrypted})
                })
            } 

            //function that changes the page from read to respond

            $scope.respond = function(name,id) {
                console.log(name,id)
                $state.go('dash.messages',{'id_user': id,'name': name});
            }

            //function transforms the timestamp to dates

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

            //function gets users list of messages by the tray

            $scope.getMessages = function (tray){
                    $scope.spinner = true;
                    $scope.tray = tray;
                    var requestMessages = $.param({
                        user_id: uid
                    })
                    $http.post(appConstants.apiUrl + appConstants.messages + uid + '/mail/' +tray,requestMessages,
                        {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                    }).then(function (response){
                        if (response.data.status == 200){
                            $scope.spinner = false;
                            var messages = response.data.data;
                            $scope.correos = getDate(messages);
                        }
                    }).catch(function (error){
                        $scope.spinner = false;
                        if (error.status == 401){
                            $state.go('login');
                            $scope.spinner = false;
                        }
                        console.log(error);
                    })
            }

            //function deletes a message

            $scope.deleteMessage = function() {
                var confirmPopup = $ionicPopup.confirm({
                  title: filter('messages.confirm_title'),
                  template: filter('messages.confirm_text'),
                  cancelText: filter('messages.confirm_button_no'),
                  okText: filter('messages.confirm_button_yes')
                });
             
                confirmPopup.then(function(res) {
                  if(res) {
                    deleteMessage();
                  }
                });
              };

            var deleteMessage = function (){
                $http.delete(appConstants.apiUrl + appConstants.messages + uid + '/' + $stateParams.id,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.status == 200){
                        console.log(response.data);
                        ionicAlertPopup.alertPop('Mensaje',filter('messages.deleted'))
                        $state.go('tab.messages');
                    }
                }).catch(function (error){
                    console.log(error)
                })
            }

            //function changes status of message from new to read

            var updateStatus = function(id){
                $http({url: appConstants.apiUrl + appConstants.messages + uid + '/' + id, method: 'PUT',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data)
                }).catch(function (error){
                    console.log(error)
                })
            }

            //functions that read messages

            $scope.readMessage =  function (id, status,content){
                $scope.passPopUp(id,content)
            }

            $scope.readOwnMessage = function (id,content){
                $scope.passPopUp(id,content)
            }

            //function that allows users to publish a received message

            $scope.publishMessage = function (){
                var publishRequest = $.param({
                    sender: $scope.data.sender,
                    id_sender: $scope.data.id_sender,
                    content: $stateParams.content
                })
                $http.post(appConstants.apiUrl + appConstants.messages + uid + '/' + $stateParams.id + '/publish',publishRequest,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response);
                    $state.go('tab.messages')
                    ionicAlertPopup.alertPop('Mensaje',filter('messages.publish_success'))
                }).catch(function (error){
                    console.log(error);
                })
            }

            //go to ne message tab


            $scope.newMessage = function (){
                $state.go('tab.newMessage');
            }

            // in case of signing

            $scope.toggleForm = function(){
                $scope.form = !$scope.form;
            }
        }    
})()  