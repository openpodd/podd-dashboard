'use strict';

angular.module('poddDashboardApp')

.controller('SummaryReportModeCtrl', function (shared, Menu) {
    shared.summaryReportMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryReportCtrl', function ($scope, SummaryReport, User, streaming, FailRequest, shared, $location, $state) {
    
    console.log('init summary ctrl');
    $scope.weekSearch = '';
    $scope.gridOptions = {
        enableSorting: true,
        data: [], 
        columnDefs: [],
    };

    $state.go('main.summary-report', { dates: $scope.weekSearch }, { type: 'week' });
    $scope.$on('summary:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptions = {};
            $scope.totalReport = 0;
        }
    });


    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });

    $scope.search = function () {
        $scope.query = $('#week_range_report').val();

        console.log('Will search with query', $scope.query);
        $state.go('main.summary-report', { dates: $scope.query }, { type: 'week' });

        if ($scope.loading) {
            return;
        }

        $scope.results = [];
        $scope.positiveReport = 0;
        $scope.negativeReport = 0;
        $scope.totalReport = 0;
        $scope.loading = true;
        $scope.error = false;
        $scope.willShowResult = true;
        $scope.gridOptions = {
            enableSorting: true,
            data: [], 
            columnDefs: [],
        };
        shared.summaryReports = {};

        SummaryReport.query({ dates: $scope.query, offset: ((new Date()).getTimezoneOffset() * -1 / 60) }).$promise.then(function (data) {
            console.log('Query result:', data);
            
            var results = [];
            var options = [];
            var positive = 0;
            var negative = 0;
            var total = 0;
            var header = false;
            data.forEach(function (item) {

                var result = {};

                result['name'] = item.name;
                if(!header) options.push({ field: 'name', displayName: 'Name', width:200 });

                item.dates.forEach(function (date) {
                    result["P" + date.date] = date.positive;
                    result["N" + date.date] = date.negative;

                    if(!header){ 
                        options.push({ field: "P" + date.date, cellTemplate: '<div class="ui-grid-cell-contents" ng-class="{ gray: COL_FIELD == 0}">{{COL_FIELD}}</div>' });
                        options.push({ field: "N" + date.date, cellTemplate: '<div class="ui-grid-cell-contents red">{{COL_FIELD}}</div>' })
                    }
                });

                positive += item.positiveReport;
                negative += item.negativeReport;
                total += item.totalReport;

                header = true;
                results.push(result);
            });

            $scope.results = results;
            $scope.loading = false;

            if (results.length === 0) {
                $scope.empty = true;
            }
            else {
                $scope.empty = false;
                $scope.willShowResult = false;
                $scope.positiveReport = positive;
                $scope.negativeReport = negative;
                $scope.totalReport = total;
            }
            $scope.weekSearch = $scope.query;
            $scope.gridOptions.enableSorting = true;
            $scope.gridOptions.columnDefs = options;
            $scope.gridOptions.data = results; 

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.$evalAsync(function () {
        $('[data-weekpicker]').weekpicker();
    });
    
    $scope.changeQuery = function() {
        console.log("ffff");
    };

    $scope.closeSummaryReport = function () {
        shared.summaryReportMode = false;
    };

    $scope.gotoMainPage = function () {
        $location.url('/');
    };


});