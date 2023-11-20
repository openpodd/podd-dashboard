/* global moment */
"use strict";

angular
  .module("poddDashboardApp")
  .controller("SummaryAnimalRecordsCtrl", function ($scope, Menu, AnimalRecordService, User) {
    Menu.setActiveMenu("summary-animal-records");

    $scope.loading = false;
    $scope.error = false;
    $scope.profile = User.profile();


    $scope.exportData = function () {
      $scope.loading = true;

      AnimalRecordService.export()
        .$promise.then(function (data) {
          $scope.loading = false;
          utils.downloadFile(
            "animal-records.csv",
            data.data,
            "text/csv"
          );
        })
        .catch(function () {
          $scope.loading = false;
        });
      return true;
    };

  });