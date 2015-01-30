/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryPersonModeCtrl', function (shared, Menu) {
    shared.summaryPersonMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryPersonCtrl', function ($scope, SummaryPerson, User,
    streaming, FailRequest, shared, $location, $state, $stateParams, $window,
    cfpLoadingBar, dateRangePickerConfig) {

    console.log('init summary person ctrl');

    $scope.date = {
        startDate: (moment().format('d') === '0' ? moment().day(-6) : moment().day(1)),
        endDate: (moment().format('d') === '0' ? moment().day(0) : moment().day(7)),
    };
    dateRangePickerConfig.format = 'DD/MM/YYYY';
    $scope.dateOptions = {
        startDate: $scope.date.startDate,
        endDate: $scope.date.endDate,
        format: 'DD/MM/YYYY',
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
            'This Week': [(moment().format('d') === '0' ? moment().day(-6) : moment().day(1)), (moment().format('d') === '0' ? moment().day(0) : moment().day(7))],
            'Last 7 Days': [moment().subtract('days', 6), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
        },
    };

    $scope.queryPerson = '';
    $scope.type = 'week';
    $scope.shared = shared;
    $scope.gridOptionsPerson = {
        enableSorting: false,
        data: [],
        columnDefs: [],
        exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
        exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
        }
    };

    $scope.$on('summaryPerson:clearQuery', function (willClear) {
        if (willClear) {
            $scope.queryPerson = $stateParams.q || '';
            $scope.date.startDate = (moment().format('d') === '0' ? moment().day(-6) : moment().day(1));
            $scope.date.endDate = (moment().format('d') === '0' ? moment().day(0) : moment().day(7));
            $scope.dateOptions.startDate = $scope.date.startDate;
            $scope.dateOptions.endDate = $scope.date.endDate;
            $scope.type = 'week';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptionsPersons = {};
            $scope.totalPerson = 0;
            if ($scope.queryPerson) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });


    $scope.percentRange = function(){
        var results = [];
        for (var i = 0; i <= 100; i+=5) {
            results.push(i);
        }
        return results;
    };

    $scope.updatePercent = function(percent){
        $state.go('main.summaryperson', { dates: $scope.queryPerson, type: 'percent', percent: percent });
    };

    $scope.search = function (date) {
        $scope.date.startDate = date.startDate;
        $scope.date.endDate = date.endDate;
        console.log('');
        $scope.queryPerson = moment(date.startDate).format('DD/MM/YYYY') + '-' + moment(date.endDate).format('DD/MM/YYYY');
        $state.go('main.summaryperson', { dates: $scope.queryPerson, type: 'percent' });
    };

    $scope._search = function () {

        console.log('Will search with query', $scope.queryPerson);

        if ($scope.loading) {
            return;
        }

        $scope.dateOptions.startDate = $scope.date.startDate;
        $scope.dateOptions.endDate = $scope.date.endDate;

        $scope.results = [];
        $scope.positiveReport = 0;
        $scope.negativeReport = 0;
        $scope.totalPerson = 0;
        $scope.loading = true;
        $scope.error = false;
        $scope.willShowResult = true;
        $scope.loadingLink = true;
        $scope.gridOptionsPerson.columnDefs = [];
        $scope.gridOptionsPerson.data = [];

        shared.summaryReports = {};

        var object = { dates: $scope.queryPerson, type: 'percent', offset: ((new Date()).getTimezoneOffset() * -1 / 60) };
        if ($scope.percent) {
            object.percent = $scope.percent;
        }

        SummaryPerson.query(object).$promise.then(function (data) {
            console.log('Query result:', data);

            var results = [];
            var percent = null;
            var positive = 0;
            var negative = 0;
            var total = 0;

            data.forEach(function (item) {
                results.push(item);
                total += 1;

                if (percent === null) {
                    percent = item.percent;
                }
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
            $scope.weekSearch = $scope.queryPerson.replace('-', ' - ');
            $scope.percent = percent;
            $scope.minReport = Math.floor(percent / 100 * ((moment().range($scope.date.startDate, $scope.date.endDate)).diff('days') + 1));
            $scope.gridOptionsPerson.enableSorting = true;
            $scope.gridOptionsPerson.columnDefs = [
                { field: 'parentAdministrationArea', headerCellClass: 'cell-center' },
                { field: 'administrationArea', headerCellClass: 'cell-center' },
                { field: 'fullname', headerCellClass: 'cell-center' },
                { field: 'status', cellClass: 'cell-center', headerCellClass: 'cell-center' },
                { field: 'telephone', cellClass: 'cell-center', headerCellClass: 'cell-center' },
                { field: 'projectMobileNumber', cellClass: 'cell-center', headerCellClass: 'cell-center' },
                { field: 'totalReport', cellClass: 'cell-center', headerCellClass: 'cell-center' },
            ];
            $scope.gridOptionsPerson.data = results;
            
            setTimeout(function(){
                $scope.loadingLink = false;
                $scope.exportPerson();
            }, 3000);

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.closeSummaryPerson = function () {
        shared.summaryPersonMode = false;
    };

    $scope.gotoMainPage = function () {
        $location.url('/');
    };

    $scope.doQueryOnParams = function (params) {
        if ($state.current.name === 'main.summaryperson') {
            $scope.queryPerson = $window.decodeURIComponent(params.dates || '');
            $scope.percent = $window.decodeURIComponent(params.percent || '');
            
            if ($scope.queryPerson) {
                var splitDate = $scope.queryPerson.split('-');
                $scope.date.startDate = moment(splitDate[0], 'DD/MM/YYYY');
                $scope.date.endDate = moment(splitDate[1], 'DD/MM/YYYY');
                $scope.dateOptions.startDate = $scope.date.startDate;
                $scope.dateOptions.endDate = $scope.date.endDate;
                return $scope._search();
            } 

            var date = {};
            if ($scope.date) {
                date = $scope.date;
            } else {
                date.startDate = (moment().format('d') === '0' ? moment().day(-6) : moment().day(1));
                date.endDate = (moment().format('d') === '0' ? moment().day(0) : moment().day(7));
            }
            
            return $scope.search(date);
        }
    };

    $scope.exportPerson = function(){
        var element = angular.element(document.querySelectorAll('.custom-csv-link-location-person')); element.html('');
        $scope.gridApi.exporter.csvExport( 'all', 'all', element);
    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        console.log('stateChangeSuccess', $state.current.name, params.dates);
        if ($state.current.name === 'main.summaryperson') {
            if (oldParams.dates !== params.dates || oldParams.percent !== params.percent) {
                $scope.doQueryOnParams(params);
            }else if(typeof params.dates === 'undefined'){
                var date = {};
                date.startDate = (moment().format('d') === '0' ? moment().day(-6) : moment().day(1));
                date.endDate = (moment().format('d') === '0' ? moment().day(0) : moment().day(7));
                return $scope.search(date);
            }
        }
    });
});
