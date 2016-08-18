'use strict';

angular.module('poddDashboardApp')

.controller('ProfileModeCtrl', function ($scope, shared, Menu) {
    shared.profileMode = true;
    Menu.setActiveMenu('profile');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('ProfileCtrl', function ($scope, User) {
    $scope.password = ['', ''];

    $scope.profile = User.profile();

    $scope.beforeProfileImage = '';
    $scope.profile.$promise
        .then(function () {
            $scope.beforeProfileImage = $scope.profile.avatarUrl;
            $scope.error = false;
        })
        .catch(function () {
            $scope.error = true;
        });

    function hasError() {
        $scope.error = false;

        $scope.password[0] = $scope.password[0].trim();
        $scope.password[1] = $scope.password[1].trim();

        if ($scope.password[0] === '') {
            $scope.error = true;
            return 1;
        }
        if ( ! $scope.password[0].match(/^\d+$/) ) {
            $scope.error = true;
            return 12;
        }
        if ($scope.password[1] === '') {
            $scope.error = true;
            return 2;
        }
        if ($scope.password[0].toString() !== $scope.password[1].toString()) {
            $scope.error = true;
            return 3;
        }
        if ($scope.password[0].length < 4 || $scope.password[1].length < 4) {
            $scope.error = true;
            return 11;
        }


        return null;
    }

    $scope.submitting = false;
    $scope.submit = function (e) {
        e.preventDefault();

        if ($scope.submitting) {
            return;
        }

        $scope.error = false;
        $scope.success = false;

        $scope.errorCode = hasError();
        if ($scope.errorCode) {
            $scope.error = true;
        }
        else {
            $scope.error = false;
            $scope.submitting = true;
            User.updatePassword({ password: $scope.password[0] }).$promise
                .then(function () {
                    $scope.error = false;
                    $scope.success = true;
                    $scope.password[0] = '';
                    $scope.password[1] = '';
                })
                .catch(function () {
                    $scope.error = true;
                    $scope.errorCode = 4;
                })
                .finally(function () {
                    $scope.submitting = false;
                });
        }
    };

    $scope.chooseImageFile = function() {
        $('#fileInput').click();
    }

    $scope.selectedImage = null;
    $scope.$watch('selectedImage', function (oldValue, newValue) {
        // console.log($scope.selectedImage);
        // if ($scope.selectedImage) {
        //     $('#cropModal').modal('show');
        // }
    });

    $scope._image = '';

    var handleFileSelect = function(evt) {
      var file = evt.currentTarget.files[0];
      var reader = new FileReader();
      reader.onload = function (evt) {
        $scope.$apply(function($scope){
          $scope._image = evt.target.result;
        });
      };
      reader.readAsDataURL(file);
    };
    angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
});
