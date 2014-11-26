'use strict';

angular.module('poddDashboardApp')

.factory('Flags', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/flags/', {}, {
        list: {
            method: 'GET',
            isArray: true
        },
        post: {
            method: 'POST',
        }
    });

    return resource;
});
