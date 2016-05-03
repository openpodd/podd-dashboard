/*globals config */
'use strict';

angular.module('poddDashboardApp')

.factory('Domain', function ($resource) {
    return $resource(config.API_BASEPATH + '/users/domains', null, {
        list: {
            method: 'GET',
            isArray: false
        },
        switchDomain: {
            //url: config.API_BASEPATH + '/users/do',
            isArray: false,
            method: 'GET'
        }
    });
})

;
