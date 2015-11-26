/* global L, d3 */
'use strict';

angular.module('poddDashboardApp')

.controller('ScenarioModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');
})

.controller('ScenarioCtrl', function ($scope, Menu, Reports, $compile, $interval, $stateParams, $anchorScroll, $location) {
  Menu.setActiveMenu('scenario');

  L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;


  var options = {
    center: [13.791177699, 100.58814079],
    zoomLevel: 15,
    zoomControl: false
  };
  var leafletMap = config.MAPBOX_MAP_ID ?
                      L.mapbox.map('map', config.MAPBOX_MAP_ID, options) :
                      L.map('map', options);

  // Zoom control.
  leafletMap.addControl(new L.control.zoom({
    position: 'topleft'
  }));
  leafletMap.scrollWheelZoom.disable();

  var defaultIconOptions = {
    className: 'scene-marker-wrapper',
    iconSize: [ 48, 48 ],
    iconAnchor: [ 24, 24 ]
  };
  var getIconType = function (iconType) {
    return angular.extend({}, defaultIconOptions, {
      html: '<div class="scene-marker">' +
              '<div class="marker-icon marker-icon-' + iconType + '-wrapper">' +
                '<div class="marker-icon-animal marker-icon-' + iconType + '"></div>' +
              '</div>' +
            '</div>'
    });
  };
  var icons = {
    pig: L.divIcon(getIconType('pig')),
    dog: L.divIcon(getIconType('dog')),
    buffalo: L.divIcon(getIconType('buffalo')),
    cow: L.divIcon(getIconType('cow')),
    chicken: L.divIcon(getIconType('chicken')),
    sheep: L.divIcon(getIconType('sheep'))
  };

  var getGISLayer = function (typeName, iconName) {
    return new L.WFS({
      url: config.GIS_BASEPATH,
      typeNS: 'poddgis_vet',
      typeName: typeName,
      geometryField: 'geom',
      crs: L.CRS.EPSG4326
    }, new L.Format.GeoJSON({
      crs: L.CRS.EPSG4326,
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: icons[iconName] });
      }
    }));
  };

  $scope.layers = {
    report: {
      name: 'Reports',
      layer: new L.featureGroup().addTo(leafletMap),
      show: true
    },
    gis: {
      pig: {
        name: 'Pig Farm',
        layer: getGISLayer('pig_farm', 'pig').addTo(leafletMap),
        show: true
      },
      cow: {
        name: 'Cow & Buffalo Farm',
        layer: getGISLayer('cowsandbuffalos_farm', 'cow').addTo(leafletMap),
        show: true
      },
      dog: {
        name: 'Dog Farm',
        layer: getGISLayer('dog_farm', 'dog').addTo(leafletMap),
        show: true
      },
      chicken: {
        name: 'Chicken Farm',
        layer: getGISLayer('poultry_farm', 'chicken').addTo(leafletMap),
        show: true
      }
    }
  };

  var bounds = $scope.layers.report.layer.getBounds();

  leafletMap.on('moveend', function() {
    $scope.pause();
    
    bounds = leafletMap.getBounds();
    query.top = bounds.getWest();
    query.right = bounds.getNorth();
    query.left = bounds.getSouth();
    query.bottom = bounds.getEast();

    $scope.layers.report.layer.clearLayers();
    refreshReportsLayerDataWithSummary();
     // console.log(bounds);
  });

  // TODO: this can cause:
  // `TypeError: Cannot read property 'childNodes' of undefined`
  // leafletMap.addControl(new LayersControl());


  $scope.toggleLayer = function (layerDef, forceValue) {
    var nextValue = angular.isUndefined(forceValue) ?
                      !layerDef.show :
                      forceValue;

    if (nextValue) {
      layerDef.layer.addTo(leafletMap);
    }
    else {
      leafletMap.removeLayer(layerDef.layer);
    }
  };

// TODO: this move to function:
// Graph Control
var parseDate = d3.time.format('%m/%Y').parse;
var parseDayDate = d3.time.format('%Y-%m-%d').parse;
var formatMonthDate = d3.time.format('%b %Y');
var formatDayDate = d3.time.format('%Y-%m-%d');
var now = parseDayDate(formatDayDate(new Date()));

var margin = {top: 10, right: 50, bottom: 20, left: 20},
    defaultExtent = [parseDate('11/2015'), new Date()],
    width = 800 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

