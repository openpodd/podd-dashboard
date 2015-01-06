'use strict';

angular.module('poddDashboardApp')

.factory('Summary', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reports/summary/week/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
});
