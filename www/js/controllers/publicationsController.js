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
          
            //check the scope of publication which of then are liked by the user

             var checkLike = function (reactions){
               if (reactions[uid]){
                 return reactions[uid];
               }else{
                 return null;
               }
             }
           
             //convert the timestamp to date

             var getDates = function (feedbacks){
             for (var i = 0; i < feedbacks.length; i++){
               if (feedbacks[i].data.reactions){
                 feedbacks[i].reactions = checkLike(feedbacks[i].data.reactions)
               }else{
                 feedbacks[i].reactions = null;
               }
               var sent = new Date(feedbacks[i].data.timestamp);
               feedbacks[i].date_sent = sent.toLocaleString();
               if (!feedbacks[i].picture){
                 feedbacks[i].picture = null;
               }
             }
             return feedbacks;
           } 
          
           //function that retrieves the user published messages

           var changeFeedbackReaction = function(messageId){
                for (var i = 0; i < $scope.feedbacks.length;i++ ){
                  if ($scope.feedbacks[i].id == messageId){
                    if($scope.feedbacks[i].reactions == true){
                      $scope.feedbacks[i].reactions = null
                      $scope.feedbacks[i].data.likes -=1;
                    }else{
                      $scope.feedbacks[i].reactions = true
                      $scope.feedbacks[i].data.likes +=1;
                    }
                  }
                }
           }

            $scope.getFeedbacks = function(){
              $scope.spinner = true;
             var requestFeedback = $.param({
               user_id: user_id
             })
             var url = appConstants.apiUrl + appConstants.messages + uid + '/mail/published'
               $http.post(url,requestFeedback,{headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
               }).then(function (response){
                   $scope.spinner = false;
                   var feedbacks = response.data.data;
                   $scope.feedbacks = getDates(feedbacks);
                   console.log($scope.feedbacks);
               }).catch(function(error){
                  $scope.spinner = false;
                  if (error.status = 404){
                    $scope.empty = true
                  }
               })
            }
          
            //user likes a feedback

            $scope.likeFeedback = function(messageId){
              $http.put(appConstants.apiUrl + appConstants.messages + uid +'/'+ messageId + '/react',null,
                {headers: {'Authorization':'Bearer: ' + token}
              }).then(function (response){
                 console.log(response.data);
                  changeFeedbackReaction(messageId)
              }).catch(function (error){
                console.log(error);
              })
            }

            // retrieves the user data
          
            $scope.getUserData = function (){
               $http.get(appConstants.apiUrl + appConstants.profile + user_id,{headers: {'Authorization':'Bearer: ' + token}
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

            //this function manage the two modals
          
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

            //function that log outs user

            $scope.logout = function(){
              $scope.closeModal('2');
              $http.get(appConstants.apiUrl + 'logout')
               .then(function (response){
                  if (response.data.status == 200){
                      delete $localStorage.uid;
                      delete $localStorage.userToken;
                      console.log('Users has logged out')
                      $state.go('login');
                  }
              })
          }
        }        
})()  