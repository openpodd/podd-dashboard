'use strict';

angular.module('poddDashboardApp')

.factory('SummaryReport', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reports/summary/week/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
})

.factory('SummaryPerson', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reports/summary/zero/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
});
