(function() {
    'use strict';
    angular
        .module('starter')
        .controller('publicationsController', publicationsController);
  
        publicationsController.$inject = ['$scope','$http','$localStorage','$state','$location','$stateParams','$ionicPopup','$window','appConstants','$ionicModal','$sessionStorage'];
        function publicationsController($scope,$http,$localStorage,$state,$location,$stateParams,$ionicPopup,$window,appConstants,$ionicModal,$sessionStorage){
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
             for (var i = 0; i < feedbacks.length; i++){
               if (feedbacks[i].data.reactions){
                 feedbacks[i].reactions = checkLike(feedbacks[i].data.reactions)
               }else{
                 feedbacks[i].reactions = null;
               }
               var sent = new Date(feedbacks[i].data.timestamp);
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
             var url = appConstants.apiUrl + appConstants.messages + user_id  + '/mail/published'
               $http({
                 url: url,
                 method: 'POST',
                 data: requestFeedback,
                 headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
               }).then(function (response){
                   console.log(response.data.data)
                   var feedbacks = response.data.data;
                   $scope.feedbacks = getDates(feedbacks);
               }).catch(function(error){
                 console.log(error);
               })
            }
          
            $scope.likeFeedback = function(messageId){
              $http({
                url: appConstants.apiUrl + appConstants.messages + uid +'/'+ messageId + '/react',
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
                 url: appConstants.apiUrl + appConstants.profile + user_id,
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

            $scope.logout = function(){
              $scope.closeModal('2');
              $http({
                  url: appConstants.apiUrl + 'logout',
                  method: 'GET'
              }).then(function (response){
                  if (response.data.status == 200){
                      delete $localStorage.uid;
                      delete $localStorage.search;
                      delete $localStorage.userToken;
                      console.log('Users has logged out')
                      $state.go('login');
                  }
              })
          }
        }        
})()  