'use strict';

angular.module('poddDashboardApp')

.factory('PlanReport', function ($resource) {
    return $resource(config.API_BASEPATH + '/planReports/:id/');
})

;
