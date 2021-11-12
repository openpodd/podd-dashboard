/*global swal, moment */

'use strict';

angular.module('poddDashboardApp')

.controller('AuthorityDashboardModeCtrl', function (Menu) {

})

.controller('AuthorityDashboardCtrl', function ($scope, Menu, AdministrationArea,
      $state, $stateParams, $window, shared, SummaryAuthorityDashboard, storage) {

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

    var user = storage.get('user');
    $scope.latitude = user.domainLatitude || 18.781516724349704;
    $scope.longitude = user.domainLongitude || 98.98681640625;


    function addMarker(items, markerIcon) {
      var location = [
        item.reportLocation.coordinates[1],
        item.reportLocation.coordinates[0]
      ];

      var marker = L.marker(location, {
        icon: markerIcon
      });
      marker.addTo(leafletMap);
    }

    var options = {
      center: [ $scope.latitude, $scope.longitude ],
      zoomLevel: 8,
    };

    L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
    var leafletMap = config.MAPBOX_MAP_ID ?
                    L.mapbox.map('map', config.MAPBOX_MAP_ID, options) :
                    L.map('map', options);

    var drawnItems = new L.FeatureGroup();
    function addMarker(item, markerIcon) {
      var location = [
        item.location.coordinates[1] + (Math.floor(Math.random() * 10) + 1) / 100000,
        item.location.coordinates[0] + (Math.floor(Math.random() * 10) + 1) / 100000
      ];

      L.marker(location, {icon: markerIcon}).addTo(drawnItems);
    }

    $scope.showList = false;
    $scope.willShowList = false;
    $scope.stateName = '';
    $scope.areaName = '';

    $scope.showList = function (stateName, areaName, reports) {
      $scope.stateName = stateName;
      $scope.areaName = areaName;
      $scope.reports = reports;
      $scope.willshowList = true;
    }

    $scope.close = function() {
      $scope.stateName = '';
      $scope.areaName = '';
      $scope.reports = [];
      $scope.willshowList = false;
    }

    SummaryAuthorityDashboard.get(params).$promise.then(function (data) {
      $scope.authority = data;

      // case
      $scope.authority.cases.administrationAreas.forEach(function(marker) {
        var greenMarker = L.AwesomeMarkers.icon({
          icon: '',
          markerColor: 'red'
        });
        addMarker(marker, greenMarker);
      });

      // suspect-outbreak
      $scope.authority.suspectOutbreaks.administrationAreas.forEach(function(marker) {
        var yellowMarker = L.AwesomeMarkers.icon({
          icon: '',
          markerColor: 'red'
        });

        addMarker(marker, yellowMarker);
      });

      // outbreak
      $scope.authority.outbreaks.administrationAreas.forEach(function(marker) {
        var redMarker = L.AwesomeMarkers.icon({
          icon: '',
          markerColor: 'red'
        });

        addMarker(marker, redMarker);
      });

      drawnItems.addTo(leafletMap);
      leafletMap.fitBounds(drawnItems.getBounds())
    });

});
