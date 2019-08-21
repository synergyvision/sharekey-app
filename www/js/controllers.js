
var env = {};

// Import variables if present (from env.js)
if(window){  
  Object.assign(env, window.__env);
}

function encryptKeys(key,seed){
  var ciphertext = CryptoJS.AES.encrypt(key,seed);
  return ciphertext
}

 function translate(phrase){
    var chars={
		"á":"a", "é":"e", "í":"i", "ó":"o", "ú":"u","ñ":"n"}
    var expr=/[áàéèíìóòúù]/ig;
    var text= phrase.replace(expr,function(e){return chars[e]});
    return text;

 }


ngModule = angular.module('starter.controllers', ['ngStorage'])

ngModule.constant('__env', env)

.controller('LoginController', function ($scope,$http,$location,$localStorage,__env,$state){
  var getServerKey = function (){
    return $http({
      url: __env.apiUrl + 'config/serverKeys',
      method: 'GET'
    }).then(function(response){
      return response.data.publickey
    }).catch(function (error){
      console.log(error)
    })
  }

  var encryptPassword = function(password){
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

  $scope.sendData = function(){
    password = encryptPassword($scope.password)
    password.then(function (password){
        var loginRequest = $.param({
          email: $scope.email,
          password: password
        });
        $http({
          url : __env.apiUrl + 'login',
          method: 'POST',
          data: loginRequest,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
        }).then(function(response){
          if (response.data.status == 200){
            $localStorage.uid = response.data.uid;
            $localStorage.userToken = response.data.token
            $http({
              url: __env.apiUrl +  __env.profile + $localStorage.uid,
              method: 'GET',
              headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization': 'Bearer: ' + $localStorage.userToken}
            }).then(function (response){
              if (response.data.status == 200){
                  $localStorage[$localStorage.uid + '-username'] = response.data.content.username;
                  $localStorage.userPicture = response.data.content.profileUrl;
                  $state.go('tab.dash');
              }else{
                var alertPopup = $ionicPopup.alert({
                  title: 'Error',
                  template: 'Ha ocurrido un error'
                });
              }  
            })
          }else{
            if (response.data.status === 'auth/wrong-password'){
              var alertPopup = $ionicPopup.alert({
                title: 'Error',
                template: 'Su contraseña es incorrecta'
              });
            } else if (response.data.status === 'auth/user-not-found'){
              var alertPopup = $ionicPopup.alert({
                title: 'Error',
                template: 'Su correo es invalido'
              });
            }
          }
        })
      })  
    }
})


.controller('CheckEmailController', function ($scope,$http,__env,$ionicPopup){
    $scope.sendEmail = function(){
      var emailRequest = $.param({
        email: $scope.email,
      });
      $http({
        url :  __env.apiUrl + 'login/sendEmail',
        method: 'POST',
        data: emailRequest,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
      }).then(function(response){
        if (response.data.status == 200){
          var alertPopup = $ionicPopup.alert({
            title: 'Información',
            template: 'Se ha enviado un correo de recuperacioón a tu cuenta'
          });
        }else {
          var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'Tu correo es invalido o no esta registrado'
          });
        }
      })
    }  
})

.controller('signUpController', function($scope,$http,$location,$state,__env,$ionicPopup) {
  
  $scope.sendData = function(){
    var signUpRequest = $.param({
      email: $scope.email,
      password: $scope.password,
      nombre: $scope.name,
      apellido: $scope.lastname,
      telefono: $scope.phone,
      usuario: $scope.username
    });
    $http({
      url : __env.apiUrl + 'signup',
      method: 'POST',
      data: signUpRequest,
      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
    }).then(function(response){
      if (response.data.status == 201){
        var alertPopup = $ionicPopup.alert({
          title: 'Exito!',
          template: 'El usuario se ha registrado exitosamente'
        });
        $state.go('login');
      }else{
        if (response.data.status == 400){
          var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'El nombre de usuario no se encuentra disponible'
          });
        } else if (response.data.status === 'auth/email-already-in-use'){
          var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'El correo ya se encuentra asociado a una cuenta'
          });
        }
      }
    })
  }

})


