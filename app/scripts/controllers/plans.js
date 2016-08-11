/*globals L,swal*/
'use strict';

angular.module('poddDashboardApp')

.controller('PlansModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');
})

.controller('PlansCtrl', function ($scope, Menu, PlanReport, $modal, AuthorityView) {
  Menu.setActiveMenu('scenario');

  $scope.loading = false;
  $scope.page = 1;
  $scope.endPageList = false;
  $scope.planReports = [];
  $scope.myAuthorities = [];

  $scope.currentPlanReport = null;
  $scope.viewAreas = function (planReport) {
    $scope.currentPlanReport = planReport;
  };

  $scope.viewResponseMap = function (planReport) {
    var scope = $scope.$new();
    scope.planReport = planReport;
    scope.isShowMap = false;
    scope.title = 'แจ้งเตือนผู้มีส่วนเกี่ยวข้อง'

    var modalInstance = $modal.open({
      templateUrl: 'views/plan-report.html',
      scope: scope,
      size: 'lg',
      controller: 'PlanReportModalCtrl'
    });
  };

  $scope.isMyAreas = function (planReport, code, area) {
    var areas = planReport.log.my_level_areas[code];
    var found = false;
    if (areas) {
      areas.forEach(function (item) {
        if (item.id === area.id) {
          found = true
        }
      });
    }
    return found;
  };

  var checkZone = function (planReport, code, result) {
    var areas = planReport.log.level_areas[code];
    var answer = '';
    areas.forEach(function (item) {
      var address = item.address.split(' ');
      for (var i = 0; i < address.length; i++) {
        if ($scope.myAuthorities.indexOf(address[i]) !== -1) {
          answer = result;
          return;
        }
      }
    });
    return answer;
  }
    

  $scope.myAreaZone = function (planReport) {
    var result = checkZone(planReport, 'red', 'โซนสีแดง');
    if (!result) {
      result = checkZone(planReport, 'yellow', 'โซนสีเหลือง');
    } else {
      if (!result) {
        result = checkZone(planReport, 'green', 'โซนสีเหลือง');
      }
    }
    return result;
  };

  function fetch(page) {
    if ($scope.loading) { return; }
    $scope.loading = true;

    page = page || 1;

    var query = {
      page: page,
      'page_size': 20
    };

    AuthorityView.mine().$promise.then(function (resp) {
      $scope.myAuthorities = [];
      resp.forEach(function (item) {
        $scope.myAuthorities.push(item.name);
      });
    });

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

          item.log.plan.levels.forEach(function (level) {
            item.affectedAreasCount += levelAreas[level.code].length;
            item.myLevelAreasCount += (item.log.my_level_areas[level.code] || []).length;

            // set flag my level areas.
            var thisLevelAreas = item.log.level_areas[level.code];
            if (thisLevelAreas) {
              thisLevelAreas.forEach(function (myArea) {
                if ($scope.isMyAreas(item, level.code, myArea)) {
                  myArea.isMine = true;
                }
              });
              thisLevelAreas.sort(function (a, b) {
                return (b.isMine ? 1 : 0) - (a.isMine ? 1 : 0);
              });
            }
          });
        });
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  var expandThreshold = 10;
  $scope.getPagerId = function (planReport, code) {
    return '' + planReport.id + ':' + code;
  };
  $scope.expandPagerId = {};
  $scope.isExpand = function (planReport, code) {
    return $scope.expandPagerId[$scope.getPagerId(planReport, code)] === true;
  };
  $scope.setExpand = function (planReport, code, isExpand) {
    $scope.expandPagerId[$scope.getPagerId(planReport, code)] = isExpand;
  };
  $scope.willShowExpandButton = function (planReport, code) {
    return planReport.log.level_areas[code].length > expandThreshold;
  };
  $scope.getLevelAreas = function (planReport, code) {
    var areas = planReport.log.level_areas[code];
    return areas;
   
  };

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

  $scope.searchData = {
      queryText: '',
      _queryText: ''
  };

  $scope.flipped = false;

  // set default saveContacts flag.
  $scope.planReport.log.plan.levels.forEach(function (level) {
    $scope.planReport.log.level_areas[level.code].forEach(function (area) {
      area.saveContacts = true;
    });
  });

  $scope.search = function () {
    $scope.searchData._queryText = $scope.searchData.queryText;
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
