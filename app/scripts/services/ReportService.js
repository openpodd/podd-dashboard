'use strict';

angular.module('poddDashboardApp')

.factory('reports', function ($resource) {
    var resource = $resource('/api/reports.json', {}, {
        get: { isArray: true }
    });

    return resource;
});
