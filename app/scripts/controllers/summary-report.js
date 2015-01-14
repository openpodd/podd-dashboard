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

    function setDateRangeFromNow(){
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
        return start_date + '-' + end_date;
    }

    $scope.queryReport = setDateRangeFromNow();
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

    $scope.$on('summaryReport:clearQuery', function (willClear) {
        if (willClear) {
            $scope.queryReport = $stateParams.q || setDateRangeFromNow();
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.loadingLink = true;
            $scope.error = false;
            $scope.results = [];
            $scope.gridOptionsReports = {};
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
        $state.go('main.summaryreport', { dates: $scope.queryReport, type: 'week' });
    }

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

        shared.summaryReports = {};

        SummaryReport.query({ dates: $scope.queryReport, offset: ((new Date()).getTimezoneOffset() * -1 / 60) }).$promise.then(function (data) {
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
                if(!header) options.push({ field: 'name', displayName: 'Name', width:320 });

                item.dates.forEach(function (date) {
                    result["P" + date.date] = date.positive;
                    result["N" + date.date] = date.negative;

                    if(!header){
                        options.push({ field: "P" + date.date, 
                            cellTemplate: '<div class="ui-grid-cell-contents cell-report" ng-class="{ gray: COL_FIELD == 0}">{{COL_FIELD}}</div>',
                            headerCellTemplate: '<div class="ui-grid-cell-contents grid ui-grid-cell-contents-collapse-2"><div class="ui-grid-collapse-2">Good</div></div>'});
                        options.push({ field: "N" + date.date,
                            cellTemplate: '<div class="ui-grid-cell-contents cell-report" ng-class="{ red: COL_FIELD > 0}">{{COL_FIELD}}</div>',
                            headerCellTemplate: '<div class="ui-grid-vertical-bar">&nbsp;</div><div class="ui-grid-cell-contents grid ng-scope pd-badge-cell">Bad</div>' })
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
            $scope.weekSearch = $scope.queryReport;
            $scope.gridOptionsReport.enableSorting = false;
            $scope.gridOptionsReport.columnDefs = options;
            $scope.gridOptionsReport.data = results;

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
        $scope.gridApi.exporter.csvExport( 'all', 'all', element );
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
            $scope.queryReport = $window.decodeURIComponent(params.dates || '');
            if ($scope.queryReport) {
                return $scope._search();
            }
            $scope.queryReport = setDateRangeFromNow();
            $state.go('main.summaryreport', { dates: $scope.queryReport, type: 'week' });
        }
    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        console.log("stateChangeSuccess");
        if ($state.current.name === 'main.summaryreport') {
            if (oldParams.dates !== params.dates) {
                $scope.doQueryOnParams(params);
            }else if(typeof params.dates === 'undefined'){
                $state.go('main.summaryreport', { dates: $scope.queryReport, type: 'week' });
            }
        }
    });
});
