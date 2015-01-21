/*global L, config */
'use strict';

angular.module('poddDashboardApp')

.factory('Map', function () {

    var tileLayerURL = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';

    L.Map.prototype.panToOffset = function (latlng, offset, options) {
        var x = this.latLngToContainerPoint(latlng).x - offset[0];
        var y = this.latLngToContainerPoint(latlng).y - offset[1];
        var point = this.containerPointToLatLng([x, y]);
        return this.setView(point, this._zoom, { pan: options });
    };

    /**
     * Calculate padding by pixel. Require re-calculate each zoom level because
     * pixel calculation depends on map projection.
     */
    L.Map.prototype.padBoundsByPixel = function (bounds, pixel) {
        var sw = bounds._southWest,
            ne = bounds._northEast,
            neTop = this.latLngToContainerPoint(ne).y - pixel,
            neRight = this.latLngToContainerPoint(ne).x + pixel,
            swBottom = this.latLngToContainerPoint(sw).y + pixel,
            swLeft = this.latLngToContainerPoint(sw).x - pixel;

        var newSW = this.containerPointToLatLng([swLeft, swBottom]),
            newNE = this.containerPointToLatLng([neRight, neTop]);

        return new L.LatLngBounds(newSW, newNE);
    };

    function Map(leaflet) {
        this.leaflet = leaflet;
        this.container = $( this.leaflet.getContainer() );

        if (!config.MAPBOX_MAP_ID) {
            this.tileLayer = L.tileLayer(tileLayerURL).addTo(this.leaflet);
        }

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

        this.iconRadarHidden = L.divIcon({
            className: 'radar-wink-wrapper radar-hide',
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

            $(village.marker._icon).tooltip({
                title: item.address || item.name
            });

            village.marker.on('click', function () {
                self.container.trigger('clicked:village', item);
            });

            // Initiate radar marker, so every village will already has a radar
            // marker. We will use this instead of create and destroy <div>.
            if ( !village.radarMarker ) {
                village.radarMarker = self.createVillageRadarMarker(village);
            }
        });

        // Prevent error when villages is empty array.
        if (items.length && !dontFitBound) {
            bounds = self.villageMarkerLayer.getBounds();
            self.leaflet.fitBounds(bounds);
            // then zoom out include padding of the web page.
            bounds = self.leaflet.padBoundsByPixel(bounds, 60);
            self.leaflet.fitBounds(bounds);
        }
    };

    Map.prototype.clearVillages = function clearVillages() {
        this.villageMarkerLayer.clearLayers();
        this.unwinkAll();
    };

    Map.prototype.addReport = function addReport(report, toWink) {
        var self = this,
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
                self.villageWink(village);
            }
        }
    };

    Map.prototype.createVillageRadarMarker = function createVillageRadarMarker(village) {
        var location = [
            village.location.coordinates[1],
            village.location.coordinates[0]
        ];

        return this.wink(location, true);
    };

    Map.prototype.wink = function wink(location, hide) {
        var self = this,
            icon = hide ? self.iconRadarHidden : self.iconRadar;

        var radarMarker = L.marker(location, {
            icon: icon,
            zIndexOffset: -10
        })
        .addTo(self.radarMarkerLayer);

        return radarMarker;
    };

    Map.prototype.unwink = function unwink(radarMarker) {
        this.radarMarkerLayer.removeLayer(radarMarker);
    };

    Map.prototype.unwinkAll = function unwinkAll() {
        this.radarMarkerLayer.clearLayers();
    };

    Map.prototype.villageWink = function villageWink(village) {
        // Automatically create radarMarker on-the-fly.
        if ( !village.radarMarker ) {
            village.radarMarker = this.createVillageRadarMarker(village);
        }

        $(village.radarMarker._icon).removeClass('radar-hide');
    };

    Map.prototype.villageUnwink = function villageWink(village) {
        if (village.radarMarker) {
            $(village.radarMarker._icon).addClass('radar-hide');
        }
    };

    Map.prototype.onClickVillage = function onClickVillage(cb) {
        this.container.on('clicked:village', cb);
    };

    return Map;
});
