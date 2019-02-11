'use strict';

angular.module('poddDashboardApp')

    .factory('AnalyticMap', function ($resource) {
        // mock
        return {
            list: function () {
                return {
                    $promise: Promise.resolve([
                        {
                            name: 'ไข้เลือดออก',
                            code: 'dengue'
                        },
                        {
                            name: 'ไข้เลือดออก รายปี',
                            code: 'dengue-all'
                        },
                        {
                            name: 'สำรวจประชากรสุนัข',
                            code: 'dog-survey'
                        }
                    ])
                };
            },
            get: function (query) {
                switch (query.code) {
                    case 'dengue-all':
                        var now = moment();
                        var firstCutoff = moment().startOf('year');
                        var secondCutoff = moment(firstCutoff).subtract(1, 'year');
                        var thirdCutoff = moment(thirdCutoff).subtract(1, 'year');
                        return {
                            name: 'พิกัดไข้เลือดออก รายปี',
                            code: 'dengue',
                            layers: [
                                {
                                    name: 'พื้นที่ อปท.',
                                    code: 'authority',
                                    type: 'geojson',
                                    popupPropertyName: 'name',
                                    style: {
                                        color: '#ff7800',
                                        'weight': 5,
                                        'opacity': 0.65,
                                        riseOnHover: true
                                    },
                                    url: 'https://analytic.cmonehealth.org/summary/geojson/cnx-authority.json'
                                },
                                {
                                    name: 'ยิงพิกัด GPS ไข้เลือดออก ปี ' + firstCutoff.year(),
                                    code: 'dengue-1',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#900C3F',
                                        fillColor: '#900C3F',
                                        weight: 1,
                                        opacity: 1,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ยิงพิกัด+GPS+ไข้เลือดออก")',
                                        dateColumn: 'incidentDate',
                                        since: firstCutoff.format('YYYY-MM-DD') ,
                                        to: now.format('YYYY-MM-DD' )
                                    }
                                },
                                {
                                    name: 'ยิงพิกัด GPS ไข้เลือดออก ปี ' + secondCutoff.year(),
                                    code: 'dengue-2',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#FF5733',
                                        fillColor: '#FF5733',
                                        weight: 1,
                                        opacity: 1,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ยิงพิกัด+GPS+ไข้เลือดออก")',
                                        dateColumn: 'incidentDate',
                                        since: secondCutoff.format('YYYY-MM-DD')  ,
                                        to: moment(firstCutoff).subtract(1, 'days').format('YYYY-MM-DD')
                                    }
                                }
                            ]
                        };
                    case 'dog-survey':
                        var now = moment();
                        var firstCutoff = moment().startOf('year');
                        var secondCutoff = moment(firstCutoff).endOf('year');
                        return {
                            name: 'สำรวจสุนัข รายปี',
                            code: 'dog-survey',
                            layers: [
                                {
                                    name: 'พื้นที่ อปท.',
                                    code: 'authority',
                                    type: 'geojson',
                                    popupPropertyName: 'name',
                                    style: {
                                        color: '#ff7800',
                                        'weight': 5,
                                        'opacity': 0.65,
                                        riseOnHover: true
                                    },
                                    url: 'https://analytic.cmonehealth.org/summary/geojson/cnx-authority.json'
                                },
                                {
                                    name: 'สำรวจสุนัข ปี ' + firstCutoff.year(),
                                    code: 'dog-1',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#900C3F',
                                        fillColor: '#900C3F',
                                        weight: 1,
                                        opacity: 1,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ขึ้นทะเบียนเจ้าของสุนัข")',
                                        dateColumn: 'incidentDate',
                                        since: firstCutoff.format('YYYY-MM-DD') ,
                                        to: secondCutoff.format('YYYY-MM-DD' )
                                    }
                                }
                            ]
                        };
                    case 'dengue':
                        var now = moment();
                        var firstCutoff = moment(now).subtract(8, 'weeks');
                        return {
                            name: 'พิกัดไข้เลือดออก',
                            code: 'dengue',
                            layers: [
                                {
                                    name: 'พื้นที่ อปท.',
                                    code: 'authority',
                                    type: 'geojson',
                                    popupPropertyName: 'name',
                                    style: {
                                        color: '#ff7800',
                                        'weight': 5,
                                        'opacity': 0.65,
                                        riseOnHover: true
                                    },
                                    url: 'https://analytic.cmonehealth.org/summary/geojson/cnx-authority.json'
                                },
                                {
                                    name: 'ยิงพิกัด GPS ไข้เลือดออก ย้อนหลัง 8 อาทิตย์',
                                    code: 'dengue-1',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#900C3F',
                                        fillColor: '#900C3F',
                                        weight: 1,
                                        opacity: 1,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ยิงพิกัด+GPS+ไข้เลือดออก")',
                                        dateColumn: 'incidentDate',
                                        since: firstCutoff.format('YYYY-MM-DD') ,
                                        to: now.format('YYYY-MM-DD' )
                                    }
                                },
                                {
                                    name: 'ยิงพิกัด GPS ไข้เลือดออก ภายในปีนี้',
                                    code: 'dengue-2',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#FF5733',
                                        fillColor: '#FF5733',
                                        weight: 1,
                                        opacity: 1,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ยิงพิกัด+GPS+ไข้เลือดออก")',
                                        dateColumn: 'incidentDate',
                                        to: firstCutoff.subtract(1, 'seconds').format('YYYY-MM-DD')  ,
                                        since: moment(firstCutoff).startOf('year').format('YYYY-MM-DD')
                                    }
                                }

                            ]
                        };
                }
            }
        }
    })

    .factory('AnalyticMapLayerRenderer', function () {

    })

    .factory('AnalyticMapDataLayer', ['dashboard', 'Search', function (dashboard, Search) {
        function LayerDataProcessor(metaLayer) {
            return {
                'geojson': function () {
                    return {
                        $data: function () {
                            return dashboard.getViaProxy({url: metaLayer.url}).$promise
                        }
                    }
                },
                'report': function () {
                    return {
                        $data: function () {
                            var since = metaLayer.filter.since ? moment(metaLayer.filter.since).format('YYYY-MM-DD') + 'T00:00:00': '*';
                            var to = metaLayer.filter.to ? moment(metaLayer.filter.to).format('YYYY-MM-DD') + 'T00:00:00' : '*';
                            var dateColumn = 'date'
                            if (metaLayer.filter.dateColumn) {
                                dateColumn = metaLayer.filter.dateColumn
                            }
                            var query = {
                                q: dateColumn + ':[' + since + ' TO ' + to + '] AND ' + metaLayer.filter.query,
                                tz: (new Date()).getTimezoneOffset() / -60
                            };

                            return Search.query(query).$promise;
                        }
                    }
                }
            }[metaLayer.type]
        }

        return function (layer) {
            return {
                meta: {
                    layer: layer,
                    layerName: function() {
                        if (layer.type !== 'geojson') {
                            var name = layer.name;
                            if (layer.filter.since) {
                                name = name + ' ' + moment(layer.filter.since).format('DD/MM/YYYY');
                            }
                            if (layer.filter.to) {
                                name = ' - ' + name + ' ' + moment(layer.filter.to).format('DD/MM/YYYY');
                            }
                            return name;
                        } else {
                            return layer.name;
                        }
                    }
                },
                $data: function $data() {
                    return LayerDataProcessor(layer)().$data()
                }
            }
        }
    }])

    .factory('AnalyticMapRenderer', [function () {
        return function (type, config) {
            var func = {
                'geojson': {
                    $render: function (data) {
                        return Promise.resolve(L.geoJson(data, {
                            style: config.style,
                            onEachFeature: function onEachFeature(feature, layer) {
                                if (feature.properties && feature.properties[config.popupPropertyName]) {
                                    layer.bindPopup(feature.properties[config.popupPropertyName]);
                                }
                            }
                        }));
                    }
                },
                'report': {
                    $render: function (data) {
                        var group = new L.FeatureGroup();

                        angular.forEach(data.results, function (item) {
                            if (!item.reportLocation) {
                                return;
                            }

                            var loc = [parseFloat(item.reportLocation[1]), parseFloat(item.reportLocation[0])];
                            if (!loc[0] || !loc[1]) {
                                return;
                            }

                            var layer = L.circle(loc, config.radius, config.style).bindPopup(item.formDataExplanation + '<br><br>Go to: <a target="_blank" href="#/home?reportId=' + item.id + '">Report #' + item.id + '</a>');
                            layer.addTo(group);
                        });

                        return Promise.resolve(group);
                    }
                }
            }[type];

            if (func) {
                return func;
            }
            else {
                return function () {};
            }
        }
    }]);
