/* jshint multistr:true */
/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryReportModeCtrl', function (shared, Menu) {
    shared.summaryReportMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryReportCtrl', function ($scope, SummaryReport, User,
    streaming, FailRequest, shared, $location, $state, $stateParams, $window,
    uiGridConstants, cfpLoadingBar, dateRangePickerConfig) {

    console.log('init summary report ctrl');

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
            'Last 7 Days': [moment().subtract('days', 6), moment()],
            'Last 30 Days': [moment().subtract('days', 29), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract('month', 1).startOf('month'), moment().subtract('month', 1).endOf('month')]
        },
    };

    $scope.queryReport = '';
    $scope.loadingLink = true;
    $scope.type = 'week';
    $scope.shared = shared;
    $scope.gridOptionsReport = {
        enableSorting: false,
        data: [],
        columnDefs: [],
        exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
        exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
        }
    };
    $scope.gridOptionsReportShow = {
        data: [],
        columnDefs: [],
        minRowsToShow: 10,
    };

    $scope.$on('summaryReport:clearQuery', function (willClear) {
        if (willClear) {
            $scope.queryReport = $stateParams.q || '';
            $scope.date.startDate = (moment().format('d') === '0' ? moment().day(-6) : moment().day(1));
            $scope.date.endDate = (moment().format('d') === '0' ? moment().day(0) : moment().day(7));
            $scope.dateOptions.startDate = $scope.date.startDate;
            $scope.dateOptions.endDate = $scope.date.endDate;
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.loadingLink = true;
            $scope.error = false;
            $scope.results = [];

            $scope.totalReport = 0;
            if ($scope.queryReport) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });

    $scope.search = function () {
        $scope.queryReport = moment($scope.date.startDate).format('DD/MM/YYYY') + '-' + moment($scope.date.endDate).format('DD/MM/YYYY');
        $state.go('main.summaryreport', { dates: $scope.queryReport, type: 'day' });
    };

    $scope._search = function () {
        console.log('Will search with query', $scope.queryReport);

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
        $scope.loadingLink = true;

        $scope.gridOptionsReport.columnDefs = [];
        $scope.gridOptionsReport.data = [];

        $scope.gridOptionsReportShow.columnDefs = [];
        $scope.gridOptionsReportShow.data = [];

        shared.summaryReports = {};

        SummaryReport.query({ dates: $scope.queryReport, offset: ((new Date()).getTimezoneOffset() * -1 / 60) }).$promise.then(function (data) {
            console.log('Query result:', data);

            var results = [];
            var showResults = [];

            var showOptions = [];
            var reportOptions = [];

            var positive = 0;
            var negative = 0;
            var total = 0;
            var header = false;

            data.forEach(function (item) {

                var result = {};
                var showResult = {};

                result.name = item.name;
                showResult.name = item.name;
                if(!header){
                    showOptions.push({ field: 'name', pinnedLeft: true,
                        headerCellTemplate: '<div class="ui-grid-vertical-bar">&nbsp;</div><div class="ui-grid-cell-contents grid ng-scope pd-badge-cell">Name</div>',
                        width:320 });

                    reportOptions.push({ field: 'name',
                        headerCellTemplate: '<div class="ui-grid-vertical-bar">&nbsp;</div><div class="ui-grid-cell-contents grid ng-scope pd-badge-cell">Name</div>',
                        width:320});
                }

                item.dates.forEach(function (date) {
                    result['P' + date.date] = date.positive;
                    result['N' + date.date] = date.negative;
                    showResult[date.date] = date.positive + ',' + date.negative;

                    if (!header) {
                        var length = item.dates.length;

                        var column = { field: date.date,
                            headerCellTemplate: '<div class="ui-grid-vertical-bar">&nbsp;</div><div class="ui-grid-cell-contents grid ui-grid-cell-contents-collapse-2"><div class="ui-grid-collapse-2">' + date.date + '</div></div>',
                            cellTemplate: '<div class="ui-grid-cell-contents cell-center">\
                                <span class="badge ng-binding" ng-class="{ \'badge-good\': COL_FIELD.split(\',\')[0] !== \'0\'}" >{{ COL_FIELD.split(",")[0] }}</span> , \
                                <span class="badge ng-binding" ng-class="{ \'badge-bad\': COL_FIELD.split(\',\')[1] !== \'0\'}" >{{ COL_FIELD.split(",")[1] }}</span>\
                                </div>'};

                        if (length > 12) {
                            column.width = 70;
                        }

                        /* jshint -W109 */
                        showOptions.push(column);
                        reportOptions.push({ field: "P" + date.date,
                            cellTemplate: '<div class="ui-grid-cell-contents cell-center" ng-class="{ gray: COL_FIELD == 0}">{{COL_FIELD}}</div>',
                            headerCellTemplate: '<div class="ui-grid-vertical-bar"></div><div class="ui-grid-cell-contents grid ui-grid-cell-contents-collapse-2"><div class="ui-grid-collapse-2">Good</div></div>'});
                        reportOptions.push({ field: "N" + date.date,
                            cellTemplate: '<div class="ui-grid-cell-contents cell-center" ng-class="{ red: COL_FIELD > 0}">{{COL_FIELD}}</div>',
                            headerCellTemplate: '<div class="ui-grid-vertical-bar">&nbsp;</div><div class="ui-grid-cell-contents grid ng-scope pd-badge-cell">Bad</div>' });

                        /* jshint +W109 */
                    }
                });

                positive += item.positiveReport;
                negative += item.negativeReport;
                total += item.totalReport;

                header = true;
                results.push(result);
                showResults.push(showResult);
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
            $scope.weekSearch = $scope.queryReport;
            $scope.gridOptionsReport.enableSorting = false;
            $scope.gridOptionsReport.columnDefs = reportOptions;
            $scope.gridOptionsReport.data = results;

            $scope.gridOptionsReportShow.columnDefs = showOptions;
            $scope.gridOptionsReportShow.data = showResults;

            setTimeout(function(){
                $scope.loadingLink = false;
                $scope.exportReport();
            }, 3000);

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.exportReport = function() {
        var element = angular.element(document.querySelectorAll('.custom-csv-link-location-report')); element.html('');
        $scope.gridApi.exporter.csvExport( 'all', 'all', element );
    };

    $scope.closeSummaryReport = function () {
        shared.summaryReportMode = false;
    };

    $scope.gotoMainPage = function () {
        $location.url('/');
    };

    $scope.doQueryOnParams = function (params) {
        if ($state.current.name === 'main.summaryreport') {
            $scope.queryReport = $window.decodeURIComponent(params.dates || '');
            if ($scope.queryReport) {
                console.log($scope.queryReport);
                var splitDate = $scope.queryReport.split('-');
                $scope.date.startDate = moment(splitDate[0], 'DD/MM/YYYY');
                $scope.date.endDate = moment(splitDate[1], 'DD/MM/YYYY');
            }else{
                $scope.date.startDate = (moment().format('d') === '0' ? moment().day(-6) : moment().day(1));
                $scope.date.endDate = (moment().format('d') === '0' ? moment().day(0) : moment().day(7));
            }

            $scope.dateOptions.startDate = $scope.date.startDate;
            $scope.dateOptions.endDate = $scope.date.endDate;

            if ($scope.queryReport) {
                return $scope._search();
            }
            else {
                return $scope.search();
            }
        }
    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        if ($state.current.name === 'main.summaryreport') {
            if (oldParams.dates !== params.dates) {
                $scope.doQueryOnParams(params);
            }else if(typeof params.dates === 'undefined'){
                $scope.date.startDate = (moment().format('d') === '0' ? moment().day(-6) : moment().day(1));
                $scope.date.endDate = (moment().format('d') === '0' ? moment().day(0) : moment().day(7));
                return $scope.search();
            }
        }
    });
});
