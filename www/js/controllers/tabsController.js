(function() {
    'use strict';
    angular
        .module('starter')
        .controller('tabsController', tabsController);
  
        tabsController.$inject = ['$scope','$localStorage'];
        function tabsController($scope,$localStorage){
            $scope.id = $localStorage.uid
        }
        
        FCMPlugin.getToken(function(token) {
            //this is the fcm token which can be used
            //to send notification to specific device 
            console.log(token);
            //FCMPlugin.onNotification( onNotificationCallback(data), successCallback(msg), errorCallback(err) )
            //Here you define your application behaviour based on the notification data.
            FCMPlugin.onNotification(function(data) {
                console.log(data);
                //data.wasTapped == true means in Background :  Notification was received on device tray and tapped by the user.
                //data.wasTapped == false means in foreground :  Notification was received in foreground. Maybe the user needs to be notified.
                // if (data.wasTapped) {
                //     //Notification was received on device tray and tapped by the user.
                //     alert(JSON.stringify(data));
                // } else {
                //     //Notification was received in foreground. Maybe the user needs to be notified.
                //     alert(JSON.stringify(data));
                // }
            });
        });
})()  