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
      $scope.stats = [];
      $scope.filter = {
        ym: new Date(),
      };

      $scope.groupSelected = {};
      $scope.groupEditting = {};

      var MAX_ACTIVE_GROUPS = 3;

      function loadMoreGroups() {
        $scope.loading = true;
        $scope.groupError = false;

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
            $scope.groupError = true;
          });
      }

      loadMoreGroups();

      $scope.isNumberOfGroupsReachLimit = function (excludeId) {
        return $scope.numberOfActiveGroups(excludeId) >= MAX_ACTIVE_GROUPS;
      };

      $scope.numberOfActiveGroups = function (excludeId) {
        var activeGroupCount = 0;
        for (var i = 0; i < $scope.groups.length; i++) {
          if ($scope.groups[i].id === excludeId) {
            continue;
          }
          if ($scope.groups[i].is_cancelled === false) {
            activeGroupCount++;
          }
        }
        return activeGroupCount;
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
            $scope.numberOfActiveGroups($scope.groupEditting.id) >=
              MAX_ACTIVE_GROUPS
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

      function searchStats() {
        $scope.statError = false;

        LineGroupNotify.stats({
          year: $scope.filter.ym.getFullYear(),
          month: $scope.filter.ym.getMonth() + 1,
        })
          .$promise.then(function (data) {
            $scope.stats = data;
          })
          .catch(function () {
            $scope.statError = true;
          });
      }

      $scope.search = function search(event) {
        event.preventDefault();
        searchStats();
      };

      searchStats();
    }
  );
