(function() {
    'use strict';
    angular
        .module('starter')
        .controller('chatsController', chatsController);
  
        chatsController.$inject = ['$scope','$http','$localStorage','$state','$sessionStorage','$stateParams','$location','appConstants','$ionicPopup'];
        function chatsController($scope,$http,$localStorage,$state,$sessionStorage,$stateParams,$location,appConstants,$ionicPopup){
            var uid = $localStorage.uid
            var token = $localStorage.userToken;
            $scope.uid =$localStorage.uid;
            $scope.keys = $localStorage[uid + 'keys'];
            var id_chat = $stateParams.id_chat; 
            var decrypted = [];
            $scope.show = false;
            $scope.userChats = [];
            
            $scope.getUserChats = async () => {
            $http({
                url:   appConstants.apiUrl + appConstants.profile +uid+ '/chats',
                method: 'GET',
                headers: {'Authorization':'Bearer: ' + token} 
                }).then(function (response){
                if (response.data.data){
                    var userChats = response.data.data
                    console.log(userChats)
                    for (var i = 0; i < userChats.length; i++){
                    storeLocalChats(userChats[i].chatID,userChats[i].title,userChats[i].members,userChats[i].last_modified)
                    }
                }else{
                    $scope.userChats = []
                }
                }).catch(function(error){
                    console.log(error);
                })
            }

            $scope.getContacts = function (){
                $http({
                url: appConstants.apiUrl + appConstants.profile + uid + '/contacts',
                method: 'GET',
                headers: {'Authorization':'Bearer: ' + token} 
                }).then(function (response){
                    $scope.contacts = response.data.data;
                }).catch(function (error){
                    alert(error.message);
                })
            }

            var storeLocalChats = function (id,title,participants,last_modified){
                var chat = {
                    chatID: id,
                    title: title,
                    members: participants,
                    last_modified: last_modified
                }
                $scope.userChats.push(chat)
                $localStorage[uid + '-chats'] = $scope.userChats

            }

            $scope.createChat = function (){
                var participants = {}
                for (var i = 0; i < $scope.name.length; i++){
                    participants[$scope.name[i]] = 'default'
                }
                participants[uid] = $scope.keyname;
                var chatRequest = $.param({
                title: $scope.title,
                participants: JSON.stringify(participants)
                })
                $http({
                        url: appConstants.apiUrl + appConstants.chats + uid,
                        method: "POST",
                        data: chatRequest,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization':'Bearer: ' + token}
                    }).then(function (response){
                        console.log('chat created')
                        storeLocalChats(response.data.Id,$scope.title,participants); 
                    }).catch(function (error){
                    console.log(error);
                    alert('Error en la creacion de chat intenta de nuevo')
                    })
            }

            $scope.getChat = function (id){
                delete $sessionStorage.passphrase;
                $state.go('tab.chatsMessages',{'id_chat': id});
            }

            $scope.chatInfo = function (){
                for (var i = 0; i < $localStorage[uid + '-chats'].length; i++){
                    if ($localStorage[uid + '-chats'][i].chatID == id_chat){
                        $scope.infoChat = $localStorage[uid + '-chats'][i]
                    }
                }
            }

            $scope.deleteChat = function(id_chat){
                $http({
                url: appConstants.apiUrl + appConstants.profile  + uid + '/chats/' + id_chat,
                method: 'DELETE',
                headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data);
                    localDeleteChat(id_chat);
                    $state.go('tab.chats');
                }).catch(function (error){
                    alert(error.message);
                })
            }

            var localDeleteChat = function(id){
                for (var i = 0 ; i < $localStorage[uid + '-chats'].length; i++){
                if ($localStorage[uid + '-chats'][i].chatID == id){
                    return $localStorage[uid + '-chats'].splice(i,1);
                }
                }
            }

            var getRecipientId = function(){
                var ids = Object.keys($scope.infoChat.members)
                for (var i = 0; i < ids.length; i++){
                    if (ids[i] == uid){
                        ids.splice(i,1);
                        return ids;
                    }
                }
            }

            var getRecipientKey =  async (idUser) => {
                var keyRequest = $.param({
                    id: idUser
                })
                return await $http({
                    url: appConstants.apiUrl + appConstants.profile  + uid + '/getPublicKey',
                    method: 'POST',
                    data: keyRequest,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log('retrieved public key from server')
                    var key = response.data.data;
                    return key.toString();
                }).catch(function (error){
                    console.log(error);
                })
                
            }

            var getMyKey = function (name){
                if (name != 'default'){  
                for (var i = 0 ; i < $scope.keys.length; i++){
                    if ($scope.keys[i].keyname ==name){
                        return $scope.keys[i].publicKey
                    }
                }
                }else{
                for (var i = 0 ; i < $scope.keys.length; i++){
                    if ($scope.keys[i].default == true){
                        return $scope.keys[i].publicKey
                    }
                }
                }  
            }

            var getMyPrivateKey = function (name){
                if (name != 'default'){
                for (var i = 0 ; i < $scope.keys.length; i++){
                    if ($scope.keys[i].keyname ==name){
                        return $scope.keys[i].privateKey
                    }
                }
                }else{
                for (var i = 0 ; i < $scope.keys.length; i++){
                    if ($scope.keys[i].default == true){
                        return $scope.keys[i].privateKey
                    }
                }
                }  
            }


            var encryptMessage = async (pubkeys, message) => {

                pubkeys = pubkeys.map(async (key) => {
                return (await openpgp.key.readArmored(key)).keys[0]
                });
                const options = {
                    message: openpgp.message.fromText(message),
                    publicKeys: await Promise.all(pubkeys)       				  // for encryption
                }
                return openpgp.encrypt(options).then(ciphertext => {
                    var encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
                    return encrypted
                })
            };

            var sendRequest = function(request){
                $http({
                    url: appConstants.apiUrl + appConstants.messages + uid + '/' + id_chat + '/messages',
                    method: 'POST',
                    data: request,
                    headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data);
                    $scope.chatMessage = "";
                    $state.reload();
                }).catch(function (error){
                    console.log(error);
                    alert(error);
                })
            }

            var getMultipleKeys = async(keys)=>{
                var keyRequest = $.param({
                    id: JSON.stringify(keys)
                })
                return await $http({
                    url: appConstants.apiUrl + appConstants.profile + uid + '/getMultipleKeys',
                    method: 'POST',
                    data: keyRequest,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log('retrieved public keys from server')
                    var key = response.data.data;
                    return key;
                }).catch(function (error){
                    console.log(error);
                })
            }

            $scope.sendToChat = function (){
                var recipientId = getRecipientId($stateParams.id_chat);
                var myPublicKey = getMyKey($scope.infoChat.members[uid]);
                if (recipientId.length > 1){
                var recipientKey = getMultipleKeys(recipientId);
                }else{
                var recipientKey = getRecipientKey(recipientId[0]);
                }
                recipientKey.then(function (recipientKey){
                    var publicKeys = [recipientKey,myPublicKey]
                    var message = encryptMessage(publicKeys,$scope.chatMessage);
                    message.then(function (message){
                        var ids = Object.keys($scope.infoChat.members);
                        var messageRequest = $.param({
                            id_sender: uid,
                            message: message,
                            id_chat: id_chat,
                            recipients: JSON.stringify(ids)
                        })
                        sendRequest(messageRequest);
                    }).catch(function (error){
                        console.log(error)
                        alert(error)
                    })
                }).catch(function (error){
                    console.log(error)
                    alert(error)
                })
            }
        
            var decriptMessage = async (privateKey,passphrase,mensaje) => {
                try{
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
                }catch(error){
                    alert('Error: Verifique que su par de llave y passphrase sean correctos')
                }  
            }

            var decryptKey = function (key,password) {
                var bytes  = CryptoJS.AES.decrypt(key,password);
                var key = bytes.toString(CryptoJS.enc.Utf8);
                return key;
            
            }

            var decryptMessages = async (messages) => {
                console.log('decripting')
                var privateKey = getMyPrivateKey($scope.infoChat.members[uid]);
                privateKey = decryptKey(privateKey,$sessionStorage.appKey);
                for (var i = 0; i < messages.length; i++){
                    var message = await decriptMessage(privateKey,$sessionStorage.passphrase,messages[i].data.content)
                    messages[i].data.content = message;
                    var sent = new Date(messages[i].data.date_sent);
                    messages[i].sent = sent.toLocaleString();
                }
                return messages
            } 

            $scope.getMessages =  function (){
                $http({
                  url: appConstants.apiUrl + appConstants.messages + uid + '/chat/' + id_chat,
                  method: 'GET',
                  headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data.data)
                    $scope.chatMessages = response.data.data;
                    if ($sessionStorage.passphrase){
                        var decripted = decryptMessages($scope.chatMessages)
                        decripted.then (function (decripted){
                            $scope.show = true;
                            $scope.chatMessages = decripted;
                            $scope.$apply()
                        }).catch(function (error){
                            console.log(error);
                            alert(error)
                        })
                    }
                }).catch(function (error){
                    if (error){
                        if (error.status == 401){
                            alert('Su sesion ha vencido')
                            $state.go('dash.login');
                        }
                        else{
                            console.log(error.code);
                            console.log(error.message);
                        }
                    } 
                })
            }

            $scope.showMessages = function (passphrase){
                $sessionStorage.passphrase = passphrase
                var decripted = decryptMessages($scope.chatMessages)
                decripted.then(function (decripted){
                    $scope.show = true;
                    $scope.chatMessages = decripted;
                    $scope.$apply();
                })
            }

            $scope.savePop = function(){
                $scope.passphrase = {};
                var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="passphrase.data">',
                title: 'Inserta clave de chat',
                scope: $scope,
                buttons: [
                    { text: 'Cancelar' },
                    {
                    text: '<b>Continuar</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (!$scope.passphrase.data) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                        } else {
                        return $scope.passphrase.data;
                        }
                    }
                    }
                ]
                });
                myPopup.then(function(res) {
                    $scope.showMessages(res)
                });
            }
    }        
})()  