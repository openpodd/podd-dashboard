/* global angular, config */

'use strict';

angular.module('poddDashboardApp')

.factory('SummaryAnalysis', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/analysis/export/', {}, {
        get: {
            isArray: false,
            responseType: 'text',
            transformResponse: function (data) {
                return { data: data };
            }
        }
    });

    return resource;
})

.factory('SummaryReport', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/areas/count-reports/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
})

.factory('SummaryPerson', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/users/inactive/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
})


.factory('SummaryPerformancePerson', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/users/daily-performance/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
})


.factory('SummaryReportMonth', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/reports/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
})


.factory('SummaryReportVisualization', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/reports-visualization/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
})

.factory('SummaryDashboardVisualization', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/dashboard-visualization/', {}, {
        get: {
            isArray: false
        }
    });

    return resource;
})

.factory('SummaryAuthorityDashboard', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/authority-dashboard/', {}, {
        get: {
            isArray: false
        }
    });

    return resource;
})

.factory('SummaryResultMonthly', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/summary/monthly/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
});

