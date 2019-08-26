(function() {
    'use strict';
    angular
        .module('starter')
        .controller('profileController', profileController);
  
        profileController.$inject = ['$scope','$http','$localStorage','$state','$location','$stateParams','$ionicPopup','$window','appConstants'];
        function profileController($scope,$http,$localStorage,$state,$location,$stateParams,$ionicPopup,$window,appConstants){
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
          
            $scope.uploadPhoto = function (){
                 $http({
                   method: 'POST',
                   url: appConstants.apiUrl +appConstants.files + 'images',
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
        }     
})()  