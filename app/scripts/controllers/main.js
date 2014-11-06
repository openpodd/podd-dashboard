'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', function ($scope, dashboard, streaming, map, reports) {

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

        reports.get({ administrationAreas: [ 1, 2, 3 ] }).$promise.then(function (items) {
            $scope.reports = items;
        });
    });

    $scope.closeReportList = function () {
        $scope.reports = null;
    };

});
