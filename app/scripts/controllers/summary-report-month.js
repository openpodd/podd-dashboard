/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryReportMonthModeCtrl', function (shared, Menu) {
    // console.log('why hereeeeee init summary performance person ctrl');
    shared.summaryReportMonthMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryReportMonthCtrl', function ($scope, SummaryReportMonth, dashboard, User,
    streaming, FailRequest, shared, $location, $state, $stateParams, $window,
    cfpLoadingBar, dateRangePickerConfig, uiGridUtils, ReportTypes, Tag) {

    console.log('init summary report month ctrl');

    $scope.months = {
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        years: [2016, 2015, 2014],
        selectedMonth: moment().month() + 1,
        selectedYear: moment().year()
    };

    if ($stateParams.month && $stateParams.month.match(/[01]?[0-9]\/20\d\d/)) {
        $scope.month = $stateParams.month;
        $scope.months.selectedMonth = $scope.months.months[$stateParams.month.split('/')[0] - 1];
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

    $scope.types = {
        all: [],
        selected: null,
        selectedAll: true,
    };

    $scope.tags = [];
    $scope.areas.selectedArea = initArea;

    // Fetch available adminisitration areas
    dashboard.getAdministrationAreas().$promise.then(function (data) {
        $scope.areas.all = data.filter(function (item) {
            return item.isLeaf;
        });
        $scope.areas.all.push(initArea);
    });

    // Fetch available adminisitration areas
    ReportTypes.get().$promise.then(function (data) {
        var results = [];
        data.forEach(function (item) {
            item.selected = true;
            results.push(item);
        });
        $scope.types.all = results;
        $scope.types.selectedAll = true;
    });

    $scope.query = '';
    $scope.selectedArea = '';
    $scope.shared = shared;
    $scope.gridOptionsReport = {
        enableSorting: false,
        data: [],
        columnDefs: [],
        exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
        exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" download="สรุปการรายงานของอาสา.csv" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
        }
    };

    $scope.$on('summaryReportMonth:clearQuery', function (willClear) {
        if (willClear) {
            $scope.queryReport = $stateParams.q || '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptionsReport = {};
            if ($scope.queryReport) {
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

        var typeIds = [];
        angular.forEach($scope.types.all, function(type){
            if (type.selected) {
                typeIds.push(type.id);
            }
        });

        var tags = [];
        angular.forEach($scope.tags, function(tag){
            tags.push(tag.text);
        });

        $state.go('main.summaryreportmonth', { month: $scope.month, areaId: areaId, typeIds: typeIds, tags: tags });
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
        $scope.gridOptionsReport.columnDefs = [];
        $scope.gridOptionsReport.data = [];

        shared.summaryReports = {};

        if (!$scope.query.administrationArea) {
            delete $scope.query.administrationArea;
        }

        if (!$scope.query.tags) {
            delete $scope.query.tags;
        }

        SummaryReportMonth.query($scope.query).$promise.then(function (data) {
            console.log('Query result:', data);

            var results = [];
            var header = false;

            var dataOptions = [];

            data.forEach(function (item) {
                // var tags = '-';
                // if (item.Tags) {
                //     angular.forEach(item.Tags, function(tag){
                //         if (tags.indexOf('-') !== -1) {
                //             tags = tags.replace('-', '');
                //         }

                //         tags = tags + tag + ' ';
                //     });
                // }
                // item.Tags = tags;

                if (!header) {
                    dataOptions.push(
                        { 
                            name: '',
                            field: 'checkbox', 
                            pinnedLeft: true,
                            cellTemplate: '<input type="checkbox" ng-model="row.entity.checkbox" ng-click="$event.stopPropagation();getExternalScopes().showMe(row.entity.id)"/>',
                            width: 30, 
                        });

                    angular.forEach(item, function(value, key) {
                        dataOptions.push({ field: key, headerCellClass: 'cell-center' });
                    });

                    header = true;
                }

                if (item.id !== '-') {
                    item.checkbox = false;
                    results.push(item);
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
            }

            $scope.month = $scope.query;
            $scope.gridOptionsReport.enableSorting = true;
            $scope.gridOptionsReport.columnDefs = dataOptions;
            $scope.gridOptionsReport.data = results;

            setTimeout(function(){
                var w = angular.element($window);
                w.resize();
            }, 100);

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.closeSummaryReportMonth = function () {
        shared.summaryReportMonthMode = false;
    };

    $scope.gotoMainPage = function () {
        $location.url('/');
    };

    $scope.doQueryOnParams = function (params) {
        console.log(params);

        if ($state.current.name === 'main.summaryreportmonth') {

            $scope.query = {
                'month': $window.decodeURIComponent(params.month || ''),
                'administrationArea': $window.decodeURIComponent(params.areaId || ''),
                'type__in': $window.decodeURIComponent(params.typeIds || '').split(','),
                'tags__in': $window.decodeURIComponent(params.tags || '').split(','),
                'negative': true,
                'testFlag': false,
                '_missing_': 'parent',
            };

            if ($scope.query.month) {
                $scope.months.selectedMonth = parseInt($scope.query.month.split('/')[0]);
                $scope.months.selectedYear = parseInt($scope.query.month.split('/')[1]);

                return $scope._search();
            }

            $scope.query.month = '';
            $scope.query.administrationArea = initArea.id;
            return $scope.search();
        }
    };

    $scope.exportReportMonth = function(){
        var element = angular.element(document.querySelectorAll('.custom-csv-link-location-person')); element.html('');
        $scope.gridApi.exporter.csvExport( 'all', 'all', element);
    };

    // Handle export function.
    $scope.csvExport = function () {
        uiGridUtils.exportCsv($scope.gridApi.grid, 'summary-report-month.csv');
    };

    $scope.xlsxExport = function () {
        uiGridUtils.exportXlsx($scope.gridApi.grid, 'summary-report-month.xlsx');
    };

    $scope.$watch('areas.selectedArea', function (newValue, oldValue) {
        if (shared.summaryReportMonthMode && newValue && newValue !== oldValue) {
            // $scope.search();
        }
    });

    $scope.$watch('months.selectedMonth', function (newValue, oldValue) {
        if (shared.summaryReportMonthMode && newValue && newValue !== oldValue) {
            // $scope.search();
        }
    });

    $scope.$watch('months.selectedYear', function (newValue, oldValue) {
        if (shared.summaryReportMonthMode && newValue && newValue !== oldValue) {
            // $scope.search();
        }
    });

    $scope.tagReports = [];
    $scope.tagReportIds = [];
    $scope.$watch('gridOptionsReport.data', function (newValue, oldValue) {
        if (shared.summaryReportMonthMode && newValue && newValue !== oldValue) {
            // $scope.search();
            var results = [];
            $scope.gridOptionsReport.data.forEach(function (item) {
                if (item.checkbox == true) {
                    results.push(item.id);
                }
            });

            $scope.tagReportIds = results;
        }
    }, true);

    $scope.tagInput = [];
    $scope.doTag = function () {
        var tags = []
        $scope.tagInput.forEach(function (item) {
            tags.push(item.text);
        });

        if (tagInput.length == 0) {
            return;
        }

        $scope.gridOptionsReport.data.forEach(function (item) {
            if (item.checkbox == true) {
                item.Tags = item.Tags + tags;
            }
        });

    };

    $scope.checkAll = function () {
        var selectedAll = $scope.types.selectedAll;
        // console.log(selectedAll, $scope.types.selectedAll);
        angular.forEach($scope.types.all, function(type){
            type.selected = selectedAll;
        });
    };

    $scope.$watch('types.all', function(newValue){
        var count = 0;
        angular.forEach(newValue, function(type){
          if(type.selected){
            count += 1;
          }
        });

        if (newValue.length === count) {
            $scope.types.selectedAll = true;
        } else {
            $scope.types.selectedAll = false;
        }
    }, true);

    $scope.loadTags = function(query) {
        console.log(query);
        return Tag.get({ 'q': query }).$promise.then(function (data) {
            var results = [];
            data.forEach(function (item) {
                results.push({ 'text': item.name });
            });
            return results;
        });

    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        console.log('stateChangeSuccess', $state.current.name, params.month);
        if ($state.current.name === 'main.summaryreportmonth') {
            if (params.month && params.month.match(/[01]?[0-9]\/20\d\d/)) {
                $scope.month = params.month;
                $scope.months.selectedMonth = $scope.months.months[params.month.split('/')[0] - 1];
            }
            if (oldParams.month !== params.month || oldParams.areaId !== params.areaId || oldParams.typeIds !== params.typeIds) {
                $scope.doQueryOnParams(params);
            }
            else {
                $scope.search();
            }
        }
    });
});
