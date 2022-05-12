/*globals swal*/
"use strict";

angular
  .module("poddDashboardApp")

  /**
   * Configuration for variety of formal forms
   */
  .controller(
    "FormConfigCtrl",
    function (
      $scope,
      FormConfig,
      moment,
      ReportModal,
      shared,
      Reports,
      $state,
      $stateParams,
      $timeout,
      Menu,
      Auth,
      AdministrationArea,
      $location
    ) {
      console.log("-> In FormConfigCtrl");

      Menu.setActiveMenu("profile");
      Auth.requireLogin($scope);

      $scope.formCode = $stateParams.code;
      $scope.model = {
        code: $scope.formCode,
      };

      FormConfig.query({ code: $scope.formCode }).$promise.then(function (
        result
      ) {
        console.log(result);
        if (result.length > 0) {
          $scope.model = result[0];
        }
      });

      $scope.save = function () {
        if ($scope.model.id) {
          FormConfig.update($scope.model)
            .$promise.then(function (result) {
              $scope.model = result;
              swal({
                title: "",
                type: "success",
                text: "บันทึกเรียบร้อยแล้ว",
                confirmButtonText: "ตกลง",
                confirmButtonClass: "btn-success",
              });
            })
            .catch(function (err) {
              $scope.showWarning(err);
            });
        } else {
          FormConfig.create($scope.model)
            .$promise.then(function (result) {
              $scope.model = result;
              swal({
                title: "",
                type: "success",
                text: "บันทึกเรียบร้อยแล้ว",
                confirmButtonText: "ตกลง",
                confirmButtonClass: "btn-success",
              });
            })
            .catch(function (err) {
              $scope.showWarning(err);
            });
        }
      };

      $scope.showWarning = function (err) {
        swal({
          title: "",
          type: "warning",
          text: "เกิดข้อผิดพลาด กรุณากรอกข้อมูลให้ครบแล้วลองใหม่",
          confirmButtonText: "ตกลง",
          confirmButtonClass: "btn-danger",
        });
      };
    }
  );
