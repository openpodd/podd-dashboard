/*globals config */
'use strict';

angular.module('poddDashboardApp')

.factory('Notification', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/notifications/', {}, {
        test: {
            url: config.API_BASEPATH + '/notifications/test/',
            method: 'POST'
        }
    });
    return resource;
})

;
