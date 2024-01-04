/* global swal */
"use strict";

angular
  .module("poddDashboardApp")
  .controller("AuthorityInfoModeCtrl", function ($scope, shared, Menu) {
    Menu.setActiveMenu("profile");
  })
  .controller(
    "AuthorityInfoCtrl",
    function ($scope, Menu, User, AuthorityInfo) {
      Menu.setActiveMenu("profile");

      $scope.authorityInfo = null;
      $scope.submitting = false;
      $scope.error = false;
      $scope.success = false;

      User.profile()
        .$promise.then(function (profile) {
          var authority = profile.authority;
          console.log(authority);
          $scope.authorityId = authority ? authority.id : "";

          return AuthorityInfo.getByAuthorityId({
            authorityId: $scope.authorityId,
          }).$promise;
        })
        .then(function (data) {
          console.log("result", data[0]);
          if (data[0]) {
            $scope.authorityInfo = data[0];

            // got python str ie. [{u'name': u'banana', u'description': u'\u0e40\u0e07\u0e34\u0e19\u0e2d\u0e38\u0e14\u0e2b\u0e19\u0e38\u0e19 10%'}]
            var strVillages = $scope.authorityInfo.villages
              .replaceAll("u'", "'")
              .replaceAll("'", '"');
            $scope.authorityInfo.villages = JSON.parse(strVillages);
          }
        });

      $scope.startNew = function () {
        $scope.authorityInfo = {
          villages: [],
          population: null,
          population_male: null,
          population_female: null,
          population_elder: null,
          num_households: null,
          num_villages: null,
          num_dogs: null,
          num_cats: null,
          year: null,
        };
      };

      $scope.submit = function (e) {
        console.log($scope.authorityInfo);
        e.preventDefault();

        if ($scope.submitting) {
          return;
        }

        $scope.error = false;
        $scope.success = false;
        $scope.submitting = true;

        $scope.authorityInfo["authorityId"] = $scope.authorityId;
        AuthorityInfo.createOrUpdate($scope.authorityInfo)
          .$promise.then(function () {
            $scope.success = true;
          })
          .catch(function () {
            $scope.error = true;
          })
          .finally(function () {
            $scope.submitting = false;
          });
      };

      $scope.addVillage = function () {
        $scope.authorityInfo.villages.push({
          name: "",
          description: "",
        });
      };

      $scope.removeVillage = function (village) {
        var idx = $scope.authorityInfo.villages.findIndex(function (it) {
          return (
            it.name === village.name && it.description === village.description
          );
        });
        if (idx > -1) {
          $scope.authorityInfo.villages.splice(idx, 1);
        }
      };
    }
  );
