'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', function ($scope, dashboard, streaming,
                                  Map, Reports, ReportModal, shared, Auth) {

    console.log('IN MainCtrl');

    Auth.requireLogin($scope);

    var map = Map();

    function refreshDashboard() {
        dashboard.get().$promise.then(function (villages) {
            map.setVillages(villages);
            // Because every available village for this user is returned even there
            // is no report. We can use this variable to keep which village
            // current logged-in user can access.
            shared.villages = {};

            villages.forEach(function (item) {
                shared.villages[ item.id ] = item;
            });
        });
    }
    refreshDashboard();

    streaming.on('villageStatus', function (data) {
        console.log('got new village data:', data);

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        map.addReport(data, true);
    });

    map.onClickVillage(function (event, data) {
        console.log('clicked on village', data);

        var query = { administrationArea: data.id };

        // set current village
        $scope.currentVillage = data;

        // set center to this marker.
        map.leaflet.panTo([
            data.location.coordinates[1],
            data.location.coordinates[0]
        ]);

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
            $scope.showReportList = true;
        });
    });

    $scope.closeReportList = function () {
        $scope.reports = null;
        $scope.recentReports = null;
        $scope.olderReports = null;
        $scope.showReportList = false;
    };

    $scope.initReportModal = function () {
        ReportModal.init();
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

    // Watch to turn on filter mode.
    $scope.shared = shared;
    $scope.$watch('shared.filterMode', function (newValue) {
        $scope.showReportList = false;

        if (newValue) {
            $scope.$broadcast('filter:clearQuery', true);
            map.clearVillages();
        }
        else {
            refreshDashboard();
        }
    });

    $scope.$watch('shared.filterResults', function (newValue) {
        if (newValue) {
            $scope.showReportList = false;
            map.setVillages(newValue);
        }
    });

});
