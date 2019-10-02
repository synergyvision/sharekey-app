(function() {

    angular
      .module('starter')
      .config(translator);
  
      translator.$inject = ['$translateProvider','appConstants'];
      function translator($translateProvider,appConstants) {
  
        $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
  
        $translateProvider.useStaticFilesLoader({
          prefix: "lang/",
          suffix: ".json"
        });
  
        $translateProvider.preferredLanguage(appConstants.language);
      }
  
  })();