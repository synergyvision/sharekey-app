(function() {
    'use strict';
    angular
        .module('starter')
        .controller('profileController', profileController);
  
        profileController.$inject = ['$scope','$http','$localStorage','$state','$location','$stateParams','$ionicPopup','$window','appConstants','$cordovaCamera','$ionicPlatform','$ionicModal'];
        function profileController($scope,$http,$localStorage,$state,$location,$stateParams,$ionicPopup,$window,appConstants,$cordovaCamera,$ionicPlatform,$ionicModal){
            var token = $localStorage.userToken;

            //function retrieves user data from serve

            $scope.requestData = function(){
              $http.get(appConstants.apiUrl + appConstants.profile + $localStorage.uid,
                {headers: {'Authorization':'Bearer: ' + token}
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


            //function updates the data of the user
          
            $scope.updateData =  function(){
              var updateRequest = $.param({
                name: $scope.name,
                lastname: $scope.lastname,
                phone: $scope.phone,
                username: $scope.username,
                bio: $scope.bio
              });
              $http.put(appConstants.apiUrl + appConstants.profile + $localStorage.uid,updateRequest,
                {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
              }).then( function (response){
                  if (response.data.status == 200){
                      console.log('User data updated');
                      $scope.$parent.modal1.hide()
                      $state.reload()
                  }else{
                    console.log(response.data.message)
                  }
              })
            }

            //cordova plugin to select a picture from the camera

            $scope.takePicture = function() {
              var options = {
                  quality : 75,
                  destinationType : Camera.DestinationType.DATA_URL,
                  sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
                  allowEdit : true,
                  encodingType: Camera.EncodingType.JPEG,
                  targetWidth: 300,
                  targetHeight: 300,
                  popoverOptions: CameraPopoverOptions,
                  saveToPhotoAlbum: false,
                  correctOrientation: true
              };
              $ionicPlatform.ready(function (){
                $cordovaCamera.getPicture(options).then(function(imageData) {
                    var imgURI = 'data:image/jpeg;base64,' + imageData;
                    $scope.uploadPhoto(imgURI);
                }, function(err) {
                    console.log(err)
                });
              })
          }

          //uploads the newly elected photo
          
            $scope.uploadPhoto = function (imgURI){
                 var photoRequest = $.param({
                    file: imgURI,
                    uid: $localStorage.uid
                 })
                 $http.post(appConstants.apiUrl +appConstants.files + 'images64',photoRequest,
                   {headers: {
                       'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                       'Authorization':'Bearer: ' + token
                   }
              })
               .then(function (response) {
                 $scope.imgSrc = imgURI;
                 $localStorage.userPicture = imgURI;
                 $scope.$parent.modal1.hide()
                 $state.reload()
               })
               .catch(function (error) {
                    console.log(error)
               });
            }
        }     
})()  