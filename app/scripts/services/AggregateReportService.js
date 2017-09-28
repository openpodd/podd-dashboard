'use strict';

angular.module('poddDashboardApp')


.factory('AggregateReport', function($resource) {
    return $resource(config.API_BASEPATH + '/aggregateReports/', {}, {
        list: {
            method: 'GET',
            isArray: true
        },
        get: {
            url: config.API_BASEPATH + '/aggregateReports/:id',
            method: 'GET',
            isArray: false
        },
        run: {
            url: config.API_BASEPATH + '/summary/aggregateReport/run/:id/',
            params: {"id" : "@id"},
            method: 'POST',
            isArray: false
        }
    });
})


