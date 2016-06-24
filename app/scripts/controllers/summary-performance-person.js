/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryPerformancePersonModeCtrl', function (shared, Menu) {
    // console.log('why hereeeeee init summary performance person ctrl');
    shared.summaryPerformancePersonMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryPerformancePersonCtrl', function ($scope, SummaryPerformancePerson, dashboard, User,
    streaming, FailRequest, shared, $location, $state, $stateParams, $window,
    cfpLoadingBar, dateRangePickerConfig, uiGridUtils) {

    console.log('init summary performance person ctrl');

    $scope.months = {
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        years: [2016, 2015, 2014],
        selectedMonth: moment().month() + 1,
        selectedYear: moment().year()
    };

    if ($stateParams.month) {
        var splitWord = ($stateParams.month.indexOf('/') !== -1)? '/': '%2F'
        $scope.months.selectedMonth = parseInt($stateParams.month.split(splitWord)[0]);
        $scope.months.selectedYear = parseInt($stateParams.month.split(splitWord)[1]);
    }

    var initArea = {
            id: '',
            parentName: '',
            name: 'ทุกพื้นที่'
        };

    $scope.areas = {
        all: [],
        selected: null,
    };

    $scope.areas.selectedArea = initArea;

    // Fetch available adminisitration areas
    // dashboard.getAdministrationAreas().$promise.then(function (data) {
    //     $scope.areas.all = data.filter(function (item) {
    //         return item.isLeaf;
    //     });
    //     $scope.areas.all.push(initArea);
    // });

    dashboard.getAuthorities().$promise.then(function (data) {
        $scope.areas.all = data;

        var areaId = parseInt($stateParams.areaId);
        if (areaId) {
            $scope.areas.all.forEach(function (item) {
               if (item.id === areaId) {
                   $scope.areas.selectedArea = item;
               }
            });
        }
    });

    $scope.query = '';
    $scope.selectedArea = '';
    $scope.shared = shared;
    $scope.gridOptionsPerson = {
        enableSorting: false,
        data: [],
        columnDefs: [],
        exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
        exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" download="สรุปการรายงานของอาสา.csv" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
        }
    };

    $scope.$on('summaryPerformancePerson:clearQuery', function (willClear) {
        if (willClear) {
            $scope.queryPerson = $stateParams.q || '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptionsPersons = {};
            if ($scope.queryPerson) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });

    $scope.search = function () {
        $scope.month = $scope.months.selectedMonth + '/' + $scope.months.selectedYear;

        var areaId = '';
        if ($scope.areas.selectedArea) {
            areaId = $scope.areas.selectedArea.id;
        }

        $state.go('main.summaryperformanceperson', { month: $scope.month, areaId: areaId });
    };

    $scope._search = function () {

        console.log('Will search with query', $scope.query);

        if ($scope.loading) {
            return;
        }

        $scope.results = [];
        $scope.loading = true;
        $scope.error = false;
        $scope.willShowResult = true;
        $scope.loadingLink = true;
        $scope.gridOptionsPerson.columnDefs = [];
        $scope.gridOptionsPerson.data = [];

        shared.summaryReports = {};

        if ($scope.query.authorityId === '') {
            delete $scope.query.authorityId;
        }

        SummaryPerformancePerson.query($scope.query).$promise.then(function (data) {
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

            $scope.month = $scope.query;
            $scope.gridOptionsPerson.enableSorting = true;
            $scope.gridOptionsPerson.columnDefs = [
                // { field: 'administrationAreaParentName', headerCellClass: 'cell-center' },
                // { field: 'administrationArea', headerCellClass: 'cell-center' },
                { field: 'fullName', headerCellClass: 'cell-center' },
                { field: 'numberOfActiveDays', cellClass: 'cell-center', headerCellClass: 'cell-center' },
                { field: 'grade', cellClass: 'cell-center', headerCellClass: 'cell-center' },
            ];
            $scope.gridOptionsPerson.data = results;

            setTimeout(function(){
                var w = angular.element($window);
                w.resize();
            }, 100);

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.closeSummaryPerformancePerson = function () {
        shared.summaryPerformancePersonMode = false;
    };

    $scope.gotoMainPage = function () {
        $location.url('/');
    };

    $scope.doQueryOnParams = function (params) {
        console.log(params);

        if ($state.current.name === 'main.summaryperformanceperson') {

            $scope.query = {
                month: $window.decodeURIComponent(params.month || ''),
                authorityId: $window.decodeURIComponent(params.areaId || ''),
            };

            if ($scope.query.month) {
                return $scope._search();
            }
            $scope.query.month = '';
            $scope.query.authorityId = initArea.id;
            return $scope.search();
        }
    };

    $scope.exportPerformancePerson = function(){
        var element = angular.element(document.querySelectorAll('.custom-csv-link-location-person')); element.html('');
        $scope.gridApi.exporter.csvExport( 'all', 'all', element);
    };

    // Handle export function.
    $scope.csvExport = function () {
        uiGridUtils.exportCsv($scope.gridApi.grid, 'summary-performance-person.csv');
    };

    $scope.xlsxExport = function () {
        uiGridUtils.exportXlsx($scope.gridApi.grid, 'summary-performance-person.xlsx');
    };

    $scope.$watch('areas.selectedArea', function (newValue, oldValue) {
        if (shared.summaryPerformancePersonMode && newValue && newValue !== oldValue) {
            $scope.search();
        }
    });

    $scope.$watch('months.selectedMonth', function (newValue, oldValue) {
        if (shared.summaryPerformancePersonMode && newValue && newValue !== oldValue) {
            $scope.search();
        }
    });

    $scope.$watch('months.selectedYear', function (newValue, oldValue) {
        if (shared.summaryPerformancePersonMode && newValue && newValue !== oldValue) {
            $scope.search();
        }
    });

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        console.log('stateChangeSuccess', $state.current.name, params.month);
        if ($state.current.name === 'main.summaryperformanceperson') {
            if (params.month && params.month.match(/[01]?[0-9]\/20\d\d/)) {
                $scope.month = params.month;
                $scope.months.selectedMonth = $scope.months.months[params.month.split('/')[0] - 1];
            }
            if (oldParams.month !== params.month || oldParams.areaId !== params.areaId) {
                $scope.doQueryOnParams(params);
            }
            else {
                $scope.search();
            }
        }
    });
});
