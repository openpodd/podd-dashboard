'use strict';

angular.module('poddDashboardApp')

.factory('PoddLog', function ($resource) {
    return $resource(config.API_BASEPATH + '/log/', {}, {
        dashboardView: {
            method: 'POST',
            isArray: false,
            url: config.API_BASEPATH + '/log/dashboard/view/?path=:path',
            params: { 'path': '@path' }
        }
    });
});
