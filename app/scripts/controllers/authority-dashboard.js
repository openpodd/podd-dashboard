/*global swal, moment */

'use strict';

angular.module('poddDashboardApp')

.controller('AuthorityDashboardModeCtrl', function (Menu) {

})

.controller('AuthorityDashboardCtrl', function ($scope, Menu, AdministrationArea,
      $state, $stateParams, $window, shared, SummaryAuthorityDashboard) {

    var params = {
      authority: $stateParams.authorityId,
      dateStart: $stateParams.dateStart,
      dateEnd: $stateParams.dateEnd
    }
    
    $scope.startDate = moment($stateParams.dateStart, 'DD/MM/YYYY');
    $scope.endDate = moment($stateParams.dateEnd, 'DD/MM/YYYY');

    $scope.startDateText = $scope.startDate.format('DD MMM YYYY');
    $scope.endDateText = $scope.endDate.format('DD MMM YYYY');

    $scope.authority = {};
    SummaryAuthorityDashboard.get(params).$promise.then(function (data) {
      $scope.authority = data;
    });

    var options = {
      center: [ 18.781516724349704, 98.98681640625 ],
      zoomLevel: 8,
      zoomControl: false,
    };
    
    L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
    var leafletMap = config.MAPBOX_MAP_ID ?
                    L.mapbox.map('map', config.MAPBOX_MAP_ID, options) :
                    L.map('map', options);
});
