'use strict';

angular.module('poddDashboardApp')

.factory('Search', function ($resource) {
    return $resource(config.host + '/reports/search', {}, {
        query: {
            method: 'GET',
            isArray: true
        }
    });
});
