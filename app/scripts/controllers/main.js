'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', function ($scope, $modal, dashboard, streaming, map, Reports, ReportModal) {

    dashboard.get().$promise.then(function (villagesStatus) {
        map.setVillages(villagesStatus);
    });

    streaming.on('villageStatus', function (data) {
        console.log('got new village data:', data);
        map.setVillages(data);
        map.wink([ data.location[1], data.location[0] ], 10000);
    });

    map.onClickVillage(function (event, data) {
        console.log('clicked on village', data);

        Reports.list({ administrationAreas: [ 1, 2, 3 ] }).$promise.then(function (items) {

            // Mock it ~
            var _first = items[0],
                _secon = items[1],
                _third = items[2];
            _first.startDate = new Date();
            _secon.startDate = new Date();
            _third.startDate = new Date((new Date()).getTime() - (86400 * 20 * 1000)); // 20 days

            $scope.recentReports = [];
            $scope.olderReports = [];

            var threshold = new Date((new Date()).getTime() - (86400 * 14 * 1000));
            threshold.setHours(0);
            threshold.setMinutes(0);
            threshold.setSeconds(0);
            threshold.setMilliseconds(0);

            items.forEach(function (item) {
                // Filter for last 2 weeks
                if (item.startDate > threshold) {
                    $scope.recentReports.push(item);
                }
                // Filter for the older
                else {
                    $scope.olderReports.push(item);
                }
            });

            $scope.reports = items;
        });
    });

    $scope.closeReportList = function () {
        $scope.reports = null;
    };

    $scope.initReportModal = function () {
        ReportModal.init();

        ReportModal.on('shown.bs.modal', function () {
            ReportModal.setImages($scope.report.images);
        });
    };

    $scope.viewReport = function (reportId) {
        Reports.get({ reportId: reportId }).$promise.then(function (data) {
            console.log('loaded report data', data);

            $scope.report = data;
            ReportModal.show();
        });
    };

});
