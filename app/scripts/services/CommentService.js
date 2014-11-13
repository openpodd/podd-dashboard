'use strict';

angular.module('poddDashboardApp')

.factory('Comments', function ($resource) {
    return $resource(config.API_BASEPATH + '/reportComments/', {}, {
        list: {
            method: 'GET',
            isArray: true
        },
        post: {
            method: 'POST'
        }
    });
});
