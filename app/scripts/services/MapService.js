/*global L:true */
'use strict';

angular.module('poddDashboardApp')

.factory('Map', function ($rootScope) {

    var map,
        center = [13.791177699, 100.58814079],
        zoomLevel = 15,
        tileLayerURL = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';

    function Map(leaflet) {
        this.leaflet = leaflet;
        this.container = $( this.leaflet.getContainer() );

        this.tileLayer = L.tileLayer(tileLayerURL).addTo(this.leaflet);

        // Group marker for better management.
        this.radarMarkerLayer = new L.featureGroup().addTo(this.leaflet);
        this.villageMarkerLayer = new L.featureGroup().addTo(this.leaflet);

        this.villages = {};

        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
        this.iconRed = L.AwesomeMarkers.icon({
            icon: 'home',
            markerColor: 'red'
        });
        this.iconBlue = L.AwesomeMarkers.icon({
            icon: 'home',
            markerColor: 'blue'
        });

        // Make radar, wink wink!
        this.iconRadar = L.divIcon({
            className: 'radar-wink-wrapper',
            iconSize: [ 160, 160 ],
            iconAnchor: [ 80, 80 ],
            html: '<div class="radar-wink"></div>'
        });
    };

    Map.prototype.getIconByStatus = function getIconByStatus(village) {
        if (village.negative > village.positive) {
            return this.iconRed;
        }
        else {
            return this.iconBlue;
        }
    };

    Map.prototype.setVillages = function setMarkers(items) {
        var self = this;

        items = items.length ? items : [ items ];

        items.forEach(function (item) {
            var village = self.villages[item.id],
                location = [
                  item.location.coordinates[1],
                  item.location.coordinates[0]
                ];

            if (village) {
                self.villageMarkerLayer.removeLayer(village);
            }

            village = self.villages[item.id] = L.marker(location, {
                icon: self.getIconByStatus(item)
            }).addTo(self.villageMarkerLayer);

            village.on('click', function (eventObject) {
                self.container.trigger('clicked:village', item);
            });
        });

        self.leaflet.fitBounds(self.villageMarkerLayer.getBounds());
    };

    Map.prototype.wink = function wink(location, timeout) {
        var self = this;

        self.radarMarkerLayer.clearLayers();

        var radarMarker = L.marker(location, {
            icon: self.iconRadar,
            zIndexOffset: -10
        })
        .addTo(self.radarMarkerLayer);

        setTimeout(function () {
            self.radarMarkerLayer.removeLayer(radarMarker);
        }, timeout);
    };

    Map.prototype.onClickVillage = function onClickVillage(cb) {
        this.container.on('clicked:village', cb);
    };


    // Setup map.
    map = function () {
        return new Map( L.map('map').setView(center, zoomLevel) );
    };

    return map;
});
