(function() {
    'use strict';
    angular
        .module('starter')
        .controller('profileController', profileController);
  
        profileController.$inject = ['$scope','$http','$localStorage','$state','$location','$stateParams','$ionicPopup','$window','appConstants','$cordovaCamera','$ionicPlatform'];
        function profileController($scope,$http,$localStorage,$state,$location,$stateParams,$ionicPopup,$window,appConstants,$cordovaCamera,$ionicPlatform){
            var token = $localStorage.userToken;

            $scope.requestData = function(){
              $http({
                url: appConstants.apiUrl + appConstants.profile + $localStorage.uid,
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
                url: appConstants.apiUrl + appConstants.profile + $localStorage.uid,
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
                    alert(err)
                });
              })
          }
          
            $scope.uploadPhoto = function (imgURI){
                 var photoRequest = $.param({
                    file: imgURI,
                    uid: $localStorage.uid
                 })
                 $http({
                   url: appConstants.apiUrl +appConstants.files + 'images64',
                   method: 'POST',
                   data: photoRequest,
                   headers: {
                       'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                       'Authorization':'Bearer: ' + token
                   }
              })
               .then(function (response) {
                 $scope.imgSrc = imgURI;
                 $localStorage.userPicture = imgURI;
                 $window.location.reload()
               })
               .catch(function (error) {
                    console.log(error)
               });
            }
        }     
})()  