$scope.window = [ formatDayDate(defaultExtent[0]), formatDayDate(defaultExtent[1]) ];


  var query = {
    // TODO: set default bounds
    'bottom': $stateParams.bottom || 198.1298828125,
    'left': $stateParams.left || 17.764381077782076,
    'top': $stateParams.top || 99.810791015625,
    'right': $stateParams.right || 19.647760955697354,
    'date__lte': $scope.window[1],
    'date__gte': $scope.window[0],
    'negative': true,
    'page_size': 1000,
    'lite': true
  };


var x = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(formatMonthDate).ticks(12),
    yAxis = d3.svg.axis().scale(y).orient('left');

var brushTransition;

$scope.reportMarkers = [];

var brush = d3.svg.brush()
    .x(x)
    .extent(defaultExtent)
    .on('brushstart', function () {})
    .on('brush', function () {})
    .on('brushend', function () {
        brushTransition = d3.select(this);

        if (!brush.empty()) {
          $scope.diff = Math.floor((brush.extent()[1] - brush.extent()[0]) / (1000*60*60*24));

          /*jshint -W064 */
          $scope.window = [ formatDayDate(brush.extent()[0]), formatDayDate(brush.extent()[1]) ];
          if (!$scope.playing) {
            $scope.layers.report.layer.clearLayers();
            $scope.reportMarkers = [];

          }

          query.date__lte = formatDayDate(brush.extent()[1]);
          query.date__gte = formatDayDate(brush.extent()[0]);
          /*jshint: +W064 */

          refreshReportsLayerData(false);
        }

        d3.select(this).call(brush.extent(brush.extent()));
      }
    );

var area = d3.svg.area()
    .interpolate('monotone')
    .x(function(d) {
      return x(d.date);
    })
    .y0(height)
    .y1(function(d) {
      return y(d.count);
    });

var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.count); });

var svg = d3.select('#chart')
    .on('click', function(){
       $scope.pause();
    })
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);


svg.append('defs').append('clipPath')
    .attr('id', 'clip')
  .append('rect')
    .attr('width', width)
    .attr('height', height);

var context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var read = function(tempData) {

  var data = [];

  tempData.forEach(function(d) {
    data.push({
      'date': parseDayDate(d.date),
      'count': d.count
    });
  });

  x.domain(d3.extent(data.map(function(d) { return d.date; })));
  y.domain([0, d3.max(data.map(function(d) { return d.count; }))]);

  // context.append('path')
  //     .datum(data)
  //     .attr('class', 'area')
  //     .attr('d', area);

  context.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);

  context.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

  // context.append('text')
  //   .attr('class', 'x label')
  //   .attr('text-anchor', 'end')
  //   .attr('x', width - 5)
  //   .attr('y', height - 6)
  //   .text('number of negative reports per month (times)');

  context.append('g')
      .attr('class', 'x brush')
      .call(brush)
      .call(brush.event)
    .selectAll('rect')
      .attr('y', -6)
      .attr('height', height + 7);
};

function playDemo() {

  if (brush.empty() || $scope.playing === false || $scope.diff < 0) {
    $scope.pause();
    return;
  }
  var stopPlaying = false;

  var dateStart = brush.extent()[0];
  dateStart.setDate(dateStart.getDate() + $scope.diff);

  if (dateStart.getTime() >= now) {
    dateStart = now;
    dateStart.setDate(dateStart.getDate() - $scope.diff);
  } 

  var dateEnd = brush.extent()[1];

  if (dateEnd.getTime() === now) {
    $scope.pause();
    return;
  }

  dateEnd.setDate(dateEnd.getDate() + $scope.diff);
  if (dateEnd.getTime() > now) {
    dateEnd = now;
    stopPlaying = true;
  } 

  var diff = Math.floor((dateEnd - dateStart) / (1000*60*60*24));
  if ($scope.diff > diff) {
    dateEnd = new Date();
    stopPlaying = true;
  }

  var targetExtent = [dateStart, dateEnd];

  brushTransition.transition()
      .duration(brush.empty() ? 0 : speed)
      .call(brush.extent(targetExtent))
      .call(brush.event);

  if (stopPlaying) {
    $scope.pause();
  }
}

var demoInterval = null;
var speed = 500;
$scope.playing = false;

