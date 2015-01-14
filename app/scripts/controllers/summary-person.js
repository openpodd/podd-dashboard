'use strict';

angular.module('poddDashboardApp')

.controller('SummaryPersonModeCtrl', function (shared, Menu) {
    shared.summaryPersonMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryPersonCtrl', function ($scope, SummaryPerson, User,
    streaming, FailRequest, shared, $location, $state, $stateParams, $window, cfpLoadingBar) {

    console.log('init summary person ctrl');

    var now = moment();
    var start_date;
    var end_date;

    if(now.format('d') === '0'){
        start_date = moment().day(-6).format("DD/MM/YYYY");
        end_date = moment().day(0).format("DD/MM/YYYY");
    }else{
        start_date = moment().day(1).format("DD/MM/YYYY");;
        end_date = moment().day(7).format("DD/MM/YYYY");;
    }

    $scope.query = start_date + '-' + end_date;
    $scope.gridOptions = {
        enableSorting: true,
        data: [],
        columnDefs: [],
    };

    $scope.$on('summaryPerson:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = $stateParams.q || start_date + '-' + end_date;
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptions = {};
            $scope.totalPerson = 0;
            if ($scope.query) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });

    $scope.search = function () {
        if($('#week_range_person').val() !== '')
            $scope.query = $('#week_range_person').val();

        console.log("goooooo",  $scope.query);
        $state.go('main.summaryperson', { dates: $scope.query, type: 'week' });
    }

    $scope._search = function () {

        console.log('Will search with query', $scope.query);

        if ($scope.loading) {
            return;
        }

        $scope.results = [];
        $scope.positiveReport = 0;
        $scope.negativeReport = 0;
        $scope.totalPerson = 0;
        $scope.loading = true;
        $scope.error = false;
        $scope.willShowResult = true;
        $scope.gridOptions = {
            enableSorting: true,
            data: [],
            columnDefs: [],
        };
        shared.summaryReports = {};

        SummaryPerson.query({ dates: $scope.query, type: 'week', offset: ((new Date()).getTimezoneOffset() * -1 / 60) }).$promise.then(function (data) {
            console.log('Query result:', data);

            var results = [];
            var options = [];
            var positive = 0;
            var negative = 0;
            var total = 0;
            var header = false;
            data.forEach(function (item) {
                results.push(item);
                total += 1;
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
                $scope.totalPerson = total;
            }
            $scope.weekSearch = $scope.query;
            $scope.gridOptions.enableSorting = true;
            $scope.gridOptions.columnDefs = [
                { field: 'parentAdministrationArea', },
                { field: 'administrationArea', },
                { field: 'fullname', },
                { field: 'telephone', },
                { field: 'projectMobileNumber', },
                { field: 'totalReport', },
            ];
            $scope.gridOptions.data = results;

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.$evalAsync(function () {
        if(shared.summaryPersonMode) $scope.search();
        $('[data-weekpicker]').weekpicker();
    });

    $scope.closeSummaryPerson = function () {
        shared.summaryPersonMode = false;
    };

    $scope.gotoMainPage = function () {
        $location.url('/');
    };

    $scope.doQueryOnParams = function (params) {
        if ($state.current.name === 'main.summaryperson') {
            $scope.query = $window.decodeURIComponent(params.dates || '');
            if ($scope.query) {
                return $scope._search();
            }
            $scope.query = start_date + '-' + end_date;
            $state.go('main.summaryperson', { dates: $scope.query, type: 'week' });
        }
    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        console.log("stateChangeSuccess", $state.current.name, params.dates);
        if ($state.current.name === 'main.summaryperson') {
            if (oldParams.dates !== params.dates) {
                $scope.doQueryOnParams(params);
            }else if(typeof params.dates === 'undefined'){
                $state.go('main.summaryperson', { dates: $scope.query, type: 'week' });
            }
        }
    });
});
