(function() {
    'use strict';
    angular
        .module('starter')
        .controller('surveysController', surveysController);
  
        surveysController.$inject = ['$scope','$http','$localStorage','$state','$window','$sessionStorage','$stateParams','$rootScope','appConstants'];
        function surveysController($scope,$http,$localStorage,$state,$window,$sessionStorage,$stateParams,$rootScope,appConstants){
            
            $scope.uid = $localStorage.uid;
            var token = $localStorage.userToken;
            var survey = $stateParams.surveyId;
            if ($rootScope.newExists == true){
                $rootScope.newExists = false;
            }

            $scope.answers = [
                {},
                {}
            ];

            $scope.answeredQuestions = []

            $scope.getSurveys = function (){
                $http.get(appConstants.apiUrl + appConstants.surveys,{headers: {'Authorization':'Bearer: ' + token}
                }).then(function (response){
                    console.log(response.data)
                    $scope.surveys = response.data.data;
                    $localStorage.surveys = $scope.surveys;
                }).catch(function (error){
                    alert('Su sesión ha vencido')
                    $state.go('login')
                    console.log(error)
                })
            }

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

            var createQuestion = function (surveyId){
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

            $scope.createSurvey = function (){
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

            $scope.addLenght =  function (){
                var answer = {};
                $scope.answers.push(answer)
            }

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

            $scope.fillSurvey = function (){
                for (var i = 0; i < $scope.answeredQuestions.length;i++){
                    $http.put(appConstants.apiUrl + appConstants.surveys + survey +'/question/' + $scope.answeredQuestions[i].questionId + '/answer/' + $scope.answeredQuestions[i].answerId + '/vote',
                        {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
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