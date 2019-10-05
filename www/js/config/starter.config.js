'use strict';
(function() {
  angular
    .module('starter')
    .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider'];
    function config($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
        $ionicConfigProvider.navBar.alignTitle('center');
        $ionicConfigProvider.tabs.position('bottom');
        $stateProvider
        .state('login',{
            url: '/auth/login', 
            templateUrl: 'views/auth/login.html',
            controller: 'LoginController',
            css: '../../../css/ionic.app.min.css'
        })

        .state('checkEmail',{
            url: '/auth/forgotPassword',
            templateUrl: 'views/auth/checkEmail.html',
            controller: 'CheckEmailController',
            css: '../../css/ionic.app.min.css'
        })
        .state('signUp',{
            url: '/auth/signUp',
            templateUrl: 'views/auth/signup.html',
            controller: 'signUpController',
            css: '../../css/ionic.app.min.css'
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
                controller: 'DashCtrl',
                css: '../../css/ionic.app.min.css'
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
        .state('tab.account', {
            url: '/account/?user_id',
            views: {
            'tab-account': {
                templateUrl: 'views/profile/tab-account.html',
                controller: 'publicationsController',
                ccs: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.keys',{
            url: '/profile/keys',
            views: {
            'tab-account': {
                templateUrl: 'views/profile/tab-account-keys.html',
                controller: 'keysController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.newKey',{
            url: '/profile/newKeys',
            views: {
            'tab-account': {
                templateUrl: 'views/profile/tab-account-newKey.html',
                controller: 'keysController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })

        .state('tab.contacts',{
            url: '/profile/contacts',
            views: {
            'tab-account':{
                templateUrl: 'views/profile/tab-account-contacts.html',
                controller: 'contactsController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.networks',{
            url: '/profile/networks',
            views: {
            'tab-account':{
                templateUrl: 'views/profile/tab-account-social.html',
                controller: 'redesController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.networks-otp',{
            url: '/profile/networks/otp',
            views: {
            'tab-account':{
                templateUrl: 'views/profile/tab-account-social-otp.html',
                controller: 'redesController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.messages',{
            url: '/messages',
            views: {
              'tab-messages':{ 
                templateUrl: 'views/messages/tab-messageList.html',
                controller: 'messagesController',
                css: '../../css/ionic.app.min.css'
              }
            }
          })
        .state('tab.newMessage',{
        url: '/messages/newMessage',
        views: {
            'tab-messages':{ 
            templateUrl: 'views/messages/tab-newMessage.html',
            controller: 'messagesController',
            css: '../../css/ionic.app.min.css'
            }
        }
        })  
        .state('tab.readMessage',{
            url: '/messages/read/?id',
            views: {
                'tab-messages':{ 
                templateUrl: 'views/messages/tab-readMessage.html',
                controller: 'messagesController',
                css: '../../css/ionic.app.min.css'
                }
            },
            params: {
                content: null 
            }
        })   
        .state('tab.surveys',{
            url: '/surveys',
            views: {
                'tab-survey':{
                    templateUrl: 'views/surveys/tab-surveys.html',
                    controller: 'surveysController',
                    css: '../../css/ionic.app.min.css'
                }
            }
        }) 
        .state('tab.survey',{
            url: '/survey/?surveyId',
            views: {
                'tab-survey':{
                    templateUrl: 'views/surveys/tab-survey.html',
                    controller: 'surveysController',
                    css: '../../css/ionic.app.min.css'
                }
            }
        })
        .state('tab.newSurvey',{
            url: '/newSurvey',
            views: {
                'tab-survey':{
                    templateUrl: 'views/surveys/tab-newSurvey.html',
                    controller: 'surveysController',
                    css: '../../css/ionic.app.min.css'
                }
            }
        })
        .state('tab.chats', {
            url: '/chats',
            views: {
            'tab-chats': {
                templateUrl: 'views/chats/tab-chats.html',
                controller: 'chatsController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.chatsMessages', {
            url: '/chats/?id_chat',
            views: {
            'tab-chats': {
                templateUrl: 'views/chats/tab-chatsMessages.html',
                controller: 'chatsController',
                css: '../../css/ionic.app.min.css'
            }
            }
        })
        .state('tab.newChat',{
            url: '/newChat',
            views: {
                'tab-chats':{
                    templateUrl: 'views/chats/tab-newChat.html',
                    controller: 'chatsController',
                    css: '../../css/ionic.app.min.css'
                }
            }
        })
        .state('tab.search',{
            url: '/search',
            views: {
                'tab-search':{
                    templateUrl: 'views/search/tab-search.html',
                    controller: 'searchController',
                    css: '../../css/ionic.app.min.css'
                }
            }
        })
        $urlRouterProvider.otherwise('/auth/login');
    }
})()