/*global L:true */
'use strict';

angular.module('poddDashboardApp')

.factory('map', function () {

    var map, iconRed, iconBlue,
        villages = {},
        center = [13.791177699, 100.58814079],
        zoomLevel = 15,
        tileLayerURL = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';

    function getIconByStatus(village) {
        if (village.negative > village.positive) {
            return iconRed;
        }
        else {
            return iconBlue;
        }
    }

    // Setup map.
    map = L
        .map('map')
        .setView(center, zoomLevel);

    L.tileLayer(tileLayerURL).addTo(map);

    L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
    iconRed = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'red'
    });
    iconBlue = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'blue'
    });

    map.customActions = {
        setVillages: function setMarkers(items) {
            items = items.length ? items : [ items ];

            items.forEach(function (item) {
                var village = villages[item.id];

                if (village) {
                    map.removeLayer(village);
                }

                villages[item.id] = L.marker([item.location[1], item.location[0]], {
                    icon: getIconByStatus(item)
                }).addTo(map);
            });
        }
    };

    return map;
});
