/* global L */
'use strict';

angular.module('poddDashboardApp')

.controller('ScenarioModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');
})

.controller('ScenarioCtrl', function ($scope, Menu, Map, Reports) {
  Menu.setActiveMenu('scenario');

  L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;

  var leafletMap = config.MAPBOX_MAP_ID ?
                      L.mapbox.map('map', config.MAPBOX_MAP_ID) :
                      L.map('map');

  // TODO: set default center to CNX
  var center = [13.791177699, 100.58814079],
      zoomLevel = 15,
      map = new Map( leafletMap.setView(center, zoomLevel) );

  var query = {
    // TODO: set default bounds
    bottom: 98.1298828125,
    left: 17.764381077782076,
    top: 99.810791015625,
    right: 19.647760955697354,
    negative: true,
    'page_size': 1000,
    lite: true
  };

  var reportsLayer = new L.featureGroup().addTo(map.leaflet);

  Reports.list(query).$promise.then(function (resp) {
    resp.results.forEach(function (item) {
      var location = [
        item.reportLocation.coordinates[1],
        item.reportLocation.coordinates[0]
      ];
      L.marker(location).addTo(reportsLayer);
    });

    // fit bound.
    var bounds = reportsLayer.getBounds();
    map.leaflet.fitBounds(bounds);
  });
});
