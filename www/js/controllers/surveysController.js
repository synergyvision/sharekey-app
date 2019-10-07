(function() {
    'use strict';
    angular
        .module('starter')
        .controller('surveysController', surveysController);
  
        surveysController.$inject = ['$scope','$http','$localStorage','$state','$window','$sessionStorage','$stateParams','$rootScope','appConstants',"ionicAlertPopup","$filter"];
        function surveysController($scope,$http,$localStorage,$state,$window,$sessionStorage,$stateParams,$rootScope,appConstants,ionicAlertPopup,$filter){
            
            $scope.uid = $localStorage.uid;
            var token = $localStorage.userToken;
            var survey = $stateParams.surveyId;
            if ($rootScope.newExists == true){
                $rootScope.newExists = false;
            }
            var filter = $filter('translate')

            $scope.answers = [
                {}
            ];

            $scope.answeredQuestions = []

            //function that retrieves the lists of surveys

            $scope.getSurveys = function (){
                $scope.spinner = true;
                $http.get(appConstants.apiUrl + appConstants.surveys,{headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    $scope.spinner = false;
                    console.log(response.data)
                    $scope.surveys = response.data.data;
                    $localStorage.surveys = $scope.surveys;
                }).catch(function (error){
                    if (error.status == 401){
                        ionicAlertPopup.alertPop("error",filter('personalInfo.expired_error'))
                         $state.go('login')
                    }else{
                        console.log(error)
                    }
                    

                })
            }

            //function that checks if the user has answered a survey or if it its expired

            var checkSurvey = function (survey){
                var now = new Date();
                if (now < new Date(survey.expires)){
                    survey.expired = false
                }else{
                    survey.expired = true
                }
                if (survey.answeredBy){
                    var ids = Object.keys(survey.answeredBy);
                    survey.answered = false
                    for (var i = 0; i < ids.length;i++){
                        if ($scope.uid == ids[i]){
                            survey.answered = true
                        }
                    }
                    return survey
                }else{
                    survey.answered = false
                    return survey
                }    
            }

            //funciton retrieves data from a single survey

            $scope.getSurvey = function (){
                $http.get(appConstants.apiUrl + appConstants.surveys + survey,
                    {headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    var surveyData = response.data;
                    $scope.survey = checkSurvey(surveyData)
                    console.log($scope.survey)
                }).catch(function (error){
                    console.log(error)
                })
            }

            //function stores the answers of a new survey

            var createAnswers = function (surveyId,questionId) {
                var newAnswers = $.param({
                    content: JSON.stringify($scope.answers)
                })
                console.log(newAnswers);
                $http.post(appConstants.apiUrl + appConstants.surveys + surveyId +'/question/' + questionId + '/answer',newAnswers,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data)
                    $state.go('tab.surveys');
                }).catch(function (error){
                    console.log(error)
                })
            }

            //function stores the questions of a new survey

            var createQuestion = function (surveyId){
                console.log($scope.question)
                var newQuestion = $.param({
                    content: $scope.question.title
                })
                $http.post(appConstants.apiUrl + appConstants.surveys + surveyId +'/question',newQuestion,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data)
                    createAnswers(surveyId,response.data.id_question)
                }).catch(function (error){
                    console.log(error)
                })

            }

            var checkErros = function(){
                if (!$scope.surveyTitle){
                    ionicAlertPopup.alertPop(filter('suveys.error'),filter('suveys.no_title'))
                    return false;
                //}else if(!$scope.question.title){
                  //  ionicAlertPopup.alertPop(filter('suveys.error'),filter('suveys.no_question'))
                   // return false;
                }else if(!$scope.answers.content){
                    ionicAlertPopup.alertPop(filter('suveys.error'),filter('suveys.no_answer'))
                    return false;
                }else{
                    return true
                }
            }

            //function that creates a new survey

            $scope.createSurvey = function (){
                if (checkErros()){
                    var created = new Date();
                    var expires_in = new Date();
                    expires_in.setDate(expires_in .getDate() + parseInt($scope.expires));
                    var newSurvey = $.param({
                        title: $scope.surveyTitle,
                        id_user: $scope.uid,
                        created: created,
                        expires_in: expires_in 
                    })
                    $http.post(appConstants.apiUrl + appConstants.surveys,newSurvey,
                        {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                    }).then(function (response){
                        var surveyId = response.data.key;
                        console.log('created survey')
                        createQuestion(surveyId);
                    }).catch(function (error){
                        console.log(error)
                    })
                }
            }

            //add more ansers

            $scope.addLenght =  function (){
                var answer = {};
                $scope.answers.push(answer)
            }

            //puts together an array of the id of the question with its answer

            $scope.getId = function (questionId,answer){
                var exists = false;
                var answeredQuestion = {
                    questionId: questionId,
                    answerId: answer.id
                }
                for (var i =0; i < $scope.answeredQuestions.length;i++){
                    if ($scope.answeredQuestions[i].questionId == questionId){
                        $scope.answeredQuestions[i] = answeredQuestion 
                        exists = true
                    }
                }
                if (!exists){
                    $scope.answeredQuestions.push(answeredQuestion);
                }
            }

            //fills a survey

            $scope.fillSurvey = function (){
                for (var i = 0; i < $scope.answeredQuestions.length;i++){
                    $http({url: appConstants.apiUrl + appConstants.surveys + survey +'/question/' + $scope.answeredQuestions[i].questionId + '/answer/' + $scope.answeredQuestions[i].answerId + '/vote',
                        method: 'PUT',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                    }).then(function (response){
                        console.log(response.data);
                        $state.go('tab.surveys');
                    }).catch(function (error){
                        console.log(error);
                    })
                }
                var updateParam = $.param({
                    uid: $scope.uid
                })
                $http.put(appConstants.apiUrl + appConstants.surveys + survey + '/updateAnsweredBy',updateParam,
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function(response){
                    console.log(response)
                    console.log('user has answered a survey')
                }).catch(function(error){
                    console.log(error)
                })
            }

            //deletes a survey

            $scope.deleteSurvey = function (){
                $http.delete(appConstants.apiUrl + appConstants.surveys + survey,{headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
                }).then(function(response){
                    console.log(response.data)
                    $state.go('tab.surveys');

                }).catch(function(error){
                    console.log(error)
                })

            }

        }     
})()  