/*global io */
'use strict';

angular.module('poddDashboardApp')

.factory('dashboard', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/dashboard/villages/', {}, {
        get: { isArray: true },
        getAdministrationAreas: {
            url: config.API_BASEPATH + '/administrationArea/',
            method: 'GET',
            isArray: true
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
