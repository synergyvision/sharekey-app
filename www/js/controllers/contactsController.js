(function() {
    'use strict';
    angular
        .module('starter')
        .controller('contactsController', contactsController);
  
        contactsController.$inject = ['$scope','appConstants','$localStorage','$http','$state','$filter'];
        function contactsController($scope,appConstants,$localStorage,$http,$state,$filter){
            var uid = $localStorage.uid;
            var token = $localStorage.userToken;
            var translate = $filter('translate')
          

            //function makes an http call to server to retrieve users pending friend requests
            
            $scope.getFriendRequest = function (){
                $http({
                    url: appConstants.apiUrl + appConstants.contacts + uid + '/requests',
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
                      $state.go('login');
                    }
                })
            }
          
            //function allows users to accept a requests
              $scope.acceptRequest = function (id){
                  var updateStatus = $.param({
                      status: true
                  })
                  sendStatus(id,updateStatus)
              }

            //function allows  users to reject a requests
          
              $scope.rejectRequest = function (id){
                  var updateStatus = $.param({
                      status: false
                  })
                  sendStatus(id,updateStatus)
              }
          
              //function sends a status to the backend server to update the status of a requesrs

            var sendStatus = function (id,status){ 
                $http({
                    url: appConstants.apiUrl + appConstants.contacts + uid + '/requests/' + id,
                    method: 'PUT',
                    data: status,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data)
                    if (response.data.status == 200){
                        if (response.data.accepted == true){
                            alert(translate('contacts.accept_requests'))
                            $state.reload();
                        }else{
                            alert(translate('contacts.reject_requests'));
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
          
            //function loads user contacts

            $scope.getContacts = function (){
          
              $http({
                  url: appConstants.apiUrl + appConstants.profile + uid + '/contacts',
                  method: 'GET',
                  headers: {'Authorization':'Bearer: ' + token}
              }).then(function (response){
                  if (response.data.status == 200){
                      console.log(response.data.data)
                      $scope.contacts = response.data.data
                  }
              }).catch(function (error){
                  if (error.status == 401){
                    //alert('Su sesion ha vencido')
                    $state.go('login');
                  }
              })
           
        }

        //function to go to a profile

        $scope.goProfile = function(id){
            $state.go('tab.account',{'user_id': id})
        }

        /*$scope.getUsers = function (){
            $scope.search = $localStorage.search
            $http({
                url: appConstants.apiUrl + appConstants.contacts + uid + '/users',
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
                url: appConstants.apiUrl + appConstants.contacts + uid + '/requests',
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
    }    
})()  