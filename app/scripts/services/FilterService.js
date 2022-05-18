"use strict";

angular
  .module("poddDashboardApp")

  .factory("Search", function ($resource) {
    return $resource(
      config.API_BASEPATH + "/reports/search",
      {},
      {
        query: {
          method: "GET",
          isArray: false,
        },
      }
    );
  })

  .factory("LocalSearch", function ($resource) {
    // MOCK data
    // return {
    //     query: function (q) {
    //         return {
    //             $promise: Promise.resolve({
    //                 count: 30,
    //                 next: "?page=2",
    //                 previous: null,
    //                 results: [
    //                     {
    //     "id": 552459,
    //     "reportId": 1,
    //     "guid": "2344efcc-aa7a-4229-b85d-860c58e4bfb0",
    //     "reportTypeId": 1629,
    //     "reportTypeName": "Public Incident",
    //     "reportTypeCategoryCode": "pin",
    //     "isStateChanged": false,
    //     "stateCode": "report",
    //     "stateName": "Report",
    //     "stateId": 6090,
    //     "date": "2022-05-12T09:11:26+00:00",
    //     "createdAt": "2022-05-12T09:12:17.253924+00:00",
    //     "isAnonymous": false,
    //     "createdByObject": {
    //         "id": 26649,
    //         "name": "tidchu tidchu",
    //         "username": "podd.26649",
    //         "firstName": "tidchu",
    //         "lastName": "tidchu",
    //         "status": "COORDINATOR",
    //         "contact": "",
    //         "avatarUrl": null,
    //         "thumbnailAvatarUrl": null,
    //         "authorityAdmins": [],
    //         "isStaff": false,
    //         "isSuperuser": false,
    //         "isAnonymous": false,
    //         "isPublic": false,
    //         "domain": 5,
    //         "administrationArea": null,
    //         "domainLatitude": 13.7563,
    //         "domainLongitude": 100.5018
    //     },
    //     "incidentDate": "2022-05-12",
    //     "createdBy": "tidchu tidchu",
    //     "createdById": 26649,
    //     "createdByName": "tidchu tidchu",
    //     "administrationAreaId": 2397,
    //     "formData": {
    //         "incident": "ไฟส่องสว่างชำรุด",
    //         "reportTypeVersion": 2,
    //         "programVersion": 104,
    //         "reporter": "แจ้งเหตุด้วยตนเอง (ระบบดึงออโต้)"
    //     },
    //     "originalFormData": {
    //         "incident": "ไฟส่องสว่างชำรุด",
    //         "reportTypeVersion": 2,
    //         "programVersion": 104,
    //         "reporter": "แจ้งเหตุด้วยตนเอง (ระบบดึงออโต้)"
    //     },
    //     "negative": true,
    //     "testFlag": false,
    //     "createdByTelephone": "0891124242",
    //     "createdByProjectMobileNumber": null,
    //     "createdByThumbnailUrl": null,
    //     "parent": null,
    //     "parentType": null,
    //     "reportLocation": {
    //         "type": "Point",
    //         "coordinates": [
    //             100.5647297,
    //             13.8297893
    //         ]
    //     },
    //     "reportLocationString": "{ \"type\": \"Point\", \"coordinates\": [ 100.5647297, 13.8297893 ] }",
    //     "remark": "",
    //     "images": [
    //         {
    //             "report": 552459,
    //             "guid": "c83eeaf8-ee58-4228-bff6-48006255bbea",
    //             "imageUrl": "https://s3-ap-southeast-1.amazonaws.com/podd/c83eeaf8-ee58-4228-bff6-48006255bbea",
    //             "thumbnailUrl": "https://s3-ap-southeast-1.amazonaws.com/podd/c83eeaf8-ee58-4228-bff6-48006255bbea-thumbnail",
    //             "note": "",
    //             "location": {}
    //         }
    //     ],
    //     "firstImageThumbnail": "https://s3-ap-southeast-1.amazonaws.com/podd/c83eeaf8-ee58-4228-bff6-48006255bbea-thumbnail",
    //     "createdByContact": "",
    //     "administrationAreaAddress": "Thailand",
    //     "administrationAreaName": "Thailand",
    //     "formDataExplanation": "แจ้งเหตุสาธารณะ",
    //     "renderedOriginalFormData": "แจ้งเหตุสาธารณะ",
    //     "parentGuid": null,
    //     "tags": [],
    //     "isPublic": false,
    //     "likeCount": 0,
    //     "commentCount": 0,
    //     "meTooCount": 0,
    //     "likeId": null,
    //     "meTooId": null,
    //     "boundary": {
    //         "top": 100.5547297,
    //         "left": 13.8197893,
    //         "right": 13.8397893,
    //         "bottom": 100.5747297
    //     },
    //     "isCurated": false,
    //     "canEdit": true
    // }
    //                 ],
    //             }),
    //         };
    //     },
    // };
    /**
     * @Query
     *  - dateFrom: yyyy-mm-dd
     *  - dateTo: yyyy-mm-dd
     *  - page: int
     *  - page_size: int
     */
    return $resource(
      config.API_BASEPATH + "/civic/reports/:status/",
      {
        status: "@status",
      },
      {
        query: {
          method: "GET",
          isArray: false,
        },
      }
    );
  });
