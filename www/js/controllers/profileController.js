(function() {
    'use strict';
    angular
        .module('starter')
        .directive('file', function () {
          return {
              scope: {
                  file: '='
              },
              link: function (scope, el, attrs) {
                  el.bind('change', function (event) {
                      var file = event.target.files[0];
                      scope.file = file ? file : undefined;
                      scope.$apply();
                  });
              }
          };
        })
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

            var dataURItoBlob = function (dataURI) {
              var byteString = atob(dataURI.toString().split(',')[1]);
          
              //var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
          
              var ab = new ArrayBuffer(byteString.length);
              var ia = new Uint8Array(ab);
              for (var i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
              }
              var blob = new Blob([ab], {type: 'image/png'}); //or mimeString if you want
              return blob;
          }

            $scope.takePicture = function() {
              var options = {
                  quality : 75,
                  destinationType : Camera.DestinationType.FILE_URI,
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
                    var imgURI = imageData;
                    $scope.uploadPhoto();
                }, function(err) {
                    alert(err)
                });
              })
          }
          
            $scope.uploadPhoto = function (){
                 var data = {
                    file: $scope.file,
                    uid: $localStorage.uid
                 }
                 $http({
                   method: 'POST',
                   url: appConstants.apiUrl +appConstants.files + 'images',
                   headers: {
                       'Content-Type': undefined,
                       'Authorization':'Bearer: ' + token
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
        }     
})()  