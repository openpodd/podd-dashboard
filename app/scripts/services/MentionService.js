'use strict';

angular.module('poddDashboardApp')

.factory('Mentions', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/mentions/', {}, {
        get: {
            isArray: true
        },
        seen: {
            url: config.API_BASEPATH + '/mentions/seen/',
            method: 'POST',
        }
    });

    return resource;
});
