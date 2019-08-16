
var env = {};

// Import variables if present (from env.js)
if(window){  
  Object.assign(env, window.__env);
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
                  $state.go('tab.social');
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

  $ionicModal.fromTemplateUrl('modifyProfile.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

})

.controller('profileController', function($scope,$http,$localStorage,$state,$location,$stateParams,$ionicPopup){
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
            $state.reload();
            var alertPopup = $ionicPopup.alert({
              title: 'Información',
              template: 'Su información de ha actualizado'
            });
             $state.reload();
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

