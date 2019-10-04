(function() {
    'use strict';
    angular
        .module('starter')
        .controller('searchController', searchController);
  
        searchController.$inject = ['$scope','appConstants','$localStorage','$http','$state','$filter','ionicAlertPopup'];
        function searchController($scope,appConstants,$localStorage,$http,$state,$filter,ionicAlertPopup){
            $scope.uid = $localStorage.uid;
            var uid = $localStorage.uid;
            var token = $localStorage.userToken;
            var filter = $filter('translate')
           
            $scope.getUsers = function (){
                $scope.search = $localStorage.search
                $http({
                    url: appConstants.apiUrl + appConstants.contacts + uid + '/users',
                    method: 'GET',
                    headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    if (response.data.status == 200){
                        $scope.users = response.data.data;
                        console.log($scope.users)
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
                        ionicAlertPopup.alertPop(filter('search.pop_title'),filter('search.sent_request'))
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

            $scope.goProfile = function(id){
                $state.go('tab.account',{'user_id': id})
            }
    }    
})()  