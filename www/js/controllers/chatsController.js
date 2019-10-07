(function() {
    'use strict';
    angular
        .module('starter')
        .controller('chatsController', chatsController)

        chatsController.$inject = ['$scope','$http','$localStorage','$state','$stateParams','$location','appConstants','$ionicPopup','$ionicLoading','$filter','ionicAlertPopup'];
        function chatsController($scope,$http,$localStorage,$state,$stateParams,$location,appConstants,$ionicPopup, $ionicLoading,$filter,ionicAlertPopup){
            var uid = $localStorage.uid
            var token = $localStorage.userToken;
            $scope.uid =$localStorage.uid;
            $scope.keys = $localStorage[uid + 'keys'];
            var id_chat = $stateParams.id_chat; 
            var decrypted = [];
            $scope.show = false;
            $scope.userChats = [];
            var username =$localStorage[uid +'-username'];
            $scope.name = [];
            $scope.decrypted = false;

            var filter = $filter('translate')

            $scope.activeKeys = function(){
                if(!$localStorage[uid+'keys']){
                    ionicAlertPopup.alertPop(filter('keys.info_title'),filter('tabs.keys_message'))
                    $state.go('tab.account',{'user_id': uid})
                }
            }    

            //Funtion that makes http call to retrieve user chats and store then in loclahost
            
            
            $scope.getUserChats = async () => {
                $scope.spinner = true
            $http.get( appConstants.apiUrl + appConstants.profile +uid+ '/chats',{headers: {'Authorization':'Bearer: ' + token} 
                }).then(function (response){
                    $scope.spinner = false
                if (response.data.data){
                    var userChats = response.data.data
                    $scope.data = userChats;
                    for (var i = 0; i < userChats.length; i++){
                    storeLocalChats(userChats[i].chatID,userChats[i].title,userChats[i].members,userChats[i].last_modified)
                    }
                }else{
                    $scope.userChats = []
                }
                }).catch(function(error){
                    $scope.spinner = false
                    if(error.status == 401){
                        ionicAlertPopup.alertPop("error",filter('personalInfo.expired_error'))
                        $state.go('login')
                    }
                    console.log(error);
                })
            }

            //function that gets the user contacts for the purpose of creating a new chat

            $scope.getContacts = function (){
                $http.get(appConstants.apiUrl + appConstants.profile + uid + '/contacts',{headers: {'Authorization':'Bearer: ' + token}
            }).then(function (response){
                    $scope.contacts = response.data.data;
                }).catch(function (error){
                    console.log(error.message);
                })
            }

            // function that stores chats localy

            var storeLocalChats = function (id,title,participants,last_modified = null){
                var chat = {
                    chatID: id,
                    title: title,
                    members: participants,
                    last_modified: last_modified
                }
                $scope.userChats.push(chat)
                $localStorage[uid + '-chats'] = $scope.userChats

            }

            //function that add a participants to a array of posible chat users

            $scope.addId = function(id){
                
                var added = false;
                for (var i = 0; i < $scope.name.length; i++){
                    if ($scope.name[i] == id){
                        added = true;
                        $scope.name.splice(i,1);
                    }
                }
                if (added == false){
                    $scope.name.push(id)
                }
            } 

           // function that creates a chat, then stores the info locally 

            var checkError = function(){
                if ($scope.name.length == 0){
                    ionicAlertPopup.alertPop(filter('chats.error'),filter('chats.no_contacts'))
                    return false
                }else if(!$scope.chatTitle){
                    ionicAlertPopup.alertPop(filter('chats.error'),filter('chats.no_title'))
                    return false
                }else if(!$scope.keyname){
                    ionicAlertPopup.alertPop(filter('chats.error'),filter('chats.no_keys'))
                    return false
                }else{
                    return true;
                }
            }

            $scope.createChat = function (){
                var participants = {}
                for (var i = 0; i < $scope.name.length; i++){
                    participants[$scope.name[i]] = 'default'
                }
                participants[uid] = $scope.keyname;
                console.log(participants,$scope.chatTitle)
                var chatRequest = $.param({
                    title: $scope.chatTitle,
                    participants: JSON.stringify(participants)
                })
                if (checkError()){
                    $http.post(appConstants.apiUrl + appConstants.chats + uid,chatRequest,{headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log('chat created')
                    storeLocalChats(response.data.Id,$scope.chatTitle,participants); 
                    $state.go('tab.chatsMessages',{'id_chat': response.data.Id});
                }).catch(function (error){
                    console.log(error);
                    ionicAlertPopup.alertPop("error",filter('chats.new_chat_error'))
            })
                }
            }



            $scope.getChat = function (id){
                $state.go('tab.chatsMessages',{'id_chat': id});
            }

            //function retrieves chat info from the ones stores locally

            $scope.chatInfo = function (){
                for (var i = 0; i < $localStorage[uid + '-chats'].length; i++){
                    if ($localStorage[uid + '-chats'][i].chatID == id_chat){
                        $scope.infoChat = $localStorage[uid + '-chats'][i]
                    }
                }
            }

            //function deletes a chat

            $scope.deleteChat = function(id_chat){
                $http.delete(appConstants.apiUrl + appConstants.profile  + uid + '/chats/' + id_chat,{headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data);
                    localDeleteChat(id_chat);
                    $state.go('tab.chats');
                }).catch(function (error){
                    console.log(error.message);
                })
            }


            //function deletes a locally stored chat

            var localDeleteChat = function(id){
                for (var i = 0 ; i < $localStorage[uid + '-chats'].length; i++){
                if ($localStorage[uid + '-chats'][i].chatID == id){
                    return $localStorage[uid + '-chats'].splice(i,1);
                }
                }
            }

            //function gets the id of the users of a chat

            var getRecipientId = function(){
                var ids = Object.keys($scope.infoChat.members)
                for (var i = 0; i < ids.length; i++){
                    if (ids[i] == uid){
                        ids.splice(i,1);
                        return ids;
                    }
                }
            }

            //function thats gets the public keys of an array of users

            var getRecipientKey =  async (idUser) => {
                var keyRequest = $.param({
                    id: idUser
                })
                return await $http.post(appConstants.apiUrl + appConstants.profile  + uid + '/getPublicKey',keyRequest,{headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log('retrieved public key from server')
                    var key = response.data.data;
                    return key.toString();
                }).catch(function (error){
                    console.log(error);
                })
                
            }

            // function retrieves the user public key by name or the default one

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

            // function retrieves the user private key by name or the default one

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

            //function encripts a message using multiple public keys

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

            //function send a message to chat

            var sendRequest = function(request){
                $http.post(appConstants.apiUrl + appConstants.messages + uid + '/' + id_chat + '/messages',request,{headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data);
                    $scope.chatMessage = "";
                    $scope.getMessages()
                }).catch(function (error){
                    console.log(error);
                })
            }

            //function retrieves multiple public keys from the server

            var getMultipleKeys = async(keys)=>{
                var keyRequest = $.param({
                    id: JSON.stringify(keys)
                })
                return await $http.post(appConstants.apiUrl + appConstants.profile + uid + '/getMultipleKeys',keyRequest,{headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log('retrieved public keys from server')
                    var key = response.data.data;
                    return key;
                }).catch(function (error){
                    console.log(error);
                })
            }

            //function takes a newle written message to encrypt it

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
                            recipients: JSON.stringify(ids),
                            username: username
                        })
                        sendRequest(messageRequest);
                    }).catch(function (error){
                        console.log(error)
                    })
                }).catch(function (error){
                    console.log(error)
                })
            }
        
            //function decrypts a mesage

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
                }  
            }

            //function decryps a private key stored locally

            var decryptKey = function (key,password) {
                var bytes  = CryptoJS.AES.decrypt(key,password);
                var key = bytes.toString(CryptoJS.enc.Utf8);
                return key;
            
            }

            //function open modal

            var show = function() {
                $ionicLoading.show({
                  template: '<ion-spinner icon="spiral"></ion-spinner>'
                })
              };
              var hide = function(){
                $ionicLoading.hide()
              };

            //function takes an array of messages to decrypt then

            var decryptMessages = async (messages,pass) => {
                console.log('decripting')
                show();
                var privateKey = getMyPrivateKey($scope.infoChat.members[uid]);
                privateKey = decryptKey(privateKey,pass);
                for (var i = 0; i < messages.length; i++){
                    var message = await decriptMessage(privateKey,pass,messages[i].data.content)
                    messages[i].data.content = message;
                    messages[i].decrypted = true;
                    var sent = new Date(messages[i].data.date_sent);
                    messages[i].sent = sent.toLocaleString();
                }
                return messages
            } 

            //function gets the messages of a chat

            $scope.getMessages =  function (){
                $scope.spinner = true;
                $http.get(appConstants.apiUrl + appConstants.messages + uid + '/chat/' + id_chat,{headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    $scope.spinner = false;
                    $scope.chatMessages = response.data.data;
                }).catch(function (error){
                    $scope.spinner = false;
                    if (error){
                        if (error.status == 401){
                            $state.go('login');
                        }
                        else{
                            console.log(error.code);
                            console.log(error.message);
                        }
                    } 
                })
            }

            //funciton show the newly decripted messages

            $scope.showMessages = function (passphrase){
                var decripted = decryptMessages($scope.chatMessages,passphrase)
                decripted.then(function (decripted){
                    hide();
                    $scope.show = true;
                    $scope.decrypted = true;
                    $scope.chatMessages = decripted;
                    $scope.$apply();
                }).catch(function(error){
                    ionicAlertPopup.alertPop("error",filter('chats.pass_error'))
                    hide();
                    console.log(error)
                })
            }


            //function opens a modal

            $scope.savePop = function(){
                $scope.passphrase = {};
                var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="passphrase.data">',
                title: filter('chats.ask_pass'),
                scope: $scope,
                buttons: [
                    { text: filter('chats.cancel') },
                    {
                    text: filter('chats.continue'),
                    type: 'button-positive',
                    onTap: function(e) {
                        if (!$scope.passphrase.data) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                        } else {
                            $scope.showMessages($scope.passphrase.data)
                        }
                    }
                    }
                ]
                });
            }
    }        
})()  