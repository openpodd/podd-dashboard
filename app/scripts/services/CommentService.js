'use strict';

angular.module('poddDashboardApp')

.factory('Comments', function ($resource) {
  return $resource('/api/reportComments/:reportId', {}, {
    list: {
      method: 'GET',
      isArray: true,
      url: '/api/reportComments/73343.json'
    }
  });
});
