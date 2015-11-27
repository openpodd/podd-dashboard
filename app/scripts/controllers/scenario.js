/* global L, d3 */
'use strict';

angular.module('poddDashboardApp')

.controller('ScenarioModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');
})

.controller('ScenarioCtrl', function ($scope, Menu, Reports, $compile, $interval, $stateParams, $anchorScroll, $location, $state) {
  Menu.setActiveMenu('scenario');

  L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;


  var options = {
    center: [ 18.781516724349704, 98.98681640625 ],
    zoomLevel: 8,
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
  var getReportCategoryIcon = function (category) {
    return {
      className: 'scene-report-marker-wrapper',
      iconSize: [ 39, 52 ],
      iconAnchor: [ 19, 52 ],
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
        layer: getGISLayer('pig_farm', 'pig'),
        show: false
      },
      cow: {
        name: 'Cow & Buffalo Farm',
        layer: getGISLayer('cowsandbuffalos_farm', 'cow'),
        show: false
      },
      dog: {
        name: 'Dog Farm',
        layer: getGISLayer('dog_farm', 'dog'),
        show: false
      },
      chicken: {
        name: 'Chicken Farm',
        layer: getGISLayer('poultry_farm', 'chicken'),
        show: false
      }
    }
  };

  var bounds = $scope.layers.report.layer.getBounds();
  var zoom = $scope.layers.report.layer.getBounds();

  leafletMap.on('moveend', function() {
    changeBound();
  });

  function changeBound() {
    $scope.pause();

    bounds = leafletMap.getBounds();
    zoom = leafletMap.getZoom();

    $state.go('scenario', { 
        top: bounds.getWest(),
        right: bounds.getNorth(),
        left: bounds.getSouth(),
        bottom: bounds.getEast(),
        zoom: zoom
    });
  


  }
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
    height = 50 - margin.top - margin.bottom;

var calChartWidth = function () {
    width = angular.element(document.getElementById('timeline-wrapper')).width();
    width = width - margin.left - margin.right;
};
calChartWidth();

$scope.window = [ formatDayDate(defaultExtent[0]), formatDayDate(defaultExtent[1]) ];


  var query = {
    // TODO: set default bounds
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
  speed = Math.floor(30000 * $scope.diff/ (100 * Math.pow($scope.diff, 1/2)));
  console.log(speed);

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

  $scope.toggleReportsLayer = function (forceValue) {
      var nextValue = angular.isUndefined(forceValue) ?
          !layers.form.report :
          forceValue;
  };

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


      // var clusterGroup = new L.MarkerClusterGroup().addTo(drawnItems);
      if (!refreshGraph) {

        var drawnItems = new L.FeatureGroup();
        $scope.layers.report.layer.addLayer(drawnItems);

        resp.results.forEach(function (item) {
          var location = [
            item.reportLocation.coordinates[1],
            item.reportLocation.coordinates[0]
          ];

          var marker = L.marker(location, {
            icon: reportTypeIcons[item.reportTypeId]
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

        if(lastLayer !== null) {
          $scope.layers.report.layer.removeLayer(lastLayer);
        }

        lastLayer = drawnItems;

      }


      // fit bound.
      // leafletMap.fitBounds(bounds);

      else {
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

  $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
      console.log('stateChangeSuccess', $state.current.name);
      if ($state.current.name === 'scenario') {

          query.top = $stateParams.top || 99.9261474609375;
          query.right = $stateParams.right || 20.16941122761028;
          query.left = $stateParams.left || 17.240497931237368;
          query.bottom = $stateParams.bottom || 97.679443359375;

          zoom = $stateParams.zoom || 8;

          var southWest = L.latLng(query.left, query.bottom),
              northEast = L.latLng(query.right, query.top);

          bounds = L.latLngBounds(southWest, northEast);
          leafletMap.fitBounds(bounds);
          leafletMap.setZoom(zoom);

          setTimeout(function() {
            refreshReportsLayerDataWithSummary();
          }, 1);
      }
  });

});
