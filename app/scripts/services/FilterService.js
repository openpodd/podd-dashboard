'use strict';

angular.module('poddDashboardApp')

.factory('Search', function ($resource) {
    return $resource(config.API_BASEPATH + '/reports/search', {}, {
        query: {
            method: 'GET',
            isArray: false
        }
    });
});
