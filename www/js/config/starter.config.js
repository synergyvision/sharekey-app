'use strict';
(function() {
  angular
    .module('starter')
    .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider'];
    function config($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
        $ionicConfigProvider.tabs.position('bottom');
        $stateProvider
        .state('login',{
            url: '/auth/login', 
            templateUrl: 'views/auth/login.html',
            controller: 'LoginController',
            css: '../../../css/login.css'
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
            templateUrl: 'views/tabs.html',
            controller: 'tabsController'
        })



        // Each tab has its own nav history stack:

        .state('tab.dash', {
            url: '/dash',
            views: {
            'tab-dash': {
                templateUrl: 'views/dashboard/tab-posts.html',
                controller: 'DashCtrl'
            }
            }
        })

        .state('tab.post', {
            url: '/dash/?post_id',
            views: {
            'tab-dash': {
                templateUrl: 'views/dashboard/tab-post.html',
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
            url: '/account/?user_id',
            views: {
            'tab-account': {
                templateUrl: 'views/profile/tab-account.html',
                controller: 'publicationsController',
                ccs: 'profile.css'
            }
            }
        })
        .state('tab.keys',{
            url: '/profile/keys',
            views: {
            'tab-account': {
                templateUrl: 'views/profile/tab-account-keys.html',
                controller: 'keysController',
                css: 'profile.css'
            }
            }
        })
        .state('tab.newKey',{
            url: '/profile/newKeys',
            views: {
            'tab-account': {
                templateUrl: 'views/profile/tab-account-newKey.html',
                controller: 'keysController',
                css: 'profile.css'
            }
            }
        })

        .state('tab.contacts',{
            url: '/profile/contacts',
            views: {
            'tab-account':{
                templateUrl: 'views/profile/tab-account-contacts.html',
                controller: 'contactsController',
                css: 'profile.css'
            }
            }
        })
        .state('tab.networks',{
            url: '/profile/networks',
            views: {
            'tab-account':{
                templateUrl: 'views/profile/tab-account-social.html',
                controller: 'redesController',
                css: 'profile.css'
            }
            }
        })
        .state('tab.messages',{
            url: '/messages',
            views: {
              'tab-messages':{ 
                templateUrl: 'views/messages/tab-messageList.html',
                controller: 'messagesController',
                css: 'messages.css'
              }
            }
          })
        .state('tab.newMessage',{
        url: '/messages/newMessage',
        views: {
            'tab-messages':{ 
            templateUrl: 'views/messages/tab-newMessage.html',
            controller: 'messagesController',
            css: 'messages.css'
            }
        }
        })  
        .state('tab.readMessage',{
            url: '/messages/read/?id',
            views: {
                'tab-messages':{ 
                templateUrl: 'views/messages/tab-readMessage.html',
                controller: 'messagesController',
                css: 'messages.css'
                }
            }
        })    
        $urlRouterProvider.otherwise('/auth/login');
    }
})()