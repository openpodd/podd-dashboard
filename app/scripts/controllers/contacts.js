/*global swal */

'use strict';

angular.module('poddDashboardApp')

.controller('ContactsModeCtrl', function (Menu) {
  Menu.setActiveMenu('scenario');

})

.controller('ContactsCtrl', function ($scope, Menu, AdministrationArea, 
      $state, $stateParams, $window, Notification) {
  Menu.setActiveMenu('scenario');

  $scope.query = $stateParams.q || '';
  $scope.administrationAreas = [];

  $scope.willShowResult = true;
  $scope.loading = true;

  $scope.isOnlyq = true;

  var page = 1;
  var pageSize = 10;

  $scope._query = {
    keywords: ['ตำบล', 'บ้าน'],
    page_size: pageSize,
    page: page,
    name__startsWith: 'บ้าน'
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
  $scope.oldSelectedContact = '';
  $scope.newSelectedContact = '';

  $scope.selectedArea = function(area) {
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

})

;
