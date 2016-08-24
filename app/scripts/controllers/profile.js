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
            $scope.username = $scope.profile.username;
            $scope.myAuthority = $scope.profile.authority? $scope.profile.authority.name: '';
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

    var dataURItoBlob = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var array = [];
        for(var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: mimeString});
    };

    $scope.submitProfileImage = function() {
        
        var image = dataURItoBlob($scope.selectedImage);
        var params = {
            'image': image
        }

        User.updateAvatar(params).$promise.then(function () {
            swal('สำเร็จ', 'ระบบได้ทำการเปลี่ยนแปลงรูปของคุณแล้ว', 'success');

            $scope.profile.avatarUrl = $scope.selectedImage;
            $scope._image = '';
            $scope.selectedImage = '';
            $('#cropModal').modal('hide');

        }, function(error){
            swal('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนแปลงรูปได้', 'error');
            $('#cropModal').modal('hide');
        });
       
    }

    $scope._image = '';
    $scope.selectedImage = '';
    var handleFileSelect = function(evt) {
        var file = evt.currentTarget.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function($scope){
               $scope._image = evt.target.result;
               $('#cropModal').modal('show');
            });
        };
        reader.readAsDataURL(file);
    };
    angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
});
