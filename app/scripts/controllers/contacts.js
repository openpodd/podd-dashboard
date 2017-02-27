/*global swal */

'use strict';

angular.module('poddDashboardApp')

.controller('ContactsModeCtrl', function (Menu) {
  Menu.setActiveMenu('users');

})

.controller('ContactModalCtrl', function ($scope, Menu, AdministrationArea,
      $state, $stateParams, $window, Notification) {

      $scope.oldSelectedContact = '';
      $scope.newSelectedContact = '';

      $scope.$parent.$parent.selectedArea = function(area) {
        $scope.selected = area;
        $scope.isSave = false;
        $scope.oldSelectedContact = area.contacts;
        $scope.newSelectedContact = area.contacts;
      };

      $scope.disabledUpdateBtn = false;
      $scope.saveContact = function() {
        var params = [{
          'id':  $scope.selected.id,
          'contacts': $scope.newSelectedContact
        }];

        if ($scope.newSelectedContact !== null &&
            $scope.newSelectedContact.replace(' ', '') !== '') {

            $scope.disabledUpdateBtn = true;
            AdministrationArea.updateContacts(params).$promise.then(function (resp) {
              $scope.selected.contacts = $scope.newSelectedContact;
              $scope.disabledUpdateBtn = false;
              $scope.isSave = true;

            }).catch(function () {
              $scope.selected.contacts = $scope.oldSelectedContact;
              $scope.disabledUpdateBtn = false;
              $scope.isSave = false;
          });

        } else {
          swal('', 'คุณยังไม่ได้ระบุข้อมูลการติดต่อ', 'warning');
        }

      };

      $scope.testMessage = '[ทดลองส่งข้อความจาก PODD]  พบโรคห่าไก่ระบาดในหมู่บ้านของท่าน แนะนำให้' +
              ' กระจายข่าวผ่านเสียงตามสายทันที' +
              ' ร่วมหารือกับ อปท.และปศอ. เพื่อควบคุมโรค'  ;

      $scope.testSendSMS = function() {

          if ($scope.selected.contacts !== null &&
              $scope.selected.contacts.replace(' ', '') !== '') {

            var params = {
              users: $scope.selected.contacts,
              message: $scope.testMessage
            };

            Notification.test(params).$promise.then(function (resp) {
              swal('สำเร็จ', 'ระบบ PODD ได้ส่งข้อความแล้ว', 'success');

            }).catch(function () {
              swal('เกิดข้อผิดพลาด', 'ระบบ PODD ไม่สามารถส่งข้อความได้', 'error');

            });

          }

          $('#contactModal').modal('toggle');
      };

})

.controller('ContactsCtrl', function ($scope, Menu, AdministrationArea,
      $state, $stateParams, $window, Notification, $timeout, uiGridUtils) {
  Menu.setActiveMenu('users');

  $scope.query = $stateParams.q || '';
  $scope.administrationAreas = [];

  $scope.willShowResult = true;
  $scope.loading = true;

  $scope.isOnlyq = true;

  var page = 1;
  var pageSize = 10;

  $scope._query = {
    keywords: [],
    page_size: pageSize,
    page: page
    // name__startsWith: 'บ้าน'
  };

  $scope.canLoadMore = true;

  $scope.toggleHelp = function () {
      $scope.help = !$scope.help;
  };

  $scope.closeHelp = function () {
      $scope.help = false;
  };

  $scope.search = function () {
    $scope._query.keywords.push($scope.query);
    $state.go('contacts', { q: $scope.query, alphabet: $scope._query.alphabet });
  };

  $scope.searchByAlphabet = function (alphabet) {
    $scope._query.alphabet = alphabet;
    $state.go('contacts', { q: $scope.query, alphabet: $scope._query.alphabet });
  };

   $scope.clearAlphabet = function () {
    delete $scope._query.alphabet;
    $state.go('contacts', { q: $scope.query, alphabet: '' });
  };

  $scope._search = function () {
    $scope._query.page = 1;

    $scope.willShowResult = true;
    $scope.loading = true;

    $scope.empty = false;
    $scope.error = false;

    $scope.canLoadMore = true;

    AdministrationArea.contacts($scope._query).$promise.then(function (resp) {
      $scope.administrationAreas = resp.results;

      $scope.willShowResult = false;
      $scope.loading = false;

      if ($scope.administrationAreas.length === 0) {
        $scope.willShowResult = true;
        $scope.empty = true;

      }

      if (resp.next === null) {
        $scope.canLoadMore = false;
      }

    }).catch(function () {
      $scope.willShowResult = true;
      $scope.loading = false;
      $scope.error = true;

    });

  };

  $scope.alphabets = ('กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ').split('');
  $scope.toParentAddress = function(area) {
    return area.address.replace(area.name, '');
  };

  $scope.loadMore = function () {
    page ++;

    $scope._query.page = page;

    $scope.disabledLoadmoreBtn = true;

    AdministrationArea.contacts($scope._query).$promise.then(function (resp) {

      angular.forEach(resp.results, function(value, key) {
        $scope.administrationAreas.push(value);

      });

      if (resp.next === null) {
        $scope.canLoadMore = false;
      }

      $scope.disabledLoadmoreBtn = false;

    }).catch(function () {
      $scope.disabledLoadmoreBtn = false;

    });

  };

  $scope.selected = '';

  $scope.doQueryOnParams = function (params) {

      if ($state.current.name === 'contacts') {

          var name = $window.decodeURIComponent(params.q || '').replace(' ', '');
          $scope._query.alphabet = $window.decodeURIComponent(params.alphabet || '');

          if (name === '') {
            delete $scope._query.q;
          } else {
            $scope._query.keywords.push(name);
          }

          return $scope._search();
      }
  };

  $scope.doQueryOnParams($stateParams);
  $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
      if ($state.current.name === 'contacts') {
          if (oldParams !== params) {
              $scope.doQueryOnParams(params);
          }
      }
  });

  $scope.gridOptionsContact = {
      enableSorting: false,
      data: [],
      columnDefs: [],
      exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
      exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" download="รายชื่ออาสาสมัครในโครงการผ่อดีดี.csv" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
      onRegisterApi: function(gridApi){
          $scope.gridApi = gridApi;
      }
  };

  function exportContacts(to) {
    AdministrationArea.contacts().$promise.then(function (data) {
      var results = [];
      data.results.forEach(function (item) {
          results.push({
            'ชื่อ': item.name,
            'ที่อยู่': item.address,
            'ผู้ติดต่อ': item.contacts? item.contacts: '-',
          });
      });

      $scope.gridOptionsContact.enableSorting = true;
      $scope.gridOptionsContact.columnDefs = [
          { field: 'ชื่อ', displayName: 'ชื่อ', headerCellClass: 'cell-center' },
          { field: 'ที่อยู่', displayName: 'ที่อยู่', headerCellClass: 'cell-center' },
          { field: 'ผู้ติดต่อ', displayName: 'ผู้ติดต่อ', headerCellClass: 'cell-center' },
      ];

      $scope.gridOptionsContact.data = results;
      var filename = 'รายชื่อติดต่อ-' + moment().format('DD-MM-YYYY');
      $timeout(function () {
          if (to === 'csv') {
              uiGridUtils.exportCsv($scope.gridApi.grid, filename + '.csv');
            } else {
              uiGridUtils.exportXlsx($scope.gridApi.grid, filename + '.xlsx');
            }
      }, 100);
    }).catch(function () {});
  }

  $scope.csvExport = function () {
      exportContacts('csv');
  };

  $scope.xlsxExport = function () {
      exportContacts('xlsx');
  }
})

;
