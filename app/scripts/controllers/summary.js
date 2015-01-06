'use strict';

angular.module('poddDashboardApp')

.controller('SummaryCtrl', function ($scope, Summary, User, streaming, FailRequest, shared) {
    
    console.log('init summary ctrl');

    $scope.currentYear = 2014;
    $scope.currentWeek =4;

    $scope.$on('summary:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.error = false;
            $scope.results = [];
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });

    $scope.search = function () {
        console.log('Will search with query', $scope.query);

        if ($scope.loading) {
            return;
        }

        $scope.results = [];
        $scope.loading = true;
        $scope.error = false;
        $scope.willShowResult = true;

        shared.summaryReports = {};

        Summary.query({ week: $scope.query }).$promise.then(function (data) {
            console.log('Query result:', data);
            
            var results = [];

            data.forEach(function (item) {
                results.push(item);
            });

            $scope.results = results;
            $scope.loading = false;

            if (results.length === 0) {
                $scope.empty = true;
            }
            else {
                $scope.empty = false;
                $scope.willShowResult = false;
            }

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

});