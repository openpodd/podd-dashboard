/* global swal */
"use strict";

angular
  .module("poddDashboardApp")

  .controller(
    "LineGroupNotifyCtrl",
    function (
      $scope,
      Menu,
      LineGroupNotify,
      $timeout,
      UserDetail,
      Authority,
      AuthorityView,
      uiGridUtils
    ) {
      Menu.setActiveMenu("users");

      $scope.groups = [];
      $scope.loading = true;
      $scope.page = 0;
      $scope.pageSize = 20;

      $scope.groupSelected = {};
      $scope.groupEditting = {};

      function loadMoreGroups() {
        $scope.loading = true;

        LineGroupNotify.list()
          .$promise.then(function (data) {
            console.log("loaded groups data", data);
            data.forEach(function (item) {
              $scope.groups.push(item);
            });
            $scope.loading = false;
          })
          .catch(function () {
            $scope.loading = false;
            $scope.error = true;
          });
      }

      loadMoreGroups();

      $scope.isNumberOfGroupsReachLimit = function () {
        var limit = 3;
        for (var i = 0; i < $scope.groups.length; i++) {
          if ($scope.groups[i].is_cancelled === false) {
            limit--;
          }
        }
        return limit <= 0;
      };

      $scope.selectGroup = function (group) {
        if (group === null) {
          $scope.groupSelected = {};

          LineGroupNotify.create({})
            .$promise.then(function (data) {
              swal("สำเร็จ", "เพิ่มกลุ่มสำเร็จ", "success");
              $("#groupModal").modal("hide");
              $scope.groupSelected = data;
              $scope.groups.push(data);
            })
            .catch(function () {
              swal("เกิดข้อผิดพลาด", "ไม่สามารถเพิ่มกลุ่มได้", "error");
            });
        } else {
          $scope.groupSelected = group;
        }
        $scope.groupEditting = angular.copy(group);
      };

      $scope.submitGroup = function () {
        if ($scope.groupEditting.id) {
          if (
            !$scope.groupEditting.is_cancelled &&
            $scope.isNumberOfGroupsReachLimit()
          ) {
            swal(
              "เกิดข้อผิดพลาด",
              "จำนวนกลุ่มเต็มแล้ว ไม่สามารถเพิ่มกลุ่มกลับมาได้",
              "error"
            );
            return;
          }

          LineGroupNotify.update({
            id: $scope.groupEditting.id,
            is_cancelled: $scope.groupEditting.is_cancelled,
            remark: $scope.groupEditting.remark,
          })
            .$promise.then(function (data) {
              swal("สำเร็จ", "แก้ไขรายละเอียดกลุ่มสำเร็จ", "success");
              $("#groupModal").modal("hide");
              angular.copy(data, $scope.groupSelected);
            })
            .catch(function () {
              swal(
                "เกิดข้อผิดพลาด",
                "ไม่สามารถแก้ไขรายละเอียดกลุ่มได้",
                "error"
              );
            });
        }
      };
    }
  );
