'use strict';

angular.module('poddDashboardApp')

.controller('SummaryReportModeCtrl', function (shared, Menu) {
    shared.summaryReportMode = true;
    Menu.setActiveMenu('summary');
})

.controller('SummaryReportCtrl', function ($scope, SummaryReport, User,
    streaming, FailRequest, shared, $location, $state, $stateParams, $window,
    uiGridConstants, cfpLoadingBar) {

    console.log('init summary report ctrl');

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
    $scope.query_report = start_date + '-' + end_date;
    $scope.loadingLink = true;
    $scope.type = 'week';

    $scope.$on('summaryReport:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query_report = $stateParams.q || start_date + '-' + end_date;
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.loadingLink = true;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptionsReports = {};
            $scope.totalReport = 0;
            if ($scope.query_report) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.summaryQuery = newValue;
    });

    $scope.search = function () {
        $state.go('main.summaryreport', { dates: $scope.query_report, type: 'week' });
    }

    $scope.shared = shared;

    shared.gridOptions = {
        enableSorting: false,
        data: [],
        columnDefs: [],
        exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
        exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
        onRegisterApi: function(gridApi){ 
            shared.gridApi = gridApi;
        }
    };

    $scope._search = function () {
        console.log('Will search with query', $scope.query_report);

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
        

        shared.summaryReports = {};

        SummaryReport.query({ dates: $scope.query_report, offset: ((new Date()).getTimezoneOffset() * -1 / 60) }).$promise.then(function (data) {
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
                        options.push({ field: "P" + date.date, width:100,
                            cellTemplate: '<div class="ui-grid-cell-contents cell-report" ng-class="{ gray: COL_FIELD == 0}">{{COL_FIELD}}</div>',
                            headerCellTemplate: '<div class="ui-grid-cell-contents grid ui-grid-cell-contents-collapse-2"><div class="ui-grid-collapse-2"><span>'+ date.date +'</span><div class="row"><div class="col-md-6">P</div><div class="col-md-6">N</div></div></div></div>'});
                        options.push({ field: "N" + date.date, width:100,
                            cellTemplate: '<div class="ui-grid-cell-contents cell-report" ng-class="{ red: COL_FIELD > 0}">{{COL_FIELD}}</div>',
                            headerCellTemplate: '<div class="ui-grid-vertical-bar">&nbsp;</div><div class="ui-grid-cell-contents grid ng-scope"></div>' })
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
            $scope.weekSearch = $scope.query_report;
            shared.gridOptions.enableSorting = false;
            shared.gridOptions.columnDefs = options;
            shared.gridOptions.data = results;

            setTimeout(function(){
                $scope.loadingLink = false;
                $scope.exportReport();
            }, 3000);

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.exportReport = function(){
        console.log("Api========", shared.gridApit);
        var element = angular.element(document.querySelectorAll(".custom-csv-link-location-report")); element.html('');
        shared.gridApi.exporter.csvExport( 'all', 'all', element );
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

    $scope.doQueryOnParams = function (params) {
        if ($state.current.name === 'main.summaryreport') {
            $scope.query_report = $window.decodeURIComponent(params.dates || '');
            if ($scope.query_report) {
                return $scope._search();
            }
            $scope.query_report = start_date + '-' + end_date;
            $state.go('main.summaryreport', { dates: $scope.query_report, type: 'week' });
        }
    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        console.log("stateChangeSuccess");
        if ($state.current.name === 'main.summaryreport') {
            if (oldParams.dates !== params.dates) {
                $scope.doQueryOnParams(params);
            }else if(typeof params.dates === 'undefined'){
                $state.go('main.summaryreport', { dates: $scope.query_report, type: 'week' });
            }
        }
    });
});
