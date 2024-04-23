/**
 * @author ByungMin
 * @since 2023-09-24 <br/>
 * @note
 *
 * 2023-10-19 드래그 관련 이벤트(setDragEvt(obj), removeDragEvt(obj))로 변경
 *            지도 중심 이동 함수 that, this 제거
 * 2023-10-20 오버레이 함수 통합
 * 2023-10-25 팝업 함수 제거
 * 2023-10-26 폴리라인 함수 생성시 style 선택기능 추가
 * 2024-03-05 함수추가
 *            1. setVisibleEvt(layer) - 전달받은 레이어 보여주기
 *            2. setVisibleAllEvt() - 모든 레이어 보여주기
 *            3. setHiddenAllEvt() - 모든 레이어 숨기기
 *            4. changeCanvas() - TileLayer를 교체하는 방법으로 라이트/다크모드 변경
 *            우리나라 유효좌표 밖에 있는 좌표의 경우 표출하지 않는 기능 추가(우리나라 유효좌표 (124.5 < lon < 132.0) / (33 < lat < 38.9), addFeature 참고)
 * 2024-03-06 addFeature()에서 data에 해당 feature의 정보도 저장
 *            addPolyline()에서 data에 해당 polyline의 정보도 저장
 *            moveEvt() - spd(속도)로 route(이동경로)대로 ftr(이동 마커)이 이동하는 함수
 *            setHiddenAllEvt(), setVisibleAllEvt()에서 TileLayer는 제외하고 처리하도록 수정
 * 2024-03-07 마커 클릭 시 커서 포인터로 변경
 *            addFeature(), addPolyline()에서 type 정보도 저장
 * 2024-03-07 레이어 클릭 시 overlay 모두 삭제 처리.
 * 2024-03-11 폴리라인 클릭 시 오류 처리 (layer.values_ -> layer?.values_).
 * 2024-03-14 addLayer함수에 heatmap타입 추가
 *            addFeature함수에 addPolyline함수 통합 및 히트맵마커 표출기능 추가
 * 2024-04-22 지도 타일을 함수로 가져올 수 있도록 소스수정(현재 지원 타일 - 카카오, OSM, StadiaMaps)
 * 2024-04-23 지도 다크모드 기능 추가(Tile이 render 되기 전에 canvas에 필터를 걸고 render 된 후에 필터를 제거하여 Tile에만 다크모드가 적용되도록 구현)
 */

import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import Map from 'ol/Map.js';
import { OSM } from 'ol/source.js';
import { TileGrid } from 'ol/tilegrid.js';
import StadiaMaps from 'ol/source/StadiaMaps.js';
import TileLayer from 'ol/layer/Tile';
import HeatmapLayer from 'ol/layer/Heatmap.js';
import VectorLayer from 'ol/layer/Vector.js';
import XYZ from 'ol/source/XYZ.js';
import View from 'ol/View.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import WKT from 'ol/format/WKT.js';
import Collection from 'ol/Collection.js';
import { unByKey } from 'ol/Observable';
import * as olRender from 'ol/render';
import * as olEasing from 'ol/easing';
import { Fill, Stroke, Style, Icon, Circle } from 'ol/style.js';
import { Draw, Modify, Snap } from 'ol/interaction.js';
import { transform, Projection, fromLonLat } from 'ol/proj.js';
import { Zoom, ZoomSlider, ScaleLine } from 'ol/control.js';

//카카오 좌표계 추가
proj4.defs('EPSG:5181', '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs');
register(proj4);

const kakao = new Projection({
    code: "EPSG:5181",
    extent: [-30000, -60000, 494288, 988576]
});

/******************** 지도별 타일 가져오는 함수 ********************/
//카카오
const getKakaoTile = () => {
    const kakaoTile = new TileLayer({
        source: new XYZ({
            projection : kakao,
            url: 'http://map.daumcdn.net/map_k3f_prod/bakery/image_map_png/PNGSD01/v21_cclzf/{z}/{-y}/{x}.png',
            tileGrid : new TileGrid({
                extent : [-30000, -60000, 494288, 988576],
                resolutions : [ 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25 ], 
            }),
            tileLoadFunction: function (i, src) {
                let a = src.split('v21_cclzf/');
                let b = a[1].split('/');
                let z = Number(b[0]);
                let tZ = 14 - z;
                i.getImage().src = src.replace('/' + z + '/', '/' + tZ + '/');
            },
        }),
        type: 'Tile'
    })

    return kakaoTile;
}

