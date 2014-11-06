'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', function ($scope, dashboard, streaming, map) {

    dashboard.get().$promise.then(function (villagesStatus) {
        map.customActions.setVillages(villagesStatus);
    });

    streaming.on('villageStatus', function (data) {
        console.log('got new village data:', data);
        map.customActions.setVillages(data);
    });

});
