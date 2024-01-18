/* global moment, utils */
"use strict";

angular
  .module("poddDashboardApp")

  .factory("mockApiResponse", function ($timeout, $q) {
    return function (resp) {
      var deferred = $q.defer();
      $timeout(function () {
        deferred.resolve(resp);
      }, 500);
      return function () {
        return { $promise: deferred.promise };
      };
    };
  })
  .factory("AuthorityInfo", function ($resource, mockApiResponse) {
    return $resource(
      config.API_BASEPATH + "/authorityinfos/?authority=:authorityId",
      {
        authorityId: "@authorityId",
      },
      {
        getByAuthorityId: {
          method: "GET",
          isArray: true,
        },
        createOrUpdate: {
          method: "POST",
        },
      }
    );
  });
