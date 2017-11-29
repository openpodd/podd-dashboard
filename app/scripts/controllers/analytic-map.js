/* global L, swal, angular, config */
/*jshint globalstrict: true*/
"use strict";

angular.module('poddDashboardApp')
    .controller('AnalyticMapCtrl', [
        '$scope', 'Menu', 'Map', 'AnalyticMap', 'AnalyticMapDataLayer', 'AnalyticMapRenderer',
        function ($scope, Menu, Map, AnalyticMap, AnalyticMapDataLayer, AnalyticMapRenderer) {

            Menu.setActiveMenu('map');

            L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
            var leafletMap = config.MAPBOX_MAP_ID ?
                L.mapbox.map('analytic-map', config.MAPBOX_MAP_ID) :
                L.map('analytic-map');

            var center = [13.791177699, 100.58814079],
                zoomLevel = 15,
                map = new Map(leafletMap.setView(center, zoomLevel));

            $scope.map = map;
            $scope.selectedPresetCode = '';
            $scope.presets = AnalyticMap.list();
            $scope.layerGroups = new L.featureGroup().addTo(map.leaflet);

            // functions

            $scope.fetchPreset = function () {
                var preset = AnalyticMap.get({ code: $scope.selectedPresetCode });
                var promises = [];

                angular.forEach(preset.layers, function (value) {
                    var dataLayer = AnalyticMapDataLayer(value);

                    var promise = dataLayer.$data().then(function (data) {
                        var mapLayer = AnalyticMapRenderer(value.type, value);

                        return mapLayer.$render(data).then(function (layer) {
                            layer.addTo($scope.layerGroups);
                        });
                    });

                    promises.push(promise);
                });

                Promise.all(promises).then(function () {
                    var bounds = $scope.map.leaflet.padBoundsByPixel($scope.layerGroups.getBounds(), 80);
                    $scope.map.leaflet.fitBounds(bounds);
                });
            };
        }
    ]);
