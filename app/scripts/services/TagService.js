'use strict';

angular.module('poddDashboardApp')

.factory('Tag', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/tags/list/', {}, {
        get: {
            isArray: true
        }
    });

    return resource;
});