const getKakaoDarkTile = () => {
    const kakaoDarkTile = new TileLayer({
        source: new XYZ({
            projection : kakao,
            url: 'http://map.daumcdn.net/map_k3f_prod/bakery/image_map_png/PNGSD01/v21_cclzf/{z}/{-y}/{x}.png',
            tileGrid : new TileGrid({
                extent : [-30000, -60000, 494288, 988576],
                resolutions : [ 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25 ], 
            }),
            tileLoadFunction: function (i, src) {
                let a = src.split('v21_cclzf/');
                let b = a[1].split('/');
                let z = Number(b[0]);
                let tZ = 14 - z;
                i.getImage().src = src.replace('/' + z + '/', '/' + tZ + '/');
            },
        }),
        type: 'Tile'
    })

    kakaoDarkTile.on('prerender', (evt) => {
        if (evt.context) {
          const context = evt.context;
          context.filter = 'grayscale(80%) invert(100%)';
          context.globalCompositeOperation = 'source-over';
        }
      });
      
      kakaoDarkTile.on('postrender', (evt) => {
        if (evt.context) {
          const context = evt.context;
          context.filter = 'none';
        }
    });

    return kakaoDarkTile;
}

//OpenStreetMap
const getOSMTile = () => {
    const googleTile = new TileLayer({
        source: new OSM(),
        type: 'Tile'
    })

    return googleTile;
}

//StadiaMaps(다크모드)
const getStadiaTile = () => {
    const stadiaTile = new TileLayer({
        source: new StadiaMaps({
            //StadiaMaps 다크모드
            layer: 'alidade_smooth_dark',
            retina: true,
            apiKey: '146a217e-fcd4-44dd-a057-8093894c7f05'
        }),
        type: 'Tile'
    });

    return stadiaTile;
}

const $Class = function (oClassMember) {
    function ClassOrigin() {
        if (this.$init) {
            this.$init.apply(this, arguments);
        }
    }
    ClassOrigin.prototype = oClassMember;
    ClassOrigin.prototype.constructor = ClassOrigin;
    return ClassOrigin;
};