.controller('publicationsController', function($scope,$http,$localStorage,$state,$location,$stateParams,$ionicModal,$ionicPopup){
  var token = $localStorage.userToken;
  var uid = $localStorage.uid;
  var user_id = $stateParams.user_id;
   $scope.username = $localStorage[uid + '-username'];

   var checkLike = function (reactions){
     if (reactions[uid]){
       return reactions[uid];
     }else{
       return null;
     }
   }
 

   var getDates = function (feedbacks){
   for (i = 0; i < feedbacks.length; i++){
     if (feedbacks[i].data.reactions){
       feedbacks[i].reactions = checkLike(feedbacks[i].data.reactions)
     }else{
       feedbacks[i].reactions = null;
     }
     sent = new Date(feedbacks[i].data.timestamp);
     feedbacks[i].data.timestamp = sent.toLocaleString();
     if (!feedbacks[i].picture){
       feedbacks[i].picture = "../img/default-user-icon-8.jpg"
     }
   }
   return feedbacks;
 } 

  $scope.getFeedbacks = function(){

   var requestFeedback = $.param({
     user_id: user_id
   })
   var url = __env.apiUrl + __env.messages + user_id  + '/mail/published'
     $http({
       url: url,
       method: 'POST',
       data: requestFeedback,
       headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
     }).then(function (response){
         console.log(response.data.data)
         feedbacks = response.data.data;
         $scope.feedbacks = getDates(feedbacks);
     }).catch(function(error){
       console.log(error);
     })
  }

  $scope.likeFeedback = function(messageId){
    $http({
      url: __env.apiUrl + __env.messages + uid +'/'+ messageId + '/react',
      method: 'PUT',
      headers: {'Authorization':'Bearer: ' + token}
    }).then(function (response){
       console.log(response.data);
       $state.reload();
    }).catch(function (error){
      console.log(error);
    })
  }

  $scope.getUserData = function (){
     $http({
       url: __env.apiUrl + __env.profile + user_id,
       method: 'GET',
       headers: {'Authorization':'Bearer: ' + token}
     }).then(function (response){
       if (response.data.status == 200){
           $scope.username = response.data.content.username;
           $scope.name = response.data.content.name;
           $scope.lastname = response.data.content.lastname;
           $scope.bio = response.data.content.bio;
           $scope.userPicture = response.data.content.profileUrl;
           $scope.facebook = response.data.content.facebookValidation;
           $scope.github = response.data.content.githubUsername
           $scope.twitter = response.data.content.twitterValidation;
         }else{
           console.log(response.data.message);
         }
     }).catch(function (e){
       if (e.status == 401){
          var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'Su sesión ha vencido'
          });
           $state.go('login');
         }
       })    
  }

  $scope.openModal = function(index) {
    if (index == 1) $scope.modal1.show();
    else $scope.modal2.show();
  };

  $scope.closeModal = function(index) {
    if (index == 1) $scope.modal1.hide();
    else $scope.modal2.hide();
  };



  $ionicModal.fromTemplateUrl('modifyProfile.html', {
    id: '1',
    scope: $scope
  }).then(function(modal) {
    $scope.modal1 = modal;
  });

  $ionicModal.fromTemplateUrl('configMenu.html', {
    id: '2',
    scope: $scope
  }).then(function(modal) {
    $scope.modal2 = modal;
  });

  $scope.goToKeys = function(){
    $scope.closeModal('2');
    $state.go('tab.keys');
  }

})

.controller('profileController', function($scope,$http,$localStorage,$state,$location,$stateParams,$ionicPopup,$window){
  var token = $localStorage.userToken;

  $scope.requestData = function(){
    $http({
      url: __env.apiUrl + __env.profile + $localStorage.uid,
      method: 'GET',
      headers: {'Authorization':'Bearer: ' + token}
    }).then(function (response){
      if (response.data.status == 200){
          $scope.username = response.data.content.username;
          $scope.name = response.data.content.name;
          $scope.lastname = response.data.content.lastname;
          $scope.phone = response.data.content.phone;
          $scope.bio = response.data.content.bio;
          $scope.imgSrc = response.data.content.profileUrl;
        }else{
          console.log(response.data.message);
        }
    }).catch(function (e){
      if (e.status == 401){
        var alertPopup = $ionicPopup.alert({
          title: 'Error',
          template: 'Su sesión ha vencido'
        });
         $state.go('login');
        }
      })
  }

  $scope.updateData =  function(){
    var updateRequest = $.param({
      name: $scope.name,
      lastname: $scope.lastname,
      phone: $scope.phone,
      username: $scope.username,
      bio: $scope.bio
    });
    $http({
      url: __env.apiUrl + __env.profile + $localStorage.uid,
      method: 'PUT',
      data: updateRequest,
      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
    }).then( function (response){
        if (response.data.status == 200){
            console.log('User data updated');
            $window.location.reload()
        }else{
          console.log(response.data.message)
        }
    })
  }

  $scope.uploadPhoto = function (){
       $http({
         method: 'POST',
         url: __env.apiUrl +__env.files + 'images',
         headers: {
             'Content-Type': undefined,
             'Authorization':'Bearer: ' + token
         },
         data: {
             file: $scope.file,
             uid: $localStorage.uid
         },
         transformRequest: function (data, headersGetter) {
             var formData = new FormData();
             angular.forEach(data, function (value, key) {
                 formData.append(key, value);
             });
             return formData;
         }
     })
     .then(function (response) {
       $scope.imgSrc = response.data.link;
       $localStorage.userPicture = response.data.link;
       console.log(response);
       $state.reload();
     })
     .catch(function (error) {
          console.log(error)
     });
  }

})

