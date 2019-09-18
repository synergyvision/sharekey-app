(function() {
    'use strict';
    angular
        .module('starter')
        .controller('DashCtrl', DashCtrl);
  
        DashCtrl.$inject = ['$scope','$window','$localStorage','$ionicPopup','$stateParams','$http','$state','appConstants','$ionicLoading','$filter'];
        function DashCtrl($scope,$window,$localStorage,$ionicPopup,$stateParams,$http,$state,appConstants,$ionicLoading,$filter){
            var uid = $localStorage.uid
            $scope.uid = uid;
            $scope.storedKeys = $localStorage[uid+'keys'];
            var token = $localStorage.userToken;
            var post = $stateParams.post_id;
            $scope.username = $localStorage[uid + '-username'];
            $scope.edit = false;
            var filter = $filter('translate');

            if(!$localStorage[uid+'keys']){
              alert(filter('tabs.keys_message'))
              $state.go('tab.keys')
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
          
          
              var getMyDefaultKey = function (){
                var userKeys = $scope.storedKeys
                for (var i = 0 ; i <= userKeys.length; i++){
                    if (userKeys[i].default == true){
                        return userKeys[i].publicKey
                    }
                }
              }
          
              var getMyDefaultPrivateKey = function (){
                var userKeys = $scope.storedKeys;
                for (var i = 0 ; i < userKeys.length; i++){
                    if (userKeys[i].default == true){
                        return userKeys[i].privateKey
                    }
                }
              }
          
              var encryptStatus = async (status) => {
                  //const privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0]
                  //await privKeyObj.decrypt(passphrase)
                  var pubkey = await getMyDefaultKey();
          
          
                  const options = {
                      message: openpgp.message.fromText(status),       // input as Message object
                      publicKeys: (await openpgp.key.readArmored(pubkey)).keys // for encryption
                     // privateKeys: [privKeyObj]                                 // for signing (optional)
                  }
              
                  return openpgp.encrypt(options).then(ciphertext => {
                      var encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
                      return encrypted
                  })
                }
          
              $scope.newPost = async () =>{
                if (!$scope.public){
                  $scope.public = false;
                  $scope.status = await encryptStatus($scope.status);
                }
                var postRequest = $.param({
                  uid: uid,
                  content: $scope.status,
                  public: $scope.public
                }) 
               $http({
                  url: appConstants.apiUrl + appConstants.posts,
                  method: 'POST',
                  data: postRequest,
                  headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                  console.log(response);
                  $state.reload();
                }).catch(function (error){
                    console.log(error)
                })
              }
          
                var checkLike = function (reactions){
                  if (reactions[uid]){
                    return reactions[uid];
                  }else{
                    return null;
                  }
                }
          
          
              var getDates = function (posts){
                for (var i = 0; i < posts.length; i++){
                  if (posts[i].data.reactions){
                    posts[i].reactions = checkLike(posts[i].data.reactions)
                  }else{
                    posts[i].reactions = null;
                  }
                  if (!posts[i].userPicture){
                    posts[i].userPicture = false;
                  }
                  var sent = new Date(posts[i].data.timestamp);
                  posts[i].data.sent = sent.toLocaleString(); 
                }
                return posts
              } 
          
              $scope.getPosts = function (){
                $http({
                  url: appConstants.apiUrl + appConstants.posts,
                  method: 'GET',
                  headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    var posts = response.data.data;
                    console.log(posts)
                    $scope.posts = getDates(posts);
                    console.log($scope.posts)
                }).catch(function (error){
                    console.log(error)
                })
              }
          
              $scope.likeStatus = function (status,post_id){
                if (status == 'like'){
                    var statusRequest = $.param({
                      likes: 1,
                      likedBy: uid
                    })
                }else{
                  statusRequest = $.param({
                    dislikes: 1,
                    likedBy: uid
                  })
                }
                $http({
                  url: appConstants.apiUrl + appConstants.posts + post_id + '/likes',
                  method: 'PUT',
                  data: statusRequest,
                  headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                  console.log(response.data);
                  $state.reload();
                }).catch(function (error){
                  console.log(error)
                })
              }
          
              $scope.editPop =  function (content){
                $scope.data = {};
                $scope.data.content = content;
                var myPopup = $ionicPopup.show({
                  template: '<input type="text" ng-model="data.content">',
                  title: filter('posts.edit_text'),
                  scope: $scope,
                  buttons: [
                    { text: filter('posts.cancel') },
                    {
                      text: filter('posts.edit'),
                      type: 'button-positive',
                      onTap: function(e) {
                        if (!$scope.data.content) {
                          //don't allow the user to close unless he enters wifi password
                          e.preventDefault();
                        } else {
                          return $scope.data.content;
                        }
                      }
                    }
                  ]
                });
                myPopup.then(function(res) {
                  editPost(res)
                });
          
              }
          
              var editPost = function(content){
                var editRequest = $.param({
                  content: content
                })
                $http({
                  url: appConstants.apiUrl + appConstants.posts + post,
                  method: 'PUT',
                  data: editRequest,
                  headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                  console.log(response.data);
                  $scope.post.data.content = content;
                }).catch(function (error){
                  console.log(error)
                })
              }
          
              $scope.deletePost = function (id){
                $http({
                  url: appConstants.apiUrl + appConstants.posts + id,
                  method: 'DELETE',
                  headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                  $state.go('tab.dash');
                }).catch(function (error){
                  console.log(error)
                })
              }
          
              $scope.goToPost = function (id){
                $state.go('tab.post',{'post_id': id})
              }
          
              $scope.loadPost = function (){
                $http({
                  url: appConstants.apiUrl + appConstants.posts + uid + '/' + post,
                  method: 'GET',
                  headers: {'Authorization':'Bearer: ' + token} 
                }).then(function (response){
                    $scope.post = response.data.data;
                  if ($scope.post.data.public == 'false'){
                    $scope.post.encrypted = true;
                  }
                }).catch (function (error){
                  console.log(error.code)
                  console.log(error.message)
                })
              }
          
              $scope.askPassphrase = function (content){
                $scope.postContent = content;
                $scope.data = {};
                var myPopup = $ionicPopup.show({
                  template: '<input type="password" ng-model="data.passphrase">',
                  title: filter('posts.ask_pass'),
                  scope: $scope,
                  buttons: [
                    { text: filter('posts.cancel') },
                    {
                      text: filter('posts.see'),
                      type: 'button-positive',
                      onTap: function(e) {
                        if (!$scope.data.passphrase) {
                          //don't allow the user to close unless he enters wifi password
                          e.preventDefault();
                        } else {
                          $scope.decryptPost($scope.data.passphrase)
                        }
                      }
                    }
                  ]
                });
              }
          
              var decryptKey = function (key,pass) {
                var bytes  = CryptoJS.AES.decrypt(key,pass);
                var key = bytes.toString(CryptoJS.enc.Utf8);
                return key;
            
              }
          
              var decryptPost = async (privateKey,passphrase,mensaje) => {
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
              var show = function() {
                $ionicLoading.show({
                  template: '<ion-spinner icon="spiral"></ion-spinner>'
                })
              };
              var hide = function(){
                $ionicLoading.hide()
              };
          
              $scope.decryptPost = function (passphrase){
                show()
                var privateKey = getMyDefaultPrivateKey();
                privateKey = decryptKey(privateKey,passphrase);
                var post = decryptPost(privateKey,passphrase,$scope.postContent)
                post.then(function (content){
                  hide();
                  $scope.post.encrypted = false;
                  $scope.post.data.content = content;
                  $scope.$apply();
                }).catch(function (error){
                    alert(filter('posts.error_passphrase'))
                })
              }
          
              $scope.getComments = function(){
                $http.get(appConstants.apiUrl + appConstants.comments + $scope.uid + '/' + post,
                  {headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data);
                    $scope.comments = response.data.data
                }).catch(function (error){
                  console.log(error)
                })
              }
          
              $scope.sendComment = function(){
                var commentRequest = $.param({
                  content: $scope.newComment,
                  user_id: $scope.uid,
                  post_id: post
                })
                $http.post(appConstants.apiUrl + appConstants.comments + '/',commentRequest,
                  {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                  $scope.newComment = "";
                  console.log(response.data);
                  $scope.getComments();
                }).catch(function (error){
                    console.log(error);
                })
              } 
          
              $scope.editCommentPop = function (id,content){
                  $scope.comment = {};
                  $scope.comment.id = id;
                  $scope.comment.content = content;
                  var myPopup = $ionicPopup.show({
                    template: '<input type="text" ng-model="comment.content">',
                    title: filter('posts.edit_comment'),
                    scope: $scope,
                    buttons: [
                      { text: filter('posts.cancel') },
                      {
                        text: filter('posts.edit'),
                        type: 'button-positive',
                        onTap: function(e) {
                          if (!$scope.comment.content) {
                            //don't allow the user to close unless he enters wifi password
                            e.preventDefault();
                          } else {
                            $scope.editComment($scope.comment);
                          }
                        }
                      }
                    ]
                  });
              }
          
              $scope.editComment = function(comment){
                  var editRequest = $.param({
                    content: comment.content
                  })
                  $http.put(appConstants.apiUrl + appConstants.comments + comment.id,editRequest,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                  }).then(function (response){
                    console.log(response.data)
                    $scope.editedCommentContent = "";
                    $scope.editedCommentId = "";
                    $scope.getComments();
                  }).catch(function (error){
                    console.log(error)
                  })
                  
              }
          
              $scope.deleteComment = function (id){
                $http.delete(appConstants.apiUrl  + appConstants.comments + id,{headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                  console.log(response.data);
                  $scope.getComments();
                }).catch(function (error){
                  console.log(error)
                })
              }
            }      
           
})()  