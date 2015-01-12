'use strict';

angular.module('poddDashboardApp')

.controller('SummaryCtrl', function ($scope, Summary, User, streaming, FailRequest, shared) {
    
    console.log('init summary ctrl');

    $scope.weekSearch = '';
    $scope.gridOptions = {};

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
        console.log('Will search with query', $scope.query);

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

        shared.summaryReports = {};

        Summary.query({ dates: $scope.query, offset: ((new Date()).getTimezoneOffset() * -1 / 60) }).$promise.then(function (data) {
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
                options.push({ field: 'name', displayName: 'Name' });

                item.dates.forEach(function (date) {
                    result[date.date + "P"] = date.positive;
                    result[date.date + "N"] = date.negative;

                    if(!header){ 
                        options.push({ 
                            field: date.date + "P", 
                            cellClass: function(grid, row, col, rowRenderIndex, colRenderIndex) {
                              if (grid.getCellValue(row,col) === 0) return 'gray';
                            }
                        });
                        options.push({ 
                            field: date.date + "N", cellClass: 'red'
                        })
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
            $scope.gridOptions = { 
                headerTemplate: '<div class="ui-grid-top-panel" style="text-align: center">I am a Custom Grid Header</div>',
                data: results, 
                columnDefs: options, };


        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.$evalAsync(function () {
        $('[data-weekpicker]').weekpicker();
    });
    

});