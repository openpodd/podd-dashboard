'use strict';

angular.module('poddDashboardApp')

.factory('dashboard', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/dashboard/villages/', {}, {
        get: { isArray: true }
    });

    return resource;
})

.factory('streaming', function () {
    return io.connect('localhost:8888')
        .on('connect', function () {
            console.log('connected');
        });
});
