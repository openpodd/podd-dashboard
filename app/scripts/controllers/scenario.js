/* global L, d3 */
'use strict';

angular.module('poddDashboardApp')

.controller('ScenarioModeCtrl', function (shared, Menu) {
  shared.summaryScenarioMode = true;
  Menu.setActiveMenu('map');
})

.controller('ScenarioCtrl', function ($scope, Menu, Reports, $compile, $interval,
    $stateParams, $anchorScroll, $location, $state, $timeout, shared, $window) {
  Menu.setActiveMenu('map');

  $scope.query = $stateParams.q || '';
  $scope.toggleHelp = function () {
    $scope.help = !$scope.help;
  };
  $scope.closeHelp = function () {
    $scope.help = false;
  };
  $scope.search = function () {
    $scope.closeHelp();
    $scope.willShowResult = true;
    $scope.loading = true;

    // console.log('------->',query);
    $timeout(function () {
      // change just the URL query params.
      $state.go('scenario', {
        q: $scope.query
      }, { notify: false });

      // do the real query.
      $scope._query.q = $scope.query;
      refreshReportsLayerDataWithSummary();
    }, 0);
  };

  L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;

  var cfg = {
    // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    // if scaleRadius is false it will be the constant radius used in pixels
    'radius': 0.1,
    'maxOpacity': 0.8,
    // scales the radius based on map zoom
    'scaleRadius': true,
    // if set to false the heatmap uses the global maximum for colorization
    // if activated: uses the data maximum within the current map boundaries
    //   (there will always be a red spot with useLocalExtremas true)
    'useLocalExtrema': true,
    // which field name in your data represents the latitude - default "lat"
    latField: 'lat',
    // which field name in your data represents the longitude - default "lng"
    lngField: 'lng',
    // which field name in your data represents the data value - default "value"
    valueField: 'count'
  };
  var heatmapLayer = new HeatmapOverlay(cfg);

  var options = {
    center: [ 18.781516724349704, 98.98681640625 ],
    zoomLevel: 8,
    zoomControl: false,
  };
  var leafletMap = null;
  if (config.USE_GOOGLE_LAYER) {
    leafletMap = L.map('map');
    var ggl = new L.Google('ROADMAP'); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
    leafletMap.addLayer(ggl);
  } else {
    leafletMap = config.MAPBOX_MAP_ID ?
        L.mapbox.map('map', config.MAPBOX_MAP_ID, options) :
        L.map('map', options);
  }


  // Zoom control.
  leafletMap.addControl(new L.control.zoom({
    position: 'topleft'
  }));
  leafletMap.scrollWheelZoom.disable();

  var defaultIconOptions = {
    className: 'scene-marker-wrapper',
    iconSize: [ 48, 48 ],
    iconAnchor: [ 24, 24 ],
    popupAnchor: [ 0, -12 ]
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
  var getReportCategoryIcon = function (category) {
    return {
      className: 'scene-report-marker-wrapper',
      iconSize: [ 39, 52 ],
      iconAnchor: [ 19, 52 ],
      popupAnchor: [0, -52],
      html: '<div class="scene-report-marker scene-report-marker-' + category + '"></div>'
    };
  };
  var icons = {
    pig: L.divIcon(getIconType('pig')),
    dog: L.divIcon(getIconType('dog')),
    buffalo: L.divIcon(getIconType('buffalo')),
    cow: L.divIcon(getIconType('cow')),
    chicken: L.divIcon(getIconType('chicken')),
    sheep: L.divIcon(getIconType('sheep')),
    // report marker
    human: L.divIcon(getReportCategoryIcon('human')),
    animal: L.divIcon(getReportCategoryIcon('animal')),
    environment: L.divIcon(getReportCategoryIcon('environment')),
  };

  $scope.layers = {
    report: {
      name: 'Reports',
      layer: new L.featureGroup().addTo(leafletMap),
      show: true
    },
    heatmap: {
      name: 'Heat Map',
      layer: heatmapLayer,
      show: false
    },
  };

  var bounds = $scope.layers.report.layer.getBounds();
  var zoom = $scope.layers.report.layer.getBounds();

  $scope.showRefresh = false;

  leafletMap.on('movestart', function() {
    $scope.pause();
    $scope.showRefresh = true;

    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });

  $scope.changeBound = function() {

    if ($state.current.name !== 'scenario') {
      return;
    }

    bounds = leafletMap.getBounds();
    zoom = leafletMap.getZoom();

    $timeout(function () {
      $state.go('scenario', {
          top: bounds.getWest(),
          right: bounds.getNorth(),
          left: bounds.getSouth(),
          bottom: bounds.getEast(),
          zoom: zoom
      }, { notify:false });

      query.top = bounds.getWest();
      query.right = bounds.getNorth();
      query.left = bounds.getSouth();
      query.bottom = bounds.getEast();

      $timeout(function () {
        refreshReportsLayerDataWithSummary();
      }, 100);
    }, 0);
  };

  $scope.toggleLayer = function (layerDef, forceValue) {
    var nextValue = angular.isUndefined(forceValue) ?
                      !layerDef.show :
                      forceValue;

    if (nextValue) {
      if (layerDef === $scope.layers.heatmap) {
        $scope.layers.report.layer.removeLayer(lastLayer);
        layerDef.layer.addTo(leafletMap);
      }

      if (!$scope.layers.heatmap.show) {
        layerDef.layer.addTo(leafletMap);
      }
    }
    else {
      if (layerDef === $scope.layers.heatmap) {
        $scope.layers.report.layer.addLayer(lastLayer);
      }

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

  var start = new Date();
  start.setDate(start.getDate() - 30);
  var startBrush = start ;
  var endBrush = new Date();

  var margin = {top: 10, right: 50, bottom: 20, left: 20},
      defaultExtent = [startBrush, endBrush],
      width = 800 - margin.left - margin.right,
      height = 50 - margin.top - margin.bottom;

  var calChartWidth = function () {
      width = angular.element(document.getElementById('timeline-wrapper')).width();
      width = width - margin.left - margin.right;
  };
  calChartWidth();

  $scope.window = [ formatDayDate(defaultExtent[0]), formatDayDate(defaultExtent[1]) ];

  var query = {
    // TODO: set default bounds
    'q': $stateParams.q || '',
    'bottom': $stateParams.bottom || 198.1298828125,
    'left': $stateParams.left || 17.764381077782076,
    'top': $stateParams.top || 99.810791015625,
    'right': $stateParams.right || 19.647760955697354,
    'date__lte': $scope.window[1],
    'date__gte': $scope.window[0],
    // 'reportTypeId': [
    //   1, 2, 3, 5, 6, 9, 10,
    //   11, 12, 14,
    //   20, 21, 22, 29,
    //   30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    //   40, 41, 42, 43, 44
    // ],
    'negative': true,
    'testFlag': false,
    'page_size': 1000,
    'lite': true
  };
  function _refreshQuery(params) {
    $scope._query = {
      'q': params.q || '',
      'bottom': params.bottom || 198.1298828125,
      'left': params.left || 17.764381077782076,
      'top': params.top || 99.810791015625,
      'right': params.right || 19.647760955697354,
      'date__lte': $scope.window[1],
      'date__gte': $scope.window[0],
      'negative': true,
      'testFlag': false,
      'page_size': 1000,
      'lite': true
    };
  }
  $scope._query = query;

  var x = d3.time.scale().range([0, width]),
      y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(formatMonthDate).ticks(12),
      yAxis = d3.svg.axis().scale(y).orient('left');

  var brushTransition;

  $scope.diffByTime = 1;
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
            $scope.reportMarkers = [];
          }

          query.date__lte = formatDayDate(brush.extent()[1]);
          query.date__gte = formatDayDate(brush.extent()[0]);
          /*jshint: +W064 */

          // Force to include the summary for better performance.
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

  if (isNaN($scope.diff)) {
    $scope.diff = 15;
  }

  var stopPlaying = false;

  var dateStart = brush.extent()[0];
  dateStart.setDate(dateStart.getDate() + $scope.diffByTime);

  if (dateStart.getTime() >= now.getTime()) {
    dateStart = now;
    dateStart.setDate(dateStart.getDate() - $scope.diffByTime);
  }

  var dateEnd = brush.extent()[1];
  if (dateEnd.getTime() === now.getTime()) {
    $scope.pause();
    return;
  }

  dateEnd.setDate(dateEnd.getDate() + $scope.diffByTime);
  if (dateEnd.getTime() > now.getTime()) {
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
var speed = 1000;
$scope.playing = false;

$scope.play = function () {
  $scope.playing = true;
  //speed = Math.floor(30000 * $scope.diffByTime/ (100 * Math.pow($scope.diffByTime, 1/2)));

  setTimeout(function() {
    playDemo();
    demoInterval = $interval(playDemo, speed);
  }, 0);
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

$scope.replay = function () {
  $scope.playing = false;

  var diff = Math.abs(Math.floor((brush.extent()[1] - brush.extent()[0]) / (1000 * 60 * 60 * 24)));

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
  var reportTypeIcons = {
    1: icons.animal, // สัตว์กัด
    2: icons.animal, // สัตว์ป่วยตาย
    3: icons.animal, // สัตว์แพทย์
    // 4: icons.animal,
    5: icons.animal, // นก
    6: icons.animal, // ปลา
    7: icons.animal, // อื่นๆ
    8: icons.animal, // ทดสอบ ป่วยตาย
    9: icons.environment, // สิ่งแวดล้อม
    10: icons.human, // คุ้มครองผ
    11: icons.human, // อาหาร
    12: icons.human, // โรคสัตว์และคน
    13: icons.animal, // ทดสอบ สัตว์กัด
    14: icons.environment, // ภัยธรรม
    15: icons.human, // ทดสอบอาหาร
    16: icons.human, // ทดสอบสัตว์สู่คน
    17: icons.environment, // ทดสอบภัยธรรมชาติ
    18: icons.environment, // ทดสอบสิ่งแวดล้อม
    19: icons.human, // ทดสอบคุ้มครองผู้
    20: icons.human, // human event
    21: icons.animal, // animal event
    22: icons.animal, // สัตว์กัด
    24: icons.human, // อาหารพิษ
    29: icons.human, // อาหารพิษ
    30: icons.human, // เขียง
    31: icons.human, // สงสัยปนเปื้อน
    32: icons.human, // เนื้อถูก
    33: icons.human, // น้ำมัน
    34: icons.human, // ยาปลอม
    35: icons.human, // สมุนไพร
    36: icons.human, // เครื่องสำอางค์
    37: icons.environment, // เสียงดัง
    38: icons.animal, // สัตว์ป่วยตาย
    39: icons.environment, // ขยะ
    40: icons.environment, // น้ำเสีย
    41: icons.environment, // ยุง
    42: icons.environment, // ควัน
    43: icons.environment, // ไฟป่า
    44: icons.environment // น้ำป่า
  };

  function getStateValue(state) {
    var val = 0;
    switch(state) {
      case 'report':
          val = 2;
          break;
      case 'case':
          val = 3;
          break;
      case 'suspect-outbreak':
          val = 4;
          break;
      case 'outbreak':
          val = 5;
          break;
      default:
          val = 1;
    }
    return val;
  }

  $scope.toggleReportsLayer = function (forceValue) {
      var nextValue = angular.isUndefined(forceValue) ?
          !layers.form.report :
          forceValue;
  };

  var lastLayer = null;
  var refreshing = false;
  var refreshingQuery = '';
  function refreshReportsLayerData(refreshGraph) {
    $scope.showRefresh = false;

    if (refreshGraph) {
        query.date__gte = formatDayDate(parseDate('01/2015'));
        query.date__lte = formatDayDate(new Date());
        query.withSummary = true;
    }
    else {
        delete query.withSummary;
    }

    // check to prevent duplicate network request.
    if (refreshing && refreshingQuery === JSON.stringify(query)) {
      return;
    }
    refreshing = true;
    refreshingQuery = JSON.stringify(query);

    $scope.reportMarkers = [];
    $scope.loadingReportMarkers = true;
    Reports.list(query).$promise.then(function (resp) {
      refreshing = false;
      $scope.loading = false;
      $scope.willShowResult = false;

      // var clusterGroup = new L.MarkerClusterGroup().addTo(drawnItems);
      if (!refreshGraph) {

        var drawnItems = new L.FeatureGroup();
        if (!$scope.layers.heatmap.show) {
          $scope.layers.report.layer.addLayer(drawnItems);
        }

        var data = [];

        resp.results.forEach(function (item) {

          var location = [
            item.reportLocation.coordinates[1],
            item.reportLocation.coordinates[0]
          ];

          var markerIcon = reportTypeIcons[item.reportTypeId];
          if (typeof markerIcon === 'undefined') {
            markerIcon = icons.human;
          }

          var marker = L.marker(location, {
            icon: markerIcon,
            riseOnHover: true
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

          data.push({
            lat: item.reportLocation.coordinates[1],
            lng: item.reportLocation.coordinates[0],
            count: getStateValue(item.stateCode),
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

        if(lastLayer !== null) {
          $scope.layers.report.layer.removeLayer(lastLayer);
        }

        lastLayer = drawnItems;

        heatmapLayer.setData({
          max: 8,
          data: data
        });

      } else {

        d3.select('#chart').html('');

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

        // console.log(refreshGraph, resp.summary);
        if (resp.summary) {
         read(resp.summary);
        }

      }

    }).catch(function (err) {
      console.log(err);
      refreshing = false;
      $scope.loading = false;
      $scope.willShowResult = false;
    });
  }

  function refreshReportsLayerDataWithSummary() {
    console.log('refresh graph');
    refreshReportsLayerData(true);
  }

  $scope.doQueryOnParams = function (params) {
      if ($state.current.name === 'scenario') {

          // console.log(params);

          query.top = params.top? $window.decodeURIComponent(params.top): 98.10791015625;
          query.bottom = params.bottom? $window.decodeURIComponent(params.bottom): 99.8052978515625;
          query.left = params.left? $window.decodeURIComponent(params.left): 18.17847354756518;
          query.right = params.right?  $window.decodeURIComponent(params.right): 19.291701823721098;

          if (typeof params.q === 'undefined') {
            delete query.q;
          }

          var southWest = L.latLng(query.right, query.top),
              northEast = L.latLng(query.left, query.bottom),
              bounds = L.latLngBounds(southWest, northEast);

          leafletMap.fitBounds(bounds);
          return $scope.search();
      }
  };


  $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
      console.log('stateChangeSuccess', $state.current.name, params);
      if ($state.current.name === 'scenario') {
          if (oldParams !== params) {
              $scope.doQueryOnParams(params);
          }else {
              $scope.search();
          }
      }
  });


});
