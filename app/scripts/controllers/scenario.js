/* global L */
'use strict';

angular.module('poddDashboardApp')

.controller('ScenarioModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');
})

.controller('ScenarioCtrl', function ($scope, Menu, Map, Reports, $compile) {
  Menu.setActiveMenu('scenario');

  L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;


  var options = {
    zoomControl: false
  };
  var leafletMap = config.MAPBOX_MAP_ID ?
                      L.mapbox.map('map', config.MAPBOX_MAP_ID, options) :
                      L.map('map', options);

  // TODO: set default center to CNX
  var center = [13.791177699, 100.58814079],
      zoomLevel = 15,
      map = new Map( leafletMap.setView(center, zoomLevel) );

  // Zoom control.
  leafletMap.addControl(new L.control.zoom({
    position: 'topleft'
  }));
  // Custom map control.
  var LayersControl = L.Control.extend({
    options: {
      position: 'topright',
    },
    onAdd: function () {
      var $container = $('.layers-control');
      $compile($container)($scope);
      return $container[0];
    }
  });
  // TODO: this can cause:
  // `TypeError: Cannot read property 'childNodes' of undefined`
  leafletMap.addControl(new LayersControl());

  var query = {
    // TODO: set default bounds
    bottom: 98.1298828125,
    left: 17.764381077782076,
    top: 99.810791015625,
    right: 19.647760955697354,
    negative: true,
    'page_size': 10,
    lite: true
  };

  var reportsLayer = new L.featureGroup().addTo(leafletMap),
      gisLayer = new L.WFS({
        url: config.GIS_BASEPATH,
        typeNS: 'poddgis_vet',
        typeName: 'water_body_cm',
        // typeName: 'Road',
        geometryField: 'geom',
        crs: L.CRS.EPSG4326
      }).addTo(leafletMap);

  var layers = {
    form: {
      report: true,
      gis: true
    },
    layers: {
      report: reportsLayer,
      gisLayer: gisLayer
    }
  };
  $scope.layers = layers;

  $scope.toggleReportsLayer = function (forceValue) {
    var nextValue = angular.isUndefined(forceValue) ?
                      !layers.form.report :
                      forceValue;

    if (nextValue) {
      reportsLayer.addTo(leafletMap);
    }
    else {
      leafletMap.removeLayer(reportsLayer);
    }
  };

  $scope.toggleGISLayer = function (forceValue) {
    var nextValue = angular.isUndefined(forceValue) ?
                      !layers.form.gis :
                      forceValue;

    if (nextValue) {
      gisLayer.addTo(leafletMap);
    }
    else {
      leafletMap.removeLayer(gisLayer);
    }
  };

  function refreshReportsLayerData() {
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
      leafletMap.fitBounds(bounds);
    });
  }
  refreshReportsLayerData();

});
