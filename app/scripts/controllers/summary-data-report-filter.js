/* global moment */
/* global angular */
'use-strict';

angular.module('poddDashboardApp')


.controller('SummaryDataReportFilterCtrl', function($scope, $stateParams, DataReport) {
    $scope.loading = false;

    $scope.dataReport = DataReport.get({
        id: $stateParams.id
    });

    $scope.dateRange = {
        from: moment().subtract(7, 'days').toDate(),
        to: moment().toDate()
    };

    $scope.submit = function () {
        if ($scope.loading) {
            return;
        }

        $scope.loading = true;


        DataReport.run({
            id: $stateParams.id
        }, {
            dateStart: moment($scope.dateRange.from).format('YYYY-MM-DD'),
            dateEnd: moment($scope.dateRange.to).format('YYYY-MM-DD')
        }).$promise.then(function(data) {
            if (data.success) {
                window.open(config.API_BASEPATH + data.url);
            } else {
                window.alert('ไม่พบข้อมูลในช่วงวันที่ที่กำหนด');
            }
            $scope.loading = false;
        });

    };
})

.controller('SummaryDataReportFilterModeCtrl', function (shared, Menu) {
    // console.log('why hereeeeee init summary performance person ctrl');
    shared.summaryDataReportFilterMode = true;
    Menu.setActiveMenu('summary');
});
