
var env = {};

// Import variables if present (from env.js)
if(window){  
  Object.assign(env, window.__env);
}

ngModule = angular.module('starter.controllers', ['ngStorage'])

ngModule.constant('__env', env)

.controller('LoginController', function ($scope,$http,$location,$localStorage,__env){
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
        console.log(response);
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

.controller('AccountCtrl', function($scope, Accounts, $stateParams) {
  $scope.items = Accounts.all();
});
