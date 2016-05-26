/* global d3, moment */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryVisualizationModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('summary');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('SummaryVisualizationCtrl', function ($scope, Menu, User, SummaryReportVisualization,
    SummaryDashboardVisualization) {
    Menu.setActiveMenu('summary');
    
    $scope.months = {
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        years: [2016, 2015, 2014],
        selectedMonth: moment().month() + 1,
        selectedYear: moment().year()
    };

    $scope.selected = 'month';
    $scope.dashboard = {
      users: 4014,
      positiveReports: 1000,
      negativeReports: 100
    };

    SummaryDashboardVisualization.get().$promise.then(function (data) {
      $scope.dashboard = data;
    });

    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    var colors = d3.scale.category10();

    var w = 1000;                        
    var h = 500;                        
    var padding = {top: 40, right: 40, bottom: 40, left:40};
    var dataset;
    var svg = d3.select('#mbars')
            .append('svg')
            .attr('width', w)
            .attr('height', h);

    svg.append('g')
        .attr('class','x axis')
        .attr('transform','translate(40,' + (h - padding.bottom) + ')');

    svg.append('g')
        .attr('class','y axis')
        .attr('transform','translate(' + padding.left + ',' + padding.top + ')');

    svg.append('text')
        .attr('transform','rotate(-90)')
        .attr('y', 0 - 5)
        .attr('x', 0-(h/2))
        .attr('dy','1em')
        .text('Number of reports');

    svg.append('text')
        .attr('class','xtext')
        .attr('x',w/2 - padding.left)
        .attr('y',h - 5)
        .attr('text-anchor','middle')
        .text($scope.selected);

    svg.append('text')
        .attr('class','title')
        .attr('x', (w / 2))             
        .attr('y', 20)
        .attr('text-anchor', 'middle')  
        .style('font-size', '16px') 
        .style('text-decoration', 'underline')  
        .text('Number of reports per ' + $scope.selected +'.');

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

    function newChart () {

        var colorHash = {};

        var params = {
          'reportTypes': [1],
          'period': $scope.selected
        };

        SummaryReportVisualization.query(params).$promise.then(function (json) {
          dataset = json;

          var data = [];
          var count = 0;
          dataset.forEach(function(d) {
            colorHash[count] = [d.name, colors(count)];
            data.push(d.data);
            count += 1;
          });

          stack(data);

          var xScale = d3.time.scale()
              .domain([new Date(data[0][0].time), d3.time.day.offset(new Date(data[0][data[0].length-1].time), 8)])
              .rangeRound([0, w-padding.left-padding.right]);

          var yScale = d3.scale.linear()
              .domain([0,             
                  d3.max(data, function(d) {
                      return d3.max(d, function(d) {
                          return d.y0 + d.y;
                      });
                  })
              ])
              .range([h-padding.bottom-padding.top,0]);

          var xAxisRange = d3.time.weeks;
          if ($scope.selected === 'month') {
            xAxisRange = d3.time.months;
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
                return colorHash[i][1];
            });

          rects = groups.selectAll('rect')
            .data(function(d){return d;});

          rects.enter()
              .append('rect')
              .attr('x', w)
              .attr('width',1)
              .style('fill-opacity',1e-6);

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
           .attr('x',w)
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

          legend.selectAll('g').data(dataset)
                .enter()
                .append('g')
                .each(function(d,i){
                  var g = d3.select(this);
                  g.append('rect')
                      .attr('x', w - padding.right - 65)
                      .attr('y', i*25 + 10)
                      .attr('width', 10)
                      .attr('height',10)
                      .style('fill', colorHash[i][1]);

                  g.append('text')
                   .attr('x', w - padding.right - 50)
                   .attr('y', i*25 + 20)
                   .attr('height',30)
                   .attr('width',100)
                   .style('fill', colorHash[i][1])
                   .text(colorHash[i][0]);
                });

          svg.select('.xtext')
            .text($scope.selected);

          svg.select('.title')
            .text('Number of reports per ' + $scope.selected +'.');

          svg.selectAll('.x.axis text')  // select all the text elements for the xaxis
            .attr('transform', function(d) {
              return 'translate(' + this.getBBox().height*-2 + ',' + this.getBBox().height + ')rotate(-45)';
        });
      });
      
    }
 

});
