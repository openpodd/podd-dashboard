/* global L, d3 */
'use strict';

angular.module('poddDashboardApp')

.controller('ScenarioModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');
})

.controller('ScenarioCtrl', function ($scope, Menu, Reports, $compile, $interval) {
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

  var reportsLayer = new L.featureGroup().addTo(leafletMap),
      gisLayer = new L.WFS({
        url: config.GIS_BASEPATH,
        typeNS: 'poddgis_vet',
        typeName: 'water_body_cm',
        // typeName: 'Road',
        geometryField: 'geom',
        crs: L.CRS.EPSG4326
      }).addTo(leafletMap);

  var layers = {
    form: {
      report: true,
      gis: true
    },
    layers: {
      report: reportsLayer,
      gisLayer: gisLayer
    }
  };
  $scope.layers = layers;

// TODO: this move to function:
// Graph Control
var parseDate = d3.time.format('%m/%Y').parse;
var FormatMonthDate = d3.time.format('%b %Y');
var FormatDayDate = d3.time.format('%Y-%m-%d');

var margin = {top: 10, right: 50, bottom: 20, left: 20},
    defaultExtent = [parseDate('01/2015'), parseDate('12/2015')],
    width = 800 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

$scope.window = [ FormatDayDate(defaultExtent[0]), FormatDayDate(defaultExtent[1]) ];

var x = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(FormatMonthDate).ticks(12),
    yAxis = d3.svg.axis().scale(y).orient('left');

var brushTransition;

var brush = d3.svg.brush()
    .x(x)
    .on('brushend', function () {
        brushTransition = d3.select(this);

        if (!brush.empty()) {
          /*jshint -W064 */
          $scope.window = [ FormatDayDate(brush.extent()[0]), FormatDayDate(brush.extent()[1]) ];
          reportsLayer.clearLayers();

          query.date__lte = FormatDayDate(brush.extent()[1]);
          query.date__gte = FormatDayDate(brush.extent()[0]);
          /*jshint: +W064 */

          refreshReportsLayerData();
        }

      }
    );

var area = d3.svg.area()
    .interpolate('monotone')
    .x(function(d) {
      return x(d.date);
    })
    .y0(height)
    .y1(function(d) {
      return y(d.negative);
    });

var svg = d3.select('#chart').append('svg')
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

var read = function() {

  var tempData = [
    { 'date': '01/2015', 'negative': 1 },
    { 'date': '02/2015', 'negative': 5 },
    { 'date': '03/2015', 'negative': 5 },
    { 'date': '04/2015', 'negative': 3 },
    { 'date': '05/2015', 'negative': 1 },
    { 'date': '06/2015', 'negative': 10 },
    { 'date': '07/2015', 'negative': 0 },
    { 'date': '08/2015', 'negative': 3 },
    { 'date': '09/2015', 'negative': 1 },
    { 'date': '10/2015', 'negative': 4 },
    { 'date': '11/2015', 'negative': 5 },
    { 'date': '12/2015', 'negative': 6 },
  ];

  var data = [];

  tempData.forEach(function(d) {
    data.push({
      'date': parseDate(d.date),
      'negative': d.negative
    });
  });

  x.domain(d3.extent(data.map(function(d) { return d.date; })));
  y.domain([0, d3.max(data.map(function(d) { return d.negative; }))]);

  context.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('d', area);

  context.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

  context.append('text')
    .attr('class', 'x label')
    .attr('text-anchor', 'end')
    .attr('x', width - 5)
    .attr('y', height - 6)
    .text('number of negative reports per month (times)');

  context.append('g')
      .attr('class', 'x brush')
      .call(brush)
      .call(brush.event)
    .selectAll('rect')
      .attr('y', -6)
      .attr('height', height + 7);
};

read();

function playDemo() {

  if (brush.empty()) {
    return;
  }

  var dateStart = brush.extent()[0];
  dateStart.setDate(dateStart.getDate() + 1);

  var dateEnd = brush.extent()[1];
  dateEnd.setDate(dateEnd.getDate() + 1);

  if (brush.extent()[1] > parseDate('12/2015')) {
    return;
  }

  var targetExtent = [dateStart, dateEnd];

  brushTransition.transition()
      .duration(brush.empty() ? 0 : speed)
      .call(brush.extent(targetExtent))
      .call(brush.event);

  return;
}

var demoInterval = null;
var speed = 1000;

$scope.play = function () {
  setTimeout(function() {
    playDemo();
    demoInterval = $interval(playDemo, speed);
  }, 100);
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
  $interval.cancel(demoInterval);
  demoInterval = null;
};

$scope.replay = function () {

  var diff = Math.floor((brush.extent()[1] - brush.extent()[0]) / (1000*60*60*24));

  var dateStart = parseDate('01/2015');

  var dateEnd = parseDate('01/2015');
  dateEnd.setDate(dateEnd.getDate() + diff);

  var targetExtent = [dateStart, dateEnd];

  brushTransition.transition()
      .duration(brush.empty() ? 0 : 0)
      .call(brush.extent(targetExtent))
      .call(brush.event);

  $interval.cancel(demoInterval);
  demoInterval = null;
};

// End Graph Control


  var query = {
    // TODO: set default bounds
    'bottom': 98.1298828125,
    'left': 17.764381077782076,
    'top': 99.810791015625,
    'right': 19.647760955697354,
    'date__lte': $scope.window[1],
    'date__gte': $scope.window[0],
    'negative': true,
    'page_size': 100,
    'lite': true
  };

  $scope.toggleReportsLayer = function (forceValue) {
    var nextValue = angular.isUndefined(forceValue) ?
                      !layers.form.report :
                      forceValue;

    if (nextValue) {
      reportsLayer.addTo(leafletMap);
    }
    else {
      leafletMap.removeLayer(reportsLayer);
    }
  };

  $scope.toggleGISLayer = function (forceValue) {
    var nextValue = angular.isUndefined(forceValue) ?
                      !layers.form.gis :
                      forceValue;

    if (nextValue) {
      gisLayer.addTo(leafletMap);
    }
    else {
      leafletMap.removeLayer(gisLayer);
    }
  };

  function refreshReportsLayerData() {
    Reports.list(query).$promise.then(function (resp) {
      resp.results.forEach(function (item) {
        var location = [
          item.reportLocation.coordinates[1],
          item.reportLocation.coordinates[0]
        ];
        L.marker(location).addTo(reportsLayer);
      });

      // fit bound.
      var bounds = reportsLayer.getBounds();
      leafletMap.fitBounds(bounds);
    });
  }
  refreshReportsLayerData();

});
