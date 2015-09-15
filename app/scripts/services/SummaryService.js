'use strict';

angular.module('poddDashboardApp')

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
    var resource = $resource(config.API_BASEPATH + '/summary/users/performance/', {}, {
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
});
