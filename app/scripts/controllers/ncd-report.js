/* global moment */
"use strict";

angular
  .module("poddDashboardApp")

  .controller("NcdReportCtrl", function ($scope, Menu) {
    Menu.setActiveMenu("ncd-report");

    console.log("init ncd report ctrl");

    $scope.loading = true;
    $scope.error = false;

    $scope.healthDateRange = {
      from: moment().subtract(7, "days").toDate(),
      to: moment().toDate(),
    };

    $scope.ncdDateRange = {
      from: moment().subtract(7, "days").toDate(),
      to: moment().toDate(),
    };

    $scope.exportXlsxAllReport = function () {
      console.log("export all");

      // TODO service to get excel content
      // AnyService.get(params).$promise.then(function (data) {
      //    convert data to byte arrays
      //    utils.downloadFile(filename, bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // });

      return true;
    };

    $scope.exportXlsxHealthReport = function () {
      var dateFrom = moment($scope.healthDateRange.from).format("YYYY-MM-DD");
      var dateTo = moment($scope.healthDateRange.to).format("YYYY-MM-DD");

      var params = {
        dateStart: dateFrom,
        dateEnd: dateTo,
      };
      console.log("export health", params);

      // TODO service to get excel content
      // AnyService.get(params).$promise.then(function (data) {
      //    convert data to byte arrays
      //    utils.downloadFile(filename, bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // });

      return true;
    };

    $scope.exportXlsxNcdReport = function () {
      var dateFrom = moment($scope.ncdDateRange.from).format("YYYY-MM-DD");
      var dateTo = moment($scope.ncdDateRange.to).format("YYYY-MM-DD");

      var params = {
        dateStart: dateFrom,
        dateEnd: dateTo,
      };
      console.log("export ncd", params);

      // TODO service to get excel content
      // AnyService.get(params).$promise.then(function (data) {
      //    convert data to byte arrays
      //    utils.downloadFile(filename, bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // });

      return true;
    };
  });
