'use strict';

/**
 * @ngdoc function
 * @name poddDashboardApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the poddDashboardApp
 */
angular.module('poddDashboardApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
