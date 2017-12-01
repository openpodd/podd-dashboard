'use strict';

angular.module('poddDashboardApp')

    .factory('AnalyticMap', function ($resource) {
        // mock
        return {
            list: function () {
                return {
                    $promise: Promise.resolve([
                        {
                            name: 'ไข้เลือดออก และ แหล่งลูกน้ำ',
                            code: 'dengue_breeding_site'
                        }
                    ])
                };
            },
            get: function (query) {
                switch (query.code) {
                    case 'dengue_breeding_site':
                        return {
                            name: 'ไข้เลือดออก และ แหล่งลูกน้ำ',
                            code: 'dengue_breeding_site',
                            layers: [
                                {
                                    name: 'Amphor',
                                    code: 'amphor',
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
                                    name: 'ยิงพิกัด GPS ไข้เลือดออก เดือนตุลาคม',
                                    code: 'report-1',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#1c9f12',
                                        fillColor: '#fff702',
                                        weight: 1,
                                        opacity: 0.8,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ยิงพิกัด+GPS+ไข้เลือดออก")',
                                        since: '2017-10-01',
                                        to: '2017-11-01'
                                    }
                                },
                                {
                                    name: 'ยิงพิกัด GPS ไข้เลือดออก เดือนกันยายน',
                                    code: 'report-2',
                                    type: 'report',
                                    radius: 100,
                                    style: {
                                        color: '#f00',
                                        fillColor: '#ff9642',
                                        weight: 1,
                                        opacity: 0.8,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("ยิงพิกัด+GPS+ไข้เลือดออก")',
                                        since: '2017-09-01',
                                        to: '2017-10-01'
                                    }
                                },
                                {
                                    name: 'นับลูกน้ำยุงลาย (ธรรมชาติ)',
                                    code: 'report-3',
                                    type: 'report',
                                    radius: 300,
                                    style: {
                                        color: '#00f',
                                        fillColor: '#ccc',
                                        weight: 1,
                                        riseOnHover: true
                                    },
                                    filter: {
                                        query: 'typeName:("นับลูกน้ำยุงลาย+(ธรรมชาติ)") AND found_containers > 0',
                                        since: '2017-10-01',
                                        to: '2017-12-01'
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
                            var since = metaLayer.filter.since ? moment(metaLayer.filter.since).format('YYYY-MM-DD') : '*';
                            var to = metaLayer.filter.to ? moment(metaLayer.filter.to).format('YYYY-MM-DD') : '*';

                            var query = {
                                q: 'date:[' + since + ' TO ' + to + '] AND ' + metaLayer.filter.query,
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
                    layer: layer
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
