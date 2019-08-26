'use strict';
(function() {
  angular
    .module('starter')
    .run(run);
    function run($ionicPlatform) {
        $ionicPlatform.ready(function() {
        if (window.cordova && window.Keyboard) {
            window.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
        }) 
    }
})();