$scope.play = function () {
  $scope.playing = true;
  speed = $scope.diff * 500 / 10;

  setTimeout(function() {
    playDemo();
    demoInterval = $interval(playDemo, speed);
  }, 1);
};

$scope.speedDown = function () {
  if (speed < 1000) {
    speed += 10;
  }
};

$scope.speedUp = function () {
  if (speed > 0) {
    speed -= 10;
  }
};

$scope.pause = function () {
  $scope.playing = false;

  $interval.cancel(demoInterval);
  demoInterval = null;
};

$scope.diff = 0;
$scope.replay = function () {
  $scope.playing = false;

  $scope.diff = Math.abs(Math.floor((brush.extent()[1] - brush.extent()[0]) / (1000*60*60*24)));

  var dateStart = parseDate('01/2015');

  var dateEnd = parseDate('01/2015');
  dateEnd.setDate(dateEnd.getDate() + $scope.diff);

  var targetExtent = [dateStart, dateEnd];

  brushTransition.transition()
      .duration(brush.empty() ? 0 : 0)
      .call(brush.extent(targetExtent))
      .call(brush.event);

  $interval.cancel(demoInterval);
  demoInterval = null;

};

// End Graph Control

  var colors = [ '#ff0000',
    '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000',
    '#000000', '#000000', '#ffff00', '#00ff00', '#ffff00',
    '#ffff00', '#00ff00', '#000000', '#00ff00', '#000000'];

  $scope.toggleReportsLayer = function (forceValue) {
      var nextValue = angular.isUndefined(forceValue) ?
          !layers.form.report :
          forceValue;
  }

  var lastLayer = null;

  function refreshReportsLayerData(refreshGraph) {

    if (refreshGraph) {
      query.date__gte = formatDayDate(parseDate('01/2015'));
      query.date__lte = formatDayDate(new Date());
      query.withSummary = true;
    } else {
      delete query.withSummary;
    }

    $scope.loadingReportMarkers = true;
    Reports.list(query).$promise.then(function (resp) {

      var drawnItems = new L.FeatureGroup();
      $scope.layers.report.layer.addLayer(drawnItems);

      // var clusterGroup = new L.MarkerClusterGroup().addTo(drawnItems);

      resp.results.forEach(function (item) {
        var location = [
          item.reportLocation.coordinates[1],
          item.reportLocation.coordinates[0]
        ];
        var marker = L.marker(location, {
          icon: L.mapbox.marker.icon({
              'marker-color': colors[item.reportTypeId],
          })
        });

        marker.item = item;
        marker.bindPopup(item.formDataExplanation);

        marker.on('mouseover', function () {
          var self = this;
          $scope.$apply(function () {
            self.isActive = true;
            self.openPopup();
          });
        });

        marker.on('mouseout', function () {
          var self = this;
          $scope.$apply(function () {
            self.isActive = false;
            self.closePopup();
          });
        });

        marker.on('click', function () {
          console.log('click');
          var self = this;

          var newHash = 'report-item-' + self.item.id.split('.')[2];

          $scope.$apply(function () {

            if ($location.hash() !== newHash) {
              $location.hash(newHash);
            }
            else {
              $anchorScroll();
            }
          });

        });


        // console.log(items.indexOf(item.id) != -1);

        // if (items.indexOf(item.id) != -1) {
        //   return;
        // }


        marker.addTo(drawnItems);

        if (!$scope.playing) {
          $scope.reportMarkers.push(marker);
        }
      });

      if (!$scope.playing) {
          $scope.loadingReportMarkers = false;
      }


      if( $scope.playing && lastLayer !== null) {
        $scope.layers.report.layer.removeLayer(lastLayer);
      }

      lastLayer = drawnItems;

      // fit bound.
      leafletMap.fitBounds(bounds);

      if (refreshGraph) {
        svg.remove();
        svg = d3.select('#chart').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        svg.append('defs').append('clipPath')
            .attr('id', 'clip')
          .append('rect')
            .attr('width', width)
            .attr('height', height);

        context = svg.append('g')
            .attr('class', 'context')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // console.log(resp.summary);
        if (resp.summary) {
         read(resp.summary);
        }
      }

    });
  }

  function refreshReportsLayerDataWithSummary() {
    console.log('refresh graph');
    refreshReportsLayerData(true);
  }

  // refreshReportsLayerDataWithSummary();

});
