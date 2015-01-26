'use strict';

angular.module('poddDashboardApp')

.factory('VisualizationData', function ($resource) {
    return $resource(config.API_BASEPATH + '/summary/areas/show-detail/');
});
