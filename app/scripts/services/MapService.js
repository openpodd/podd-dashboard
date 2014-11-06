/*global L:true */
'use strict';

angular.module('poddDashboardApp')

.factory('map', function () {

    var map, iconRed, iconBlue, iconRadar,
        radarMarkerLayer, villageMarkerLayer,
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

    // Group marker for better management.
    radarMarkerLayer = new L.layerGroup().addTo(map);
    villageMarkerLayer = new L.layerGroup().addTo(map);

    L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
    iconRed = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'red'
    });
    iconBlue = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'blue'
    });

    // Make radar, wink wink!
    iconRadar = L.divIcon({
        className: 'radar-wink-wrapper',
        iconSize: [ 160, 160 ],
        iconAnchor: [ 80, 80 ],
        html: '<div class="radar-wink"></div>'
    });

    map.customActions = {
        setVillages: function setMarkers(items) {
            items = items.length ? items : [ items ];

            items.forEach(function (item) {
                var village = villages[item.id],
                    location = [ item.location[1], item.location[0] ];

                if (village) {
                    villageMarkerLayer.removeLayer(village);
                }

                village = villages[item.id] = L.marker(location, {
                    icon: getIconByStatus(item)
                }).addTo(villageMarkerLayer);
            });
        },

        wink: function wink(location, timeout) {
            radarMarkerLayer.clearLayers();

            var radarMarker = L.marker(location, {
                icon: iconRadar,
                zIndexOffset: -10
            })
            .addTo(radarMarkerLayer);

            setTimeout(function () {
                radarMarkerLayer.removeLayer(radarMarker);
            }, timeout);
        }
    };

    return map;
});
