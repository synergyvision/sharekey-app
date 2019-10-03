(function() {
    'use strict';
    angular
        .module('starter')
        .factory('ionicAlertPopup',ionicAlertPopup);
  
        ionicAlertPopup.$inject = ['$ionicPopup'];
        function ionicAlertPopup($ionicPopup){
            var factory = {
                alertPop: alertPop
            }

            return factory;

            function alertPop(title,body){
                var alertPopup = $ionicPopup.alert({
                    title: title,
                    template: body,
                  });
            }

        }
})()  