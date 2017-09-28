'use strict';

angular.module('poddDashboardApp')


.factory('DataReport', function($resource) {
    return $resource(config.API_BASEPATH + '/dataReports/', {}, {
        list: {
            method: 'GET',
            isArray: true
        },
        get: {
            url: config.API_BASEPATH + '/dataReports/:id',
            method: 'GET',
            isArray: false
        },
        run: {
            url: config.API_BASEPATH + '/summary/dataReport/run/:id/',
            params: {"id" : "@id"},
            method: 'POST',
            isArray: false
        }
    });
})


