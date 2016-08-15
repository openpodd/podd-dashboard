/*global io */
'use strict';

angular.module('poddDashboardApp')

.factory('dashboard', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/dashboard/villages/', {}, {
        get: { isArray: true },
        getAdministrationAreas: {
            url: config.API_BASEPATH + '/administrationArea/',
            method: 'GET',
            isArray: true,
            cache: true
        },
        getAuthorities: {
            url: config.API_BASEPATH + '/authorities/' + '?short=true',
            method: 'GET',
            isArray: true,
            cache: true
        },
        getDashboardData: {
            url: config.API_BASEPATH + '/pages/dashboard',
            method: 'GET',
            isArray: false,
            cache: false
        }
    });

    return resource;
})

.factory('newDashboard', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/pages/dashboard', {}, {
        get: { 
            isArray: false 
        }
    });

    return resource;
})

.factory('streaming', function () {
    return io.connect(config.SOCKETIO_BASEPATH)
        .on('connect', function () {
            console.log('connected');
        });
});
