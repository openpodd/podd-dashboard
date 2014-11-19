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
        this.iconGrey = L.AwesomeMarkers.icon({
            icon: 'home',
            markerColor: 'cadetblue'
        });

        // Make radar, wink wink!
        this.iconRadar = L.divIcon({
            className: 'radar-wink-wrapper',
            iconSize: [ 160, 160 ],
            iconAnchor: [ 80, 80 ],
            html: '<div class="radar-wink"></div>'
        });
    }

    Map.prototype.getIconByStatus = function getIconByStatus(village) {
        if (village.negative > 0) {
            return this.iconRed;
        }
        else if ( (village.positive + village.negative) > 0 ) {
            return this.iconBlue;
        }
        else {
            return this.iconGrey;
        }
    };

    Map.prototype.setVillages = function setVillages(items, dontFitBound) {
        var self = this, bounds;

        items = items.forEach ? items : [ items ];

        items.forEach(function (item) {
            var village = self.villages[item.id],
                location = [
                  item.location.coordinates[1],
                  item.location.coordinates[0]
                ];

            if (village) {
                self.villageMarkerLayer.removeLayer(village.marker);
            }

            village = self.villages[item.id] = item;

            village.marker = L.marker(location, {
                icon: self.getIconByStatus(item),
                riseOnHover: true,
            }).addTo(self.villageMarkerLayer);

            village.marker.on('click', function (eventObject) {
                self.container.trigger('clicked:village', item);
            });
        });

        // Prevent error when villages is empty array.
        if (items.length && !dontFitBound) {
            bounds = self.villageMarkerLayer.getBounds();
            bounds.pad(5);
            self.leaflet.fitBounds(bounds);
        }
    };

    Map.prototype.clearVillages = function clearVillages() {
        this.villageMarkerLayer.clearLayers();
    };

    Map.prototype.addReport = function addReport(report, toWink, winkTimeout, unwinkOnClick) {
        var self = this,
            location,
            village = self.villages[ report.administrationAreaId ];

        if (village) {
            if (report.negative) {
                village.negative += 1;
                village.negativeCases.push({
                    id: report.id,
                    createdBy: report.createdByName,
                    date: report.date,
                    incidentDate: report.incidentDate,
                    eventTypeName: report.reportTypeName
                });
            }
            else {
                village.positive += 1;
                village.positiveCases.push({
                    id: report.id,
                    createdBy: report.createdByName,
                    date: report.date,
                    incidentDate: report.incidentDate,
                    eventTypeName: report.reportTypeName
                });
            }

            self.setVillages([ village ]);

            if (toWink) {
                location = [
                    village.location.coordinates[1],
                    village.location.coordinates[0]
                ];

                // if already has `wink` marker, clear it first.
                if (village.radarMarker) {
                    self.unwink(village.radarMarker);
                }

                village.radarMarker = self.wink(location, winkTimeout || 0);

                if (unwinkOnClick) {
                    village.marker.on('click', function () {
                        self.unwink(village.radarMarker);
                    });
                }
            }
        }
    };

    Map.prototype.wink = function wink(location, timeout) {
        var self = this;

        var radarMarker = L.marker(location, {
            icon: self.iconRadar,
            zIndexOffset: -10
        })
        .addTo(self.radarMarkerLayer);

        if (timeout) {
            setTimeout(function () {
                self.radarMarkerLayer.removeLayer(radarMarker);
            }, timeout);
        }

        return radarMarker;
    };

    Map.prototype.unwink = function unwink(radarMarker) {
        this.radarMarkerLayer.removeLayer(radarMarker);
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
