/* global L, swal, angular, config, Promise */
/*jshint globalstrict: true*/
"use strict";

angular.module('poddDashboardApp')
.controller('AnimalMapCtrl', [
    '$scope', 'Menu', 'Map', 'storage', 'AnimalRecordService', "AnimalMap",
    function ($scope, Menu, Map, storage, AnimalRecordService, AnimalMap) {
        Menu.setActiveMenu('map'); // เมนูหลัก ไม่ใช่ dropdown submenu

        var user = storage.get('user');
        $scope.latitude = user.domainLatitude || 15.87;
        $scope.longitude = user.domainLongitude || 100.9925;

        var leafletMap = null;
        if (config.USE_GOOGLE_LAYER) {
            leafletMap = L.map('animal-map');
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
        var center = [$scope.latitude, $scope.longitude],
            zoomLevel = 11,
            map = new AnimalMap(leafletMap.setView(center, zoomLevel));

        $scope.map = map;

        AnimalRecordService.listOnMap().$promise.then(function (resp) {
            $scope.animals = resp;
            $scope.animals.forEach(function (animal) {
                map.addAnimalMarker(animal);
            });
        });
    }
]);