.controller('tabsController', function ($scope,$localStorage){
  $scope.id = $localStorage.uid
})

// Controladores de la plantilla Borrar

.controller('keysController',function($scope,$http,$localStorage,$state,$window,$sessionStorage,__env,$ionicPopup){
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


    // receives a random generated 12 words phrase
    $scope.generarPalabras = function (){
      $http({
        url: __env.apiUrl + 'mnemonic',
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
      for (i = 0; i < keys.length; i++){
          keys[i].activated = false;
          for (j = 0; j < $scope.userKeys.length; j++){
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
        url: __env.apiUrl + __env.profile + uid + '/getKeys',
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
      for (i = 0; i < $scope.userKeys.length;i++){
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
        url: __env.apiUrl + __env.profile+ uid + '/updateDefault',
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

    storekeys = function (public,private,name){
        
        var storeRequest = $.param({
          pubkey: public,
          privkey: private,
          keyname: name
        })
          
        $http({
          url: __env.apiUrl + __env.profile + $localStorage.uid + '/storeKeys',
          method: 'POST',
          data: storeRequest,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
        }).then(function (response){
            if (response.data.status == 200){
                console.log('keys stored succesfully')
                var popup = angular.element("#keySpinner");
                //for hide model
                popup.modal('hide');
                $state.reload();
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

    var localStorekeys = function(public,private,name){
      var newKey = {
        keyname: name,
        publicKey: public,
        privateKey: private,
        default: false
      }

      $scope.userKeys.push(newKey);
      $localStorage[uid + 'keys'] = $scope.userKeys;
    }

    //funciton that checks form fields

    checkParameters = function (){
        if (($scope.keyname == "")  && ($scope.name == "") && ($scope.email == "") && ($scope.passphrase = "") && ($scope.phrase == "")){
          return false;
        }else{
          return true;
        }
    }

    
    //function that generates a new key pair
    $scope.generateKeys =  function (){
          if (checkParameters){
            var uid = $localStorage.uid;
            var options = {
                userIds: [{ name: $scope.name, email: $scope.email}],
                numBits: 4096,
                passphrase: $scope.passphrase,
            }
            var popup = angular.element("#keySpinner");
            //for hide model
            popup.modal('show');
            words = translate($scope.phrase);
            appKey = translate($sessionStorage.appKey);
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
            }else{
              alert('Por favor llene todos los campos')
            }    
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

    $scope.deleteKeys  =  function (){

      name = $localStorage.keyDelete;
      var deleteRequest = $.param({
        name: name
      })

      $http({
        url: __env.apiUrl + __env.profile + $localStorage.uid + '/deleteKey',
        method: 'DELETE',
        data: deleteRequest,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
      }).then(function (response){
            if (response.status == 200){
              alert('Se ha borrado una llave');
              delete $localStorage.keyDelete;
              localDelete(name);
              $state.reload();
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
        url: __env.apiUrl + __env.profile + $localStorage.uid + '/recoverKey',
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
        localStorekeys($localStorage.recoveryKey.PubKey,localPrivateKey,$localStorage.recoveryKey.name);
        alert("LLave activada exitosamente");
        delete $localStorage.recoveryKey
        $window.location.reload(); 
      }else{
        alert('La clave de aplicacion es incorrecta')
      }  
    }
})

.controller('DashCtrl', function($scope) {

  // --------------------- animation for green color .badge-notification icon---
  anime({
    targets: ['.badge-notify'],
    scale: [1.2, 1],
    delay: 1800,
    duration: 2000,
  });

  // --------------------- animation for blue  color .badge --------------------
  anime({
    targets: ['.badge'],
    rotate: {
      value: 720,
      delay: 300,
      duration: 1500,
      easing: 'easeInOutQuad'
    },
    direction: 'normal'
  });

  
})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, Chats, $stateParams) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('SocialCtrl', function($scope, Socials, $stateParams) {
  $scope.items = Socials.all();
})

