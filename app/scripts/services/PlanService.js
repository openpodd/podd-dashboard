/*globals config */
'use strict';

angular.module('poddDashboardApp')

.factory('PlanReport', function ($resource) {
    return $resource(config.API_BASEPATH + '/planReports/:id/', {
      'id': '@id'
    }, {
      resendNotification: {
        url: config.API_BASEPATH + '/planReports/:id/notify',
        isArray: false,
        method: 'POST'
      }
    });
})

;
