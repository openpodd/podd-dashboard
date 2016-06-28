'use strict';

angular.module('poddDashboardApp')

.factory('CaseDefinition', function ($resource) {
  return $resource(config.API_BASEPATH + '/caseDefinitions/', {}, {
    'explained': {
      url: config.API_BASEPATH + '/caseDefinitions/explained',
      isArray: true,
      cache: false
    }
  });
})

;
