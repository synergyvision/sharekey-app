// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


angular.module('starter', ['ionic', 'starter.controllers','starter.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs).
    // The reason we default this to hidden is that native apps don't usually show an accessory bar, at
    // least on iOS. It's a dead giveaway that an app is using a Web View. However, it's sometimes
    // useful especially with forms, though we would prefer giving the user a little more room
    // to interact with the app.
    if (window.cordova && window.Keyboard) {
      window.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if (window.StatusBar) {
      // Set the statusbar to use the default style, tweak this to
      // remove the status bar on iOS or change it to use white instead of dark colors.
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('login',{
    url: '/auth/login', 
    templateUrl: 'views/auth/login.html',
    controller: 'LoginController',
    css: '../../css/login.css'
  })

  .state('checkEmail',{
    url: '/auth/forgotPassword',
    templateUrl: 'views/auth/checkEmail.html',
    controller: 'CheckEmailController',
    css: '../../css/login.css'
  })
  .state('signUp',{
    url: '/auth/signUp',
    templateUrl: 'views/auth/signup.html',
    controller: 'signUpController',
    css: '../../css/login.css'
  })





  // template states

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'views/tabs.html'
  })



  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'views/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.chats', {
    url: '/chats',
    views: {
      'tab-chats': {
        templateUrl: 'views/tab-chats.html',
        controller: 'ChatsCtrl'
      }
    }
  })


  .state('tab.social', {
    url: '/social',
    views: {
      'tab-social': {
        templateUrl: 'views/tab-social.html',
        controller: 'SocialCtrl'
      }
    }
  })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'views/tab-account.html',
        controller: 'AccountCtrl'

      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/auth/login');
  $ionicConfigProvider.tabs.position('bottom'); // other values: top

});

