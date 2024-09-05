/*global L, config */
'use strict';

angular.module('poddDashboardApp')

.factory('AnimalMap', function () {
    function Map(leaflet) {
        this.leaflet = leaflet;
        this.container = $( this.leaflet.getContainer() );

        this.animalMarkerLayer = new L.FeatureGroup().addTo(this.leaflet);
        this.iconBlue = L.AwesomeMarkers.icon({
            icon: 'star',
            markerColor: 'blue'
        });

        this.iconRed = L.AwesomeMarkers.icon({
            icon: 'star',
            markerColor: 'red'
        });
    }
    Map.prototype.clearAnimalMarkers = function () {
        this.animalMarkerLayer.clearLayers();
    }

    Map.prototype.addAnimalMarker = function (animal) {

        var title = "ประเภทสัตว์: " + animal.animal_type;
        var isDeath = animal.death_updated_date ? "เสียชีวิต" : "ยังมีชีวิต";
        var description = "วัคซีน: " + animal.vaccine + "<br>" +
            "การทำหมัน: " + animal.spay + "<br>" +
            "สร้างรายการ: " + animal.created_at + "<br>" +
            "แก้ไขล่าสุด: " + animal.updated_at + "<br>" +
            "สถานะ: " + isDeath;


        var marker = L.marker([animal.latitude, animal.longitude], {
            icon: (isDeath === "เสียชีวิต" ? this.iconRed : this.iconBlue)
        });

        

        var popupContent = '<div class="animal-popup">' +
            '<div class="animal-popup-title">' + title + '</div>' +
            '<div class="animal-popup-description">' + description + '</div>' +
            '</div>';

        marker.bindPopup(popupContent);

        this.animalMarkerLayer.addLayer(marker);
    };

    return Map;
});