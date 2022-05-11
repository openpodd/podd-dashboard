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
        return {
            query: function (q) {
                return {
                    $promise: Promise.resolve({
                        count: 30,
                        next: "?page=2",
                        previous: null,
                        results: [
                            {
                                id: 187282,
                                reportId: 2,
                                guid: "0d1345e1-c2b0-48a2-821e-d1e9f01ece9b",
                                reportTypeId: 77,
                                reportTypeName: "ไข้เลือดออก",
                                date: "2017-05-02T09:50:03Z",
                                administrationAreaId: 114,
                                negative: true,
                                incidentDate: "2017-05-02",
                                createdBy: "6353",
                                createdByName: "บอม บอม",
                                createdByThumbnailUrl: null,
                                flag: "",
                                testFlag: false,
                                formDataExplanation:
                                    "<p>รายงานไข้เลือดออก เลขที่ 00098 ชื่อ e เพศ หญิง อายุ 1\r\nที่ [จังหวัด:จ. เชียงใหม่][อำเภอ:อ. สันป่าตอง][ตำบล:ต. ท่าวังพร้าว] \r\nป่วยเมื่อวันที่ 2017-05-02\r\nเข้ารับการรักษาเมื่อวันที่ 2017-05-02 โรงพยาบาล รพ.กรุงเทพ-เชียงใหม่ \r\n</p>\r\n",
                                renderedOriginalFormData:
                                    "<p>รายงานไข้เลือดออก เลขที่ 00098 ชื่อ e เพศ หญิง อายุ 1\r\nที่ [จังหวัด:จ. เชียงใหม่][อำเภอ:อ. สันป่าตอง][ตำบล:ต. ท่าวังพร้าว] \r\nป่วยเมื่อวันที่ 2017-05-02\r\nเข้ารับการรักษาเมื่อวันที่ 2017-05-02 โรงพยาบาล รพ.กรุงเทพ-เชียงใหม่ \r\n</p>\r\n",
                                administrationAreaAddress: "ซ่อนเร้น",
                                firstImageThumbnail:
                                    "https://s3-ap-southeast-1.amazonaws.com/podd/e3e9b46b-9ad9-4334-ad5f-0c8b423be97e-thumbnail",
                                state: 110,
                                stateCode: "report",
                                stateName: "Report",
                                parent: null,
                                parentType: null,
                                tags: null,
                                reportLocation: [100.5736112, 13.7699096],
                                commentCount: 2,
                            },
                            {
                                id: 187275,
                                reportId: 1,
                                guid: "47d5ad50-4db0-43ad-9237-8aa065c80ee5",
                                reportTypeId: 77,
                                reportTypeName: "ไข้เลือดออก",
                                date: "2017-05-02T09:15:22Z",
                                administrationAreaId: 114,
                                negative: true,
                                incidentDate: "2017-05-02",
                                createdBy: "6353",
                                createdByName: "บอม บอม",
                                createdByThumbnailUrl: null,
                                flag: "",
                                testFlag: false,
                                formDataExplanation:
                                    "<p>รายงานไข้เลือดออก ddd เพศ หญิง อายุ 1\r\nที่ [จังหวัด:จ. เชียงใหม่][อำเภอ:อ. สารภี][ตำบล:ต. ยางเนิ้ง] \r\nป่วยเมื่อวันที่ 2017-05-02\r\nเข้ารับการรักษาเมื่อวันที่ 2017-05-03 โรงพยาบาล รพ.กรุงเทพ-เชียงใหม่ \r\n</p>\r\n",
                                renderedOriginalFormData:
                                    "<p>รายงานไข้เลือดออก ddd เพศ หญิง อายุ 1\r\nที่ [จังหวัด:จ. เชียงใหม่][อำเภอ:อ. สารภี][ตำบล:ต. ยางเนิ้ง] \r\nป่วยเมื่อวันที่ 2017-05-02\r\nเข้ารับการรักษาเมื่อวันที่ 2017-05-03 โรงพยาบาล รพ.กรุงเทพ-เชียงใหม่ \r\n</p>\r\n",
                                administrationAreaAddress: "ซ่อนเร้น",
                                firstImageThumbnail:
                                    "https://s3-ap-southeast-1.amazonaws.com/podd/e6de7784-51b1-4c82-9790-a7ea1dfcd52b-thumbnail",
                                state: 110,
                                stateCode: "report",
                                stateName: "Report",
                                parent: null,
                                parentType: null,
                                tags: null,
                                reportLocation: [100.5736112, 13.7699096],
                                commentCount: 3,
                            },
                            {
                                id: 184133,
                                reportId: 33,
                                guid: "1070bbb0-6c63-4537-86aa-717f491f1adb",
                                reportTypeId: 2,
                                reportTypeName: "สัตว์ป่วย/ตาย",
                                date: "2017-04-04T02:44:44Z",
                                administrationAreaId: 114,
                                negative: true,
                                incidentDate: "2017-04-04",
                                createdBy: "896",
                                createdByName: "",
                                createdByThumbnailUrl: null,
                                flag: "",
                                testFlag: false,
                                formDataExplanation:
                                    "<p>พบ หมา[สัตว์กระเพาะเดี่ยว] ป่วยจำนวน 1 ตัว, ตายจำนวน 0 ตัว จากทั้งหมด 20 ตัว จำนวนเล้า/คอกข้างเคียงที่มีอาการ 0\r\n มีอาการดังนี้ ท้องเสีย,ซูบผอม,เสียการทรงตัว\r\n</p>\r\n",
                                renderedOriginalFormData:
                                    "<p>พบ หมา[สัตว์กระเพาะเดี่ยว] ป่วยจำนวน 1 ตัว, ตายจำนวน 0 ตัว จากทั้งหมด 20 ตัว จำนวนเล้า/คอกข้างเคียงที่มีอาการ 0\r\n มีอาการดังนี้ ท้องเสีย,ซูบผอม,เสียการทรงตัว\r\n</p>\r\n",
                                administrationAreaAddress: "ซ่อนเร้น",
                                firstImageThumbnail: "",
                                state: 59,
                                stateCode: "insignificant-report",
                                stateName: "Insignificant Report",
                                parent: null,
                                parentType: null,
                                tags: null,
                                reportLocation: null,
                                commentCount: 10,
                            },
                            {
                                id: 142907,
                                reportId: 29,
                                guid: "21a4b398-838d-4547-81b3-f1b0bca29a77",
                                reportTypeId: 2,
                                reportTypeName: "สัตว์ป่วย/ตาย",
                                date: "2016-06-15T11:15:57Z",
                                administrationAreaId: 114,
                                negative: true,
                                incidentDate: "2016-06-15",
                                createdBy: "339",
                                createdByName: "Sudarat Yawutthi",
                                createdByThumbnailUrl:
                                    "https://podd.s3.amazonaws.com/6229777c-e7cb-43fd-b120-f4ed5fda7129",
                                flag: "",
                                testFlag: false,
                                formDataExplanation:
                                    "<p>พบ ไก่พื้นเมือง[สัตว์ปีก] ป่วยจำนวน 5 ตัว, ตายจำนวน 0 ตัว จากทั้งหมด 10 ตัว จำนวนเล้า/คอกข้างเคียงที่มีอาการ 0\r\nโดยคาดว่าจะเป็นโรค ห่าไก่ มีอาการดังนี้ ป่วยตายเฉียบพลัน\r\n</p>\r\n",
                                renderedOriginalFormData:
                                    "<p>พบ ไก่พื้นเมือง[สัตว์ปีก] ป่วยจำนวน 5 ตัว, ตายจำนวน 0 ตัว จากทั้งหมด 10 ตัว จำนวนเล้า/คอกข้างเคียงที่มีอาการ 0\r\nโดยคาดว่าจะเป็นโรค ห่าไก่ มีอาการดังนี้ ป่วยตายเฉียบพลัน\r\n</p>\r\n",
                                administrationAreaAddress: "ซ่อนเร้น",
                                firstImageThumbnail: "",
                                state: 4,
                                stateCode: "3",
                                stateName: "Case",
                                parent: null,
                                parentType: null,
                                tags: null,
                                reportLocation: [100.5881775, 13.7911403],
                                commentCount: 3,
                            },
                            {
                                id: 136130,
                                reportId: 197,
                                guid: "d3c416b0-2cfc-41cd-93f7-20fccbebebe1",
                                reportTypeId: 2,
                                reportTypeName: "สัตว์ป่วย/ตาย",
                                date: "2016-05-12T08:24:02Z",
                                administrationAreaId: 114,
                                negative: true,
                                incidentDate: "2016-05-12",
                                createdBy: "896",
                                createdByName: "",
                                createdByThumbnailUrl: null,
                                flag: "",
                                testFlag: false,
                                formDataExplanation:
                                    "<p>พบ ไก่พื้นเมือง[สัตว์ปีก] ป่วยจำนวน 1 ตัว, ตายจำนวน 0 ตัว จากทั้งหมด 20 ตัว จำนวนเล้า/คอกข้างเคียงที่มีอาการ 0\r\n มีอาการดังนี้ ไข่ลดลง,ท้องเสีย,ขี้เหลวมีเลือดปน,คอบิด,ขาเกร็ง,ตาบวมปิด,หน้าบวม,ซึม/เหงา/ไม่กินอาหาร,แคระแกร็น,ไอ จาม,หายใจเสียงดัง\r\n</p>\r\n",
                                renderedOriginalFormData:
                                    "<p>พบ ไก่พื้นเมือง[สัตว์ปีก] ป่วยจำนวน 1 ตัว, ตายจำนวน 0 ตัว จากทั้งหมด 20 ตัว จำนวนเล้า/คอกข้างเคียงที่มีอาการ 0\r\n มีอาการดังนี้ ไข่ลดลง,ท้องเสีย,ขี้เหลวมีเลือดปน,คอบิด,ขาเกร็ง,ตาบวมปิด,หน้าบวม,ซึม/เหงา/ไม่กินอาหาร,แคระแกร็น,ไอ จาม,หายใจเสียงดัง\r\n</p>\r\n",
                                administrationAreaAddress: "ซ่อนเร้น",
                                firstImageThumbnail: "",
                                state: 24,
                                stateCode: "report",
                                stateName: "Report",
                                parent: 136128,
                                parentType: "GENERAL",
                                tags: null,
                                reportLocation: [100.5881385, 13.7911665],
                                commentCount: 0,
                            },
                        ],
                    }),
                };
            },
        };
        /**
         * @Query
         *  - dateFrom: yyyy-mm-dd
         *  - dateTo: yyyy-mm-dd
         *  - page: int
         *  - page_size: int
         */
        return $resource(
            config.API_BASEPATH + "/lgreports/:status",
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
