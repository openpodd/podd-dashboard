/* global moment */
"use strict";

angular
  .module("poddDashboardApp")

  .controller("NcdReportCtrl", function ($scope, Menu, NcdService, User) {
    Menu.setActiveMenu("ncd-report");

    console.log("init ncd report ctrl");

    $scope.loading = false;
    $scope.error = false;
    $scope.profile = User.profile();

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
      $scope.loading = true;

      NcdService.exportAll({
        authorityId: $scope.profile.authority.id,
      })
        .$promise.then(function (data) {
          $scope.loading = false;
          utils.downloadFile(
            "ncd-all.xlsx",
            data.data,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        })
        .catch(function () {
          $scope.loading = false;
        });
      return true;
    };

    $scope.exportXlsxHealthReport = function () {
      $scope.loading = true;
      var dateFrom = moment($scope.healthDateRange.from)
        .set({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
        .toISOString();
      var dateTo = moment($scope.healthDateRange.to)
        .set({ hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
        .toISOString();

      var params = {
        start: dateFrom,
        end: dateTo,
        authorityId: $scope.profile.authority.id,
      };
      console.log("export health", params);

      NcdService.exportHealth(params)
        .$promise.then(function (data) {
          $scope.loading = false;
          utils.downloadFile(
            "ncd-health.xlsx",
            data.data,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        })
        .catch(function () {
          $scope.loading = false;
        });

      return true;
    };

    $scope.exportXlsxNcdReport = function () {
      $scope.loading = true;
      var dateFrom = moment($scope.healthDateRange.from)
        .set({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
        .toISOString();
      var dateTo = moment($scope.healthDateRange.to)
        .set({ hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
        .toISOString();

      var params = {
        start: dateFrom,
        end: dateTo,
        authorityId: $scope.profile.authority.id,
      };
      console.log("export ncd", params);
      NcdService.exportNcd(params)
        .$promise.then(function (data) {
          $scope.loading = false;
          utils.downloadFile(
            "ncd-ncd.xlsx",
            data.data,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        })
        .catch(function () {
          $scope.loading = false;
        });

      return true;
    };
  });
