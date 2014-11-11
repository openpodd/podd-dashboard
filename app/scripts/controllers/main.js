'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', function ($scope, dashboard, streaming, map, Reports, ReportModal, Auth) {
    Auth.login(config.username, config.password);

    dashboard.get().$promise.then(function (villagesStatus) {
        map.setVillages(villagesStatus);
    });

    streaming.on('villageStatus', function (data) {
        console.log('got new village data:', data);
        var location = [
            data.location.coordinates[1],
            data.location.coordinates[0]
        ];

        map.setVillages(data);
        map.wink(location, 10000);
    });

    map.onClickVillage(function (event, data) {
        console.log('clicked on village', data);

        var query = { administrationArea: data.id };

        Reports.list(query).$promise.then(function (items) {

            $scope.recentReports = [];
            $scope.olderReports = [];

            var threshold = new Date((new Date()).getTime() - (86400 * 14 * 1000));
            threshold.setHours(0);
            threshold.setMinutes(0);
            threshold.setSeconds(0);
            threshold.setMilliseconds(0);

            items.forEach(function (item) {
                // Filter for last 2 weeks
                if ((new Date(item.incidentDate)) > threshold) {
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

            var tmpFormData = [], index;
            if (data.formData && !data.formData.forEach) {
                for (index in data.formData) {
                    if (data.formData.hasOwnProperty(index)) {
                        tmpFormData.push({
                            name: index,
                            value: data.formData[index]
                        });
                    }
                }
                data.formData = tmpFormData;
            }

            $scope.report = data;

            ReportModal.show();
        });
    };

});
