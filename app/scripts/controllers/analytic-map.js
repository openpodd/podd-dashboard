/* global L, swal, angular, config */
/*jshint globalstrict: true*/
"use strict";

angular.module('poddDashboardApp')
.controller('AnalyticMapCtrl', [
    '$scope', 'Menu', 'Map',
    function ($scope, Menu, Map) {

    Menu.setActiveMenu('map');

    L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
    var leafletMap = config.MAPBOX_MAP_ID ?
        L.mapbox.map('analytic-map', config.MAPBOX_MAP_ID) :
        L.map('analytic-map');

    var center = [13.791177699, 100.58814079],
        zoomLevel = 15,
        map = new Map( leafletMap.setView(center, zoomLevel) );
    }
]);
