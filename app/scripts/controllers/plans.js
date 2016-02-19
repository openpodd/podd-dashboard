/*globals L,swal*/
'use strict';

angular.module('poddDashboardApp')

.controller('PlansModeCtrl', function (Menu) {
  Menu.setActiveMenu('plans');
})

.controller('PlansCtrl', function ($scope, Menu, PlanReport) {
  Menu.setActiveMenu('plans');

  $scope.loading = false;
  $scope.page = 1;
  $scope.endPageList = false;
  $scope.planReports = [];

  function fetch(page) {
    if ($scope.loading) { return; }
    $scope.loading = true;

    page = page || 1;

    var query = {
      page: page,
      'page_size': 20
    };

    PlanReport.query(query).$promise
      .then(function (resp) {
        if (resp.length < query.page_size) {
          $scope.endPageList = true;
          // end process if empty list.
          if (resp.length === 0) { return; }
        }

        resp.forEach(function (item) {
          $scope.planReports.push(item);

          if (!item.log.plan.levels) {
            item.log.plan.levels = [
              { name: 'Red', code: 'red' },
              { name: 'Yellow', code: 'yellow' },
              { name: 'Green', code: 'green' }
            ];
          }

          var levelAreas = item.log.level_areas;
          item.affectedAreasCount = 0;
          item.myLevelAreasCount = 0;

          item.log.plan.levels.forEach(function (plan) {
            item.affectedAreasCount += levelAreas[plan.code].length;
            item.myLevelAreasCount += item.log.my_level_areas[plan.code].length;
          });
        });
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  $scope.loadMore = function () {
    $scope.page += 1;
    fetch($scope.page);
  };

  fetch();

})

.controller('PlanReportModalCtrl', function ($scope, $modalInstance, PlanReport) {
    L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';

    $scope.close = function () {
        $modalInstance.dismiss();
    };

    $scope.queryText = '';

    $scope.flipped = false;

    // set default saveContacts flag.
    $scope.planReport.log.plan.levels.forEach(function (level) {
      $scope.planReport.log.level_areas[level.code].forEach(function (area) {
        area.saveContacts = true;
      });
    });

    $scope.search = function () {
      $scope._queryText = $scope.queryText;
    };

    $scope.resend = function (planReport, area) {
      if (area.working) {
        return;
      }
      area.working = true;

      var data = {
        id: planReport.id,
        area: area.id,
        contacts: area.newContacts,
        save: area.saveContacts,
        append: true
      };

      PlanReport.resendNotification(data).$promise
        .then(function () {
          area.contacts = area.contacts + ',' + area.newContacts;
          area.newContacts = '';
          swal({
            title: 'เรียบร้อย',
            text: 'ระบบได้ส่งข้อความแจ้งเตือนเรียบร้อยแล้ว',
            type: 'success'
          });
        })
        .catch(function (err) {
          console.log('-> error', err);
          swal({
            title: 'ผิดพลาด',
            text: 'เกิดปัญหาบางอย่าง กรุณาลองอีกครั้ง',
            type: 'error'
          });
        })
        .finally(function () {
          area.working = false;
        });
    };
})

;
