'use strict';

angular.module('poddDashboardApp')

.factory('Mentions', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/notifications/', {}, {
        get: {
            isArray: true
        },
        seen: {
            url: config.API_BASEPATH + '/notification/seen/',
            method: 'POST',
        }
    });

    return resource;
});
