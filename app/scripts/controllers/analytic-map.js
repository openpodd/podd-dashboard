/* global L, swal, angular, config, Promise */
/*jshint globalstrict: true*/
"use strict";

angular.module('poddDashboardApp')
    .controller('AnalyticMapCtrl', [
        '$scope', 'Menu', 'Map', 'AnalyticMap', 'AnalyticMapDataLayer', 'AnalyticMapRenderer', 'storage',
        function ($scope, Menu, Map, AnalyticMap, AnalyticMapDataLayer, AnalyticMapRenderer, storage) {

            Menu.setActiveMenu('map');

            var user = storage.get('user');
            $scope.latitude = user.domainLatitude || 15.87;
            $scope.longitude = user.domainLongitude || 100.9925;

            var leafletMap = null;
            if (config.USE_GOOGLE_LAYER) {
                leafletMap = L.map('analytic-map');
                var ggl = new L.Google('ROADMAP'); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
                leafletMap.addLayer(ggl);

                // layerControl.addLayer(gsat);
            } else {
                L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
                leafletMap = config.MAPBOX_MAP_ID ?
                    L.mapbox.map('analytic-map', config.MAPBOX_MAP_ID) :
                    L.map('analytic-map');

                var mapboxStyle = config.MAPBOX_STYLE;
                if (mapboxStyle) {
                    L.mapbox.styleLayer(mapboxStyle).addTo(leafletMap);
                }
            }


            var layerControl = L.control.layers({}, {}, {position: 'topleft'}).addTo(leafletMap);

            var center = [$scope.latitude, $scope.longitude],
                zoomLevel = 11,
                map = new Map(leafletMap.setView(center, zoomLevel));

            $scope.map = map;
            $scope.selectedPresetCode = '';
            AnalyticMap.list().$promise.then(function (resp) {
                $scope.presets = resp;
            });
            $scope.layerGroups = new L.featureGroup().addTo(map.leaflet);
            $scope.mapRenderers = {};
            $scope.mapLayers = {};

            if (config.USE_GOOGLE_LAYER) {
                var hmap = new L.Google('HYBRID');
                var hb = AnalyticMapDataLayer(hmap);
                layerControl.addOverlay(hmap, 'ดาวเทียม');
            }

            // functions

            function processLayer(layer) {
                var dataLayer = AnalyticMapDataLayer(layer);

                return dataLayer.$data().then(function (data) {
                    if ($scope.mapLayers[layer.code]) {
                        // remove first
                        var map = $scope.mapLayers[layer.code];
                        $scope.layerGroups.removeLayer(map);
                        layerControl.removeLayer(map);
                    }

                    var mapRenderer = AnalyticMapRenderer(layer.type, layer);
                    $scope.mapRenderers[layer.code] = mapRenderer;

                    return mapRenderer.$render(data).then(function (map) {
                        map.addTo($scope.layerGroups);
                        $scope.mapLayers[layer.code] = map;
                        layerControl.addOverlay(map, dataLayer.meta.layerName());
                    });
                });
            }

            function fitBounds() {
                var bounds = $scope.map.leaflet.padBoundsByPixel($scope.layerGroups.getBounds(), 80);
                $scope.map.leaflet.fitBounds(bounds);
            }

            function hideSettings() {
                $scope.settingsVisible = false;
            }
            $scope.hideSettings = hideSettings();

            $scope.fetchPreset = function () {
                var preset = AnalyticMap.get({ code: $scope.selectedPresetCode });
                var promises = [];

                $scope.preset = preset;

                angular.forEach(preset.layers, function (value) {
                    var promise = processLayer(value);
                    promises.push(promise);
                });

                Promise.all(promises)
                    .then(function () {
                        // fitBounds();
                    });
            };

            $scope.onSaveLayer = function (layer) {
                hideSettings();
                processLayer(layer);
            };

            $scope.onRemoveLayer = function (layer) {
                hideSettings();

                if ($scope.mapLayers[layer.code]) {
                    var map = $scope.mapLayers[layer.code];
                    layerControl.removeLayer(map);
                    $scope.layerGroups.removeLayer(map);
                }

                var layers = [];
                angular.forEach($scope.preset.layers, function (p) {
                    if (p.code !== layer.code) {
                        layers.push(p);
                    }
                });

                $scope.preset.layers = layers;
            };
        }
    ]);
