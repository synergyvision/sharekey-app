
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

.controller('LoginController', function ($scope,$http,$location,$localStorage,__env,$state,$ionicPopup){
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


.controller('publicationsController', function($scope,$http,$localStorage,$state,$location,$stateParams,$ionicModal,$ionicPopup,$window){
  var token = $localStorage.userToken;
  var uid = $localStorage.uid;
  $scope.uid = uid;
  var user_id = $stateParams.user_id;
  $scope.user_id = user_id
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
       $window.location.reload();
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

  $scope.goToContacts = function(){
    $scope.closeModal('2');
    $state.go('tab.contacts');
  }

  $scope.goToNetworks = function(){
    $scope.closeModal('2');
    $state.go('tab.networks');
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

.controller('keysController',function($scope,$http,$localStorage,$state,$window,$sessionStorage,__env,$ionicPopup,$ionicHistory){
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

    var localStorekeys = function(public,private,name,defecto = null){
      var newKey = {
        keyname: name,
        publicKey: public,
        privateKey: private,
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
        url: __env.apiUrl + __env.profile + $localStorage.uid + '/deleteKey',
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
})

.controller('DashCtrl', function($scope,$sessionStorage,$window,$localStorage,$ionicPopup,$stateParams,$http,$state) {
  uid = $localStorage.uid
  $scope.uid = uid;
  $scope.storedKeys = $localStorage[uid+'keys'];
  var token = $localStorage.userToken;
  var post = $stateParams.post_id;
  $scope.username = $localStorage[uid + '-username'];
  $scope.edit = false;

    var showConfirm = function (){
      var confirmPopup = $ionicPopup.confirm({
        title: 'Advertencia',
        template: 'Restablecer su clave de aplicación borrara toda su información en el dispositivo, es decir tendra que reactivar sus llaves.'
      });
      confirmPopup.then(function(res) {
        if(res) {
          resetAppKey();
        } else {
          showAppKeyPop();
        }
      });
    }

    var showAppKeyPop = function (){
      $scope.data = {}
      var myPopup = $ionicPopup.show({
        template: '<input type="password" ng-model="data.appKey">',
        title: 'Introduzca su clave de aplicación,si es la primera vez en este dispositivo se guardara.',
        scope: $scope,
        buttons: [
          { text: 'Reestablecer',
            onTap: function(e){
              showConfirm();
            }
          },
          {
            text: '<b>Continuar</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.appKey) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();
              } else {
                $scope.setAppKey($scope.data.appKey);
              }
            }
          }
        ]
      });
    }

    $scope.checkAppKey = function(){
      if (!$sessionStorage.appKey){
        showAppKeyPop();
      }
      
  }

    $scope.setAppKey = function (words){
      if ($localStorage[uid+'keys']){
        words = translate(words);
        try {
        var bytes  = CryptoJS.AES.decrypt($localStorage[uid+'keys'][0].privateKey,words);
        var pass = bytes.toString(CryptoJS.enc.Utf8);
        $sessionStorage.appKey = words;
        }
        catch (e){
          console.log(e);
          alert('La clave de aplicación es incorrecta')
          showAppKeyPop();
        }
      }else{
        $sessionStorage.appKey = words;
      }
    }

    var resetAppKey = function (){
      delete $localStorage[uid + 'keys'];
      delete $sessionStorage.appKey;
      $window.location.reload();
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
        pubkey = await getMyDefaultKey();


        const options = {
            message: openpgp.message.fromText(status),       // input as Message object
            publicKeys: (await openpgp.key.readArmored(pubkey)).keys // for encryption
           // privateKeys: [privKeyObj]                                 // for signing (optional)
        }
    
        return openpgp.encrypt(options).then(ciphertext => {
            encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
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
        url: __env.apiUrl + __env.posts,
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
      for (i = 0; i < posts.length; i++){
        if (posts[i].data.reactions){
          posts[i].reactions = checkLike(posts[i].data.reactions)
        }else{
          posts[i].reactions = null;
        }
        if (!posts[i].userPicture){
          posts[i].userPicture = 'img/default-user-icon-8.jpg'
        }
        sent = new Date(posts[i].data.timestamp);
        posts[i].data.timestamp = sent.toLocaleString(); 
      }
      return posts
    } 

    $scope.getPosts = function (){
      $http({
        url: __env.apiUrl + __env.posts,
        method: 'GET',
        headers: {'Authorization':'Bearer: ' + token}
      }).then(function (response){
          posts = response.data.data;
          console.log(posts)
          $scope.posts = getDates(posts);
          console.log($scope.posts)
      }).catch(function (error){
          console.log(error)
      })
    }

    $scope.likeStatus = function (status,post_id){
      if (status == 'like'){
          statusRequest = $.param({
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
        url: __env.apiUrl + __env.posts + post_id + '/likes',
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
        title: 'Edita tu post',
        scope: $scope,
        buttons: [
          { text: 'Cancelar' },
          {
            text: '<b>Editar</b>',
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
        url: __env.apiUrl + __env.posts + post,
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
        url: __env.apiUrl + __env.posts + id,
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
        url: __env.apiUrl + __env.posts + uid + '/' + post,
        method: 'GET',
        headers: {'Authorization':'Bearer: ' + token} 
      }).then(function (response){
        console.log(response)
         $scope.post = response.data.data;
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
        title: 'Introduzca su passphrase para ver su post',
        scope: $scope,
        buttons: [
          { text: 'Cancelar' },
          {
            text: '<b>Activar</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.passphrase) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();
              } else {
                return $scope.data.passphrase;
              }
            }
          }
        ]
      });
      myPopup.then(function(res) {
        $scope.decryptPost(res)
      });
    }

    var decryptKey = function (key) {
      var bytes  = CryptoJS.AES.decrypt(key,$sessionStorage.appKey);
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
          decrypted = plaintext.data;
          return decrypted
      })
  }

    $scope.decryptPost = function (passphrase){
      private = getMyDefaultPrivateKey();
      private = decryptKey(private);
      post = decryptPost(private,passphrase,$scope.postContent)
      post.then (function (content){
        $scope.post.data.content = content;
        $scope.$apply();
      }).catch(function (error){
          alert('Error: verifique que su llave y passphrase sean correctos')
      })
    }

    $scope.getComments = function(){
      $http({
        url: __env.apiUrl + __env.comments + $scope.uid + '/' + post,
        method: 'GET',
        headers: {'Authorization':'Bearer: ' + token}
      }).then(function (response){
          console.log(response.data);
          $scope.comments = response.data.data
      }).catch(function (error){
        console.log(error)
      })
    }

    $scope.sendComment = function(){
      commentRequest = $.param({
        content: $scope.newComment,
        user_id: $scope.uid,
        post_id: post
      })
      $http({
        url: __env.apiUrl + __env.comments + '/',
        method: 'POST',
        data: commentRequest,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
      }).then(function (response){
        console.log(response.data);
        $state.reload();
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
          title: 'Edita tu comentario',
          scope: $scope,
          buttons: [
            { text: 'Cancelar' },
            {
              text: '<b>Editar</b>',
              type: 'button-positive',
              onTap: function(e) {
                if (!$scope.comment.content) {
                  //don't allow the user to close unless he enters wifi password
                  e.preventDefault();
                } else {
                  return $scope.comment;
                }
              }
            }
          ]
        });
        myPopup.then(function(res) {
          $scope.editComment(res)
        });
    }

    $scope.editComment = function(comment){
        var editRequest = $.param({
          content: comment.content
        })
        $http({
          url: __env.apiUrl + __env.comments + comment.id,
          method: 'PUT',
          data: editRequest,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
        }).then(function (response){
          console.log(response.data)
          $scope.editedCommentContent = "";
          $scope.editedCommentId = "";
          $state.reload();
        }).catch(function (error){
          console.log(error)
        })
        
    }

    $scope.deleteComment = function (id){
      $http({
        url: __env.apiUrl  + __env.comments + id,
        method: 'DELETE',
        headers: {'Authorization':'Bearer: ' + token}
      }).then(function (response){
        console.log(response.data);
        $state.reload();
      }).catch(function (error){
        console.log(error)
      })
    }


})


.controller('contactsController', function ($scope,__env,$localStorage,$http,$state){
  uid = $localStorage.uid;
  var token = $localStorage.userToken;

    $scope.getFriendRequest = function (){
      $http({
          url: __env.apiUrl + __env.contacts + uid + '/requests',
          method: 'GET',
          headers: {'Authorization':'Bearer: ' + token}
      }).then(function (response){
          if (response.data.status == 200){
              $scope.requests = response.data.data;
              console.log($scope.requests )
          }
      }).catch(function (error){
          console.log(error);
          if (error.status == 401){
            alert('Su sesion ha vencido por inactividad')
            $state.go('login');
          }
      })
  }

    $scope.acceptRequest = function (id){
        updateStatus = $.param({
            status: true
        })
        sendStatus(id,updateStatus)
    }

    $scope.rejectRequest = function (id){
        updateStatus = $.param({
            status: false
        })
        sendStatus(id,updateStatus)
    }

  sendStatus = function (id,status){ 
      $http({
          url: __env.apiUrl + __env.contacts + uid + '/requests/' + id,
          method: 'PUT',
          data: status,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
      }).then(function (response){
          console.log(response.data)
          if (response.data.status == 200){
              if (response.data.accepted == true){
                  alert('Has aceptado la solicitud de amistad')
                  $state.reload();
              }else{
                  alert('Has rechazado la soliciud');
                  $state.reload();
              }
          }
      }).catch(function (error){
          if (error.status == 401){
              alert('Su sesion ha vencido')
              $state.go('login');
            }
      })
  }

  $scope.getContacts = function (){

    $http({
        url: __env.apiUrl + __env.profile + uid + '/contacts',
        method: 'GET',
        headers: {'Authorization':'Bearer: ' + token}
    }).then(function (response){
        if (response.data.status == 200){
            console.log(response.data.data)
            $scope.contacts = response.data.data
        }
    }).catch(function (error){
        if (error.status == 401){
          alert('Su sesion ha vencido')
          $state.go('login');
        }
    })

  }

  $scope.goProfile = function(id){
    console.log(id)
    $state.go('tab.account',{'user_id': id})
  }

  /*$scope.getUsers = function (){
    $scope.search = $localStorage.search
    $http({
        url: __env.apiUrl + __env.contacts + uid + '/users',
        method: 'GET',
        headers: {'Authorization':'Bearer: ' + token}
    }).then(function (response){
        if (response.data.status == 200){
            $scope.users = response.data.data;
        }
    }).catch(function (error){
        if (error){
          if (error.status == 401){
              alert('Su sesion ha vencido')
              $state.go('login');
          }
          else{
              console.log(error.code);
              console.log(error.message);
          }
        }  
    }) 
}

  $scope.sendRequest =  function(id){
    var request = $.param({
        id_to: id
    })

    $http({
        url: __env.apiUrl + __env.contacts + uid + '/requests',
        method: 'POST',
        data: request,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
    }).then(function (response){
        if (response.data.status == 201){
            alert('Se ha enviado una solicitud de amistad');
        }
    }).catch(function (error){
            if (error){
                if (error.status == 401){
                    alert('Su sesion ha vencido')
                    $state.go('login');
                }
                else{
                    console.log(error.code);
                    console.log(error.message);
                }
            }  
        }) 
  }*/

})

.controller('redesController', function($scope,$http,$localStorage,$state,$location,$stateParams,$location,$rootScope,$window){
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
     
  
    function makeid() {
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
       url: __env.apiUrl + __env.config + uid + '/validateFacebook',
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
        url: __env.apiUrl + __env.config + uid + '/addedSocials',
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
        url: __env.apiUrl + __env.config + uid + '/getTwitterFeed',
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
        url: __env.apiUrl + __env.config + uid + '/validateTwitter',
        method: 'POST',
        headers: {'Authorization':'Bearer: ' + token}
      }).then(function (response){
         alert('Se ha validado la información de twitter exitosamente')
         $state.reload();
      }).catch(function (error){
         console.log(error)
      })
    }

    getServerKey = function (){
      return $http({
        url: __env.apiUrl + 'config/serverKeys',
        method: 'GET'
      }).then(function(response){
        return response.data.publickey
      }).catch(function (error){
        console.log(error)
      })
    }
  
    encryptPassword = async (password) =>{
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
      password = encryptPassword($scope.password)
      password.then(function (password){
        var loginGit = $.param({
          username: $scope.username,
          password: password
        }) 
        $http({
          url: __env.apiUrl + __env.repos + uid + '/getToken',
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