const OL = new ($Class({
    $init: function () {
        console.log('init');
    },
    /*통신*/
    ajax: function (url, callback) {
        // Create an XMLHttpRequest object
        const xhttp = new XMLHttpRequest();

        // Define a callback function
        xhttp.onload = function () {
            callback(JSON.parse(this.responseText));
        };

        // Send a request
        xhttp.open('GET', url);
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhttp.send();
    },
    transformOSM: function (xy) {
        return transform(xy, 'EPSG:4326', 'EPSG:3857');
    },
    transformWGS84: function (xy) {
        return transform(xy, 'EPSG:3857', 'EPSG:4326');
    },
    /*지도 생성*/
    roadMap: function (obj) {
        let map = new Map({
            layers: [
                getKakaoDarkTile()
            ],
            target: obj.target,
            view: new View({
                projection : kakao, //좌표계 설정(default : 'EPSG:3857')
                center : fromLonLat([128.940775, 35.97005278], kakao), //지도 센터설정
                extent : [261366.037460875, 216430.6425167995, 507126.037460875, 323310.6425167995],//지도 영역설정
                zoom : 11,  //지도 줌
                minZoom : 5 //지도 최소 줌
            }),
            controls: [new Zoom(), new ZoomSlider(), new ScaleLine()],
        });

        this[obj.target] = new ($Class({
            $init: function (map) {
                this.map = map;
                this.tooltipObj = {};
                this.selectedObj = null;
                this.onmousemoveObj = null;
                this.setClickEvt();
                this.setHoverEvt();
                this.setWheelEvt();
            },
            /******************** 라이트/다크 모드변경 ********************/
            //TileLayer를 교체하는 방법으로 모드 변경구현
            changeCanvas: function (obj) {
                if (obj.type === 'ligth') {
                    //tileLayer 제거
                    let layers = this.map.getLayers().getArray();
                    for (let layer of layers) {
                        if (layer.values_.type === 'Tile') {
                            this.map.removeLayer(layer);
                            break;
                        }
                    }

                    //라이트모드 tileLayer
                    const lightLyr = getKakaoTile();

                    lightLyr.setZIndex(0);
                    this.map.addLayer(lightLyr);
                } else if (obj.type === 'dark') {
                    //tileLayer 제거
                    let layers = this.map.getLayers().getArray();
                    for (let layer of layers) {
                        if (layer.values_.type === 'Tile') {
                            this.map.removeLayer(layer);
                            break;
                        }
                    }

                    const darkLyr = getKakaoDarkTile()

                    darkLyr.setZIndex(0);
                    this.map.addLayer(darkLyr);
                }
            },
            /******************** 지도 중심 이동 함수 ********************/
            setCenter: function (mapCenter) {
                // mapCenter : [경도, 위도]
                map.getView().setCenter(mapCenter);
                map.getView().setZoom(16);
            },
            /*컨트롤 올리기*/
            addControl: function (control) {
                this.map.addControl(control);
            },
            /******************** layer 관련 함수 ********************/
            /*레이어 조회*/
            getLayer: function (obj) {
                // obj = lid
                if (this.map === null) return null;

                let layers = this.map.getLayers().getArray();
                for (let i = 0; i < layers.length; i++) {
                    if (obj.lid === undefined) return null;

                    if (layers[i].lid === obj.lid) {
                        return layers[i];
                    }
                }

                return null;
            },
            /*레이어 추가*/
            addLayer: function (obj) {
                // obj = type / lid / name / urls / onSelect / minZoom / unSelect / onmouseenter / onmouseleave / styles
                if (this.map === null) {
                    return null;
                }

                let layer = this.getLayer(obj);
                if (layer !== null) {
                    return layer;
                }

                switch (obj.type) {
                    case 'vector':
                        let vsrc = new VectorSource({
                            features: []
                        });
                        layer = new VectorLayer({
                            source: vsrc
                        });

                        layer.lid = obj.lid;
                        layer.type = 'vector';
                        layer.istyle = [];
                        layer.minZoom = obj.minZoom;
                        layer.click = obj.click;
                        layer.onSelect = obj.onSelect;
                        layer.unSelect = obj.unSelect;
                        layer.onmouseenter = obj.onmouseenter;
                        layer.onmouseleave = obj.onmouseleave;
                        layer.setZIndex(obj.zIndex || 0);

                        this.map.addLayer(layer);

                        if (obj.styles) {
                            if (!Array.isArray(obj.styles)) obj.styles = [obj.styles];

                            for (let i = 0; i < obj.styles.length; i++) {
                                let istyle = new Style({
                                    fill: new Fill(obj.styles[i].fill),
                                    stroke: new Stroke(obj.styles[i].stroke)
                                });
                                layer.istyle.push(istyle);
                                if (i == 0) layer.setStyle(istyle);
                            }

                            break;
                        }
                        if (obj.urls) {
                            if (!Array.isArray(obj.urls)) obj.urls = [obj.urls];

                            for (let i = 0; i < obj.urls.length; i++) {
                                let istyle = new Style({
                                    image: new Icon({
                                        anchor: [0.5, 0.5],
                                        anchorXUnits: 'fraction',
                                        anchorYUnits: 'fraction',
                                        src: obj.urls[i],
                                        scale: 1,
                                        opacity: 1
                                    })
                                });
                                layer.istyle.push(istyle);
                                if (i == 0) layer.setStyle(istyle);
                            }
                            break;
                        }
                        if (obj.fcltEvt) {
                            if (!Array.isArray(obj.fcltEvt)) {
                                obj.fcltEvt = [obj.fcltEvt];
                            }

                            for (let i = 0; i < obj.fcltEvt.length; i++) {
                                if (obj.fcltEvt[i] === 'circle') {
                                    let istyle = new Style({
                                        image: new Circle({
                                            radius: 1,
                                            stroke: new Stroke({
                                                color: 'rgba(255, 0, 0, 0.5)',
                                                width: 45
                                            })
                                        })
                                    });
                                    layer.istyle.push(istyle);
                                    if (i == 0) layer.setStyle(istyle);
                                }
                            }
                            break;
                        }
                        if (obj.colors) {
                            if (!Array.isArray(obj.colors)) obj.colors = [obj.colors];

                            for (let i = 0; i < obj.colors.length; i++) {
                                let istyle = new Style({
                                    fill: new Fill({
                                        color: obj.colors[i]
                                    })
                                });
                                layer.istyle.push(istyle);
                                if (i == 0) layer.setStyle(istyle);
                            }
                            break;
                        }
                        if (layer.istyle.length > 0) {
                            layer.setStyle(layer.istyle[0]);
                        }
                        break;
                    case 'heatmap':
                        let hsrc = new VectorSource({
                            features: []
                        });

                        layer = new HeatmapLayer({
                            source: hsrc,
                            blur: obj.blur || 15,
                            radius: obj.radius || 20,
                            opacity: obj.opacity || 0.8
                        });

                        layer.lid = obj.lid; //레이어 ID 설정
                        layer.type = 'heatmap';
                        layer.setZIndex(obj.zIndex || 0); //레이어 zIndex 설정

                        //지도에 레이어추가
                        this.map.addLayer(layer);
                        break;
                    default:
                        console.log(obj.type);
                }
                return layer;
            },
            // layer 곂치는 순서 변경
            changeZIndex: function (lyrs) {
                // {lyrs : [layer1, layer2, layer3]}
                // ex) 만약 2, 3, 1 순으로 정렬하고 싶다면 [layer2, layer3, layer1] 형태로 파라미터 보내야함
                for (let i = 0; i < lyrs.length; i++) {
                    lyrs[i].setZIndex(i + 1);
                }
            },

            /******************** overlay 관련 함수 ********************/
            //map에 overlay 추가
            addOverlay: function (obj) {
                //obj = {
                //    oid : overlayId,
                //    element : createElement
                //    coord : 생성위치 ex) [위도, 경도]
                //    // offset: [0, 0],
                //    // positioning: 'top-left'
                // }

                const oly = new Overlay({
                    element: obj.element
                });
                oly['oid'] = obj.oid;
                oly.setPosition(obj.coord);

                map.addOverlay(oly);

                return oly;
            },
            //map에 특정 overlay 조회
            getOverlay: function (obj) {
                //obj = {
                //    oid : overlayId,
                // }
                const overlays = map.getOverlays().getArray();

                if (overlays.length === 0) {
                    return null;
                } else {
                    for (let i = 0; i < overlays.length; i++) {
                        if (overlays[i].oid === obj.oid) {
                            return overlays[i];
                        }
                    }
                    return null;
                }
            },
            //map에 특정 overlay 제거
            removeOverlay: function (overlay) {
                this.map.removeOverlay(overlay);
            },
            //map에 모든 overlay 제거
            removeOverlayAll: function () {
                const overlays = map.getOverlays().getArray();

                if (overlays.length > 0) {
                    for (let i = overlays.length - 1; i >= 0; i--) {
                        this.map.removeOverlay(overlays[i]);
                    }
                }
            },

            /******************** Feature 관련 함수 ********************/
            //layer에 Feature 추가 - 마커, 폴리라인, 히트맵 가능
            addFeature: function (obj) {
                let layer = this.getLayer(obj);

                if (layer === null) {
                    //layer가 없는 경우
                    return null;
                }

                if (layer.type === 'heatmap') {
                    //히트맵인 경우
                    let src = layer.getSource();

                    let ftr = this.getFeature(obj);

                    if (ftr === null) {
                        if (
                            124.5 < obj.xy[0] &&
                            obj.xy[0] < 132.0 &&
                            33 < obj.xy[1] &&
                            obj.xy[1] < 38.9
                        ) {
                            //우리나라 유효좌표 안에 있는 경우 생성
                            ftr = new Feature({ geometry: new Point(obj.xy) });
                            ftr.fid = obj.fid;
                            ftr.type = 'heatMap';
                            ftr.layer = layer;
                            ftr.weight = obj.weight;
                            src.addFeature(ftr);
                        }
                    }

                    return ftr;
                } else if (layer.type === 'vector') {
                    //마커와 폴리라인
                    //마커인 경우
                    // obj = {
                    //     lid   : layerId
                    //     fid   : featureId
                    //     type  : point
                    //     xy    : [경도, 위도]
                    //     state : 표출 이미지(layer 속성 중 URL의 index 번호)
                    // }
                    if (obj.type === 'point') {
                        if (
                            124.5 < obj.xy[0] &&
                            obj.xy[0] < 132.0 &&
                            33 < obj.xy[1] &&
                            obj.xy[1] < 38.9
                        ) {
                            //우리나라 유효좌표 안에 있는 경우 생성
                            let src = layer.getSource();

                            let ftr = this.getFeature(obj);

                            if (ftr === null) {
                                if (layer.istyle.length < obj.state + 1) {
                                    obj.state = 0;
                                }

                                let istyle = layer.istyle[obj.state];

                                ftr = new Feature({ geometry: new Point(obj.xy) });

                                ftr.fid = obj.fid;
                                ftr.type = obj.type;
                                ftr.layer = layer;
                                ftr.setStyle(istyle);
                                ftr.data = obj?.data || {}; //feature 정보 저장
                                src.addFeature(ftr);
                            }
                            return ftr;
                        } else {
                            return null;
                        }
                    } else if (obj.type === 'polyline') {
                        //폴리라인인 경우
                        // obj = {
                        //     lid   : layerId
                        //     fid   : featureId
                        //     type  : polyline
                        //     data  : [[경도, 위도], [경도, 위도], ....]
                        //     state : 1
                        // }
                        const coordlist = obj.data;
                        const lyr = this.getLayer({ lid: obj.lid });

                        let coords = '';

                        for (let i = 0; i < coordlist.length; i++) {
                            if (coords !== '') {
                                coords += ',';
                            }

                            coords += coordlist[i][0] + ' ' + coordlist[i][1];
                        }

                        const lineStr = new WKT().readFeatures(
                            'GEOMETRYCOLLECTION(LINESTRING(' + coords + '))',
                            {}
                        );
                        lineStr[0].fid = obj.fid;
                        lineStr[0].data = obj?.data || {}; //polyline 정보 저장
                        lineStr[0].type = obj.type;

                        lyr.getSource().addFeatures(lineStr);
                        lyr.setStyle(lyr.istyle[obj.state]);
                    }
                }
            },
            //layer에 특정 feature 조회
            getFeature: function (obj) {
                // obj = {
                //     lid : layerId
                //     fid : featureId
                // }
                let layer = this.getLayer(obj);
                if (layer === null) {
                    return null;
                }

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                for (let i = 0; i < ftrs.length; i++) {
                    if (ftrs[i].fid === obj.fid) {
                        return ftrs[i];
                    }
                }
                return null;
            },
            //layer의 모든 feature 조회
            getFeatureAll: function (obj) {
                // obj = {
                //     lid : layerId
                // }
                let layer = this.getLayer(obj);
                if (layer === null) return null;

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                if (ftrs.length > 0) {
                    return ftrs;
                } else {
                    return null;
                }
            },
            //layer의 특정 feature 삭제
            removeFeature: function (obj) {
                // obj = {
                //     lid : layerId
                //     fid : featureId
                // }
                let layer = this.getLayer(obj);

                if (layer === null) return null;

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                if (ftrs.length > 0) {
                    for (let i = 0; i < ftrs.length; i++) {
                        if (ftrs[i].fid === obj.fid) {
                            src.removeFeature(ftrs[i]);
                        }
                    }
                }
            },
            //layer의 모든 feature 삭제
            removeFeatureAll: function (obj) {
                // obj = {
                //     lid : layerId
                // }
                let layer = this.getLayer(obj);

                if (layer === null) return null;

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                if (ftrs.length > 0) {
                    for (let i = 0; i < ftrs.length; i++) {
                        src.removeFeature(ftrs[i]);
                    }
                }
            },

            /******************** 이벤트 관련 함수 ********************/
            // feature style 변경
            changeFeatureStyle: function (obj) {
                const feature = this.getFeature({
                    lid: obj.lid,
                    fid: obj.fid
                });

                if (feature !== null || feature !== undefined) {
                    const style = new Style(obj.style);
                    feature.setStyle(style);
                }
            },
            // 셀렉트 & 언셀렉트 이벤트 추가
            setClickEvt: function () {
                var that = this;
                that.map.on('click', function (e) {
                    let layers = e.target.getLayers().getArray();

                    //레이어 클릭 이벤트
                    for (let i = 0; i < layers.length; i++) {
                        if (layers[i].click !== undefined) {
                            return layers[i].click.apply(null, [e]);
                        }
                    }

                    //overlay 모두 삭제 - 모두 삭제 하고 개별 클릭 이벤트로 알아서 overlay 추가해야함.
                    OL.map.removeOverlayAll();

                    //레이어 위의 feature 클릭 이벤트
                    var result = that.map.forEachFeatureAtPixel(e.pixel, function (ftr) {
                        if (ftr.layer?.values_.opacity === 0) {
                            return null;
                        }

                        if (ftr === undefined || ftr === null) {
                            return null;
                        }

                        if (ftr.layer?.onSelect === undefined || ftr.layer.onSelect === null) {
                            return null;
                        }

                        ftr.layer.onSelect(ftr, e);
                        that.selectedObj = ftr;

                        return ftr;
                    });

                    if (!result && that.selectedObj) {
                        if (
                            that.selectedObj.layer.unSelect === undefined ||
                            that.selectedObj.layer.unSelect === null
                        ) {
                            return;
                        }
                        that.selectedObj.layer.unSelect(that.selectedObj, e);
                        that.selectedObj = null;
                    }
                });
            },
            // 마우스엔터 & 마우스리브 이벤트 추가
            setHoverEvt: function () {
                var that = this;
                that.map.on('pointermove', function (e) {
                    var result = that.map.forEachFeatureAtPixel(e.pixel, function (ftr) {
                        //드래그 이벤트시 팝업도 함께 이동
                        const popup = ftr.popup;

                        if (popup) {
                            popup.setPosition(ftr.getGeometry().flatCoordinates);
                        }

                        if (e.dragging) {
                            return;
                        }

                        if (ftr === undefined || ftr === null) {
                            return;
                        }
                        if (ftr.layer === undefined) {
                            return;
                        }
                        if (
                            ftr.layer.onmouseenter === undefined ||
                            ftr.layer.onmouseenter === null
                        ) {
                            return;
                        }
                        ftr.layer.onmouseenter(ftr, e);

                        that.onmousemoveObj = ftr;
                        return ftr;
                    });
                    if (!result && that.onmousemoveObj) {
                        if (
                            that.onmousemoveObj.layer.onmouseleave === undefined ||
                            that.onmousemoveObj.layer.onmouseleave === null
                        ) {
                            return;
                        }
                        that.onmousemoveObj.layer.onmouseleave(that.onmousemoveObj, e);
                        that.onmousemoveObj = null;
                    }
                });

                //마우스 오버시 포인터 변경
                that.map.on('pointermove', function (evt) {
                    var hit = this.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                        if (layer.values_.opacity === 0 || feature.type !== 'point') {
                            return false;
                        } else {
                            return true;
                        }
                    });
                    if (hit) {
                        this.getTargetElement().style.cursor = 'pointer';
                    } else {
                        this.getTargetElement().style.cursor = '';
                    }
                });
            },
            // 마우스휠 이벤트 추가
            setWheelEvt: function () {
                let that = this;
                that.map.getView().on('change:resolution', function (e) {
                    if (that.map.ov != Math.floor(e.target.getZoom())) {
                        let layers = that.map.getLayers().getArray();
                        for (let l = 0; l < layers.length; l++) {
                            if (layers[l].minZoom >= Math.floor(e.target.getZoom())) {
                                layers[l].setVisible(false);
                            } else {
                                layers[l].setVisible(true);
                            }
                        }
                    }
                    that.map.ov = Math.floor(e.target.getZoom());
                });
            },
            unSelect: function () {},
            //drag 이벤트 추가
            setDragEvt: function (obj) {
                //obj = {
                //     evtId  : evtId,
                //     ftrArr : [ftr, ftr, ...]
                //}

                // drag 이벤트 생성
                let modify = new Modify({ features: new Collection(obj.ftrArr) });
                modify.dragEvtId = obj.evtId;

                map.addInteraction(modify); //지도에 이벤트 추가
            },
            //drag 이벤트 제거
            removeDragEvt: function () {
                const modifyArr = map.getInteractions().getArray();
                // 이벤트 제거
                for (let i = 0, n = modifyArr.length; i < n; i++) {
                    if (modifyArr[i].dragEvtId !== undefined) {
                        map.removeInteraction(modifyArr[i]);
                    }
                }
            },
            // 원 애니메이션
            playFcltEvt(feature, cretCycl) {
                const duration = cretCycl;
                const start = Date.now();
                const flashGeom = feature.getGeometry().clone();

                const listenerKey = this.getLayer({ lid: feature.layer.lid }).on(
                    'postrender',
                    animate
                );

                function animate(event) {
                    const frameState = event.frameState;

                    const elapsed = frameState.time - start;

                    if (elapsed >= duration) {
                        unByKey(listenerKey);
                        return;
                    }

                    const vectorContext = olRender.getVectorContext(event);
                    const elapsedRatio = elapsed / duration;

                    // radius will be 5 at start and 30 at end.
                    const radius = olEasing.easeOut(elapsedRatio) * 50;
                    const opacity = olEasing.easeOut(1 - elapsedRatio);

                    const style = new Style({
                        image: new Circle({
                            radius: radius,
                            stroke: new Stroke({
                                color: 'rgba(255, 0, 0, ' + opacity + ')',
                                width: 5
                            })
                        })
                    });

                    vectorContext.setStyle(style);
                    vectorContext.drawGeometry(flashGeom);

                    // tell OpenLayers to continue postrender animation
                    map.render();
                }

                if (this.getFeature({ lid: feature.layer.lid, fid: feature.fid })) {
                    this.removeFeature({ lid: feature.layer.lid, fid: feature.fid });
                }

                this.getLayer({ lid: feature.layer.lid }).getSource().addFeature(feature);
            },
            // 전체 숨기기 이벤트
            setHiddenAllEvt: function () {
                let layers = this.map.getLayers().getArray();

                for (let l = 0; l < layers.length; l++) {
                    if (layers[l].values_?.type === 'Tile') {
                        continue;
                    }
                    layers[l].setOpacity(0);
                }
            },
            // 전체 보여주기 이벤트
            setVisibleAllEvt: function () {
                let layers = this.map.getLayers().getArray();

                for (let l = 1; l < layers.length; l++) {
                    if (layers[l].values_?.type === 'Tile') {
                        continue;
                    }
                    layers[l].setOpacity(1);
                }
            },
            // 전달받은 레이어 보여주기 이벤트
            setVisibleEvt: function (layer) {
                let layers = this.map.getLayers().getArray();

                console.log(layers[1]);

                for (let l = 1; l < layers.length; l++) {
                    if (layer.includes(layers[l].lid)) {
                        layers[l].setOpacity(1);
                    }
                }
            },
            //이동 애니매이션(초안)
            moveEvt(obj) {
                const {
                    route, //이동할 경로
                    ftr, //이동할 마커
                    spd //이동 속도(10 ~ 999)
                } = obj;

                const position = ftr.getGeometry().clone();

                const vectorLayer = new VectorLayer({
                    source: new VectorSource({
                        features: [route, ftr]
                    })
                });

                this.map.addLayer(vectorLayer);

                let distance = 0;
                let lastTime = Date.now();

                function moveFeature(event) {
                    const speed = spd;
                    const time = event.frameState.time;
                    const elapsedTime = time - lastTime; //재생시간

                    distance = distance + (speed * elapsedTime) / 1e6;

                    if (distance < 2) {
                        lastTime = time;

                        const currentCoordinate = route
                            .getGeometry()
                            .geometries_[0].getCoordinateAt(distance);
                        position.setCoordinates(currentCoordinate);

                        ftr.setGeometry(position);
                        map.render();
                    } else {
                        vectorLayer.un('postrender', moveFeature);
                    }
                }

                vectorLayer.on('postrender', moveFeature);
                ftr.setGeometry(null);
            }
            /******************** 미사용함수 ********************/
            // /*geojson 읽기*/
            // readGeoJson: function (result, lyr) {
            //     var arr = new ol.format.GeoJSON().readFeatures(result);
            //     return arr;
            // },
            // addTooltip: function (id) {
            //     var tooltipElement = document.getElementById(id);
            //     tooltipElement.style.display = '';

            //     let tooltip = new ol.Overlay({
            //         element: document.getElementById(id),
            //         offset: [0, 0],
            //         positioning: 'top-left'
            //     });
            //     this.tooltipObj[id] = tooltip;
            //     this.addOverlay(tooltip);
            //     tooltip.setVisible(true);

            //     return tooltip;
            // },
            // getTooltip: function (id) {
            //     return this.tooltipObj[id];
            // },
            // removeTooltip: function (id) {
            //     var tooltip = this.tooltipObj[id];
            //     var tooltipElement = document.getElementById(id);
            //     tooltipElement.style.display = 'none';

            //     document.body.appendChild(tooltipElement);
            //     this.removeOverlay(tooltip);
            // },
        }))(map);
        return this[obj.target].map;
    }
}))();
export default OL;
