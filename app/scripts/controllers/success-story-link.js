"use strict";

angular
  .module("poddDashboardApp")
  .controller("SuccessStoryLinkCtrl", function ($scope, User) {
    console.log("-> In SuccessStoryLinkCtrl");
    $scope.readyToCopy = false;
    $scope.copyToClipboard = function () {
      navigator.clipboard.writeText($scope.iframe);
    };
    $scope.profile = User.profile();
    $scope.profile.$promise
      .then(function () {
        console.log($scope.profile.authority);
        $scope.myAuthorityId = $scope.profile.authority
          ? $scope.profile.authority.id
          : "";
        $scope.myAuthorityName = $scope.profile.authority
          ? $scope.profile.authority.name
          : "";

        $scope.iframe =
          '<iframe style="margin: 100px; width: 500px; height: 80%;"' +
          ' src="https://api.cmonehealth.org/civic/accomplishments/?authority_id=' +
          $scope.myAuthorityId +
          '"/> ';
        $scope.readyToCopy = true;
        $scope.error = false;
      })
      .catch(function () {
        $scope.error = true;
      });
  });
