/* global d3, moment */
'use strict';

angular.module('poddDashboardApp')


.controller('SummaryVisualizationModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('summary');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
    shared.subscribe = Menu.hasPermissionOnMenu('view_dashboard_subscibe');
})

.controller('SummaryVisulizeGraphCtrl', function ($scope, shared, SummaryReportVisualization) {

  var colors = d3.scale.category20c();

  var $wrapper = angular.element('#mbars');

  var w = $wrapper.width();
  var h = $wrapper.height();
  var padding = {
      top: 40,
      right: 40,
      bottom: 80,
      left: 60
  };

  var dataset;
  var svg = d3.select('#mbars')
      .append('svg')
      .attr('width', w)
      .attr('height', h);

  svg.append('g')
      .attr('class','x axis')
      .attr('transform','translate(' + padding.left + ',' + (h - padding.bottom) + ')');

  svg.append('g')
      .attr('class','y axis')
      .attr('transform','translate(' + padding.left + ',' + padding.top + ')');

  svg.append('text')
      .attr('transform','rotate(-90)')
      .attr('y', padding.left - 56)
      .attr('x', 0-(h/2))
      .attr('dy','1em')
      .text('จำนวนรายงาน');

  var groups = svg.selectAll('g')
      .data([])
      .enter()
      .append('g')
      .attr('class','rgroups')
      .attr('transform','translate('+ padding.left + ',' + (h - padding.bottom) +')')
      .style('fill', '#ccc');

  var rects = groups.selectAll('rect')
      .data(function(d) {
        return d;
      })
      .enter()
      .append('rect')
      .attr('width', 2)
      .style('fill-opacity',1e-6);

  //Set up stack method

  var stack = d3.layout.stack();

  $scope.$watch('selected', function (newValue) {
      if (newValue) {
        newChart ();
      }
  });

  $scope.$parent.$parent.selectDataset = function (dataset) {
      dataset.selected = !dataset.selected;
      newChart();
  };
  function getSelectedReportTypesId() {
      var selectedId = [];
      ($scope.$parent.$parent.initialDataset || []).forEach(function (item) {
          if (item.selected) {
              selectedId.push(item.id);
          }
      });

      if (selectedId.length === 0) {
          return null;
      }
      else {
          return selectedId;
      }
  }

  var colorHash = {};

  function findById(dataset, id) {
      var data;
      dataset.forEach(function (item) {
         if (item.id === id) {
             data = item;
         }
      });
      return data;
  }

  function newChart () {
      var params = {
          reportTypes: getSelectedReportTypesId(),
          period: $scope.selected,
          subscribe: shared.subscribe
      };

      if ($scope.lastWeek) {
        params.lastWeek = true;
      }

      SummaryReportVisualization.query(params).$promise.then(function (json) {
          dataset = json;
          if (!$scope.$parent.$parent.initialDataset || $scope.$parent.$parent.initialDataset.length === 0) {
              $scope.$parent.$parent.initialDataset = dataset;
              dataset.forEach(function (item, index) {
                  colorHash[item.id] = colors(index);
                  item.colorCode = colors(index);
              });
              console.log(colorHash);
          }

          var data = [];
          $scope.$parent.$parent.initialDataset.forEach(function (item) {
              // Find if exists in new dataset, need to do this cuz wanna maintain
              // bar color and animation.
              var matchedItem = findById(dataset, item.id);
              var tmp;
              if (matchedItem) {
                  data.push(matchedItem.data);
              }
              else {
                  tmp = [];
                  item.data.forEach(function (_item) {
                       tmp.push({
                           y: 0,
                           time: _item.time
                       });
                  });
                  data.push(tmp);
              }
          });
          stack(data);

          var xMin = new Date(data[0][0].time);
          var xMax = new Date(data[0][data[0].length - 1].time);
          var xScale = d3.time.scale()
              .domain([xMin, xMax], 8)
              .rangeRound([0, w - padding.left - padding.right]);

          var yScale = d3.scale.linear()
              .domain([0,
                  d3.max(data, function(d) {
                      return d3.max(d, function(d) {
                          return d.y0 + d.y;
                      });
                  })
              ])
              .range([h-padding.bottom - padding.top, 0]);

          var xAxisRange = d3.time.weeks;
          if ($scope.selected === 'month') {
              xAxisRange = d3.time.months;
          } else if ($scope.selected === 'day') {
              xAxisRange = d3.time.days;
          }

          var xAxis = d3.svg.axis()
              .scale(xScale)
              .orient('bottom')
              .ticks(xAxisRange, 1);

          var yAxis = d3.svg.axis()
              .scale(yScale)
              .orient('left')
              .ticks(10);

          groups = svg.selectAll('.rgroups').data(data);
          groups.enter().append('g')
              .attr('class','rgroups')
              .attr('transform','translate('+ padding.left + ',' + (h - padding.bottom) +')')
              .style('fill',function(d, i){
                  return colorHash[$scope.$parent.$parent.initialDataset[i].id];
              });

          rects = groups.selectAll('rect')
              .data(function (d) {
                  return d;
              });

          rects.enter()
              .append('rect')
              .attr('x', w)
              .attr('width', 1)
              .style('fill-opacity', 1e-6);

          rects.transition()
              .duration(1000)
              .ease('linear')
              .attr('x', function(d) {
                  return xScale(new Date(d.time));
              })
              .attr('y', function(d) {
                  return -(- yScale(d.y0) - yScale(d.y) + (h - padding.top - padding.bottom)*2);
              })
              .attr('height', function(d) {
                  return -yScale(d.y) + (h - padding.top - padding.bottom);
              })
              .attr('width', 15)
              .style('fill-opacity', 1);

          rects.exit()
              .transition()
              .duration(1000)
              .ease('circle')
              .attr('x', w)
              .remove();

          groups.exit()
              .transition()
              .duration(1000)
              .ease('circle')
              .attr('x',w)
              .remove();

          svg.select('.x.axis')
             .transition()
             .duration(1000)
             .ease('circle')
             .call(xAxis);

          svg.select('.y.axis')
              .transition()
              .duration(1000)
              .ease('circle')
              .call(yAxis);

          var legend = svg.append('g')
              .attr('class','legend')
              .attr('x', w - padding.right - 65)
              .attr('y', 25)
              .attr('height', 100)
              .attr('width',100);

          svg.selectAll('.x.axis text')
              .attr('style', 'text-anchor:end')
              .attr('transform', function(d) {
                  var translateX = -this.getBBox().height;
                  var translateY = 12;

                  return 'translate(' + translateX + ',' + translateY + ') rotate(-90)';
              });
    });

  }

})

.controller('SummaryVisualizationCtrl', function ($scope, shared, Menu, User,
                                                  SummaryReportVisualization, SummaryDashboardVisualization) {
    Menu.setActiveMenu('summary');

    $scope.months = {
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        years: [2016, 2015, 2014],
        selectedMonth: moment().month() + 1,
        selectedYear: moment().year()
    };

    $scope.selected = 'month';
    $scope.dashboard = {
        users: 0,
        positiveReports: 0,
        negativeReports: 0
    };

    var params = {
        subscribe: shared.subscribe
    };

    SummaryDashboardVisualization.get(params).$promise.then(function (data) {
        $scope.dashboard = data;
    });

    $scope.initialDataset = [];

});
