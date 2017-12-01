/* global L, swal, angular, config, Promise */
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

            var center = [18.7719015, 98.8864371],
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

            // functions

            function processLayer(layer) {
                var dataLayer = AnalyticMapDataLayer(layer);

                return dataLayer.$data().then(function (data) {
                    if ($scope.mapLayers[layer.code]) {
                        // remove first
                        var map = $scope.mapLayers[layer.code];
                        $scope.layerGroups.removeLayer(map);
                    }

                    var mapRenderer = AnalyticMapRenderer(layer.type, layer);
                    $scope.mapRenderers[layer.code] = mapRenderer;

                    return mapRenderer.$render(data).then(function (map) {
                        map.addTo($scope.layerGroups);
                        $scope.mapLayers[layer.code] = map;
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
                        fitBounds();
                    })
                    .catch(function () {
                        fitBounds();
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
                    $scope.layerGroups.removeLayer(map);
                }

                var layers = [];
                angular.forEach($scope.preset.layers, function (p) {
                    if (p.code !== layer.code) {
                        layers.push(p);
                    }
                });

                $scope.preset.layers = layers;
            }
        }
    ]);
